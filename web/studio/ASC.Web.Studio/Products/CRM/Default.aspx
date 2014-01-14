﻿<%@ Assembly Name="ASC.Web.CRM" %>
<%@ Assembly Name="ASC.Web.Studio" %>

<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="Default.aspx.cs" MasterPageFile="~/Products/CRM/Masters/BasicTemplate.Master" Inherits="ASC.Web.CRM.Contacts"%>
<%@ MasterType TypeName="ASC.Web.CRM.BasicTemplate" %>

<%@ Import Namespace="ASC.Web.CRM" %>
<%@ Import Namespace="ASC.Web.CRM.Classes" %>
<%@ Import Namespace="ASC.Web.CRM.Resources" %>
<%@ Import Namespace="ASC.Web.Core.Utility.Skins" %>

<asp:Content ID="PageContentWithoutCommonContainer" ContentPlaceHolderID="BTPageContentWithoutCommonContainer" runat="server">
    <asp:PlaceHolder ID="_navigationPanelContent" runat="server"></asp:PlaceHolder>
    <asp:PlaceHolder ID="_widgetContainer" runat="server"></asp:PlaceHolder>
</asp:Content>

<asp:Content ID="CommonContainer" ContentPlaceHolderID="BTPageContent" runat="server">
    <asp:PlaceHolder ID="CommonContainerHolder" runat="server"></asp:PlaceHolder>
    <asp:HiddenField ID="_ctrlContactID" runat="server" />
    <div id="files_hintTypesPanel" class="hintDescriptionPanel">
        <div class="popup-corner"></div>
        <%=CRMContactResource.TooltipTypes%>
        <a href="http://www.teamlab.com/help/tipstricks/contact-types.aspx" target="_blank"><%=CRMCommonResource.ButtonLearnMore%></a>
    </div>
    <div id="files_hintCsvPanel" class="hintDescriptionPanel">
        <div class="popup-corner"></div>
        <%=CRMContactResource.TooltipCsv%>
        <a href="http://www.teamlab.com/help/guides/create-CSV-file.aspx" target="_blank"><%=CRMCommonResource.ButtonLearnMore%></a>
    </div>
</asp:Content>