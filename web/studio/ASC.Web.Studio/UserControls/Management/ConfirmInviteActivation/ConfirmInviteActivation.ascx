﻿<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="ConfirmInviteActivation.ascx.cs"
    Inherits="ASC.Web.Studio.UserControls.Management.ConfirmInviteActivation" %>
<%@ Import Namespace="ASC.Web.Core.Utility.Skins" %>
<%@ Import Namespace="ASC.Web.Studio.Core.Users" %>
<%@ Import Namespace="Resources" %>

<asp:PlaceHolder runat="server" ID="_confirmHolder">
    <div class="confirmBlock">
        <div class="confirmTitle header-base">
            <% if (_type == ASC.Web.Studio.ConfirmType.EmpInvite)
               { %>
                <%= Resource.YouDecidedToJoinThisPortal %>
            <% }
               else
               { %>
                <%= Resource.InviteTitle %>
                <div class="subTitle">
                    <%= String.IsNullOrEmpty(_email) ? Resource.InvitePublicSubTitle : Resource.InviteSubTitle %>
                </div>
            <% } %>
        </div>
        <div class="clerFix confirmBlock">
            <div class="rightPart">
                <% if (!String.IsNullOrEmpty(_errorMessage))
                   { %>
                <div class="errorBox">
                    <%= _errorMessage %></div>
                <% } %>
                <%--Email--%>
                <% if (String.IsNullOrEmpty(_email))
                   { %>
                <div class="property">
                    <div class="name">
                        <%= Resource.Email %>:
                    </div>
                    <div class="value">
                        <input type="text" maxlength="64" id="studio_confirm_Email" name="emailInput" class="textEdit" value="<%= GetEmailAddress() %>" />
                    </div>
                </div>
                <% } %>
                <%--FirstName--%>
                <div class="property">
                    <div class="name">
                        <%= Resource.FirstName%>:
                    </div>
                    <div class="value">
                        <input type="text" maxlength="64" id="studio_confirm_FirstName" value="<%= GetFirstName() %>" name="firstnameInput"
                            class="textEdit" />
                    </div>
                </div>
                <%--LastName--%>
                <div class="property">
                    <div class="name">
                        <%= Resource.LastName%>:
                    </div>
                    <div class="value">
                        <input type="text" maxlength="64" id="studio_confirm_LastName" value="<%= GetLastName() %>" name="lastnameInput"
                            class="textEdit" />
                    </div>
                </div>
                <%--Pwd--%>
                <div class="property">
                    <div class="name">
                        <%= Resource.InvitePassword %>:
                        <img class="hintImg" title="<%= UserManagerWrapper.GetPasswordHelpMessage() %>" src="<%= WebImageSupplier.GetAbsoluteWebPath("info.png") %>" />
                    </div>
                    <div class="value">
                        <input type="password" maxlength="64" id="studio_confirm_pwd" value="" name="pwdInput" class="textEdit" autocomplete="off"/>
                    </div>
                </div>
                <%--RePwd--%>
                <div class="property">
                    <div class="name">
                        <%= Resource.RePassword %>:
                    </div>
                    <div class="value">
                        <input type="password" maxlength="64" id="studio_confirm_repwd" value="" name="repwdInput" class="textEdit" autocomplete="off"/>
                    </div>
                </div>
                <div class="clearFix btnBox">
                    <a class="button blue" href="javascript:void(0);" onclick="AuthManager.ConfirmInvite(); return false;">
                        <%= Resource.LoginRegistryButton%></a>
                </div>
                 <asp:PlaceHolder runat="server" ID="thrdParty" Visible="false"></asp:PlaceHolder>
            </div>
            <div class="leftPart">
                <div class="borderBase tintMedium portalInfo">
                    <a href="auth.aspx">
                        <img class="logo" src="<%= _tenantInfoSettings.GetAbsoluteCompanyLogoPath() %>" border="0" alt="" />
                    </a>
                    <div class="header-base">
                        <%= ASC.Core.CoreContext.TenantManager.GetCurrentTenant().Name.HtmlEncode() %></div>
                    <div class="user borderBase">
                        <img class="avatar borderBase" src="<%= _userAvatar %>" alt="" />
                        <div class="name">
                            <div class="header-base-small">
                                <%= _userName %></div>
                            <div class="describe-text">
                                <%= _userPost %></div>
                        </div>
                    </div>
                </div>
                <div class="description">
                    <%= String.Format(Resource.InviteDescription, "<span class=\"blue\">", "</span>") %>
                </div>
            </div>
        </div>
    </div>
</asp:PlaceHolder>