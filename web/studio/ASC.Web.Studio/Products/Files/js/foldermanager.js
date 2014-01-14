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

window.ASC.Files.Folders = (function () {
    var tasksTimeout = null;
    var bulkStatuses = false;

    var currentFolder = {};
    var folderContainer = "";

    var eventAfter = null;
    var typeNewDoc = "";

    var isCopyTo = false;

    /* Methods*/

    var getFolderItems = function (isAppend, countAppend) {
        var filterSettings = ASC.Files.Filter.getFilterSettings(ASC.Files.Folders.currentFolder.id);

        ASC.Files.ServiceManager.getFolderItems(ASC.Files.TemplateManager.events.GetFolderItems,
            {
                folderId: ASC.Files.Folders.currentFolder.id,
                from: (isAppend ? jq("#filesMainContent .file-row[name!=\"addRow\"]").length : 0),
                count: countAppend || ASC.Files.Constants.COUNT_ON_PAGE,
                append: isAppend === true,
                filter: filterSettings.filter,
                subject: filterSettings.subject,
                text: filterSettings.text,
                orderBy: filterSettings.sorter
            }, { orderBy: filterSettings.sorter });
    };

    var clickOnFolder = function (folderId) {
        if (ASC.Files.Folders.folderContainer == "trash") {
            return;
        }

        if (folderId == ASC.Files.Constants.FOLDER_ID_PROJECT
            && ASC.Files.Tree.folderIdCurrentRoot
            && ASC.Files.Tree.folderIdCurrentRoot != ASC.Files.Constants.FOLDER_ID_PROJECT) {
            location.href = "tmdocs.aspx";
            return false;
        }

        ASC.Files.Anchor.navigationSet(folderId);
    };

    var clickOnFile = function (fileData, forEdit, version) {
        var fileObj = fileData.entryObject;
        if (ASC.Files.Folders.folderContainer == "trash"
            && jq("#filesMainContent").find(fileObj).is(":visible")) {
            return false;
        }

        var fileId = fileData.id;
        var fileTitle = fileData.title || ASC.Files.UI.getEntryTitle("file", fileId);

        if (ASC.Files.Utility.CanWebView(fileTitle) || ASC.Files.Utility.CanWebEdit(fileTitle)) {
            return ASC.Files.Converter.checkCanOpenEditor(fileId, fileTitle, version, forEdit != false);
        }

        if (typeof ASC.Files.ImageViewer != "undefined" && ASC.Files.Utility.CanImageView(fileTitle)) {
            var hash = ASC.Files.ImageViewer.getPreviewHash(fileId);
            ASC.Files.Anchor.move(hash);
            return true;
        }

        if (jq.browser.mobile) {
            ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.ErrorMassage_MobileDownload, true);
            return true;
        }

        var url = ASC.Files.Utility.GetFileViewUrl(fileId, version);
        window.open(url, "_blank");
        return ASC.Files.Marker.removeNewIcon("file", fileId);
    };

    var updateIfExist = function (target) {
        var value = jq(target).prop("checked");

        ASC.Files.ServiceManager.request("get",
            "json",
            ASC.Files.TemplateManager.events.UpdateIfExist,
            {},
            "updateifexist?set=" + value);
    };

    var download = function (entryType, entryId, version) {
        var list = new Array();
        if (!ASC.Files.Common.isCorrectId(entryId)) {
            list = jq("#filesMainContent .file-row:has(.checkbox input:checked)");
            if (list.length == 0) {
                ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.EmptyListSelectedForDownload, true);
                return;
            }
            if (list.length == 1) {
                var itemData = ASC.Files.UI.getObjectData(list[0]);
                entryId = itemData.entryId;
                entryType = itemData.entryType;
            }
        }

        if (entryType === "file") {
            if (jq.browser.mobile) {
                ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.ErrorMassage_MobileDownload, true);
                return;
            }

            ASC.Files.Marker.removeNewIcon(entryType, entryId);

            window.open(ASC.Files.Utility.GetFileDownloadUrl(entryId, version), "_blank");
            return;
        }

        if (ASC.Files.Folders.bulkStatuses == true) {
            ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.ErrorMassage_SecondDownload, true);
            return;
        }

        var data = {};
        data.entry = new Array();

        if (ASC.Files.Common.isCorrectId(entryId)) {
            data.entry.push(
                {
                    key: Encoder.htmlEncode(entryType + "_" + entryId),
                    value: ""
                });

            ASC.Files.Marker.removeNewIcon(entryType, entryId);
        } else {
            list.each(function () {
                var curItemData = ASC.Files.UI.getObjectData(this);

                data.entry.push(
                    {
                        key: Encoder.htmlEncode(curItemData.entryType + "_" + curItemData.entryId),
                        value: ""
                    });

                ASC.Files.Marker.removeNewIcon(curItemData.entryType, curItemData.entryId);
            });
        }
        ASC.Files.Folders.bulkDownload(data);
    };

    var bulkDownload = function (data) {
        ASC.Files.Folders.bulkStatuses = true;
        ASC.Files.ServiceManager.download(ASC.Files.TemplateManager.events.Download, { doNow: true }, { stringHash: data });
    };

    var createFolder = function () {
        if (ASC.Files.ImageViewer && ASC.Files.ImageViewer.isView()) {
            return;
        }

        if (!ASC.Files.UI.accessibleItem() || ASC.Files.UI.isSettingsPanel()) {
            ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.ErrorMassage_SecurityException, true);
            return;
        }

        jq(document).scrollTop(0);

        var newFolderObj = ASC.Files.UI.getEntryObject("folder", 1).filter("[spare_data=\"NEW_FOLDER\"]");
        if (newFolderObj.length != 0) {
            return;
        }

        var emptyFolder = {
            folder:
                {
                    id: 1,
                    spare_data: "NEW_FOLDER",
                    title: ASC.Files.FilesJSResources.TitleNewFolder,
                    access: 0,
                    shared: false,
                    isnew: 0,
                    shareable: false
                }
        };
        var stringData = ASC.Files.Common.jsonToXml(emptyFolder);

        var htmlXML = ASC.Files.TemplateManager.translateFromString(stringData);

        ASC.Files.EmptyScreen.hideEmptyScreen();
        var mainContent = jq("#filesMainContent");
        mainContent.prepend(htmlXML);

        jq("#filesMainContent .new-folder").yellowFade().removeClass("new-folder");

        newFolderObj = ASC.Files.UI.getEntryObject("folder", 1).filter("[spare_data=\"NEW_FOLDER\"]");
        newFolderObj.addClass("row-rename");

        var obj = newFolderObj.find(".entry-title .name a");

        var ftClass = ASC.Files.Utility.getFolderCssClass();
        newFolderObj.find(".thumb-folder").addClass(ftClass);

        var newContainer = document.createElement("input");
        newContainer.id = "promptCreateFolder";
        newContainer.type = "text";
        newContainer.style.display = "none";
        document.body.appendChild(newContainer);

        newContainer = jq("#promptCreateFolder");
        newContainer.attr("maxlength", ASC.Files.Constants.MAX_NAME_LENGTH);
        newContainer.addClass("textEdit input-rename");
        newContainer.val(ASC.Files.FilesJSResources.TitleNewFolder);
        newContainer.insertAfter(obj);
        newContainer.show();
        obj.hide();
        newContainer.focus();
        if (!jq.browser.mobile) {
            newContainer.select();
        }

        ASC.Files.UI.checkCharacter(newContainer);

        var saveFolder = function () {
            var newFolderSaveObj = ASC.Files.UI.getEntryObject("folder", 1).filter("[spare_data=\"NEW_FOLDER\"]");

            var newName = ASC.Files.Common.replaceSpecCharacter(jq("#promptCreateFolder").val().trim());
            if (newName == "" || newName == null) {
                newName = ASC.Files.FilesJSResources.TitleNewFolder;
            }

            newFolderSaveObj.find(".entry-title .name a").show().text(newName);
            newFolderSaveObj.removeClass("row-rename");
            jq("#promptCreateFolder").remove();
            newFolderSaveObj.find(".rename-action").remove();

            var params = { parentFolderID: ASC.Files.Folders.currentFolder.id, title: newName };

            ASC.Files.UI.blockObject(newFolderSaveObj, true, ASC.Files.FilesJSResources.DescriptCreate);
            ASC.Files.ServiceManager.createFolder(ASC.Files.TemplateManager.events.CreateFolder, params);
        };

        newFolderObj.append("<div class=\"rename-action\"><div class=\"name-aplly\" title=" + ASC.Files.FilesJSResources.TitleCreate +
            "></div><div class=\"name-cancel\" title=" + ASC.Files.FilesJSResources.TitleCancel + "></div></div>");
        newFolderObj.find(".name-aplly").click(saveFolder);
        newFolderObj.find(".name-cancel").click(function () {
            var newFolderCancelObj = ASC.Files.UI.getEntryObject("folder", 1).filter("[spare_data=\"NEW_FOLDER\"]");
            newFolderCancelObj.remove();
            if (jq("#filesMainContent .file-row").length == 0) {
                ASC.Files.EmptyScreen.displayEmptyScreen();
            }
        });

        jq("#promptCreateFolder").bind(jq.browser.webkit ? "keydown" : "keypress", function (event) {
            if (jq("#promptCreateFolder").length == 0) {
                return;
            }

            if (!e) {
                var e = event;
            }
            var code = e.keyCode || e.which;

            switch (code) {
                case ASC.Files.Common.keyCode.esc:
                    var newFolderCancelObj = ASC.Files.UI.getEntryObject("folder", 1).filter("[spare_data=\"NEW_FOLDER\"]");
                    newFolderCancelObj.remove();
                    if (jq("#filesMainContent .file-row").length == 0) {
                        ASC.Files.EmptyScreen.displayEmptyScreen();
                    }
                    break;
                case ASC.Files.Common.keyCode.enter:
                    saveFolder();
                    break;
            }
        });
    };

    var createNewDoc = function () {
        if (ASC.Files.ImageViewer && ASC.Files.ImageViewer.isView()) {
            return;
        }

        if (!ASC.Resources.Master.TenantTariffDocsEdition) {
            ASC.Files.UI.displayTariffDocsEdition();
            return;
        }

        if (!ASC.Files.UI.accessibleItem() || ASC.Files.UI.isSettingsPanel()) {
            ASC.Files.UI.displayInfoPanel(ASC.Files.FilesJSResources.ErrorMassage_SecurityException, true);
            return;
        }

        jq(document).scrollTop(0);

        var newFileObj = ASC.Files.UI.getEntryObject("file", 1).filter("[spare_data=\"NEW_FILE\"]");
        newFileObj.remove();

        var titleNewDoc;
        switch (ASC.Files.Folders.typeNewDoc) {
            case "document":
                titleNewDoc = ASC.Files.FilesJSResources.TitleNewFileText + ASC.Files.Utility.Resource.InternalFormats.Document;
                break;
            case "spreadsheet":
                titleNewDoc = ASC.Files.FilesJSResources.TitleNewFileSpreadsheet + ASC.Files.Utility.Resource.InternalFormats.Spreadsheet;
                break;
            case "presentation":
                titleNewDoc = ASC.Files.FilesJSResources.TitleNewFilePresentation + ASC.Files.Utility.Resource.InternalFormats.Presentation;
                break;
            default:
                return;
        }

        if (!ASC.Files.Utility.CanWebEdit(titleNewDoc)) {
            return;
        }

        var emptyFile = {
            file:
                {
                    id: 1,
                    spare_data: "NEW_FILE",
                    title: titleNewDoc,
                    access: 0,
                    shared: false,
                    version: 0
                }
        };

        var stringData = ASC.Files.Common.jsonToXml(emptyFile);

        var htmlXML = ASC.Files.TemplateManager.translateFromString(stringData);

        ASC.Files.EmptyScreen.hideEmptyScreen();
        var mainContent = jq("#filesMainContent");
        mainContent.prepend(htmlXML);

        jq("#filesMainContent .new-file").show().yellowFade().removeClass("new-file");

        newFileObj = ASC.Files.UI.getEntryObject("file", 1).filter("[spare_data=\"NEW_FILE\"]");
        newFileObj.addClass("row-rename");

        var obj = newFileObj.find(".entry-title .name a");

        var ftClass = ASC.Files.Utility.getCssClassByFileTitle(titleNewDoc);
        newFileObj.find(".thumb-file").addClass(ftClass);

        var lenExt = ASC.Files.Utility.GetFileExtension(titleNewDoc).length;
        titleNewDoc = titleNewDoc.substring(0, titleNewDoc.length - lenExt);

        var newContainer = document.createElement("input");
        newContainer.id = "promptCreateFile";
        newContainer.type = "text";
        newContainer.style.display = "none";
        document.body.appendChild(newContainer);
        newContainer = jq("#promptCreateFile");
        newContainer.attr("maxlength", ASC.Files.Constants.MAX_NAME_LENGTH - lenExt);
        newContainer.addClass("textEdit input-rename");
        newContainer.val(titleNewDoc);
        newContainer.insertAfter(obj);
        newContainer.show().focus();
        if (!jq.browser.mobile) {
            newContainer.select();
        }

        ASC.Files.UI.checkCharacter(newContainer);

        var saveFile = function () {
            var newFileSaveObj = ASC.Files.UI.getEntryObject("file", 1).filter("[spare_data=\"NEW_FILE\"]");

            var newName = ASC.Files.Common.replaceSpecCharacter(jq("#promptCreateFile").val().trim());
            var oldName = ASC.Files.UI.getObjectTitle(newFileSaveObj);
            if (newName == "" || newName == null) {
                newName = oldName;
            } else {
                var curLenExt = ASC.Files.Utility.GetFileExtension(oldName).length;
                newName += oldName.substring(oldName.length - curLenExt);
            }

            newFileSaveObj.removeClass("row-rename");
            jq("#promptCreateFile").remove();
            newFileSaveObj.find(".rename-action").remove();

            newFileSaveObj.find(".entry-title .name a").show().text(newName);

            var rowLink = newFileSaveObj.find(".entry-title .name a");
            ASC.Files.UI.highlightExtension(rowLink, newName);

            var params =
                {
                    folderID: ASC.Files.Folders.currentFolder.id,
                    fileTitle: newName,
                    winEditor: window.open("")
                };

            ASC.Files.UI.blockObject(newFileObj, true, ASC.Files.FilesJSResources.DescriptCreate);
            ASC.Files.ServiceManager.createNewFile(ASC.Files.TemplateManager.events.CreateNewFile, params);
        };

        newFileObj.append("<div class=\"rename-action\"><div class=\"name-aplly\" title=" + ASC.Files.FilesJSResources.TitleCreate +
            "></div><div class=\"name-cancel\" title=" + ASC.Files.FilesJSResources.TitleCancel + "></div></div>");
        newFileObj.find(".name-aplly").click(saveFile);
        newFileObj.find(".name-cancel").click(function () {
            var newFileCancelObj = ASC.Files.UI.getEntryObject("file", 1).filter("[spare_data=\"NEW_FILE\"]");
            newFileCancelObj.remove();
            if (jq("#filesMainContent .file-row").length == 0) {
                ASC.Files.EmptyScreen.displayEmptyScreen();
            }
        });

        jq("#promptCreateFile").bind(jq.browser.webkit ? "keydown" : "keypress", function (event) {
            if (jq("#promptCreateFile").length == 0) {
                return;
            }

            if (!e) {
                var e = event;
            }
            var code = e.keyCode || e.which;

            switch (code) {
                case ASC.Files.Common.keyCode.esc:
                    var newFileCancelObj = ASC.Files.UI.getEntryObject("file", 1).filter("[spare_data=\"NEW_FILE\"]");
                    newFileCancelObj.remove();
                    if (jq("#filesMainContent .file-row").length == 0) {
                        ASC.Files.EmptyScreen.displayEmptyScreen();
                    }
                    break;
                case ASC.Files.Common.keyCode.enter:
                    saveFile();
                    break;
            }
        });
    };

    var rename = function (entryType, entryId) {
        var entryObj = ASC.Files.UI.getEntryObject(entryType, entryId);

        var lenExt = 0;

        if (jq("#promptRename").length != 0) {
            jq("#filesMainContent .file-row.row-rename .name-cancel").click();
        }

        if (entryObj.find("#contentVersions").length) {
            ASC.Files.Folders.closeVersions();
        }

        entryObj.addClass("row-rename");
        ASC.Files.UI.selectRow(entryObj, false);
        ASC.Files.UI.updateMainContentHeader();

        var entryTitle = ASC.Files.UI.getObjectTitle(entryObj);

        if (entryType == "file") {
            lenExt = ASC.Files.Utility.GetFileExtension(entryTitle).length;
            entryTitle = entryTitle.substring(0, entryTitle.length - lenExt);
        }

        var newContainer = document.createElement("input");
        newContainer.id = "promptRename";
        newContainer.type = "text";
        newContainer.style.display = "none";
        document.body.appendChild(newContainer);

        newContainer = jq("#promptRename");
        newContainer.attr("maxlength", ASC.Files.Constants.MAX_NAME_LENGTH - lenExt);
        newContainer.addClass("textEdit input-rename");
        newContainer.val(entryTitle);
        newContainer.insertAfter(entryObj.find(".entry-title .name a"));
        newContainer.show().focus();
        if (!jq.browser.mobile) {
            newContainer.select();
        }

        ASC.Files.UI.checkCharacter(newContainer);

        var saveRename = function () {
            var entryRenameData = ASC.Files.UI.getObjectData(jq("#promptRename"));
            var entryRenameObj = entryRenameData.entryObject;
            var entryRenameType = entryRenameData.entryType;
            var entryRenameId = entryRenameData.entryId;
            var oldName = ASC.Files.UI.getObjectTitle(entryRenameObj);

            var newName = ASC.Files.Common.replaceSpecCharacter(jq("#promptRename").val().trim());
            if (newName == "" || newName == null) {
                return;
            }

            entryRenameObj.removeClass("row-rename");
            entryRenameObj.find(".rename-action").remove();
            jq("#promptRename").remove();

            if (entryRenameType == "file") {
                var lenExtRename = ASC.Files.Utility.GetFileExtension(oldName).length;
                newName += oldName.substring(oldName.length - lenExtRename);
            }

            if (newName != oldName) {
                entryRenameObj.find(".entry-title .name a").show().text(newName);

                if (entryRenameType == "file") {
                    var rowLink = entryRenameObj.find(".entry-title .name a");
                    ASC.Files.UI.highlightExtension(rowLink, newName);
                }

                ASC.Files.UI.blockObject(entryRenameObj, true, ASC.Files.FilesJSResources.DescriptRename);

                if (entryRenameType == "file") {
                    ASC.Files.ServiceManager.renameFile(ASC.Files.TemplateManager.events.FileRename, { fileId: entryRenameId, name: oldName, newname: newName, show: true });
                } else {
                    ASC.Files.ServiceManager.renameFolder(ASC.Files.TemplateManager.events.FolderRename, { parentFolderID: ASC.Files.Folders.currentFolder.id, folderId: entryRenameId, name: oldName, newname: newName });
                }
            }
        };

        entryObj.append("<div class=\"rename-action\"><div class=\"name-aplly\" title=" + ASC.Files.FilesJSResources.TitleCreate +
            "></div><div class=\"name-cancel\" title=" + ASC.Files.FilesJSResources.TitleCancel + "></div></div>");
        entryObj.find(".name-aplly").click(saveRename);
        entryObj.find(".name-cancel").click(function () {
            var entryObjCancel = jq("#promptRename").closest(".file-row");
            jq("#promptRename").remove();
            entryObjCancel.removeClass("row-rename");
            entryObjCancel.find(".rename-action").remove();
        });

        entryObj.removeClass("row-selected");

        jq("#promptRename").bind(jq.browser.webkit ? "keydown" : "keypress", function (event) {
            if (jq("#promptRename").length === 0) {
                return;
            }

            if (!e) {
                var e = event;
            }
            var code = e.keyCode || e.which;

            if ((code == ASC.Files.Common.keyCode.esc || code == ASC.Files.Common.keyCode.enter)
                && jq("#promptRename").length != 0) {
                switch (code) {
                    case ASC.Files.Common.keyCode.esc:
                        var entryObjCancel = jq("#promptRename").closest(".file-row");
                        entryObjCancel.removeClass("row-rename");
                        entryObjCancel.find(".rename-action").remove();
                        jq("#promptRename").remove();
                        break;
                    case ASC.Files.Common.keyCode.enter:
                        saveRename();
                        break;
                }
            }
        });
    };

    var showVersions = function (fileObj, fileId) {
        if (ASC.Files.Folders.folderContainer == "trash") {
            return;
        }

        fileObj = jq(fileObj);
        if (!fileObj.is(".file-row")) {
            fileObj = fileObj.closest(".file-row");
        }

        if (fileObj.hasClass("folder-row")) {
            return;
        }

        if (fileObj.find(".version").length == 0) {
            return;
        }

        if (jq("#contentVersions:visible").length != 0) {
            var close = fileObj.find("#contentVersions").length != 0;
            ASC.Files.Folders.closeVersions();
            if (close) {
                return;
            }
        }

        ASC.Files.UI.blockObject(fileObj, true, ASC.Files.FilesJSResources.DescriptLoadVersion);

        fileId = fileId || ASC.Files.UI.getObjectData(fileObj).entryId;
        ASC.Files.ServiceManager.getFileHistory(ASC.Files.TemplateManager.events.GetFileHistory, { fileId: fileId });
    };

    var makeCurrentVersion = function (fileId, version) {
        jq(".version-operation").css("visibility", "hidden");
        ASC.Files.UI.blockObjectById("file", fileId, true, ASC.Files.FilesJSResources.DescriptSetVersion);
        ASC.Files.ServiceManager.setCurrentVersion(ASC.Files.TemplateManager.events.SetCurrentVersion, { fileId: fileId, version: version });
    };

    var closeVersions = function () {
        jq("#contentVersions").remove();
        jq("#filesMainContent .row-over").removeClass("row-over");
    };

    var replaceVersion = function (fileId, show) {
        ASC.Files.ServiceManager.getFile(ASC.Files.TemplateManager.events.ReplaceVersion,
            {
                fileId: fileId,
                show: show,
                isStringXml: false
            });
    };

    var showOverwriteMessage = function (listData, folderId, folderToTitle, isCopyOperation, data) {
        var folderTitle = ASC.Files.UI.getEntryTitle("folder", folderId) || (ASC.Files.Tree ? ASC.Files.Tree.getFolderTitle(folderId) : "");

        var message;
        if (data.length > 1) {
            var files = "";
            for (var i = 0; i < data.length; i++) {
                files += "<li title=\"{0}\">{0}</li>".format(data[i].Value);
            }
            message = "<b>" + ASC.Files.FilesJSResources.FilesAlreadyExist.format(data.length, folderTitle) + "</b>";
            jq("#overwriteList").html(files).show();
        } else {
            jq("#overwriteList").hide();
            message = ASC.Files.FilesJSResources.FileAlreadyExist.format("<span title=\"" + data[0].Value + "\">" + data[0].Value + "</span>", "<b>" + folderTitle + "</b>");
        }

        jq("#overwriteMessage").html(message);

        jq("#buttonOverwrite").unbind("click").click(function () {
            PopupKeyUpActionProvider.CloseDialogAction = "";
            PopupKeyUpActionProvider.CloseDialog();
            ASC.Files.ServiceManager.moveItems(ASC.Files.TemplateManager.events.MoveItems,
                {
                    folderToId: folderId,
                    overwrite: true,
                    isCopyOperation: (isCopyOperation == true),
                    doNow: true
                },
                { stringList: listData });
        });

        jq("#buttonSkipOverwrite").unbind("click").click(function () {

            for (i = 0; i < data.length; i++) {
                ASC.Files.UI.blockObjectById("file", data[i].Key, false, null, true);
                var pos = jq.inArray("file_" + data[i].Key, listData.entry);
                if (pos != -1) {
                    listData.entry.splice(pos, 1);
                }
            }
            ASC.Files.UI.updateMainContentHeader();

            PopupKeyUpActionProvider.CloseDialogAction = "";
            PopupKeyUpActionProvider.CloseDialog();
            ASC.Files.ServiceManager.moveItems(ASC.Files.TemplateManager.events.MoveItems,
                {
                    folderToId: folderId,
                    overwrite: false,
                    isCopyOperation: (isCopyOperation == true),
                    doNow: true
                },
                { stringList: listData });
        });

        jq("#buttonCancelOverwrite").unbind("click").click(function () {
            for (i = 0; i < listData.entry.length; i++) {
                var itemId = ASC.Files.UI.parseItemId(listData.entry[i]);
                ASC.Files.UI.blockObjectById(itemId.entryType, itemId.entryId, false, null, true);
            }
            ASC.Files.UI.updateMainContentHeader();

            PopupKeyUpActionProvider.CloseDialogAction = "";
            PopupKeyUpActionProvider.CloseDialog();
        });

        ASC.Files.UI.blockUI(jq("#confirmOverwriteFiles"), 420, 300);

        PopupKeyUpActionProvider.EnterAction = "jq(\"#buttonOverwrite\").click();";
        PopupKeyUpActionProvider.CloseDialogAction = "jq(\"#buttonCancelOverwrite\").click();";
    };

    var curItemFolderMoveTo = function (folderToId, folderToTitle, pathDest) {
        if (folderToId === ASC.Files.Folders.currentFolder.entryId) {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.isCopyTo = false;
            return;
        }

        var thirdParty = typeof ASC.Files.ThirdParty != "undefined";
        var takeThirdParty = thirdParty && (ASC.Files.Folders.isCopyTo == true || ASC.Files.ThirdParty.isThirdParty());

        var data = {};
        data.entry = new Array();

        Encoder.EncodeType = "!entity";
        jq("#filesMainContent .file-row:not(.checkloading):not(.new-folder):not(.new-file):not(.error-entry):has(.checkbox input:checked)").each(function () {
            var entryData = ASC.Files.UI.getObjectData(this);
            var entryType = entryData.entryType;
            var entryObj = entryData.entryObject;
            var entryId = entryData.entryId;

            if (ASC.Files.Folders.isCopyTo == true
                || (ASC.Files.UI.accessAdmin(entryObj) && !ASC.Files.UI.editingFile(entryObj))) {

                if (jq.inArray(entryId, pathDest) != -1) {
                    ASC.Files.UI.displayInfoPanel(((ASC.Files.Folders.isCopyTo == true) ? ASC.Files.FilesJSResources.InfoFolderCopyError : ASC.Files.FilesJSResources.InfoFolderMoveError), true);
                } else {
                    if (takeThirdParty
                        || !thirdParty
                        || !ASC.Files.ThirdParty.isThirdParty(entryObj)) {
                        ASC.Files.UI.blockObject(entryObj,
                            true,
                            (ASC.Files.Folders.isCopyTo == true) ?
                                ASC.Files.FilesJSResources.DescriptCopy :
                                ASC.Files.FilesJSResources.DescriptMove,
                            true);

                        data.entry.push(Encoder.htmlEncode(entryType + "_" + entryId));
                    }
                }
            }
        });
        Encoder.EncodeType = "entity";

        ASC.Files.UI.updateMainContentHeader();
        ASC.Files.Actions.hideAllActionPanels();

        if (data.entry && data.entry.length != 0) {
            ASC.Files.ServiceManager.moveFilesCheck(ASC.Files.TemplateManager.events.MoveFilesCheck,
                {
                    folderToTitle: folderToTitle,
                    folderToId: folderToId,
                    list: data,
                    isCopyOperation: (ASC.Files.Folders.isCopyTo == true)
                },
                { stringList: data });
        }

        ASC.Files.Folders.isCopyTo = false;
    };

    var showMore = function () {
        if (jq("#pageNavigatorHolder:visible").length == 0
            || jq("#pageNavigatorHolder a").text() == ASC.Files.FilesJSResources.ButtonShowMoreLoad) {
            return;
        }

        jq("#pageNavigatorHolder a").text(ASC.Files.FilesJSResources.ButtonShowMoreLoad);

        ASC.Files.Folders.getFolderItems(true);
    };

    var emptyTrash = function () {
        if (ASC.Files.Folders.folderContainer != "trash") {
            return;
        }

        ASC.Files.Actions.hideAllActionPanels();

        ASC.Files.UI.checkSelectAll(true);

        jq("#confirmRemoveText").html("<b>" + ASC.Files.FilesJSResources.ConfirmEmptyTrash + "</b>");
        jq("#confirmRemoveList").hide();
        jq("#confirmRemoveTextDescription").show();

        jq("#removeConfirmBtn").unbind("click").click(function () {
            PopupKeyUpActionProvider.CloseDialog();

            ASC.Files.ServiceManager.emptyTrash(ASC.Files.TemplateManager.events.EmptyTrash, { doNow: true });
        });

        ASC.Files.UI.blockUI(jq("#confirmRemove"), 420, 0, -150);
        PopupKeyUpActionProvider.EnterAction = "jq(\"#removeConfirmBtn\").click();";
    };

    var deleteItem = function (entryType, entryId) {
        ASC.Files.Actions.hideAllActionPanels();

        var caption = ASC.Files.FilesJSResources.ConfirmRemoveList;
        var list = new Array();

        if (entryType && entryId) {
            var entryObj = ASC.Files.UI.getEntryObject(entryType, entryId);
            if (!ASC.Files.UI.accessAdmin(entryObj)) {
                return;
            }
            if (ASC.Files.UI.editingFile(entryObj)) {
                return;
            }

            list.push({ entryType: entryType, entryId: entryId });

        } else {
            jq("#filesMainContent .file-row:not(.checkloading):not(.new-folder):not(.new-file):not(.error-entry):has(.checkbox input:checked)").each(function () {
                var entryRowData = ASC.Files.UI.getObjectData(this);
                var entryRowObj = entryRowData.entryObject;
                var entryRowType = entryRowData.entryType;
                var entryRowId = entryRowData.entryId;

                if (ASC.Files.ThirdParty && !ASC.Files.ThirdParty.isThirdParty()
                    && ASC.Files.ThirdParty.isThirdParty(entryRowData.entryObject)) {
                    return true;
                }
                if (!ASC.Files.UI.editingFile(entryRowObj)
                    && ASC.Files.UI.accessAdmin(entryRowObj)) {
                    list.push({ entryType: entryRowType, entryId: entryRowId });
                }
            });
        }

        if (list.length == 0) {
            return;
        }

        if (list.length == 1) {
            if (list[0].entryType == "file") {
                caption = ASC.Files.FilesJSResources.ConfirmRemoveFile;
            } else {
                caption = ASC.Files.FilesJSResources.ConfirmRemoveFolder;
            }
        }

        var textFolder = "";
        var textFile = "";
        var strHtml = "<label title=\"{0}\"><input type=\"checkbox\" entryType=\"{1}\" entryId=\"{2}\" checked=\"checked\">{0}</label>";
        for (var i = 0; i < list.length; i++) {
            var entryRowTitle = ASC.Files.UI.getEntryTitle(list[i].entryType, list[i].entryId);
            if (list[i].entryType == "file") {
                textFile += strHtml.format(entryRowTitle, list[i].entryType, list[i].entryId);
            } else {
                textFolder += strHtml.format(entryRowTitle, list[i].entryType, list[i].entryId);
            }
        }

        jq("#confirmRemoveText").html("<b>" + caption + "</b>");
        jq("#confirmRemoveList dd.confirm-remove-files").html(textFile);
        jq("#confirmRemoveList dd.confirm-remove-folders").html(textFolder);

        jq("#confirmRemoveList .confirm-remove-folders, #confirmRemoveList .confirm-remove-files").show();
        if (textFolder == "") {
            jq("#confirmRemoveList .confirm-remove-folders").hide();
        }
        if (textFile == "") {
            jq("#confirmRemoveList .confirm-remove-files").hide();
        }

        var checkRemoveItem = function () {
            jq("#confirmRemoveList .confirm-remove-folders-count").text(jq("#confirmRemoveList dd.confirm-remove-folders :checked").length);
            jq("#confirmRemoveList .confirm-remove-files-count").text(jq("#confirmRemoveList dd.confirm-remove-files :checked").length);
        };
        checkRemoveItem();
        jq("#confirmRemoveList dd [type='checkbox']").change(checkRemoveItem);

        if (ASC.Files.ThirdParty && ASC.Files.ThirdParty.isThirdParty()) {
            jq("#confirmRemoveSharpBoxTextDescription").show();
        } else {
            jq("#confirmRemoveSharpBoxTextDescription").hide();
        }

        if (ASC.Files.Folders.folderContainer == "trash") {
            jq("#confirmRemoveTextDescription").show();
        } else {
            jq("#confirmRemoveTextDescription").hide();
        }

        jq("#removeConfirmBtn").unbind("click").click(function () {
            PopupKeyUpActionProvider.CloseDialog();

            var data = {};
            var listChecked = jq("#confirmRemoveList input:checked");
            if (listChecked.length == 0) {
                return;
            }
            data.entry = new Array();
            Encoder.EncodeType = "!entity";
            for (var j = 0; j < listChecked.length; j++) {
                var entryConfirmType = jq(listChecked[j]).attr("entryType");
                var entryConfirmId = jq(listChecked[j]).attr("entryId");
                var entryConfirmObj = ASC.Files.UI.getEntryObject(entryConfirmType, entryConfirmId);
                ASC.Files.UI.blockObject(entryConfirmObj, true, ASC.Files.FilesJSResources.DescriptRemove, true);
                data.entry.push(Encoder.htmlEncode(entryConfirmType + "_" + entryConfirmId));
            }
            Encoder.EncodeType = "entity";
            ASC.Files.UI.updateMainContentHeader();
            ASC.Files.ServiceManager.deleteItem(ASC.Files.TemplateManager.events.DeleteItem, { list: data.entry, doNow: true }, { stringList: data });
        });

        ASC.Files.UI.blockUI(jq("#confirmRemove"), 420, 0, -150);

        PopupKeyUpActionProvider.EnterAction = "jq(\"#removeConfirmBtn\").click();";
    };

    var cancelTasksStatuses = function () {
        ASC.Files.Folders.bulkStatuses = false;

        jq("#tasksProgress .asc-progress-value").css("width", "0%");
        jq("#tasksProgress .asc-progress-percent").text("0%");
        jq("#tasksProgress .progress-dialog-header span").text("");
        jq("#tasksProgress").hide();
    };

    var terminateTasks = function (isImport) {
        clearTimeout(ASC.Files.Folders.tasksTimeout);

        ASC.Files.ServiceManager.terminateTasks(ASC.Files.TemplateManager.events.TerminateTasks, { isImport: isImport, isTerminate: true, doNow: true });
    };

    var getTasksStatuses = function (doNow) {
        clearTimeout(ASC.Files.Folders.tasksTimeout);

        ASC.Files.Folders.tasksTimeout = setTimeout(
            function () {
                ASC.Files.ServiceManager.getTasksStatuses(ASC.Files.TemplateManager.events.GetTasksStatuses, { doNow: false });
            }, ASC.Files.Constants.REQUEST_STATUS_DELAY / (doNow === true ? 8 : 1));
    };

    return {
        eventAfter: eventAfter,

        currentFolder: currentFolder,
        folderContainer: folderContainer,

        isCopyTo: isCopyTo,

        createFolder: createFolder,
        replaceVersion: replaceVersion,

        showVersions: showVersions,
        closeVersions:closeVersions,
        makeCurrentVersion: makeCurrentVersion,
        closeVersions: closeVersions,

        showOverwriteMessage: showOverwriteMessage,
        curItemFolderMoveTo: curItemFolderMoveTo,

        rename: rename,
        deleteItem: deleteItem,
        emptyTrash: emptyTrash,

        getFolderItems: getFolderItems,

        clickOnFolder: clickOnFolder,
        clickOnFile: clickOnFile,

        updateIfExist: updateIfExist,

        showMore: showMore,

        createNewDoc: createNewDoc,
        typeNewDoc: typeNewDoc,

        download: download,
        bulkDownload: bulkDownload,

        getTasksStatuses: getTasksStatuses,
        cancelTasksStatuses: cancelTasksStatuses,
        terminateTasks: terminateTasks,
        tasksTimeout: tasksTimeout,
        bulkStatuses: bulkStatuses
    };
})();

(function ($) {
    $(function () {

        jq("#pageNavigatorHolder a").click(function () {
            ASC.Files.Folders.showMore();
            return false;
        });

        jq("#topNewFolder a").click(function () {
            ASC.Files.Folders.createFolder();
        });

        jq("#buttomDelete, #mainDelete").click(function () {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.deleteItem();
        });

        jq("#buttomEmptyTrash, #mainEmptyTrash").click(function () {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.emptyTrash();
        });

        jq("#buttonDownload").click(function () {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.download();
        });

        jq("#mainDownload").click(function () {
            if (!jq(this).is(".unlockAction")) {
                return;
            }
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.download();
        });

        jq("#filesSelectAllCheck").click(function () {
            ASC.Files.UI.checkSelectAll(jq("#filesSelectAllCheck").prop("checked") == true);
            jq(this).blur();
        });

        jq("#filesMainContent").on("click", ".version", function () {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Folders.showVersions(this);
            return false;
        });

        jq("#filesMainContent").on("click", ".folder-row:not(.error-entry):not([spare_data]) .entry-title .name a, .folder-row:not(.error-entry):not([spare_data]) .thumb-folder", function () {
            var folderId = ASC.Files.UI.getObjectData(this).id;
            ASC.Files.Folders.clickOnFolder(folderId);
            return false;
        });

        jq("#toParentFolderLink, .empty-folder-toparent").on("click", function () {
            var folderId = jq(this).attr("data-id");
            ASC.Files.Folders.clickOnFolder(folderId);
            return false;
        });

        jq("#filesMainContent").on("click", ".file-row:not(.folder-row):not(.error-entry):not([spare_data]) .entry-title .name a, .file-row:not(.folder-row):not(.error-entry):not([spare_data]) .thumb-file", function () {
            var fileData = ASC.Files.UI.getObjectData(this);
            var fileObj = fileData.entryObject;
            ASC.Files.Folders.clickOnFile(fileData);
            fileObj.removeClass("isNewForWebEditor");
            return false;
        });

        jq("#filesMainContent").on("click", "#contentVersions .version-preview", function () {
            var fileData = ASC.Files.UI.getObjectData(this);
            var version = jq(this).closest(".version-row").attr("data-version");
            ASC.Files.Folders.clickOnFile(fileData, false, version);
            return false;
        });

        jq("#filesMainContent").on("click", "#contentVersions .version-download", function () {
            var fileId = ASC.Files.UI.getObjectData(this).id;
            var version = jq(this).closest(".version-row").attr("data-version");
            ASC.Files.Folders.download("file", fileId, version);
            return false;
        });

        jq("#filesMainContent").on("click", "#contentVersions .version-restore", function () {
            var fileId = ASC.Files.UI.getObjectData(this).id;
            var version = jq(this).closest(".version-row").attr("data-version");
            ASC.Files.Folders.makeCurrentVersion(fileId, version);
            return false;
        });

        jq(".update-if-exist").change(function () {
            ASC.Files.Folders.updateIfExist(this);
        });

        if (typeof ASC.Files.Share == "undefined") {
            jq("#files_shareaccess_folders, #filesShareAccess,\
                #filesUnsubscribe, #foldersUnsubscribe").remove();
        }

        jq(window).scroll(function () {
            ASC.Files.UI.stickContentHeader();
            if (jq(document).height() - jq(window).height() <= jq(window).scrollTop() + 350) {
                ASC.Files.Folders.showMore();
            }

            return true;
        });

        LoadingBanner.displayLoading(true);

    });
})(jQuery);