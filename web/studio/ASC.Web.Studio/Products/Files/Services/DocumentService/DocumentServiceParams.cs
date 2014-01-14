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
using System.Linq;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using ASC.Core;
using ASC.Core.Users;
using ASC.Files.Core;
using ASC.Web.Files.Classes;
using ASC.Web.Files.Resources;
using ASC.Web.Files.Services.WCFService;
using ASC.Web.Files.Utils;
using ASC.Web.Studio.Utility;
using Microsoft.Practices.ServiceLocation;
using File = ASC.Files.Core.File;

namespace ASC.Web.Files.Services.DocumentService
{
    [DataContract(Name = "service_params", Namespace = "")]
    public class DocumentServiceParams
    {
        public static readonly Dictionary<FileType, string> DocType = new Dictionary<FileType, string>
            {
                {Studio.Utility.FileType.Document, "text"},
                {Studio.Utility.FileType.Spreadsheet, "spreadsheet"},
                {Studio.Utility.FileType.Presentation, "presentation"}
            };

        #region Nested Classes

        public enum EditorType
        {
            Desktop,
            Mobile,
            Embedded
        }

        #endregion

        #region Constructor

        private static Dictionary<string, Dictionary<FileType, Dictionary<string, string>>> _docTemplates;
        private string _breadCrumbs;
        private string _folderUri;
        private string _fileUri;

        private FileType _fileTypeCache = Studio.Utility.FileType.Unknown;

        private string _key = string.Empty;

        public bool ModeWrite = false;
        public EditorType Type = EditorType.Desktop;

        #endregion

        #region Property

        [DataMember(Name = "file")]
        public File File;

        [DataMember(Name = "key")]
        public string Key
        {
            set { _key = value; }
            get { return DocumentServiceConnector.GenerateRevisionId(_key); }
        }

        [DataMember(Name = "vkey")]
        public string Vkey
        {
            set { }
            get { return DocumentServiceConnector.GenerateValidateKey(Key); }
        }

        [DataMember(Name = "mode")]
        public string Mode
        {
            set { }
            get { return ModeWrite ? "edit" : "view"; }
        }

        [DataMember(Name = "type")]
        public string TypeString
        {
            set { Type = (EditorType)Enum.Parse(typeof(EditorType), value, true); }
            get { return Type.ToString().ToLower(); }
        }

        [DataMember(Name = "sharingSettings")]
        public ItemList<AceShortWrapper> SharingSettings
        {
            get
            {
                if (Type == EditorType.Embedded) return new ItemList<AceShortWrapper>();

                try
                {
                    var docService = ServiceLocator.Current.GetInstance<IFileStorageService>();
                    return docService.GetSharedInfoShort(File.UniqID);
                }
                catch
                {
                    return new ItemList<AceShortWrapper>();
                }
            }
        }

        [DataMember(Name = "folderUrl")]
        public string FolderUrl
        {
            set { _folderUri = value; }
            get
            {
                if (Type == EditorType.Embedded) return string.Empty;
                if (!SecurityContext.IsAuthenticated) return string.Empty;
                if (_folderUri != null)
                    return _folderUri;

                using (var folderDao = Global.DaoFactory.GetFolderDao())
                {
                    try
                    {
                        var parent = folderDao.GetFolder(File.FolderID);
                        if (File.RootFolderType == FolderType.USER
                            && !Equals(File.RootFolderId, Global.FolderMy)
                            && !Global.GetFilesSecurity().CanRead(parent))
                            return PathProvider.GetFolderUrl(Global.FolderShare);

                        return PathProvider.GetFolderUrl(parent);
                    }
                    catch (Exception)
                    {
                        return string.Empty;
                    }
                }
            }
        }

        [DataMember(Name = "url")]
        public string FileUri
        {
            set { _fileUri = value; }
            get
            {
                if (!string.IsNullOrEmpty(_fileUri))
                    return _fileUri;

                _fileUri = PathProvider.GetFileStreamUrl(File);
                return _fileUri;
            }
        }

        [DataMember(Name = "filePath")]
        public string FilePath
        {
            set { }
            get
            {
                if (Type == EditorType.Embedded) return string.Empty;
                if (string.IsNullOrEmpty(_breadCrumbs))
                {
                    const string crumbsSeporator = " \\ ";

                    var breadCrumbsList = EntryManager.GetBreadCrumbs(File.FolderID);
                    _breadCrumbs = String.Join(crumbsSeporator, breadCrumbsList.Select(folder => folder.Title).ToArray());
                }

                return _breadCrumbs;
            }
        }

        [DataMember(Name = "documentType")]
        public string DocumentType
        {
            set { }
            get
            {
                string documentType;

                DocType.TryGetValue(GetFileType, out documentType);
                return documentType;
            }
        }

        [DataMember(Name = "fileTypeNum")]
        private FileType GetFileType
        {
            set { }
            get
            {
                if (_fileTypeCache == Studio.Utility.FileType.Unknown)
                    _fileTypeCache = FileUtility.GetFileTypeByFileName(File.Title);
                return _fileTypeCache;
            }
        }

        [DataMember(Name = "fileType")]
        public string FileType
        {
            set { }
            get
            {
                return File.ConvertedExtension.Trim('.');
            }
        }

        [DataMember(Name = "canEdit")]
        public bool CanEdit;

        [DataMember(Name = "user")]
        public KeyValuePair<Guid, string> User
        {
            set { }
            get
            {
                return SecurityContext.CurrentAccount.ID.Equals(ASC.Core.Configuration.Constants.Guest.ID)
                           ? new KeyValuePair<Guid, string>(Guid.NewGuid(), FilesCommonResource.Guest)
                           : new KeyValuePair<Guid, string>(SecurityContext.CurrentAccount.ID, CoreContext.UserManager.GetUsers(SecurityContext.CurrentAccount.ID).DisplayUserName(false));
            }
        }

        [DataMember(Name = "lang")]
        public string Lang
        {
            set { }
            get { return CoreContext.UserManager.GetUsers(SecurityContext.CurrentAccount.ID).GetCulture().Name; }
        }

        [DataMember(Name = "templates")]
        public ItemDictionary<string, string> DocTemplates
        {
            get
            {
                if (Type == EditorType.Embedded) return new ItemDictionary<string, string>();
                var lang = Lang;
                if (_docTemplates == null)
                    _docTemplates = new Dictionary<string, Dictionary<FileType, Dictionary<string, string>>>();
                if (!_docTemplates.ContainsKey(lang))
                    _docTemplates.Add(lang, new Dictionary<FileType, Dictionary<string, string>>());
                if (!_docTemplates[lang].ContainsKey(GetFileType))
                    _docTemplates[lang].Add(GetFileType, GetDocumentTemplates(GetFileType));

                return new ItemDictionary<string, string>(_docTemplates[lang][GetFileType]);
            }
        }

        [DataMember(Name = "viewerUrl", EmitDefaultValue = false)]
        public string ViewerUrl;

        [DataMember(Name = "embeddedUrl", EmitDefaultValue = false)]
        public string EmbeddedUrl;

        [DataMember(Name = "downloadUrl", EmitDefaultValue = false)]
        public string DownloadUrl;

        [DataMember(Name = "sharingSettingsUrl", EmitDefaultValue = false)]
        public string SharingSettingsUrl;

        [DataMember(Name = "linkToEdit", EmitDefaultValue = false)]
        public string LinkToEdit;

        #endregion

        #region Methods

        private static Dictionary<string, string> GetDocumentTemplates(FileType fileType)
        {
            var result = new Dictionary<string, string>();

            var storeTemp = Global.GetStoreTemplate();

            var lang = CoreContext.UserManager.GetUsers(SecurityContext.CurrentAccount.ID).GetCulture().TwoLetterISOLanguageName;
            var path = FileConstant.TemplateDocPath + lang + "/";
            if (!storeTemp.IsDirectory(path))
                path = FileConstant.TemplateDocPath + "default/";

            var docExt = FileUtility.InternalExtension[fileType] ?? FileUtility.InternalExtension[Studio.Utility.FileType.Document];
            const string icnExt = ".png";
            foreach (var file in storeTemp.ListFilesRelative("", path, "*" + docExt, false))
            {
                if (String.IsNullOrEmpty(file)) continue;

                var fileName = Path.GetFileNameWithoutExtension(file);

                var icnUri = storeTemp.GetUri(path + fileName + icnExt).ToString();

                result.Add(fileName, icnUri);
            }

            return result;
        }

        public static string Serialize(DocumentServiceParams documentServiceParams)
        {
            using (var ms = new MemoryStream())
            {
                var serializer = new DataContractJsonSerializer(typeof(DocumentServiceParams));
                serializer.WriteObject(ms, documentServiceParams);
                ms.Seek(0, SeekOrigin.Begin);
                return Encoding.UTF8.GetString(ms.GetBuffer(), 0, (int)ms.Length);
            }
        }

        #endregion
    }
}