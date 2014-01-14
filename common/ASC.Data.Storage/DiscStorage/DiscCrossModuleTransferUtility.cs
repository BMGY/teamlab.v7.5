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
using System.IO;
using System.Web;
using ASC.Data.Storage.Configuration;

namespace ASC.Data.Storage.DiscStorage
{
    public class DiscCrossModuleTransferUtility : ICrossModuleTransferUtility
    {
        private readonly Dictionary<string, MappedPath> _srcMappedPaths;
        private readonly Dictionary<string, MappedPath> _destMappedPaths;

        public DiscCrossModuleTransferUtility(string srcTenant,
                                              ModuleConfigurationElement srcModuleConfig,
                                              IDictionary<string, string> srcStorageConfig,
                                              string destTenant,
                                              ModuleConfigurationElement destModuleConfig,
                                              IDictionary<string, string> destStorageConfig)
        {
            _srcMappedPaths = new Dictionary<string, MappedPath>(GetMappedPaths(srcTenant, srcModuleConfig));
            _destMappedPaths = new Dictionary<string, MappedPath>(GetMappedPaths(destTenant, destModuleConfig));
        }

        public void MoveFile(string srcDomain, string srcPath, string destDomain, string destPath)
        {
            var srcTarget = GetTarget(_srcMappedPaths, srcDomain, srcPath);
            var destTarget = GetTarget(_destMappedPaths, destDomain, destPath);

            if (!File.Exists(srcTarget))
                throw new FileNotFoundException("File not found", Path.GetFullPath(srcTarget));

            if (!Directory.Exists(Path.GetDirectoryName(destTarget)))
                Directory.CreateDirectory(Path.GetDirectoryName(destTarget));

            File.Delete(destTarget);
            File.Move(srcTarget, destTarget);
        }

        public void CopyFile(string srcDomain, string srcPath, string destDomain, string destPath)
        {
            var srcTarget = GetTarget(_srcMappedPaths, srcDomain, srcPath);
            var destTarget = GetTarget(_destMappedPaths, destDomain, destPath);

            if (!File.Exists(srcTarget))
                throw new FileNotFoundException("File not found", Path.GetFullPath(srcTarget));

            if (!Directory.Exists(Path.GetDirectoryName(destTarget)))
                Directory.CreateDirectory(Path.GetDirectoryName(destTarget));

            File.Copy(srcTarget, destTarget, true);
        }

        private string GetTarget(IDictionary<string, MappedPath> mappedPaths, string domain, string path)
        {
            MappedPath pathMap = domain != null && mappedPaths.ContainsKey(domain)
                                     ? mappedPaths[domain]
                                     : mappedPaths[string.Empty].AppendDomain(domain);

            return pathMap.Path + path.Replace('/', '\\').TrimEnd('\\');
        }


        private static IDictionary<string, MappedPath> GetMappedPaths(string tenant, ModuleConfigurationElement moduleConfig)
        {
            var mappedPaths = new Dictionary<string, MappedPath>();

            foreach (DomainConfigurationElement domain in moduleConfig.Domains)
            {
                mappedPaths.Add(domain.Name,
                                new MappedPath(HttpContext.Current, tenant, moduleConfig.AppendTenant, domain.Path, domain.VirtualPath,
                                               SelectDirectory(moduleConfig), domain.Quota, domain.Overwrite));
            }

            mappedPaths.Add(string.Empty,
                            new MappedPath(HttpContext.Current, tenant, moduleConfig.AppendTenant, moduleConfig.Path, moduleConfig.VirtualPath,
                                           SelectDirectory(moduleConfig), moduleConfig.Quota, moduleConfig.Overwrite));

            return mappedPaths;
        }

        private static string SelectDirectory(ModuleConfigurationElement moduleConfig)
        {
            if (string.IsNullOrEmpty(moduleConfig.BaseDir))
            {
                if (HttpContext.Current != null)
                {
                    return HttpContext.Current.Server.MapPath(VirtualPathUtility.ToAbsolute("~/"));
                }
                if (AppDomain.CurrentDomain.GetData(Constants.CustomDataDirectory) != null)
                {
                    return (string)AppDomain.CurrentDomain.GetData(Constants.CustomDataDirectory);
                }
                return AppDomain.CurrentDomain.BaseDirectory;
            }
            return moduleConfig.BaseDir;
        }
    }
}
