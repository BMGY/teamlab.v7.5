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
using System.Globalization;
using System.IO;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;
using System.Xml;
using System.Xml.Linq;
using ASC.Common.Utils;

namespace ASC.Web.Files.Services.DocumentService
{
    /// <summary>
    /// Class service connector
    /// </summary>
    public class DocumentService
    {
        private readonly string _tenantId;
        private readonly string _secretKey;
        private readonly int _userCount;
        private const string ConvertParams = "?url={0}&outputtype={1}&filetype={2}&title={3}&key={4}&vkey={5}";

        /// <summary>
        /// Timeout to request conversion
        /// </summary>
        public int ConvertTimeout = 120000;

        /// <summary>
        /// Number of tries request conversion
        /// </summary>
        public int MaxTry = 3;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="tenantId">Public license key</param>
        /// <param name="secretKey">Secret license key</param>
        /// <param name="userCount">User count</param>
        public DocumentService(string tenantId, string secretKey, int userCount)
        {
            _tenantId = tenantId;
            _secretKey = secretKey;
            _userCount = userCount;
        }

        /// <summary>
        /// Translation key to a supported form.
        /// </summary>
        /// <param name="expectedKey">Expected key</param>
        /// <returns>Supported key</returns>
        public static string GenerateRevisionId(string expectedKey)
        {
            const int maxLength = 50;
            if (expectedKey.Length > maxLength) expectedKey = expectedKey.GetHashCode().ToString(CultureInfo.InvariantCulture);
            var key = Regex.Replace(expectedKey, "[^0-9-.a-zA-Z_=]", "_");
            return key.Substring(key.Length - Math.Min(key.Length, maxLength));
        }

        /// <summary>
        /// Generate validate key for editor by documentId
        /// </summary>
        /// <param name="documentRevisionId">Key for caching on service, whose used in editor</param>
        /// <param name="userIp">Add host address to the key</param>
        /// <returns>Validation key</returns>
        public string GenerateValidateKey(string documentRevisionId, string userIp)
        {
            if (string.IsNullOrEmpty(documentRevisionId)) return string.Empty;

            documentRevisionId = GenerateRevisionId(documentRevisionId);

            object primaryKey;

            if (!string.IsNullOrEmpty(userIp))
                primaryKey = new { expire = DateTime.UtcNow, key = documentRevisionId, key_id = _tenantId, user_count = _userCount, ip = userIp };
            else
                primaryKey = new { expire = DateTime.UtcNow, key = documentRevisionId, key_id = _tenantId, user_count = _userCount };

            return Signature.Create(primaryKey, _secretKey);
        }

        /// <summary>
        /// The method is to convert the file to the required format
        /// </summary>
        /// <param name="documentConverterUrl">Url to the service of conversion</param>
        /// <param name="documentUri">Uri for the document to convert</param>
        /// <param name="fromExtension">Document extension</param>
        /// <param name="toExtension">Extension to which to convert</param>
        /// <param name="documentRevisionId">Key for caching on service</param>
        /// <param name="isAsync">Perform conversions asynchronously</param>
        /// <param name="convertedDocumentUri">Uri to the converted document</param>
        /// <returns>The percentage of completion of conversion</returns>
        /// <example>
        /// string convertedDocumentUri;
        /// GetConvertedUri("http://helpcenter.teamlab.com/content/GettingStarted.pdf", ".pdf", ".docx", "469971047", false, out convertedDocumentUri);
        /// </example>
        /// <exception>
        /// </exception>
        public int GetConvertedUri(
            string documentConverterUrl,
            string documentUri,
            string fromExtension,
            string toExtension,
            string documentRevisionId,
            bool isAsync,
            out string convertedDocumentUri)
        {
            var xDocumentResponse = SendRequestToConvertService(
                documentConverterUrl,
                documentUri,
                fromExtension,
                toExtension,
                documentRevisionId,
                isAsync);
            return GetResponseUri(xDocumentResponse, out convertedDocumentUri);
        }

        /// <summary>
        /// Placing the document in the storage service
        /// </summary>
        /// <param name="documentStorageUrl">Url to the storage service</param>
        /// <param name="fileStream">Stream of document</param>
        /// <param name="contentType">Mime type</param>
        /// <param name="documentRevisionId">Key for caching on service, whose used in editor</param>
        /// <returns>Uri to document in the storage</returns>
        public string GetExternalUri(
            string documentStorageUrl,
            Stream fileStream,
            string contentType,
            string documentRevisionId)
        {
            var validateKey = GenerateValidateKey(documentRevisionId, string.Empty);

            var urlDocumentService = documentStorageUrl + ConvertParams;
            var urlTostorage = String.Format(urlDocumentService,
                                             string.Empty,
                                             string.Empty,
                                             string.Empty,
                                             string.Empty,
                                             documentRevisionId,
                                             validateKey);

            var request = (HttpWebRequest)WebRequest.Create(urlTostorage);
            request.Method = "POST";
            request.ContentType = contentType;
            request.ContentLength = fileStream.Length;

            const int bufferSize = 2048;
            var buffer = new byte[bufferSize];
            int readed;
            while ((readed = fileStream.Read(buffer, 0, bufferSize)) > 0)
            {
                request.GetRequestStream().Write(buffer, 0, readed);
            }

            using (var response = request.GetResponse())
            using (var stream = response.GetResponseStream())
            {
                if (stream == null) throw new WebException("Could not get an answer");
                var xDocumentResponse = XDocument.Load(new XmlTextReader(stream));
                string externalUri;
                GetResponseUri(xDocumentResponse, out externalUri);
                return externalUri;
            }
        }

        #region private

        /// <summary>
        /// Request for conversion to a service
        /// </summary>
        /// <param name="documentConverterUrl">Url to the service of conversion</param>
        /// <param name="documentUri">Uri for the document to convert</param>
        /// <param name="fromExtension">Document extension</param>
        /// <param name="toExtension">Extension to which to convert</param>
        /// <param name="documentRevisionId">Key for caching on service</param>
        /// <param name="isAsync">Perform conversions asynchronously</param>
        /// <returns>Xml document request result of conversion</returns>
        private XDocument SendRequestToConvertService(string documentConverterUrl, string documentUri, string fromExtension, string toExtension, string documentRevisionId, bool isAsync)
        {
            fromExtension = string.IsNullOrEmpty(fromExtension) ? Path.GetExtension(documentUri) : fromExtension;
            if (string.IsNullOrEmpty(fromExtension)) throw new ArgumentNullException("fromExtension", "Document's extension is not known");

            var title = Path.GetFileName(documentUri);
            title = string.IsNullOrEmpty(title) ? Guid.NewGuid().ToString() : title;

            documentRevisionId = string.IsNullOrEmpty(documentRevisionId)
                                     ? documentUri
                                     : documentRevisionId;
            documentRevisionId = GenerateRevisionId(documentRevisionId);

            var validateKey = GenerateValidateKey(documentRevisionId, string.Empty);

            var urlDocumentService = documentConverterUrl + ConvertParams;
            var urlToConverter = String.Format(urlDocumentService,
                                               HttpUtility.UrlEncode(documentUri),
                                               toExtension.Trim('.'),
                                               fromExtension.Trim('.'),
                                               title,
                                               documentRevisionId,
                                               validateKey);

            if (isAsync)
                urlToConverter += "&async=true";

            var req = (HttpWebRequest)WebRequest.Create(urlToConverter);
            req.Timeout = ConvertTimeout;

            Stream stream = null;
            var countTry = 0;
            while (countTry < MaxTry)
            {
                try
                {
                    countTry++;
                    stream = req.GetResponse().GetResponseStream();
                    break;
                }
                catch (WebException ex)
                {
                    if (ex.Status != WebExceptionStatus.Timeout)
                    {
                        throw new HttpException((int)HttpStatusCode.BadRequest, "Bad Request", ex);
                    }
                }
            }
            if (countTry == MaxTry)
            {
                throw new WebException("Timeout", WebExceptionStatus.Timeout);
            }

            if (stream == null) throw new WebException("Could not get an answer");
            return XDocument.Load(new XmlTextReader(stream));
        }

        /// <summary>
        /// Processing document received from the editing service
        /// </summary>
        /// <param name="xDocumentResponse">The resulting xml from editing service</param>
        /// <param name="responseUri">Uri to the converted document</param>
        /// <returns>The percentage of completion of conversion</returns>
        private static int GetResponseUri(XDocument xDocumentResponse, out string responseUri)
        {
            var responceFromConvertService = xDocumentResponse.Root;
            if (responceFromConvertService == null) throw new WebException("Invalid answer format");

            var errorElement = responceFromConvertService.Element("Error");
            if (errorElement != null) ProcessConvertServiceResponceError(Convert.ToInt32(errorElement.Value));

            var endConvert = responceFromConvertService.Element("EndConvert");
            if (endConvert == null) throw new WebException("Invalid answer format");
            var isEndConvert = Convert.ToBoolean(endConvert.Value);

            var resultPercent = 0;
            responseUri = string.Empty;
            if (isEndConvert)
            {
                var fileUrl = responceFromConvertService.Element("FileUrl");
                if (fileUrl == null) throw new WebException("Invalid answer format");

                responseUri = fileUrl.Value;
                resultPercent = 100;
            }
            else
            {
                var percent = responceFromConvertService.Element("Percent");
                if (percent != null)
                    resultPercent = Convert.ToInt32(percent.Value);
                resultPercent = resultPercent >= 100 ? 99 : resultPercent;
            }

            return resultPercent;
        }

        /// <summary>
        /// Generate an error code table
        /// </summary>
        /// <param name="errorCode">Error code</param>
        private static void ProcessConvertServiceResponceError(int errorCode)
        {
            string errorMessage;
            switch (errorCode)
            {
                case -22: // public const int c_nErrorUserCountExceed = -22;
                    errorMessage = "user count exceed";
                    break;
                case -21: // public const int c_nErrorKeyExpire = -21;
                    errorMessage = "tariff expire";
                    break;
                case -20: // public const int c_nErrorVKeyEncrypt = -20;
                    errorMessage = "encrypt VKey";
                    break;
                case -8: // public const int c_nErrorFileVKey = -8;
                    errorMessage = "document VKey";
                    break;
                case -7: // public const int c_nErrorFileRequest = -7;
                    errorMessage = "document request";
                    break;
                case -6: // public const int c_nErrorDatabase = -6;
                    errorMessage = "database";
                    break;
                case -5: // public const int c_nErrorUnexpectedGuid = -5;
                    errorMessage = "unexpected guid";
                    break;
                case -4: // public const int c_nErrorDownloadError = -4;
                    errorMessage = "download";
                    break;
                case -3: // public const int c_nErrorConvertationError = -3;
                    errorMessage = "convertation";
                    break;
                case -2: // public const int c_nErrorConvertationTimeout = -2;
                    errorMessage = "convertation timeout";
                    break;
                case -1: // public const int c_nErrorUnknown = -1;
                    errorMessage = "convertation unknown";
                    break;
                default: // public const int c_nErrorNo = 0;
                    errorMessage = "errorCode = " + errorCode;
                    break;
            }

            throw new Exception(errorMessage);
        }

        #endregion
    }
}