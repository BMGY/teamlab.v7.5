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
using System.IO;
using System.Web;
using ASC.Common.Web;
using ASC.Core;
using ASC.Core.Tenants;
using ASC.Files.Core;
using ASC.Security.Cryptography;
using ASC.Web.Files.Classes;
using ASC.Web.Files.Utils;
using Newtonsoft.Json;
using File = ASC.Files.Core.File;

namespace ASC.Web.Files.HttpHandlers
{
    public class ChunkedUploaderHandler : AbstractHttpAsyncHandler
    {
        public override void OnProcessRequest(HttpContext context)
        {
            try
            {
                var request = new ChunkedRequestHelper(context.Request);

                if (!TryAuthorize(request))
                {
                    WriteError(context, "Can't authorize given initiate session request or session with specified upload id already expired");
                    return;
                }

                if (CoreContext.TenantManager.GetCurrentTenant().Status != TenantStatus.Active)
                {
                    WriteError(context, "Can't perform upload for deleted or transfering portals");
                }

                switch (request.Type)
                {
                    case ChunkedRequestType.Abort:
                        FileUploader.AbortUpload(request.UploadId);
                        WriteSuccess(context, null);
                        return;

                    case ChunkedRequestType.Initiate:
                        ChunkedUploadSession createdSession = FileUploader.InitiateUpload(request.FolderId, request.FileId, request.FileName, request.FileSize);
                        WriteSuccess(context, ToResponseObject(createdSession));
                        return;

                    case ChunkedRequestType.Upload:
                        ChunkedUploadSession resumedSession = FileUploader.UploadChunk(request.UploadId, request.ChunkStream, request.ChunkSize);

                        if (resumedSession.BytesUploaded == resumedSession.BytesTotal)
                            WriteSuccess(context, ToResponseObject(resumedSession.File), statusCode: 201);
                        else
                            WriteSuccess(context, ToResponseObject(resumedSession));
                        
                        return;

                    default:
                        WriteError(context, "Unknown request type.");
                        return;
                }
            }
            catch (Exception error)
            {
                Global.Logger.Error(error);
                WriteError(context, error.Message);
            }
        }

        private static bool TryAuthorize(ChunkedRequestHelper request)
        {
            if (request.Type == ChunkedRequestType.Initiate)
            {
                CoreContext.TenantManager.SetCurrentTenant(request.TenantId);
                SecurityContext.AuthenticateMe(CoreContext.Authentication.GetAccountByID(request.AuthKey));
                return true;
            }
            
            if (!string.IsNullOrEmpty(request.UploadId))
            {
                var uploadSession = ChunkedUploadSessionHolder.GetSession(request.UploadId);
                if (uploadSession != null)
                {
                    CoreContext.TenantManager.SetCurrentTenant(uploadSession.TenantId);
                    SecurityContext.AuthenticateMe(CoreContext.Authentication.GetAccountByID(uploadSession.UserId));
                    return true;
                }
            }

            return false;
        }

        private static void WriteError(HttpContext context, string message, int statusCode = 200)
        {
            WriteResponse(context, statusCode, false, message.HtmlEncode(), null);
        }

        private static void WriteSuccess(HttpContext context, object data, int statusCode = 200)
        {
            WriteResponse(context, statusCode, true, string.Empty, data);
        }

        private static void WriteResponse(HttpContext context, int statusCode, bool success, string message, object data)
        {
            context.Response.StatusCode = statusCode;
            context.Response.Write(JsonConvert.SerializeObject(new {success, data, message}));
        }

        private static object ToResponseObject(ChunkedUploadSession session)
        {
            return new
                {
                    id = session.Id,
                    created = session.Created,
                    expired = session.Expired,
                    location = session.Location,
                    bytes_uploaded = session.BytesUploaded,
                    bytes_total = session.BytesTotal
                };
        }

        private static object ToResponseObject(File file)
        {
            return new
                {
                    id = file.ID,
                    version = file.Version,
                    title = file.Title,
                    provider_key = file.ProviderKey
                };
        }

        private enum ChunkedRequestType
        {
            None,
            Initiate,
            Abort,
            Upload
        }

        private class ChunkedRequestHelper
        {
            private readonly HttpRequest _request;
            private HttpPostedFileBase _file;
            private int? _tenantId;
            private long? _fileContentLength;
            private Guid? _authKey;

            public ChunkedRequestType Type
            {
                get
                {
                    if (_request["initiate"] == "true" && IsAuthDataSet() && IsFileDataSet())
                        return ChunkedRequestType.Initiate;

                    if (_request["abort"] == "true" && !string.IsNullOrEmpty(UploadId))
                        return ChunkedRequestType.Abort;

                    if (!string.IsNullOrEmpty(UploadId))
                        return ChunkedRequestType.Upload;

                    return ChunkedRequestType.None;
                }
            }

            public string UploadId
            {
                get { return _request["uid"]; }
            }

            public int TenantId
            {
                get
                {
                    if (!_tenantId.HasValue)
                    {
                        int v;
                        if (int.TryParse(_request["tid"], out v))
                            _tenantId = v;
                        else
                            _tenantId = -1;
                    }
                    return _tenantId.Value;
                }
            }

            public Guid AuthKey
            {
                get
                {
                    if (!_authKey.HasValue)
                    {
                        if (!string.IsNullOrEmpty(_request["userid"]))
                            _authKey = new Guid(InstanceCrypto.Decrypt(_request["userid"]));
                        else
                            _authKey = Guid.Empty;
                    }
                    return _authKey.Value;
                }
            }

            public string FolderId
            {
                get { return _request["folderid"]; }
            }

            public string FileId
            {
                get { return _request["fileid"]; }
            }

            public string FileName
            {
                get { return _request["name"]; }
            }

            public long FileSize
            {
                get
                {
                    if (!_fileContentLength.HasValue)
                    {
                        long v;
                        long.TryParse(_request["fileSize"], out v);
                        _fileContentLength = v;
                    }
                    return _fileContentLength.Value;
                }
            }

            public long ChunkSize
            {
                get { return File.ContentLength; }
            }

            public Stream ChunkStream
            {
                get { return File.InputStream; }
            }

            private HttpPostedFileBase File
            {
                get { return _file ?? (_file = new HttpPostedFileWrapper(_request.Files[0])); }
            }

            public ChunkedRequestHelper(HttpRequest request)
            {
                if (request == null) throw new ArgumentNullException("request");
                _request = request;
            }

            private bool IsAuthDataSet()
            {
                return TenantId > -1 && AuthKey != Guid.Empty;
            }

            private bool IsFileDataSet()
            {
                return !string.IsNullOrEmpty(FileName) && !string.IsNullOrEmpty(FolderId);
            }
        }
    }
}
