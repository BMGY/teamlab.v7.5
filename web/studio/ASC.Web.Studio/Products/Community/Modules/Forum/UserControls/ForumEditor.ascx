﻿<%@ Assembly Name="ASC.Web.Community.Forum"%>
<%@ Control Language="C#" AutoEventWireup="true" CodeBehind="ForumEditor.ascx.cs" Inherits="ASC.Web.Community.Forum.ForumEditor" %>
<%@ Import Namespace="ASC.Web.Community.Forum.Resources" %>

<%@ Register TagPrefix="sc" Namespace="ASC.Web.Studio.Controls.Common" Assembly="ASC.Web.Studio" %>
  
  <input type="hidden" id="forum_editCategoryID" value="" />
  <input type="hidden" id="forum_securityObjID" value"" />
   
<%--edit category dlg--%>
<div id="forum_editCategoryDialog" style="display: none;">
    <sc:Container ID="EditCategoryContainer" runat="server">
        <Header>
            <%=ForumResource.ThreadCategoryEditor%>
        </Header>
        <Body>            
            <div id="forum_editCategoryMessage" class='infoPanel alert' style='margin:10px 0;'></div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadCategoryName%>:</b>
                </div>
                <div>
                    <input class="textEdit" style="width:100%;" type="text" id="forum_editCategoryName" value="" />
                </div>
            </div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadCategoryDescription%>:</b>
                </div>
                <div>
                    <textarea style="width: 100%; height: 100px;" id="forum_editCategoryDescription"></textarea>
                </div>
            </div>
            <div id="forum_edit_categ_panel_buttons">
                <a class="button blue middle" href="javascript:ForumMakerProvider.SaveCategory('edit');">
                    <%=ForumResource.SaveButton%>
                </a>
                <span class="splitter"></span>
                <a class="button gray middle" href="javascript:ForumMakerProvider.CloseDialogByID('forum_editCategoryDialog');">
                    <%=ForumResource.CancelButton%>
                </a>
            </div>  
            <div id="forum_edit_categ_action_loader" style="display: none;">
                <div class="text-medium-describe">
                    <%=ForumResource.PleaseWaitMessage%>
				</div>
				<img src="<%=ASC.Web.Core.Utility.Skins.WebImageSupplier.GetAbsoluteWebPath("ajax_progress_loader.gif")%>">
            </div>
        </Body>
    </sc:Container>
</div>
 
 <%--new cat--%>
<div id='forum_newCategoryDialog' style="display:none;">
<sc:Container ID="NewCategoryContainer" runat="server">
        <Header>
            <%=ForumResource.ThreadCategoryEditor%>
          </Header>
        <Body>
            <div id="forum_newCategoryMessage" class='infoPanel alert' style='margin:10px 0;'></div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadCategoryName%>:</b>
                </div>
                <div>
                    <input class="textEdit" style="width:100%;" type="text" id="forum_newCategoryName" value="" />
                </div>
            </div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadCategoryDescription%>:</b>
                </div>
                <div>
                    <textarea style="width:100%; height:100px;" id="forum_newCategoryDescription"></textarea>
                </div>
            </div>
            <div id="forum_new_categ_panel_buttons">
                <a class="button blue middle" href="javascript:ForumMakerProvider.SaveCategory('new');">
                    <%=ForumResource.SaveButton%>
                </a>
                <span class="splitter-buttons"></span>
                <a class="button gray middle" href="javascript:ForumMakerProvider.CloseDialogByID('forum_newCategoryDialog');">
                    <%=ForumResource.CancelButton%>
                </a>
            </div>
            <div id="forum_new_categ_action_loader" style="display: none;">
                <div class="text-medium-describe">
                    <%=ForumResource.PleaseWaitMessage%>
                </div>
                <img src="<%=ASC.Web.Core.Utility.Skins.WebImageSupplier.GetAbsoluteWebPath("ajax_progress_loader.gif")%>">
            </div>
        </Body>
    </sc:Container>
 </div> 
 
 <input type="hidden" id="forum_editThreadID" value="" />
 
 <%--new forum--%>
 <div id='forum_newThreadDialog' style="display:none;">
 <sc:Container ID="NewThreadContainer" runat="server">
        <Header>
            <%=ForumResource.ThreadEditor%>
        </Header>
        <Body>
            <div id="forum_newThreadMessage" class='infoPanel alert' style='margin:10px 0;'></div>    
            <input type="hidden" id="forum_newThreadCategoryID" value=""/>    
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadName%>:</b>
                </div>
                <div>
                    <input class="textEdit" style="width:100%;" type="text" id="forum_newThreadName" value="" />
                </div>
            </div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadDescription%>:</b>
                </div>
                <div>
                    <textarea style="width:100%; height:100px;" id="forum_newThreadDescription"></textarea>
                </div>
            </div>
            <div id="forum_new_thread_panel_buttons">
                <a class="button blue middle" href="javascript:ForumMakerProvider.SaveThread('new');">
                    <%=ForumResource.SaveButton%>
                </a>
                <span class="splitter-buttons"></span>
                <a class="button gray middle" href="javascript:ForumMakerProvider.CloseDialogByID('forum_newThreadDialog');">
                    <%=ForumResource.CancelButton%>
                </a>
            </div>  
            <div id="forum_new_thread_action_loader" style="display: none;">
            <div class="text-medium-describe">
                <%=ForumResource.PleaseWaitMessage%>
            </div>
            <img src="<%=ASC.Web.Core.Utility.Skins.WebImageSupplier.GetAbsoluteWebPath("ajax_progress_loader.gif")%>">
        </div>
        </Body>
    </sc:Container>
 </div> 
 
 <%--forum editor--%>
<div id='forum_editThreadDialog' style="display:none;">
  <sc:Container ID="EditThreadContainer" runat="server">
        <Header>
            <%=ForumResource.ThreadEditor%>
          </Header>
        <Body>
            <div id="forum_editThreadMessage" class='infoPanel alert' style='margin:10px 0;'></div>
            <input type="hidden" id="forum_editThreadCategoryID" value=""/>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadName%>:</b>
                </div>
                <div>
                    <input class="textEdit" style="width:100%;" type="text" id="forum_editThreadName" value="" />
                </div>
            </div>
            <div class="headerPanel-splitter">
                <div class="headerPanelSmall-splitter">
                    <b><%=ForumResource.ThreadDescription%>:</b>
                </div>
                <div>
                    <textarea style="width:100%; height:100px;" id="forum_editThreadDescription"></textarea>
                </div>
            </div>
            <div id="forum_edit_thread_panel_buttons">
                <a class="button blue middle" href="javascript:ForumMakerProvider.SaveThread('edit');">
                    <%=ForumResource.SaveButton%>
                </a>
                <span class="splitter-buttons"></span>
                <a class="button gray middle" href="javascript:ForumMakerProvider.CloseDialogByID('forum_editThreadDialog');">
                    <%=ForumResource.CancelButton%>
                </a>
            </div>
            <div id="forum_edit_thread_action_loader" style="display: none;">
                <div class="text-medium-describe">
                    <%=ForumResource.PleaseWaitMessage%>
			    </div>
			    <img src="<%=ASC.Web.Core.Utility.Skins.WebImageSupplier.GetAbsoluteWebPath("ajax_progress_loader.gif")%>">
            </div>
        </Body>
    </sc:Container>
 </div> 

<div id="forum_threadCategories">
    <%= RenderForumCategories() %>
    <asp:PlaceHolder ID="EmptyContent" runat="server"></asp:PlaceHolder>
</div>

<% if (HasCategories)%>
<% { %>
    <div class="big-button-container">
        <a class="button blue big" href="newforum.aspx">
            <%= ForumResource.AddThreadButton %>
        </a>
    </div>
<% } %>