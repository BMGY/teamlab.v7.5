﻿<%@ Assembly Name="ASC.Web.CRM" %>
<%@ Assembly Name="ASC.Web.Core" %>
<%@ Assembly Name="ASC.Common" %>
<%@ Assembly Name="ASC.Core.Common" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="HistoryView.ascx.cs" Inherits="ASC.Web.CRM.Controls.Common.HistoryView" %>
<%@ Import Namespace="ASC.Core" %>
<%@ Import Namespace="ASC.CRM.Core" %>
<%@ Import Namespace="ASC.Web.Core.Utility.Skins" %>
<%@ Import Namespace="ASC.Web.CRM" %>
<%@ Import Namespace="ASC.Web.CRM.Resources" %>

<div id="historyBlock">
        <table class="details-menu" width="100%" cellpadding="0" cellspacing="0">
         <colgroup>
            <col />
            <col style="width: 150px;"/>
            <col/>
        </colgroup>
        <tbody>
        <tr>
            <td id="categorySelectorContainer"></td>
            <td style="white-space:nowrap;padding-right: 15px;">
                <%= CRMCommonResource.Date %>:
                <input type="text" class="textEditCalendar"/>
            </td>
            <td style="white-space:nowrap;">
                <div id="eventLinkToPanel" class="empty-select"></div>
            </td>
        </tr>
        </tbody>
    </table>
    <div style="padding-right: 5px;">
        <textarea></textarea>
    </div>

    <div style="margin: 10px 0;">
        <table width="100%">
        <tr>
            <td style="white-space:nowrap;" class="historyViewUserSelectorCont">
                <%=CRMCommonResource.SelectUsersToNotify%>:
            </td>
            <td style="white-space:nowrap;" class="historyViewUserSelectorCont">
                <div id ="historyViewUserSelector"></div>
            </td>
            <td width="100%" align="right">
                <% if(!MobileVer) {%>
                <div style="float:right;" id="attachButtonsPanel">
                    <a class="attachLink baseLinkAction linkMedium" onclick="ASC.CRM.HistoryView.showAttachmentPanel(true)" >
                        <%= CRMCommonResource.ShowAttachPanel%>
                    </a>
                    <a class="attachLink baseLinkAction linkMedium" onclick="ASC.CRM.HistoryView.showAttachmentPanel(false)" style="display: none;" >
                        <%= CRMCommonResource.HideAttachPanel%>
                    </a>
                </div>
                <% } %>
            </td>
        </tr>
        </table>
        <div id="selectedUsers_HistoryUserSelector_Container" class="clearFix" style="margin-top: 10px;"></div>
    </div>

    <% if(!MobileVer) {%>
    <div id="attachOptions" style="display:none;margin: 10px 0;">
        <asp:PlaceHolder ID="_phfileUploader" runat="server" />
    </div>
    <% } %>

    <div class="action_block">
        <a class="button blue middle disable" onclick="ASC.CRM.HistoryView.addEvent()">
            <%= CRMCommonResource.AddThisNote %>
        </a>
    </div>
    <div style="display: none;" class="ajax_info_block">
        <span class="text-medium-describe"><%= CRMCommonResource.AddThisNoteProggress%>... </span>
        <br />
        <img alt="<%= CRMCommonResource.AddThisNoteProggress%>" title="<%= CRMCommonResource.AddThisNoteProggress%>"
            src="<%= WebImageSupplier.GetAbsoluteWebPath("ajax_progress_loader.gif") %>" />
    </div>

    <br />
    <div class="clearFix">
        <div id="eventsFilterContainer">
            <div id="eventsAdvansedFilter"></div>
        </div>
        <br />

        <div id="eventsList">
            <table id="eventsTable" class="tableBase" cellpadding="10" cellspacing="0">
                <tbody>
                </tbody>
            </table>
            <div id="showMoreEventsButtons">
                <a class="crm-showMoreLink" style="display:none;">
                    <%= CRMJSResource.ShowMoreButtonText %>
                </a>
                <a class="crm-loadingLink" style="display:none;">
                    <%= CRMJSResource.LoadingProcessing %>
                </a>
            </div>
        </div>
    </div>
</div>