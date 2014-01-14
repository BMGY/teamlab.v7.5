/* 
 * 
 * (c) Copyright Ascensio System Limited 2010-2014
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * http://www.gnu.org/licenses/agpl.html 
 * 
 */

using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Web;
using ASC.Collections;
using ASC.Data.Storage.Configuration;

namespace ASC.Data.Storage
{
    public static class WebPath
    {
        private static readonly IDictionary<string, FixerConfigurationElement> FixersByExt;
        private static readonly IEnumerable<AppenderConfigurationElement> Appenders;


        static WebPath()
        {
            FixersByExt = new Dictionary<string, FixerConfigurationElement>();
            var section = (StorageConfigurationSection)ConfigurationManager.GetSection(Schema.SECTION_NAME);
            if (section != null)
            {
                foreach (FixerConfigurationElement fixer in section.Fixers.Cast<FixerConfigurationElement>())
                {
                    FixerConfigurationElement fixer1 = fixer;
                    fixer.Extension
                        .Split(' ')
                        .Select(ext => ext.Trim().ToLowerInvariant())
                        .Where(ext => !string.IsNullOrEmpty(ext))
                        .ToList()
                        .ForEach(ext => FixersByExt[ext] = fixer1);
                }
                Appenders = section.Appenders.Cast<AppenderConfigurationElement>();
            }
        }

        public static string GetRelativePath(string absolutePath)
        {
            if (!Uri.IsWellFormedUriString(absolutePath, UriKind.Absolute))
                throw new ArgumentException(string.Format("bad path format {0} is not absolute", absolutePath));

            var appender = Appenders.FirstOrDefault(x => absolutePath.Contains(x.Append) || absolutePath.Contains(x.AppendSecure));

            if (appender == null) return absolutePath;

            if (SecureHelper.IsSecure() && !string.IsNullOrEmpty(appender.AppendSecure))
            {

                return absolutePath.Remove(0, appender.AppendSecure.Length);

            }
            else
            {

                return absolutePath.Remove(0, appender.Append.Length);

            }

        }

        public static string GetPath(string relativePath)
        {
            if (relativePath.StartsWith("~"))
                throw new ArgumentException(string.Format("bad path format {0} remove '~'", relativePath),
                                            "relativePath");

            string result = relativePath;

            var ext = Path.GetExtension(relativePath).ToLowerInvariant();
             
            try
            {
                FixerConfigurationElement fixer = FixersByExt.ContainsKey(ext) ? FixersByExt[ext] : null;
                if (fixer != null && !string.IsNullOrEmpty(fixer.AppendBeforeExt))
                {
                    relativePath = relativePath.Substring(0, relativePath.LastIndexOf(ext))
                                   + fixer.AppendBeforeExt + ext;
                }
            }
            catch
            {
            }

            if (Appenders.Any())
            {
                var avaliableAppenders = Appenders.Where(x => x.Extensions.Split('|').Contains(ext) || String.IsNullOrEmpty(ext));
                var avaliableAppendersCount = avaliableAppenders.LongCount();

                AppenderConfigurationElement appender;
                
          
                if (avaliableAppendersCount > 1)
                {
                    appender = avaliableAppenders.ToList()[(int)(relativePath.Length % avaliableAppendersCount)];

                }
                else if (avaliableAppendersCount == 1)
                {
                    appender = avaliableAppenders.First();
                }
                else
                {
                    appender = Appenders.First();
                }
                

                if (appender.Append.StartsWith("~"))
                {
                    string query = string.Empty;
                    //Rel path
                    if (relativePath.IndexOfAny(new[] { '?', '=', '&' }) != -1)
                    {
                        //Cut it
                        query = relativePath.Substring(relativePath.IndexOf('?'));
                        relativePath = relativePath.Substring(0, relativePath.IndexOf('?'));
                    }
                    result = VirtualPathUtility.ToAbsolute(
                        string.Format("{0}/{1}{2}", appender.Append.TrimEnd('/'),
                                      relativePath.TrimStart('/'), query)
                        );
                }
                else
                {
                    if (SecureHelper.IsSecure() && !string.IsNullOrEmpty(appender.AppendSecure))
                    {
                        result = string.Format("{0}/{1}", appender.AppendSecure.TrimEnd('/'),
                                               relativePath.TrimStart('/'));
                    }
                    else
                    {
                        //Append directly
                        result = string.Format("{0}/{1}", appender.Append.TrimEnd('/'), relativePath.TrimStart('/'));
                    }
                }
            }
            //To LOWER! cause Amazon is CASE SENSITIVE!
            return result.ToLowerInvariant();
        }



        private static readonly IDictionary<string, bool> Existing = new SynchronizedDictionary<string, bool>();

        public static bool Exists(string relativePath)
        {
            var path = GetPath(relativePath);
            if (!Existing.ContainsKey(path))
            {
                if (Uri.IsWellFormedUriString(path, UriKind.Relative) && HttpContext.Current != null)
                {
                    //Local
                    Existing[path] = File.Exists(HttpContext.Current.Server.MapPath(path));
                }
                if (Uri.IsWellFormedUriString(path, UriKind.Absolute))
                {
                    //Make request
                    Existing[path] = CheckWebPath(path);
                }
            }
            return Existing[path];
        }

        private static bool CheckWebPath(string path)
        {
            try
            {
                var request = (HttpWebRequest)WebRequest.Create(path);
                request.Method = "HEAD";
                var resp = (HttpWebResponse)request.GetResponse();
                resp.Close();
                return resp.StatusCode == HttpStatusCode.OK;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
}