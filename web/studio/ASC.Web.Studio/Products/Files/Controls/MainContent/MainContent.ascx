﻿<%@ Assembly Name="ASC.Web.Files" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="MainContent.ascx.cs" Inherits="ASC.Web.Files.Controls.MainContent" %>
<%@ Import Namespace="ASC.Core" %>
<%@ Import Namespace="ASC.Web.Files.Classes" %>
<%@ Import Namespace="ASC.Web.Files.Import" %>
<%@ Import Namespace="ASC.Web.Files.Resources" %>
<%@ Import Namespace="ASC.Web.Studio.Utility" %>
<%@ Register TagPrefix="sc" Namespace="ASC.Web.Studio.Controls.Common" Assembly="ASC.Web.Studio" %>

<div id="contentPanel" data-title="<%= TitlePage %>" data-rootid="<%= FolderIDCurrentRoot %>">
    <%-- Advansed Filter --%>
    <div id="filterContainer">
        <div id="files_advansedFilter"></div>
    </div>

    <%-- Main Content Header --%>
    <ul id="mainContentHeader" class="contentMenu">
        <li class="menuAction menuActionSelectAll">
            <div class="menuActionSelect">
                <input type="checkbox" id="filesSelectAllCheck" title="<%= FilesUCResource.MainHeaderSelectAll %>" />
            </div>
            <div class="down_arrow" title="<%= FilesUCResource.TitleSelectFile %>">
            </div>
        </li>
        <li id="mainDownload" class="menuAction" title="<%= FilesUCResource.ButtonDownload %>">
            <span><%= FilesUCResource.ButtonDownload %></span>
        </li>
        <% if (FileUtility.ExtsConvertible.Any())
           { %>
        <li id="mainConvert" class="menuAction" title="<%= FilesUCResource.DownloadAs %>">
            <span><%= FilesUCResource.DownloadAs %></span>
        </li>
        <% } %>
        <li id="mainMove" class="menuAction" title="<%= FilesUCResource.ButtonMoveTo %>">
            <span><%= FilesUCResource.ButtonMoveTo %></span>
        </li>
        <li id="mainCopy" class="menuAction" title="<%= FilesUCResource.ButtonCopyTo %>">
            <span><%= FilesUCResource.ButtonCopyTo %></span>
        </li>
        <li id="mainMarkRead" class="menuAction" title="<%= FilesUCResource.RemoveIsNew %>">
            <span><%= FilesUCResource.RemoveIsNew %></span>
        </li>
        <li id="mainUnsubscribe" class="menuAction" title="<%= FilesUCResource.Unsubscribe %>">
            <span><%= FilesUCResource.Unsubscribe %></span>
        </li>
        <li id="mainRestore" class="menuAction" title="<%= FilesUCResource.ButtonRestore %>">
            <span><%= FilesUCResource.ButtonRestore %></span>
        </li>
        <li id="mainDelete" class="menuAction" title="<%= FilesUCResource.ButtonDelete %>">
            <span><%= FilesUCResource.ButtonDelete %></span>
        </li>
        <li id="mainEmptyTrash" class="menuAction" title="<%= FilesUCResource.ButtonEmptyTrash %>">
            <span><%= FilesUCResource.ButtonEmptyTrash %></span>
        </li>
        <li id="switchViewFolder">
            <div id="switchToNormal" title="<%= FilesUCResource.SwitchViewToNormal %>">
                &nbsp;
            </div>
            <div id="switchToCompact" title="<%= FilesUCResource.SwitchViewToCompact %>">
                &nbsp;
            </div>
        </li>

        <li id="filesListUp" title="<%= FilesUCResource.ButtonUp %>">
            <span class="baseLinkAction"><%= FilesUCResource.ButtonUp %></span>
        </li>
    </ul>

    <%-- Link To Parent --%>
    <div id="toParentFolder">
        <a id="toParentFolderLink">...</a>
    </div>

    <%-- Main Content --%>
    <div id="mainContent">
        <ul id="filesMainContent" class="user-select-none"></ul>
        <div id="pageNavigatorHolder">
            <a class="button blue gray"></a>
        </div>
        <div id="emptyContainer">
            <asp:PlaceHolder runat="server" ID="EmptyScreenFolder"></asp:PlaceHolder>
        </div>
    </div>
</div>

<%--Panels--%>
<div id="settingCommon" class="display-none">
    <% if (Global.IsAdministrator && !ASC.Core.CoreContext.Configuration.YourDocs && ImportConfiguration.SupportInclusion)%>
    <% { %>
    <span class="header-base"><%= FilesUCResource.ThirdPartyAccounts %></span>
    <br />
    <br />
    <label>
        <input id="cbxEnableSettings" type="checkbox" <%= EnableThirdpartySettings ? "checked='checked'" : "" %> />
        <%= FilesUCResource.ThirdPartyEnableSettings %>
    </label>
    <br />
    <br />
    <br />
    <% } %>

    <span class="header-base"><%= FilesUCResource.SettingUpdateIfExist %></span>
    <br />
    <br />
    <label>
        <input type="checkbox" class="update-if-exist float-left" <%= FilesSettings.UpdateIfExist ? "checked=\"checked\"" : string.Empty %> />
        <%= string.Format(FilesUCResource.ConfirmUpdateIfExist, "<br/><span class=\"text-medium-describe\">", "</span>")%>
    </label>
    <br />
    <br />
    <label>
        <input type="checkbox" class="store-original" <%= FilesSettings.StoreOriginalFiles ? "checked=\"checked\"" : string.Empty %> />
        <%= FilesUCResource.ConfirmStoreOriginalUploadCbxLabelText %>
    </label>
</div>

<div id="settingThirdPartyPanel" class="display-none">
    <asp:PlaceHolder runat="server" ID="SettingPanelHolder"></asp:PlaceHolder>
</div>

<% if (EnableHelp)
   { %>
<div id="helpPanel"></div>
<% } %>

<%--tooltip--%>
<div id="entryTooltip" class="studio-action-panel"></div>

<%--popup window's--%>
<div id="filesSelectorPanel" class="studio-action-panel files-popup-win">
    <div class="corner-top">
    </div>
    <ul class="dropdown-content">
        <li id="filesSelectAll"><a class="dropdown-item">
            <%= FilesUCResource.ButtonSelectAll %></a></li>
        <li id="filesSelectFile"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterFile %></a></li>
        <li id="filesSelectFolder"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterFolder %></a></li>
        <li id="filesSelectDocument"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterDocument %></a></li>
        <li id="filesSelectPresentation"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterPresentation %></a></li>
        <li id="filesSelectSpreadsheet"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterSpreadsheet %></a></li>
        <li id="filesSelectImage"><a class="dropdown-item">
            <%= FilesUCResource.ButtonFilterImage %></a></li>
    </ul>
</div>
<div id="filesActionsPanel" class="studio-action-panel files-popup-win">
    <ul class="dropdown-content">
        <li id="buttonDownload"><a class="dropdown-item">
            <%= FilesUCResource.ButtonDownload %>
            (<span></span>)</a> </li>
        <li id="buttonConvert"><a class="dropdown-item">
            <%= FilesUCResource.DownloadAs %>
            (<span></span>)</a> </li>
        <li id="buttonUnsubscribe"><a class="dropdown-item">
            <%= FilesUCResource.Unsubscribe %>
            (<span></span>)</a> </li>
        <li id="buttomMoveto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonMoveTo %>
            (<span></span>)</a> </li>
        <li id="buttomCopyto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonCopyTo %>
            (<span></span>)</a> </li>
        <li id="buttomRestore"><a class="dropdown-item">
            <%= FilesUCResource.ButtonRestore %>
            (<span></span>)</a> </li>
        <li id="buttomDelete"><a class="dropdown-item">
            <%= FilesUCResource.ButtonDelete %>
            (<span></span>)</a> </li>
        <li id="buttomEmptyTrash"><a class="dropdown-item">
            <%= FilesUCResource.ButtonEmptyTrash %></a> </li>
    </ul>
</div>
<div id="filesActionPanel" class="studio-action-panel files-popup-win">
    <div class="corner-top right">
    </div>
    <ul id="actionPanelFiles" class="dropdown-content">
        <li id="filesEdit"><a class="dropdown-item">
            <%= FilesUCResource.ButtonEdit %></a> </li>
        <li id="filesOpen"><a class="dropdown-item">
            <%= FilesUCResource.OpenFile %></a> </li>
        <li id="filesShareAccess"><a class="dropdown-item">
            <%= FilesUCResource.ButtonShareAccess %></a> </li>
        <li id="filesDownload"><a class="dropdown-item">
            <%= FilesUCResource.DownloadFile %></a> </li>
        <li id="filesConvert"><a class="dropdown-item">
            <%= FilesUCResource.DownloadAs %></a> </li>
        <% if (!CoreContext.Configuration.YourDocs)
           { %>
        <li id="filesGetLink"><a class="dropdown-item">
            <%= FilesUCResource.GetLink %></a></li>
        <% } %>
        <li id="filesUnsubscribe"><a class="dropdown-item">
            <%= FilesUCResource.Unsubscribe %></a> </li>
        <li id="filesVersions"><a class="dropdown-item">
            <%= FilesUCResource.ButtonShowVersions %>(<span></span>)</a> </li>
        <li id="filesMoveto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonMoveTo %></a> </li>
        <li id="filesCopyto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonCopyTo %></a> </li>
        <li id="filesRestore"><a class="dropdown-item">
            <%= FilesUCResource.ButtonRestore %></a> </li>
        <li id="filesRename"><a class="dropdown-item">
            <%= FilesUCResource.ButtonRename %></a> </li>
        <li id="filesRemove"><a class="dropdown-item">
            <%= FilesUCResource.ButtonDelete %></a> </li>
    </ul>
    <ul id="actionPanelFolders" class="dropdown-content">
        <li id="foldersOpen"><a class="dropdown-item">
            <%= FilesUCResource.OpenFolder %></a> </li>
        <li id="foldersShareAccess"><a class="dropdown-item">
            <%= FilesUCResource.ButtonShareAccess %></a> </li>
        <li id="foldersDownload"><a class="dropdown-item">
            <%= FilesUCResource.DownloadFolder %></a> </li>
        <li id="foldersUnsubscribe"><a class="dropdown-item">
            <%= FilesUCResource.Unsubscribe %></a> </li>
        <li id="foldersMoveto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonMoveTo %></a> </li>
        <li id="foldersCopyto"><a class="dropdown-item">
            <%= FilesUCResource.ButtonCopyTo %></a> </li>
        <li id="foldersRestore"><a class="dropdown-item">
            <%= FilesUCResource.ButtonRestore %></a> </li>
        <li id="foldersRename"><a class="dropdown-item">
            <%= FilesUCResource.ButtonRename %></a> </li>
        <li id="foldersRemove"><a class="dropdown-item">
            <%= FilesUCResource.ButtonDelete %></a> </li>
        <li id="foldersChangeThirdparty"><a class="dropdown-item">
            <%= FilesUCResource.ButtonChangeThirdParty %></a> </li>
        <li id="foldersRemoveThirdparty"><a class="dropdown-item">
            <%= FilesUCResource.ButtonDeleteThirdParty %></a> </li>
    </ul>
</div>
<div id="filesNewsPanel" class="files-news-panel studio-action-panel files-popup-win">
    <div class="corner-top corner-left">
    </div>
    <ul id="filesNewsList" class="dropdown-content webkit-scrollbar"></ul>
    <span id="filesNewsMarkRead" class="baseLinkAction"><%= FilesUCResource.RemoveIsNewAll %></span>
</div>

<%--dialog window--%>
<div id="confirmRemove" class="popup-modal display-none">
    <sc:Container id="confirmRemoveDialog" runat="server">
        <header><%=FilesUCResource.ConfirmRemove%></header>
        <body>
            <div id="confirmRemoveText">
            </div>
            <div id="confirmRemoveList" class="files-remove-list webkit-scrollbar">
                <dl>
                    <dt class="confirm-remove-folders">
                        <%=FilesUCResource.Folders%> (<span class="confirm-remove-folders-count"></span>):</dt>
                    <dd class="confirm-remove-folders">
                    </dd>
                    <dt class="confirm-remove-files">
                        <%=FilesUCResource.Documents%> (<span class="confirm-remove-files-count"></span>):</dt>
                    <dd class="confirm-remove-files">
                    </dd>
                </dl>
            </div>
            <span id="confirmRemoveTextDescription" class="text-medium-describe clearFix">
                <%=FilesUCResource.ConfirmRemoveDescription%>
            </span>
            <span id="confirmRemoveSharpBoxTextDescription" class="text-medium-describe clearFix">
                <%=FilesUCResource.ConfirmRemoveSharpBoxDescription%>
            </span>
            <div class="middle-button-container">
                <a id="removeConfirmBtn" class="button blue middle">
                    <%=FilesUCResource.ButtonOk%>
                </a>
                <span class="splitter-buttons"></span>
                <a class="button gray middle" onclick="PopupKeyUpActionProvider.CloseDialog(); return false;">
                    <%=FilesUCResource.ButtonCancel%>
                </a>
            </div>
        </body>
    </sc:Container>
</div>
<div id="confirmOverwriteFiles" class="popup-modal display-none">
    <sc:Container id="confirmOverwriteDialog" runat="server">
        <header><%=FilesUCResource.ConfirmOverwrite%></header>
        <body>
            <div id="overwriteMessage">
            </div>
            <ul id="overwriteList" class="webkit-scrollbar">
            </ul>
            <div class="middle-button-container">
                <a id="buttonOverwrite" class="button blue middle">
                    <%=FilesUCResource.ButtonRewrite%>
                </a>
                <span class="splitter-buttons"></span>
                <a id="buttonSkipOverwrite" class="button gray middle">
                    <%=FilesUCResource.ButtonSkip%>
                </a>
                <span class="splitter-buttons"></span>
                <a id="buttonCancelOverwrite" class="button gray middle">
                    <%=FilesUCResource.ButtonCancel%>
                </a>
            </div>
        </body>
    </sc:Container>
</div>
<%-- progress --%>
<div id="bottomLoaderPanel" class="progress-dialog-container">
    <div id="progressTemplate" class="progress-dialog display-none">
        <div class="progress-dialog-header">
        </div>
        <div class="progress-dialog-body files-progress-box">
            <div class="asc-progress-wrapper">
                <div class="asc-progress-value"></div>
            </div>
            <div class="asc-progress-percent">0</div>
        </div>
    </div>
    <asp:PlaceHolder runat="server" ID="UploaderPlaceHolder"></asp:PlaceHolder>
</div>

<asp:PlaceHolder runat="server" ID="ControlPlaceHolder"></asp:PlaceHolder>
