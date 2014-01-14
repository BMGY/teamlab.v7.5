﻿<%@ Page Language="C#" MasterPageFile="~/Products/Community/Modules/Forum/Forum.Master" EnableViewState="false" AutoEventWireup="true" CodeBehind="Topics.aspx.cs" Inherits="ASC.Web.Community.Forum.Topics" Title="Untitled Page" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ForumPageContent" runat="server">
    <div class="forumsHeaderBlock" style="margin-bottom: 16px;">
        <span class="header-with-menu"><%=HttpUtility.HtmlEncode(ForumTitle)%></span>
        <asp:Literal ID="SubscribeLinkBlock" runat="server"></asp:Literal>
        <span class="menu-small" style="display: <%=(EnableDelete? "inline-block":"none") %>"></span>
    </div>
    <asp:PlaceHolder ID="topicsHolder" runat="server"></asp:PlaceHolder>
    <div id="errorMessageTopic"></div>
</asp:Content>
