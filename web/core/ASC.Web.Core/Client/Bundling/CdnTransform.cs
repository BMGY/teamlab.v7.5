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

using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using ASC.Data.Storage.Configuration;
using log4net;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Configuration;
using System.Web.Optimization;

namespace ASC.Web.Core.Client.Bundling
{
    class CdnTransform : IBundleTransform
    {
        private static readonly ILog log = LogManager.GetLogger("ASC.Web.Bundle.CdnTransform");
        private static readonly ConcurrentQueue<CdnItem> queue = new ConcurrentQueue<CdnItem>();
        private static readonly Dictionary<string, string> appenders = new Dictionary<string, string>();
        private static readonly string s3publickey;
        private static readonly string s3privatekey;
        private static readonly string s3bucket;
        private static bool successInitialized = false;
        private static int work = 0;


        static CdnTransform()
        {
            try
            {
                var section = (StorageConfigurationSection)WebConfigurationManager.GetSection("storage");
                if (section == null)
                {
                    throw new Exception("Storage section not found.");
                }

                if (section.Appenders.Count == 0)
                {
                    throw new Exception("Appenders not found.");
                }
                foreach (AppenderConfigurationElement a in section.Appenders)
                {
                    var url = string.IsNullOrEmpty(a.AppendSecure) ? a.Append : a.AppendSecure;
                    if (url.StartsWith("~"))
                    {
                        throw new Exception("Only absolute cdn path supported. Can not use " + url);
                    }

                    appenders[a.Extensions + "|"] = url.TrimEnd('/') + "/";
                }

                foreach (HandlerConfigurationElement h in section.Handlers)
                {
                    if (h.Name == "cdn")
                    {
                        s3publickey = h.HandlerProperties["acesskey"].Value;
                        s3privatekey = h.HandlerProperties["secretaccesskey"].Value;
                        s3bucket = h.HandlerProperties["bucket"].Value;
                        break;
                    }
                }

                successInitialized = true;
            }
            catch (Exception fatal)
            {
                log.Fatal(fatal);
            }
        }


        public void Process(BundleContext context, BundleResponse response)
        {
            if (successInitialized && BundleTable.Bundles.UseCdn)
            {
                try
                {
                    var bundle = context.BundleCollection.GetBundleFor(context.BundleVirtualPath);
                    if (bundle != null)
                    {
                        queue.Enqueue(new CdnItem { Bundle = bundle, Response = response });
                        Action upload = () => UploadToCdn();
                        upload.BeginInvoke(null, null);
                    }
                }
                catch (Exception fatal)
                {
                    log.Fatal(fatal);
                    throw;
                }
            }
        }

        private void UploadToCdn()
        {
            try
            {
                // one thread only
                if (Interlocked.CompareExchange(ref work, 1, 0) == 0)
                {
                    var @continue = false;
                    try
                    {
                        CdnItem item;
                        if (queue.TryDequeue(out item))
                        {
                            @continue = true;

                            var cdnpath = GetCdnPath(item.Bundle.Path);
                            var key = new Uri(cdnpath).PathAndQuery.TrimStart('/');
                            var etag = AmazonS3Util.GenerateChecksumForContent(item.Response.Content, false).ToLowerInvariant();

                            var config = new AmazonS3Config
                            {
                                ServiceURL = "s3.amazonaws.com",
                                CommunicationProtocol = Protocol.HTTP
                            };
                            using (var s3 = new AmazonS3Client(s3publickey, s3privatekey, config))
                            {
                                var upload = false;
                                try
                                {
                                    var request = new GetObjectMetadataRequest
                                    {
                                        BucketName = s3bucket,
                                        Key = key,
                                    };
                                    using (var response = s3.GetObjectMetadata(request))
                                    {
                                        upload = !string.Equals(etag, response.ETag.Trim('"'), StringComparison.InvariantCultureIgnoreCase);
                                    }
                                }
                                catch (AmazonS3Exception ex)
                                {
                                    if (ex.StatusCode == HttpStatusCode.NotFound)
                                    {
                                        upload = true;
                                    }
                                    else
                                    {
                                        throw;
                                    }
                                }

                                if (upload)
                                {
                                    var request = new PutObjectRequest
                                    {
                                        BucketName = s3bucket,
                                        CannedACL = S3CannedACL.PublicRead,
                                        Key = key,
                                        ContentType = AmazonS3Util.MimeTypeFromExtension(Path.GetExtension(key).ToLowerInvariant()),
                                    };

                                    if (ClientSettings.GZipEnabled)
                                    {
                                        var compressed = new MemoryStream();
                                        using (var compression = new GZipStream(compressed, CompressionMode.Compress, true))
                                        {
                                            new MemoryStream(Encoding.UTF8.GetBytes(item.Response.Content)).CopyTo(compression);
                                        }
                                        request.InputStream = compressed;
                                        request.AddHeader("Content-Encoding", "gzip");
                                    }
                                    else
                                    {
                                        request.ContentBody = item.Response.Content;
                                    }

                                    var cache = TimeSpan.FromDays(365);
                                    request.AddHeader("Cache-Control", string.Format("public, maxage={0}", (int)cache.TotalSeconds));
                                    request.AddHeader("Expires", DateTime.UtcNow.Add(cache).ToString("R"));
                                    request.AddHeader("Etag", etag);
                                    request.AddHeader("Last-Modified", DateTime.UtcNow.ToString("R"));

                                    using (s3.PutObject(request)) { }
                                }

                                item.Bundle.CdnPath = cdnpath;
                            }
                        }
                    }
                    catch (Exception err)
                    {
                        log.Error(err);
                    }
                    finally
                    {
                        work = 0;
                        if (@continue)
                        {
                            Action upload = () => UploadToCdn();
                            upload.BeginInvoke(null, null);
                        }
                    }
                }
            }
            catch (Exception fatal)
            {
                log.Fatal(fatal);
            }
        }

        private string GetCdnPath(string path)
        {
            var ext = Path.GetExtension(path).ToLowerInvariant();
            var abspath = string.Empty;
            foreach (var a in appenders)
            {
                abspath = a.Value;
                if (a.Key.ToLowerInvariant().Contains(ext + "|"))
                {
                    break;
                }
            }

            return abspath + path.TrimStart('~', '/');
        }



        class CdnItem
        {
            public Bundle Bundle
            {
                get;
                set;
            }

            public BundleResponse Response
            {
                get;
                set;
            }
        }
    }
}