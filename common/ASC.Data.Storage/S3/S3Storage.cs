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
using System.Collections.Specialized;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Runtime.Serialization;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using ASC.Core.Tenants;
using Amazon;
using Amazon.CloudFront;
using Amazon.CloudFront.Model;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.Util;
using ASC.Data.Storage.Configuration;
using MimeMapping = ASC.Common.Web.MimeMapping;
using Protocol = Amazon.S3.Model.Protocol;

namespace ASC.Data.Storage.S3
{
    public class UnencodedUri : Uri
    {
        public UnencodedUri(string uriString)
            : base(uriString)
        {
        }

        public UnencodedUri(string uriString, UriKind uriKind)
            : base(uriString, uriKind)
        {
        }

        public UnencodedUri(Uri baseUri, string relativeUri)
            : base(baseUri, relativeUri)
        {
        }

        public UnencodedUri(Uri baseUri, Uri relativeUri)
            : base(baseUri, relativeUri)
        {
        }

        protected UnencodedUri(SerializationInfo serializationInfo, StreamingContext streamingContext)
            : base(serializationInfo, streamingContext)
        {
        }

        public override string ToString()
        {
            return OriginalString;
        }
    }

    public class S3Storage : BaseStorage
    {
        private readonly DataList _dataList;
        private readonly List<string> _domains = new List<string>();
        private readonly Dictionary<string, S3CannedACL> _domainsAcl;
        private readonly Dictionary<string, TimeSpan> _domainsExpires;
        private readonly string _modulename;
        private readonly string _tenant;
        private readonly S3CannedACL _moduleAcl;
        private string _accessKeyId = "";
        private string _bucket = "";
        private Uri _bucketRoot;
        private Uri _bucketSSlRoot;
        private string _secretAccessKeyId = "";
        private bool _lowerCasing = true;
        private bool _revalidateCloudFront;
        private string _distributionId = string.Empty;
        private String _subDir = String.Empty;

        public S3Storage(string tenant, ModuleConfigurationElement moduleConfig, HttpContext context)
        {
            _tenant = tenant;
            _modulename = moduleConfig.Name;
            _dataList = new DataList(moduleConfig);
            _domains.AddRange(
                moduleConfig.Domains.Cast<DomainConfigurationElement>().Select(x => string.Format("{0}/", x.Name)));
            //Make acl
            _domainsExpires =
                moduleConfig.Domains.Cast<DomainConfigurationElement>().Where(x => x.Expires != TimeSpan.Zero).
                    ToDictionary(x => x.Name,
                                 y => y.Expires);
            _domainsExpires.Add(string.Empty, moduleConfig.Expires);

            _domainsAcl = moduleConfig.Domains.Cast<DomainConfigurationElement>().ToDictionary(x => x.Name,
                                                                                               y => GetS3Acl(y.Acl));
            _moduleAcl = GetS3Acl(moduleConfig.Acl);
        }

        private S3CannedACL GetDomainACL(string domain)
        {
            if (GetExpire(domain) != TimeSpan.Zero)
            {
                return S3CannedACL.Private;
            }

            if (_domainsAcl.ContainsKey(domain))
            {
                return _domainsAcl[domain];
            }
            return _moduleAcl;
        }

        private TimeSpan GetExpire(string domain)
        {
            return _domainsExpires.ContainsKey(domain) ? _domainsExpires[domain] : _domainsExpires[string.Empty];
        }

        private S3CannedACL GetS3Acl(ACL acl)
        {
            switch (acl)
            {
                case ACL.Read:
                    return S3CannedACL.PublicRead;
                default:
                    return S3CannedACL.PublicRead;
            }
        }

        public Uri GetUriShared(string domain, string path)
        {
            return new Uri(SecureHelper.IsSecure() ? _bucketSSlRoot : _bucketRoot, MakePath(domain, path));
        }

        public override Uri GetPreSignedUri(string domain, string path, TimeSpan expire, IEnumerable<string> headers)
        {
            if (expire == TimeSpan.Zero || expire == TimeSpan.MinValue || expire == TimeSpan.MaxValue)
            {
                expire = GetExpire(domain);
            }
            if (expire == TimeSpan.Zero || expire == TimeSpan.MinValue || expire == TimeSpan.MaxValue)
            {
                return GetUriShared(domain, path);
            }

            var pUrlRequest = new GetPreSignedUrlRequest
                {
                    BucketName = _bucket,
                    Expires = DateTime.UtcNow.Add(expire),
                    Key = MakePath(domain, path),
                    Protocol = SecureHelper.IsSecure() ? Protocol.HTTPS : Protocol.HTTP,
                    Verb = HttpVerb.GET
                };

            if (headers != null && headers.Any())
            {
                var headersOverrides = new ResponseHeaderOverrides();

                foreach (var h in headers)
                {
                    if (h.StartsWith("Content-Disposition")) headersOverrides.ContentDisposition = (h.Substring("Content-Disposition".Length + 1));
                    else if (h.StartsWith("Cache-Control")) headersOverrides.CacheControl = (h.Substring("Cache-Control".Length + 1));
                    else if (h.StartsWith("Content-Encoding")) headersOverrides.ContentEncoding = (h.Substring("Content-Encoding".Length + 1));
                    else if (h.StartsWith("Content-Language")) headersOverrides.ContentLanguage = (h.Substring("Content-Language".Length + 1));
                    else if (h.StartsWith("Content-Type")) headersOverrides.ContentType = (h.Substring("Content-Type".Length + 1));
                    else if (h.StartsWith("Expires")) headersOverrides.Expires = (h.Substring("Expires".Length + 1));
                    else throw new FormatException(string.Format("Invalid header: {0}", h));
                }
                pUrlRequest.ResponseHeaderOverrides = headersOverrides;
            }

            return MakeUri(GetClient().GetPreSignedURL(pUrlRequest));
        }


        private Uri MakeUri(string preSignedURL)
        {
            var uri = new Uri(preSignedURL);
            var signedPart = uri.PathAndQuery.TrimStart('/');
            return new UnencodedUri(uri.Scheme.Equals("https", StringComparison.OrdinalIgnoreCase) ? _bucketSSlRoot : _bucketRoot, signedPart);
        }

        public override Stream GetReadStream(string domain, string path)
        {
            return GetReadStream(domain, path, 0);
        }

        public override Stream GetReadStream(string domain, string path, int offset)
        {
            var request = new GetObjectRequest
                {
                    BucketName = _bucket,
                    Key = MakePath(domain, path)
                };

            if (0 < offset) request.ByteRangeLong = new Amazon.S3.Model.Tuple<long, long>(offset, int.MaxValue);

            return new ResponseStreamWrapper(GetClient().GetObject(request));
        }

        public override string[] ListFilesRelative(string domain, string path, string pattern, bool recursive)
        {
            IEnumerable<S3Object> s3Obj = GetS3Objects(domain, path);
            return
                s3Obj.Where(x => Wildcard.IsMatch(pattern, Path.GetFileName(x.Key))).Select(
                    x => x.Key.Substring(MakePath(domain, path + "/").Length).TrimStart('/')).ToArray();
        }

        protected override Uri SaveWithAutoAttachment(string domain, string path, Stream stream, string attachmentFileName)
        {
            var contentDisposition = string.Format("attachment; filename={0};",
                                                   HttpUtility.UrlPathEncode(attachmentFileName));
            if (attachmentFileName.Any(c => (int)c >= 0 && (int)c <= 127))
            {
                contentDisposition = string.Format("attachment; filename*=utf-8''{0};",
                                                   HttpUtility.UrlPathEncode(attachmentFileName));
            }
            return Save(domain, path, stream, null, contentDisposition);
        }

        public override Uri Save(string domain, string path, Stream stream, string contentType,
                        string contentDisposition)
        {
            return Save(domain, path, stream, contentType, contentDisposition, ACL.Auto);
        }

        public Uri Save(string domain, string path, Stream stream, string contentType,
                                 string contentDisposition, ACL acl, string contentEncoding = null, int cacheDays = 5)
        {
            bool postWriteCheck = false;
            if (QuotaController != null)
            {
                try
                {
                    QuotaController.QuotaUsedAdd(_modulename, domain, _dataList.GetData(domain), stream.Length);
                }
                catch (TenantQuotaException)
                {
                    //this exception occurs only if tenant has no free space
                    //or if file size larger than allowed by quota
                    //so we can exit this function without stream buffering etc
                    throw;
                }
                catch (Exception)
                {
                    postWriteCheck = true;
                }
            }


            using (AmazonS3 client = GetClient())
            {
                var request = new PutObjectRequest();
                string mime = string.IsNullOrEmpty(contentType)
                                  ? MimeMapping.GetMimeMapping(Path.GetFileName(path))
                                  : contentType;

                request.BucketName = _bucket;
                request.Key = MakePath(domain, path);
                request.CannedACL = acl == ACL.Auto ? GetDomainACL(domain) : GetS3Acl(acl);
                request.ContentType = mime;
                 
                request.ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256;

                var requestHeaders = new NameValueCollection();
                requestHeaders.Add("Cache-Control", string.Format("public, maxage={0}", (int)TimeSpan.FromDays(cacheDays).TotalSeconds));
                requestHeaders.Add("Etag", (DateTime.UtcNow.Ticks).ToString(CultureInfo.InvariantCulture));
                requestHeaders.Add("Last-Modified", DateTime.UtcNow.ToString("R"));
                requestHeaders.Add("Expires", DateTime.UtcNow.Add(TimeSpan.FromDays(cacheDays)).ToString("R"));

                if (!string.IsNullOrEmpty(contentDisposition))
                {
                    requestHeaders.Add("Content-Disposition", contentDisposition);
                }
                else if (mime == "application/octet-stream")
                {
                    requestHeaders.Add("Content-Disposition", "attachment");
                }

                if (!string.IsNullOrEmpty(contentEncoding))
                {
                    requestHeaders.Add("Content-Encoding", contentEncoding);
                }

                request.AddHeaders(requestHeaders);

                //Send body
                var buffered = stream.GetBuffered();
                if (postWriteCheck)
                {
                    QuotaController.QuotaUsedAdd(_modulename, domain, _dataList.GetData(domain), buffered.Length);
                }
                request.AutoCloseStream = false;

                request.InputStream = buffered;
                
                PutObjectResponse response = client.PutObject(request);
                var destinationObjectEncryptionStatus = response.ServerSideEncryptionMethod;

                    //..ServerSideEncryptionMethod;

                InvalidateCloudFront(MakePath(domain, path));

                return GetUri(domain, path);
            }
        }

        public override Uri UploadWithoutQuota(string domain, string path, Stream stream, string contentType, string contentDisposition)
        {
            ACL acl = ACL.Auto;
            using (AmazonS3 client = GetClient())
            {
                var util = new Amazon.S3.Transfer.TransferUtility(client);

                var request = new Amazon.S3.Transfer.TransferUtilityUploadRequest();

                string mime = string.IsNullOrEmpty(contentType)
                                  ? MimeMapping.GetMimeMapping(Path.GetFileName(path))
                                  : contentType;

                const int uploadTimeout = 10 * 60 * 1000;

                request.BucketName = _bucket;
                request.Key = MakePath(domain, path);
                request.CannedACL = acl == ACL.Auto ? GetDomainACL(domain) : GetS3Acl(acl);
                request.ContentType = mime;
                request.Timeout = uploadTimeout;

                var headers = new NameValueCollection();
                headers.Add("Cache-Control", string.Format("public, maxage={0}", (int)TimeSpan.FromDays(5).TotalSeconds));
                headers.Add("Etag", (DateTime.UtcNow.Ticks).ToString(CultureInfo.InvariantCulture));
                headers.Add("Last-Modified", DateTime.UtcNow.ToString("R"));
                headers.Add("Expires", DateTime.UtcNow.Add(TimeSpan.FromDays(5)).ToString("R"));
                if (!string.IsNullOrEmpty(contentDisposition))
                {
                    headers.Add("Content-Disposition", Uri.EscapeDataString(contentDisposition));
                }
                else if (mime == "application/octet-stream")
                {
                    headers.Add("Content-Disposition", "attachment");
                }

                request.AddHeaders(headers);

                //Send body
                var buffered = stream.GetBuffered();

                request.AutoCloseStream = false;

                request.InputStream = buffered;

                util.Upload(request);

                InvalidateCloudFront(MakePath(domain, path));

                return GetUri(domain, path);
            }
        }

        private void InvalidateCloudFront(params string[] paths)
        {
            if (!_revalidateCloudFront || string.IsNullOrEmpty(_distributionId)) return;

            using (var cfClient = GetCloudFrontClient())
            {

                var invalidationRequest = new CreateInvalidationRequest
                    {
                        DistributionId = _distributionId,
                        InvalidationBatch = new InvalidationBatch
                            {
                                CallerReference = Guid.NewGuid().ToString(),

                                Paths = new Paths
                                    {
                                        Items = paths.ToList(),
                                        Quantity = paths.Count()
                                    }
                            }
                    };

                cfClient.CreateInvalidation(invalidationRequest);
            }
        }

        public override Uri Save(string domain, string path, Stream stream)
        {
            return Save(domain, path, stream, string.Empty, string.Empty);
        }

        public override Uri Save(string domain, string path, Stream stream, string contentEncoding, int cacheDays)
        {
            return Save(domain, path, stream, string.Empty, string.Empty, ACL.Auto, contentEncoding, cacheDays);
        }

        public override Uri Save(string domain, string path, Stream stream, ACL acl)
        {
            return Save(domain, path, stream, null, null, acl);
        }

        #region chunking

        public override string InitiateChunkedUpload(string domain, string path)
        {
            var request = new InitiateMultipartUploadRequest
                {
                    BucketName = _bucket,
                    Key = MakePath(domain, path),
                    ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                };

            using (var s3 = GetClient())
            {
                var response = s3.InitiateMultipartUpload(request);
                return response.UploadId;
            }
        }

        public override string UploadChunk(string domain, string path, string uploadId, Stream stream, int chunkNumber, long chunkLength)
        {
            var request = new UploadPartRequest
                {
                    BucketName = _bucket,
                    Key = MakePath(domain, path),
                    UploadId = uploadId,
                    PartNumber = chunkNumber,
                    InputStream = stream
                };

            try
            {
                using (var s3 = GetClient())
                {
                    var response = s3.UploadPart(request);
                    return response.ETag;
                }
            }
            catch (AmazonS3Exception error)
            {
                if (error.ErrorCode == "NoSuchUpload")
                {
                    AbortChunkedUpload(domain, path, uploadId);
                }

                throw;
            }
        }

        public override Uri FinalizeChunkedUpload(string domain, string path, string uploadId, Dictionary<int, string> eTags)
        {
            var request = new CompleteMultipartUploadRequest
                {
                    BucketName = _bucket,
                    Key = MakePath(domain, path),
                    UploadId = uploadId,
                    PartETags = eTags.Select(x => new PartETag(x.Key, x.Value)).ToList()
                };

            try
            {
                using (var s3 = GetClient())
                {
                    s3.CompleteMultipartUpload(request);
                    InvalidateCloudFront(MakePath(domain, path));
                }

                if (QuotaController != null)
                {
                    var size = GetFileSize(domain, path);
                    QuotaController.QuotaUsedAdd(_modulename, domain, _dataList.GetData(domain), size);
                }

                return GetUri(domain, path);
            }
            catch (AmazonS3Exception error)
            {
                if (error.ErrorCode == "NoSuchUpload")
                {
                    AbortChunkedUpload(domain, path, uploadId);
                }

                throw;
            }
        }

        public override void AbortChunkedUpload(string domain, string path, string uploadId)
        {
            var key = MakePath(domain, path);

            var request = new AbortMultipartUploadRequest
                {
                    BucketName = _bucket,
                    Key = key,
                    UploadId = uploadId
                };

            using (var s3 = GetClient())
            {
                s3.AbortMultipartUpload(request);
            }
        }

        public override bool IsSupportChunking { get { return true; } }

        #endregion

        public override void Delete(string domain, string path)
        {
            Delete(domain, path, true);
        }

        public void Delete(string domain, string path, bool quotaDelete)
        {
            using (AmazonS3 client = GetClient())
            {
                string key = MakePath(domain, path);
                if (quotaDelete)
                {
                    QuotaDelete(domain, client, key);
                }

                var request = new DeleteObjectRequest
                    {
                        BucketName = _bucket,
                        Key = key
                    };

                client.DeleteObject(request);
            }
        }

        private long QuotaDelete(string domain, AmazonS3 client, string key)
        {
            if (QuotaController != null)
            {
                using (var responce = client.ListObjects(new ListObjectsRequest
                    {
                        BucketName = _bucket,
                        Prefix = key
                    }))
                {
                    if (responce.S3Objects != null && responce.S3Objects.Count > 0)
                    {
                        long size = Convert.ToInt64(responce.S3Objects[0].Size);
                        QuotaController.QuotaUsedDelete(_modulename, domain, _dataList.GetData(domain), size);
                        return size;
                    }
                }
            }
            return 0;
        }

        public override void DeleteFiles(string domain, string path, string pattern, bool recursive)
        {
            var objToDel = GetS3Objects(domain, path)
                .Where(x => Wildcard.IsMatch(pattern, Path.GetFileName(x.Key)));

            using (AmazonS3 client = GetClient())
            {
                foreach (S3Object s3Object in objToDel)
                {
                    if (QuotaController != null)
                    {
                        QuotaController.QuotaUsedDelete(_modulename, domain, _dataList.GetData(domain),
                                                        Convert.ToInt64(s3Object.Size));
                    }

                    var deleteRequest = new DeleteObjectRequest
                        {
                            BucketName = _bucket,
                            Key = s3Object.Key
                        };

                    using (client.DeleteObject(deleteRequest))
                    {
                    }
                }
            }
        }

        public override void MoveDirectory(string srcdomain, string srcdir, string newdomain, string newdir)
        {
            string srckey = MakePath(srcdomain, srcdir);
            string dstkey = MakePath(newdomain, newdir);
            //List files from src
            using (AmazonS3 client = GetClient())
            {
                var request = new ListObjectsRequest
                    {
                        BucketName = _bucket,
                        Prefix = srckey
                    };

                using (var response = client.ListObjects(request))
                {
                    foreach (S3Object s3Object in response.S3Objects)
                    {
                        client.CopyObject(new CopyObjectRequest
                            {
                                SourceBucket = _bucket,
                                SourceKey = s3Object.Key,
                                DestinationBucket = _bucket,
                                DestinationKey = s3Object.Key.Replace(srckey, dstkey),
                                CannedACL = GetDomainACL(newdomain),
                                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                            });

                        client.DeleteObject(new DeleteObjectRequest
                            {
                                BucketName = _bucket,
                                Key = s3Object.Key
                            });
                    }
                }
            }
        }

        public override Uri Move(string srcdomain, string srcpath, string newdomain, string newpath)
        {
            using (AmazonS3 client = GetClient())
            {
                string srcKey = MakePath(srcdomain, srcpath);
                string dstKey = MakePath(newdomain, newpath);
                long size = QuotaDelete(srcdomain, client, srcKey);
                if (QuotaController != null)
                {
                    QuotaController.QuotaUsedAdd(_modulename, newdomain, _dataList.GetData(newdomain), size);
                }
                var request = new CopyObjectRequest
                    {
                        SourceBucket = _bucket,
                        SourceKey = srcKey,
                        DestinationBucket = _bucket,
                        DestinationKey = dstKey,
                        CannedACL = GetDomainACL(newdomain),
                        Directive = S3MetadataDirective.REPLACE,
                        ServerSideEncryptionMethod=ServerSideEncryptionMethod.AES256
                    };

                client.CopyObject(request);
                Delete(srcdomain, srcpath, false);
                return GetUri(newdomain, newpath);
            }
        }

        public override Uri SaveTemp(string domain, out string assignedPath, Stream stream)
        {
            assignedPath = Guid.NewGuid().ToString();
            return Save(domain, assignedPath, stream);
        }

        public override Uri[] List(string domain, string path, bool recursive)
        {
            throw new NotSupportedException();
        }


        public override string SavePrivate(string domain, string path, Stream stream, DateTime expires)
        {
            using (AmazonS3 client = GetClient())
            {
                var objectKey = MakePath(domain, path);

                var request = new Amazon.S3.Transfer.TransferUtilityUploadRequest
                    {
                        BucketName = _bucket,
                        Key = objectKey,
                        CannedACL = S3CannedACL.BucketOwnerFullControl,
                        ContentType = "application/octet-stream",

                    };

                request.WithMetadata("private-expire", expires.ToFileTimeUtc().ToString(CultureInfo.InvariantCulture));

                var headers = new NameValueCollection();
                headers.Add("Cache-Control", string.Format("public, maxage={0}", (int)TimeSpan.FromDays(5).TotalSeconds));
                headers.Add("Etag", (DateTime.UtcNow.Ticks).ToString(CultureInfo.InvariantCulture));
                headers.Add("Last-Modified", DateTime.UtcNow.ToString("R"));
                headers.Add("Expires", DateTime.UtcNow.Add(TimeSpan.FromDays(5)).ToString("R"));
                headers.Add("Content-Disposition", "attachment");
                request.AddHeaders(headers);

                request.InputStream = stream;
                new Amazon.S3.Transfer.TransferUtility(client).Upload(request);

                //Get presigned url                
                var pUrlRequest = new GetPreSignedUrlRequest
                {
                    BucketName = _bucket,
                    Expires = expires,
                    Key = objectKey,
                    Protocol = Protocol.HTTP,
                    Verb = HttpVerb.GET
                };

                string url = client.GetPreSignedURL(pUrlRequest);
                //TODO: CNAME!
                return url;
            }
        }

        public override void DeleteExpired(string domain, string path, TimeSpan oldThreshold)
        {
            using (AmazonS3 client = GetClient())
            {
                IEnumerable<S3Object> s3Obj = GetS3Objects(domain, path);
                foreach (S3Object s3Object in s3Obj)
                {
                    var request = new GetObjectMetadataRequest
                    {
                        BucketName = _bucket,
                        Key = s3Object.Key
                    };

                    using (GetObjectMetadataResponse metadata = client.GetObjectMetadata(request))
                    {
                        string privateExpireKey = metadata.Metadata["private-expire"];
                        if (!string.IsNullOrEmpty(privateExpireKey))
                        {
                            long fileTime;
                            if (long.TryParse(privateExpireKey, out fileTime))
                            {
                                if (DateTime.UtcNow > DateTime.FromFileTimeUtc(fileTime))
                                {
                                    //Delete it
                                    var deleteObjectRequest =
                                        new DeleteObjectRequest
                                            {
                                                BucketName = _bucket,
                                                Key = s3Object.Key
                                            };

                                    using (client.DeleteObject(deleteObjectRequest))
                                    {
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        public override string GetUploadUrl()
        {
            return GetUriInternal(string.Empty).ToString();
        }

        public override string GetPostParams(string domain, string directoryPath, long maxUploadSize, string contentType,
                                             string contentDisposition)
        {
            string key = MakePath(domain, directoryPath) + "/";
            //Generate policy
            string sign;
            string policyBase64 = GetPolicyBase64(key, string.Empty, contentType, contentDisposition, maxUploadSize,
                                                  out sign);
            var postBuilder = new StringBuilder();
            postBuilder.Append("{");
            postBuilder.AppendFormat("\"key\":\"{0}${{filename}}\",", key);
            postBuilder.AppendFormat("\"acl\":\"public-read\",");
            postBuilder.AppendFormat("\"key\":\"{0}\",", key);
            postBuilder.AppendFormat("\"success_action_status\":\"{0}\",", 201);

            if (!string.IsNullOrEmpty(contentType))
                postBuilder.AppendFormat("\"Content-Type\":\"{0}\",", contentType);
            if (!string.IsNullOrEmpty(contentDisposition))
                postBuilder.AppendFormat("\"Content-Disposition\":\"{0}\",", contentDisposition);

            postBuilder.AppendFormat("\"AWSAccessKeyId\":\"{0}\",", _accessKeyId);
            postBuilder.AppendFormat("\"Policy\":\"{0}\",", policyBase64);
            postBuilder.AppendFormat("\"Signature\":\"{0}\"", sign);
            postBuilder.Append("}");
            return postBuilder.ToString();
        }

        public override string GetUploadForm(string domain, string directoryPath, string redirectTo, long maxUploadSize,
                                             string contentType, string contentDisposition, string submitLabel)
        {
            string destBucket = GetUploadUrl();
            string key = MakePath(domain, directoryPath) + "/";
            //Generate policy
            string sign;
            string policyBase64 = GetPolicyBase64(key, redirectTo, contentType, contentDisposition, maxUploadSize,
                                                  out sign);

            var formBuilder = new StringBuilder();
            formBuilder.AppendFormat("<form action=\"{0}\" method=\"post\" enctype=\"multipart/form-data\">", destBucket);
            formBuilder.AppendFormat("<input type=\"hidden\" name=\"key\" value=\"{0}${{filename}}\" />", key);
            formBuilder.Append("<input type=\"hidden\" name=\"acl\" value=\"public-read\" />");
            if (!string.IsNullOrEmpty(redirectTo))
                formBuilder.AppendFormat("<input type=\"hidden\" name=\"success_action_redirect\" value=\"{0}\" />",
                                         redirectTo);

            formBuilder.AppendFormat("<input type=\"hidden\" name=\"success_action_status\" value=\"{0}\" />", 201);

            if (!string.IsNullOrEmpty(contentType))
                formBuilder.AppendFormat("<input type=\"hidden\" name=\"Content-Type\" value=\"{0}\" />", contentType);
            if (!string.IsNullOrEmpty(contentDisposition))
                formBuilder.AppendFormat("<input type=\"hidden\" name=\"Content-Disposition\" value=\"{0}\" />",
                                         contentDisposition);
            formBuilder.AppendFormat("<input type=\"hidden\" name=\"AWSAccessKeyId\" value=\"{0}\"/>", _accessKeyId);
            formBuilder.AppendFormat("<input type=\"hidden\" name=\"Policy\" value=\"{0}\" />", policyBase64);
            formBuilder.AppendFormat("<input type=\"hidden\" name=\"Signature\" value=\"{0}\" />", sign);
            formBuilder.AppendFormat("<input type=\"file\" name=\"file\" />");
            formBuilder.AppendFormat("<input type=\"submit\" name=\"submit\" value=\"{0}\" /></form>", submitLabel);
            return formBuilder.ToString();
        }

        private string GetPolicyBase64(string key, string redirectTo, string contentType, string contentDisposition,
                                       long maxUploadSize, out string sign)
        {
            var policyBuilder = new StringBuilder();
            policyBuilder.AppendFormat("{{\"expiration\": \"{0}\",\"conditions\":[",
                                       DateTime.UtcNow.AddMinutes(15).ToString(AWSSDKUtils.ISO8601DateFormat,
                                                                               CultureInfo.InvariantCulture));
            policyBuilder.AppendFormat("{{\"bucket\": \"{0}\"}},", _bucket);
            policyBuilder.AppendFormat("[\"starts-with\", \"$key\", \"{0}\"],", key);
            policyBuilder.Append("{\"acl\": \"public-read\"},");
            if (!string.IsNullOrEmpty(redirectTo))
            {
                policyBuilder.AppendFormat("{{\"success_action_redirect\": \"{0}\"}},", redirectTo);
            }
            policyBuilder.AppendFormat("{{\"success_action_status\": \"{0}\"}},", 201);
            if (!string.IsNullOrEmpty(contentType))
            {
                policyBuilder.AppendFormat("[\"eq\", \"$Content-Type\", \"{0}\"],", contentType);
            }
            if (!string.IsNullOrEmpty(contentDisposition))
            {
                policyBuilder.AppendFormat("[\"eq\", \"$Content-Disposition\", \"{0}\"],", contentDisposition);
            }
            policyBuilder.AppendFormat("[\"content-length-range\", 0, {0}]", maxUploadSize);
            policyBuilder.Append("]}");

            string policyBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(policyBuilder.ToString()));
            sign = AWSSDKUtils.HMACSign(policyBase64, _secretAccessKeyId, new HMACSHA1());
            return policyBase64;
        }

        public override string GetUploadedUrl(string domain, string directoryPath)
        {
            if (HttpContext.Current != null)
            {
                string buket = HttpContext.Current.Request.QueryString["bucket"];
                string key = HttpContext.Current.Request.QueryString["key"];
                string etag = HttpContext.Current.Request.QueryString["etag"];
                string destkey = MakePath(domain, directoryPath) + "/";

                if (!string.IsNullOrEmpty(buket) && !string.IsNullOrEmpty(key) && string.Equals(buket, _bucket) &&
                    key.StartsWith(destkey))
                {
                    string domainpath = key.Substring(MakePath(domain, string.Empty).Length);
                    bool skipQuota = false;
                    if (HttpContext.Current.Session != null)
                    {
                        object isCounted = HttpContext.Current.Session[etag];
                        skipQuota = isCounted != null;
                    }
                    //Add to quota controller
                    if (QuotaController != null && !skipQuota)
                    {
                        try
                        {
                            long size = GetFileSize(domain, domainpath);
                            QuotaController.QuotaUsedAdd(_modulename, domain, _dataList.GetData(domain), size);
                            if (HttpContext.Current.Session != null)
                            {
                                HttpContext.Current.Session.Add(etag, size);
                            }
                        }
                        catch (Exception)
                        {
                           
                        }
                    }
                    return GetUriInternal(key).ToString();
                }
            }
            return string.Empty;
        }


        public override Uri[] ListFiles(string domain, string path, string pattern, bool recursive)
        {
            return GetS3Objects(domain, path)
                .Where(x => Wildcard.IsMatch(pattern, Path.GetFileName(x.Key)))
                .Select(x => GetUriInternal(x.Key))
                .ToArray();
        }

        private bool CheckKey(string domain, string key)
        {
            return !string.IsNullOrEmpty(domain) ||
                   _domains.All(configuredDomains => !key.StartsWith(MakePath(configuredDomains, "")));
        }

        public override bool IsFile(string domain, string path)
        {
            using (AmazonS3 client = GetClient())
            {
                var request = new ListObjectsRequest { BucketName = _bucket };
                request.Prefix = (MakePath(domain, path));
                using (ListObjectsResponse response = client.ListObjects(request))
                {
                    return response.S3Objects.Count > 0;
                }
            }
        }

        public override bool IsDirectory(string domain, string path)
        {
            return IsFile(domain, path);
        }

        public override void DeleteDirectory(string domain, string path)
        {
            DeleteFiles(domain, path, "*.*", true);
        }

        public override long GetFileSize(string domain, string path)
        {
            using (AmazonS3 client = GetClient())
            {
                var request = new ListObjectsRequest { BucketName = _bucket };
                request.Prefix = (MakePath(domain, path));
                using (ListObjectsResponse response = client.ListObjects(request))
                {
                    if (response.S3Objects.Count > 0)
                    {
                        return response.S3Objects[0].Size;
                    }
                    throw new FileNotFoundException("file not found", path);
                }
            }
        }


        public override long ResetQuota(string domain)
        {
            if (QuotaController != null)
            {
                IEnumerable<S3Object> objects = GetS3Objects(domain);
                long size = objects.Sum(s3Object => s3Object.Size);
                QuotaController.QuotaUsedSet(_modulename, domain, _dataList.GetData(domain), size);
                return size;
            }
            return 0;
        }

        public override long GetUsedQuota(string domain)
        {
            IEnumerable<S3Object> objects = GetS3Objects(domain);
            return objects.Sum(s3Object => s3Object.Size);
        }

        public override Uri Copy(string srcdomain, string srcpath, string newdomain, string newpath)
        {
            using (AmazonS3 client = GetClient())
            {
                string srcKey = MakePath(srcdomain, srcpath);
                string dstKey = MakePath(newdomain, newpath);
                long size = QuotaDelete(srcdomain, client, srcKey);
                if (QuotaController != null)
                {
                    QuotaController.QuotaUsedAdd(_modulename, newdomain, _dataList.GetData(newdomain), size);
                }
                var request = new CopyObjectRequest
                    {
                        SourceBucket = _bucket,
                        SourceKey = srcKey,
                        DestinationBucket = _bucket,
                        DestinationKey = dstKey,
                        CannedACL = GetDomainACL(newdomain),
                        Directive = S3MetadataDirective.REPLACE,
                        ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                    };

                client.CopyObject(request);
                return GetUri(newdomain, newpath);
            }
        }

        public override void CopyDirectory(string srcdomain, string srcdir, string newdomain, string newdir)
        {
            string srckey = MakePath(srcdomain, srcdir);
            string dstkey = MakePath(newdomain, newdir);
            //List files from src
            using (AmazonS3 client = GetClient())
            {
                var request = new ListObjectsRequest {BucketName = _bucket, Prefix = srckey};

                using (ListObjectsResponse response = client.ListObjects(request))
                {
                    foreach (S3Object s3Object in response.S3Objects)
                    {
                        if (QuotaController != null)
                        {
                            QuotaController.QuotaUsedAdd(_modulename, newdomain, _dataList.GetData(newdomain), s3Object.Size);
                        }

                        client.CopyObject(new CopyObjectRequest
                                              {
                                                SourceBucket = _bucket,
                                                SourceKey = s3Object.Key,
                                                DestinationBucket = _bucket,
                                                DestinationKey = s3Object.Key.Replace(srckey, dstkey),
                                                CannedACL = GetDomainACL(newdomain),
                                                ServerSideEncryptionMethod = ServerSideEncryptionMethod.AES256
                                              });
                    }
                }
            }
        }

        private IEnumerable<S3Object> GetS3Objects(string domain)
        {
            return GetS3Objects(domain, string.Empty);
        }

        private IEnumerable<S3Object> GetS3Objects(string domain, string path)
        {
            using (AmazonS3 client = GetClient())
            {
                var request = new ListObjectsRequest
                    {
                        BucketName = _bucket,
                        Prefix = (MakePath(domain, path.TrimEnd('/') + '/')),
                        MaxKeys = (1000)
                    };

                var objects = new List<S3Object>();
                ListObjectsResponse response;
                do
                {
                    response = client.ListObjects(request);
                    objects.AddRange(response.S3Objects.Where(entry => CheckKey(domain, entry.Key)));
                    request.Marker = response.NextMarker;
                } while (response.IsTruncated);
                return objects;
            }
        }


        public override IDataStore Configure(IDictionary<string, string> props)
        {
            _accessKeyId = props["acesskey"];
            _secretAccessKeyId = props["secretaccesskey"];
            _bucket = props["bucket"];
            _bucketRoot = props.ContainsKey("cname") && Uri.IsWellFormedUriString(props["cname"], UriKind.Absolute)
                              ? new Uri(props["cname"], UriKind.Absolute)
                              : new Uri(string.Format("http://{0}.s3.amazonaws.com", _bucket), UriKind.Absolute);
            _bucketSSlRoot = props.ContainsKey("cnamessl") &&
                             Uri.IsWellFormedUriString(props["cnamessl"], UriKind.Absolute)
                                 ? new Uri(props["cnamessl"], UriKind.Absolute)
                                 : new Uri(string.Format("https://s3.amazonaws.com/{0}/", _bucket), UriKind.Absolute);

            if (props.ContainsKey("lower"))
            {
                bool.TryParse(props["lower"], out _lowerCasing);
            }
            if (props.ContainsKey("cloudfront"))
            {
                bool.TryParse(props["cloudfront"], out _revalidateCloudFront);
            }
            if (props.ContainsKey("distribution"))
            {
                _distributionId = props["distribution"];
            }

            if (props.ContainsKey("subdir"))
            {
                _subDir = props["subdir"];
            }

            return this;
        }

        private string MakePath(string domain, string path)
        {
            string result;

            path = path.TrimStart('\\', '/').TrimEnd('/').Replace('\\', '/');

            if (!String.IsNullOrEmpty(_subDir))
            {
                if (_subDir.Length == 1 && (_subDir[0] == '/' || _subDir[0] == '\\'))
                    result = path;
                else
                    result = String.Format("{0}/{1}", _subDir, path); // Ignory all, if _subDir is not null
            }
            else//Key combined from module+domain+filename
                result = string.Format("{0}/{1}/{2}/{3}",
                                                         _tenant,
                                                         _modulename,
                                                         domain,
                                                         path);

            result = result.Replace("//", "/");
            if (_lowerCasing)
            {
                result = result.ToLowerInvariant();
            }

            return result;
        }

        public override Uri GetUriInternal(string path)
        {
            return new Uri(SecureHelper.IsSecure() ? _bucketSSlRoot : _bucketRoot, path);
        }

        private AmazonCloudFront GetCloudFrontClient()
        {
            var cfg = new AmazonCloudFrontConfig { MaxErrorRetry = 3 };
            return AWSClientFactory.CreateAmazonCloudFrontClient(_accessKeyId, _secretAccessKeyId, cfg);
        }

        private AmazonS3 GetClient()
        {
            var cfg = new AmazonS3Config { CommunicationProtocol = Protocol.HTTP, MaxErrorRetry = 3 };
            return AWSClientFactory.CreateAmazonS3Client(_accessKeyId, _secretAccessKeyId, cfg);
        }

        public Stream GetWriteStream(string domain, string path)
        {
            throw new NotSupportedException();
        }



        private class ResponseStreamWrapper : Stream
        {
            private readonly GetObjectResponse _response;


            public ResponseStreamWrapper(GetObjectResponse response)
            {
                if (response == null) throw new ArgumentNullException("response");

                _response = response;
            }


            public override bool CanRead
            {
                get { return _response.ResponseStream.CanRead; }
            }

            public override bool CanSeek
            {
                get { return _response.ResponseStream.CanSeek; }
            }

            public override bool CanWrite
            {
                get { return _response.ResponseStream.CanWrite; }
            }

            public override long Length
            {
                get { return _response.ContentLength; }
            }

            public override long Position
            {
                get { return _response.ResponseStream.Position; }
                set { _response.ResponseStream.Position = value; }
            }

            public override int Read(byte[] buffer, int offset, int count)
            {
                return _response.ResponseStream.Read(buffer, offset, count);
            }

            public override long Seek(long offset, SeekOrigin origin)
            {
                return _response.ResponseStream.Seek(offset, origin);
            }

            public override void SetLength(long value)
            {
                _response.ResponseStream.SetLength(value);
            }

            public override void Write(byte[] buffer, int offset, int count)
            {
                _response.ResponseStream.Write(buffer, offset, count);
            }

            public override void Flush()
            {
                _response.ResponseStream.Flush();
            }

            protected override void Dispose(bool disposing)
            {
                base.Dispose(disposing);
                if (disposing) _response.Dispose();
            }
        }
    }
}