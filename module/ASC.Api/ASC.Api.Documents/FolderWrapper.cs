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
using System.Runtime.Serialization;
using ASC.Api.Employee;
using ASC.Core;
using ASC.Files.Core;
using ASC.Files.Core.Security;
using ASC.Specific;
using ASC.Web.Files.Classes;

namespace ASC.Api.Documents
{
    /// <summary>
    /// </summary>
    [DataContract(Name = "folder", Namespace = "")]
    public class FolderWrapper : FileEntryWrapper
    {
        /// <summary>
        /// </summary>
        [DataMember(IsRequired = true, EmitDefaultValue = true)]
        public object ParentId { get; set; }

        /// <summary>
        /// </summary>
        [DataMember(EmitDefaultValue = true, IsRequired = false)]
        public int FilesCount { get; set; }

        /// <summary>
        /// </summary>
        [DataMember(EmitDefaultValue = true, IsRequired = false)]
        public int FoldersCount { get; set; }

        /// <summary>
        /// </summary>
        [DataMember]
        public bool IsShareable { get; set; }

        /// <summary>
        /// </summary>
        /// <param name="folder"></param>
        public FolderWrapper(Folder folder)
            : base(folder)
        {
            ParentId = folder.ParentFolderID;
            if (folder.RootFolderType == FolderType.USER
                && !Equals(folder.RootFolderCreator, SecurityContext.CurrentAccount.ID))
            {
                RootFolderType = FolderType.SHARE;

                using (var folderDao = Global.DaoFactory.GetFolderDao())
                {
                    var parentFolder = folderDao.GetFolder(folder.ParentFolderID);
                    if (!Global.GetFilesSecurity().CanRead(parentFolder))
                        ParentId = Global.FolderShare;
                }
            }

            FilesCount = folder.TotalFiles;
            FoldersCount = folder.TotalSubFolders;
            IsShareable = folder.Shareable;
        }

        private FolderWrapper()
            : base()
        {

        }

        /// <summary>
        /// </summary>
        /// <returns></returns>
        public static FolderWrapper GetSample()
        {
            return new FolderWrapper
                {
                    Access = FileShare.ReadWrite,
                    Updated = (ApiDateTime) DateTime.UtcNow,
                    Created = (ApiDateTime) DateTime.UtcNow,
                    CreatedBy = EmployeeWraper.GetSample(),
                    Id = new Random().Next(),
                    RootFolderType = FolderType.BUNCH,
                    SharedByMe = false,
                    Title = "Some titile",
                    UpdatedBy = EmployeeWraper.GetSample(),
                    FilesCount = new Random().Next(),
                    FoldersCount = new Random().Next(),
                    ParentId = new Random().Next(),
                    IsShareable = false
                };
        }
    }
}