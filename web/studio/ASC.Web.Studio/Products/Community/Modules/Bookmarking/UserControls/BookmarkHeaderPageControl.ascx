﻿<%@ Assembly Name="ASC.Web.Community.Bookmarking" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="BookmarkHeaderPageControl.ascx.cs" 
    Inherits="ASC.Web.Community.Bookmarking.UserControls.BookmarkHeaderPageControl" %>
<%@ Import Namespace="ASC.Web.Community.Bookmarking.Resources" %>


<div class="bookmarksHeaderBlock"> 
    <span class="main-title-icon bookmarks"></span>
    <span class="header-with-menu"><%=Title%></span>
    <a id="unSubscribeOnBookmarkComments" style="display: none" class="follow-status subscribed display-none" href="javascript:unSubscribeOnBookmarkComments()" title="<%=UnsubscribeOnBookmarkComments%>"></a>
    <a id="subscribeOnBookmarkComments" style="display: none" class="follow-status unsubscribed" href="javascript:subscribeOnBookmarkComments()" title="<%=SubscribeOnBookmarkComments%>"></a>
</div>

