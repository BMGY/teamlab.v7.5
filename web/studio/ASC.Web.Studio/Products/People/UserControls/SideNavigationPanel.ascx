﻿<%@ Assembly Name="ASC.Web.People" %>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="SideNavigationPanel.ascx.cs" Inherits="ASC.Web.People.UserControls.SideNavigationPanel" %>
<%@ Import Namespace="ASC.Web.People.Resources" %>

<!-- is first button -->
<button style="display:none">&nbsp;</button>

<div class="page-menu">
<% if (CurrentUserAdmin)
   { %>
  <ul class="menu-actions">
    <li id="menuCreateNewButton" class="menu-main-button without-separator middle" title="<%=PeopleResource.LblCreateNew%>">
      <span id="menuCreateNewButtonText" class="main-button-text"><%=PeopleResource.LblCreateNew%></span>
      <span class="white-combobox"></span>
    </li>
    <li id="menuOtherActionsButton" class="menu-gray-button" title="<%=Resources.Resource.MoreActions %>">
      <span class="btn_other-actions">...</span>
    </li>
  </ul>
<% } %>
  <div id="createNewButton" class="studio-action-panel">
    <div class="corner-top left"></div>
    <ul class="dropdown-content">
      <li>
        <% if (EnableAddUsers) { %>
          <a class="dropdown-item add-profile" href="profileaction.aspx?action=create&type=user"><%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("User").HtmlEncode() %></a>
        <% } else { %>
          <span class="dropdown-item disable"><%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("User").HtmlEncode() %></span>
        <% } %>
      </li>
      <li><a class="dropdown-item add-profile" href="profileaction.aspx?action=create&type=guest"><%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("Guest").HtmlEncode()%></a></li>
      <li><a class="dropdown-item add-group"><%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("Department").HtmlEncode()%></a></li>
    </ul>
  </div>

  <div id="otherActions" class="studio-action-panel">
    <div class="corner-top left"></div>
    <ul class="dropdown-content">
      <li><a class="dropdown-item add-profiles"><%= PeopleResource.LblImportAccounts %></a></li>
      <% if (HasPendingProfiles)
         { %>
      <li><a class="dropdown-item send-invites"><%= PeopleResource.LblResendInvites %></a></li>
      <% } %>
    </ul>
  </div>

  <ul class="menu-list">
    <%if (Profiles.Count > 0)
      {%>
      <li class="menu-item <%= (Groups.Count == 0) ? "none-" : ""%>sub-list <%= Page is ASC.Web.People.Help ? "" : "currentCategory active" %>" data-id="@persons">
        <div class="category-wrapper">
          <%if (Groups.Count > 0)
            {%>
          <span class="expander"></span>
          <% } %>
          <a id="defaultLinkPeople" class="menu-item-label outer-text text-overflow" title="<%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("Departments").HtmlEncode() %>">
            <span class="menu-item-icon people"></span>
            <span class="menu-item-label inner-text"><%= ASC.Web.Studio.Core.Users.CustomNamingPeople.Substitute<Resources.Resource>("Departments").HtmlEncode()%></span>
          </a>
        </div>
    <%}%>
    <asp:Repeater ID="GroupRepeater" runat="server" ItemType="ASC.Web.People.Classes.MyGroup">
      <HeaderTemplate>
        <ul id="groupList" class="menu-sub-list">
      </HeaderTemplate>
      <ItemTemplate>
        <li class="menu-sub-item" data-id="<%#Item.Id%>">
          <a class="menu-item-label outer-text text-overflow" title="<%#Item.Title%>"><%#Item.Title%></a>
        </li>
      </ItemTemplate>
      <FooterTemplate>
        </ul>
      </FooterTemplate>
    </asp:Repeater>
    <%if (Groups.Count > 0)
      {%>
      </li>
    <%}%>
    <%--
    <li class="menu-item sub-list" data-id="@freelancers">
      <div class="category-wrapper">
        <span class="expander"></span>
        <a class="menu-item-label outer-text text-overflow" title="Freelancers">
          <span class="menu-item-label inner-text">Freelancers</span>
        </a>
      </div>
    </li>
    <li class="menu-item sub-list" data-id="@clients">
      <div class="category-wrapper">
        <span class="expander"></span>
        <a class="menu-item-label outer-text text-overflow" title="Clients">
          <span class="menu-item-label inner-text">Clients</span>
        </a>
      </div>
    </li>
    --%>
    <% if (CurrentUserAdmin)
       { %>
         <li id="menuSettings" class="menu-item sub-list add-block">
                    <div class="category-wrapper">
                        <span class="expander"></span>
                        <a class="menu-item-label outer-text text-overflow" href="<%= VirtualPathUtility.ToAbsolute("~/management.aspx") + "?type=8"%>">
                            <span class="menu-item-icon settings"></span>
                            <span class="menu-item-label inner-text gray-text"><%= PeopleResource.Settings %></span>
                        </a>
                    </div>
                    <ul class="menu-sub-list">
                          <li id="menuAccessRights" class="menu-sub-item filter">
                                <a class="menu-item-label outer-text text-overflow" href="<%= VirtualPathUtility.ToAbsolute("~/management.aspx") + "?type=8#people" %>"><%= PeopleResource.AccessRightsSettings %></a>
                          </li>
                    </ul>
                </li>
         <% } %>
         <asp:PlaceHolder ID="HelpHolder" runat="server"></asp:PlaceHolder>
         <asp:PlaceHolder ID="SupportHolder" runat="server"></asp:PlaceHolder>
  </ul>
</div>
