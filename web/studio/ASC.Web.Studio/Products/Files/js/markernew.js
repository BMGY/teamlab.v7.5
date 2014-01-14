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

window.ASC.Files.Marker = (function () {
    var isInit = false;

    var init = function () {
        if (isInit === false) {
            isInit = true;

            ASC.Files.ServiceManager.bind(ASC.Files.TemplateManager.events.MarkAsRead, ASC.Files.EventHandler.onGetTasksStatuses);

            ASC.Files.ServiceManager.bind(ASC.Files.TemplateManager.events.GetNews, ASC.Files.Marker.onGetNews);

            jq(document).click(function (event) {
                jq.dropdownToggle().registerAutoHide(event, ".is-new", "#filesNewsPanel");
            });
        }
    };

    var markRootAsNew = function (xmlData) {
        if (typeof xmlData == "undefined" || xmlData == null) {
            return false;
        }

        jq("#studio_sidePanel .page-menu .is-new").hide();

        var xmlChildNodes = xmlData.childNodes;
        for (var i = 0; i < xmlChildNodes.length; i++) {
            var xmlKey = xmlChildNodes[i].childNodes[0];
            var xmlValue = xmlChildNodes[i].childNodes[1];
            var folderId = xmlKey.textContent || xmlKey.text;
            var valueNew = xmlValue.textContent || xmlValue.text;
            if (valueNew > 0) {
                jq("#studio_sidePanel .page-menu .is-new[data-id=\"" + folderId + "\"]").text(valueNew).show();
            }
        }

        return true;
    };

    var removeNewIcon = function (entryType, entryId) {
        return ASC.Files.Marker.setNewCount(entryType, entryId, 0);
    };

    var setNewCount = function (entryType, entryId, countNew) {
        var result = false;

        var isUpdate = (countNew | 0) > 0;
        var newsObj = ASC.Files.UI.getEntryObject(entryType, entryId).find(".is-new");
        if (newsObj.is(":visible")) {
            var diffCount = (entryType == "file"
                ? -Math.pow(-1, countNew)
                : countNew - (newsObj.html() | 0));

            var rootId = ASC.Files.Tree.pathParts[0].Key;
            var rootObj = jq("#studio_sidePanel .page-menu .is-new[data-id=\"" + rootId + "\"]");
            var prevCount = rootObj.html() | 0;
            var rootCountNew = prevCount + diffCount;

            rootObj.html(rootCountNew > 0 ? rootCountNew : 0);
            if (rootCountNew > 0) {
                rootObj.show();
            } else {
                rootObj.hide();
            }

            if (isUpdate) {
                if (entryType == "folder") {
                    newsObj.html(countNew);
                }
            } else {
                newsObj.remove();
            }
            result = true;
        }

        if (entryType === "folder") {
            newsObj = jq("#studio_sidePanel .page-menu .is-new[data-id=\"" + entryId + "\"]");
            if (newsObj.is(":visible")) {
                newsObj.html(countNew > 0 ? countNew : 0);
                if (isUpdate) {
                    newsObj.show();
                } else {
                    newsObj.hide();

                    var parentRemoveNew = jq(ASC.Files.Tree.pathParts).is(function () {
                        return this.Key == entryId;
                    });
                    if (parentRemoveNew) {
                        jq("#filesMainContent .is-new").remove();
                    }
                }
                result = true;
            }
        }

        return result;
    };

    //request

    var markAsRead = function (event) {
        var itemData;

        var data = {};
        data.entry = new Array();

        if (typeof event == "undefined") {
            jq("#filesMainContent .file-row:not(.checkloading):not(.new-folder):not(.new-file):has(.checkbox input:checked)").each(function () {
                itemData = ASC.Files.UI.getObjectData(this);

                if (itemData.entryObject.find(".is-new").length > 0) {
                    data.entry.push(itemData.entryType + "_" + itemData.entryId);
                }
            });
        } else if (typeof event == "object") {
            itemData = event;

            data.entry.push(itemData.entryType + "_" + itemData.entryId);
        } else if (ASC.Files.Common.isCorrectId(event)) {
            data.entry.push("folder_" + event);
        }

        if (data.entry.length == 0) {
            return false;
        }

        ASC.Files.ServiceManager.request("post",
            "json",
            ASC.Files.TemplateManager.events.MarkAsRead,
            { list: data.entry, doNow: true },
            { stringList: data },
            "markasread");

        return false;
    };

    var getNews = function (target, folderId) {
        ASC.Files.Actions.hideAllActionPanels();

        if (!ASC.Files.Common.isCorrectId(folderId)) {
            var itemData = ASC.Files.UI.getObjectData(target);

            if (itemData.entryType == "file") {
                ASC.Files.Marker.markAsRead(itemData);
                return;
            }

            folderId = itemData.entryId;
        }

        var targetSize = {
            top: target.offset().top,
            left: target.offset().left,
            width: target.width()
        };

        ASC.Files.ServiceManager.request("get",
            "xml",
            ASC.Files.TemplateManager.events.GetNews,
            { folderId: folderId, targetSize: targetSize, showLoading: true },
            "getnews?folderId=" + encodeURIComponent(folderId));
    };

    //event handler

    var onMarkAsRead = function (listData) {
        jq("#studio_sidePanel .page-menu .is-new").hide();

        for (var i = 0; i < listData.length; i++) {
            var curItem = ASC.Files.UI.parseItemId(listData[i]);
            if (curItem == null) {
                if (listData[i].indexOf("new_") == 0) {
                    var itemDataStr = listData[i].substring(("new_").length).replace(/\?/g, ":");
                    var itemData = JSON.parse(itemDataStr);
                    var folderId = itemData.key;
                    var valueNew = itemData.value;
                    if (valueNew > 0) {
                        jq("#studio_sidePanel .page-menu .is-new[data-id=\"" + folderId + "\"]").text(valueNew).show();
                    }
                }
                continue;
            }
            var entryType = curItem.entryType;
            var entryId = curItem.entryId;

            ASC.Files.UI.blockObjectById(curItem.entryType, curItem.entryId, false, null, true);
            ASC.Files.Marker.removeNewIcon(entryType, entryId);

            if (entryType == "folder") {
                var isParent = jq(ASC.Files.Tree.pathParts).is(function () {
                    return this.Key == entryId;
                });

                if (isParent) {
                    jq("#filesMainContent .is-new").remove();
                }
            }
        }

        ASC.Files.UI.updateMainContentHeader();
        ASC.Files.Actions.showActionsViewPanel();
    };

    var onGetNews = function (xmlData, params, errorMessage) {
        if (typeof errorMessage != "undefined") {
            ASC.Files.UI.displayInfoPanel(errorMessage, true);
            return;
        }

        var htmlData = ASC.Files.TemplateManager.translate(xmlData);

        if (htmlData.length) {
            jq("#filesNewsList").html(htmlData);

            jq("#filesNewsList .file-row").each(function () {
                var entryData = ASC.Files.UI.getObjectData(this);

                var entryId = entryData.entryId;
                var entryType = entryData.entryType;
                var entryObj = entryData.entryObject;
                var entryTitle = entryData.title;

                var ftClass = (entryType == "file" ? ASC.Files.Utility.getCssClassByFileTitle(entryTitle, true) : ASC.Files.Utility.getFolderCssClass(true));
                entryObj.find(".thumb-" + entryType).addClass(ftClass);

                var rowLink = entryObj.find(".entry-title .name a");

                if (entryType == "file") {
                    if (rowLink.is(":not(:has(.file-extension))")) {
                        ASC.Files.UI.highlightExtension(rowLink, entryTitle);
                    }

                    var entryUrl = ASC.Files.Utility.GetFileDownloadUrl(entryId);

                    if ((ASC.Files.Utility.CanWebView(entryTitle) || ASC.Files.Utility.CanWebEdit(entryTitle))
                        && !ASC.Files.Utility.MustConvert(entryTitle)
                        && ASC.Resources.Master.TenantTariffDocsEdition) {
                        entryUrl = ASC.Files.Utility.GetFileWebEditorUrl(entryId);
                        rowLink.attr("href", entryUrl).attr("target", "_blank");
                    } else if (typeof ASC.Files.ImageViewer != "undefined" && ASC.Files.Utility.CanImageView(entryTitle)) {
                        entryUrl = "#" + ASC.Files.ImageViewer.getPreviewHash(entryId);
                        rowLink.attr("href", entryUrl);
                    } else {
                        rowLink.attr("href", jq.browser.mobile ? "" : entryUrl);
                    }
                } else {
                    entryUrl = "#" + ASC.Files.Anchor.fixHash(entryId);
                    rowLink.attr("href", entryUrl);
                }
            });

            var targetSize = params.targetSize;
            jq("#filesNewsPanel").css(
                {
                    "top": targetSize.top,
                    "left": targetSize.left + targetSize.width
                })
                .toggle()
                .attr("data-id", params.folderId);

            var countNew = jq("#filesNewsList .file-row").length;
            ASC.Files.Marker.setNewCount("folder", params.folderId, countNew);
        } else {
            ASC.Files.Marker.removeNewIcon("folder", params.folderId);
        }
    };

    return {
        init: init,

        removeNewIcon: removeNewIcon,
        setNewCount: setNewCount,

        markAsRead: markAsRead,
        markRootAsNew: markRootAsNew,

        getNews: getNews,

        onMarkAsRead: onMarkAsRead,
        onGetNews: onGetNews
    };
})();

(function ($) {
    $(function () {
        ASC.Files.Marker.init();

        jq("#filesMainContent").on("click", ".is-new", function (event) {
            var e = ASC.Files.Common.fixEvent(event);
            var target = jq(e.srcElement || e.target);
            ASC.Files.Marker.getNews(target);
            return false;
        });

        jq("#mainMarkRead").click(function () {
            ASC.Files.Actions.hideAllActionPanels();
            ASC.Files.Marker.markAsRead();
        });

        jq("#filesNewsMarkRead").click(function () {
            ASC.Files.Actions.hideAllActionPanels();
            var folderId = jq("#filesNewsPanel").attr("data-id");
            ASC.Files.Marker.markAsRead(folderId);
        });

        jq("#filesNewsList").on("click", ".folder-row:not(.error-entry) .entry-title .name a, .folder-row:not(.error-entry) .thumb-folder", function () {
            ASC.Files.Actions.hideAllActionPanels();
            var folderId = ASC.Files.UI.getObjectData(this).id;
            ASC.Files.Folders.clickOnFolder(folderId);
            return false;
        });

        jq("#filesNewsList").on("click", ".file-row:not(.folder-row):not(.error-entry) .entry-title .name a, .file-row:not(.folder-row):not(.error-entry) .thumb-file", function () {
            ASC.Files.Actions.hideAllActionPanels();
            var fileData = ASC.Files.UI.getObjectData(this);
            var updated = ASC.Files.Folders.clickOnFile(fileData);

            if (!updated) {
                var newFolderId = jq("#filesNewsPanel").attr("data-id");
                var newObj = jq(".is-new[data-id=\"" + newFolderId + "\"]");
                if (!newObj.is(":visible")) {
                    newObj = ASC.Files.UI.getEntryObject("folder", newFolderId).find(".is-new");
                }
                var prevCount = newObj.html() | 0;
                ASC.Files.Marker.setNewCount("folder", newFolderId, prevCount - 1);
            }

            return false;
        });

    });
})(jQuery);