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

using System;
using System.Text;
using System.Web;
using ASC.Blogs.Core;
using ASC.Blogs.Core.Domain;
using ASC.Core;
using ASC.Core.Users;
using ASC.Web.Community.Product;
using ASC.Web.Core.Utility.Skins;
using ASC.Blogs.Core.Resources;
using ASC.Web.Studio.Utility.HtmlUtility;

namespace ASC.Web.Community.Blogs.Views
{
    public partial class ViewBlogView : BaseUserControl
    {
        public EventHandler UpdateCompleted;
        public EventHandler UpdateCancelled;

        public bool IsPreview { get; set; }

        public Post post
        {
            set { ShowBlogDetails(value); }
        }

        private void ShowBlogDetails(Post post)
        {
            if (post == null) return;

            var sb = new StringBuilder();
            var user = CoreContext.UserManager.GetUsers(post.UserID);

            if (IsPreview)
            {
                sb.Append("<div style='margin-bottom: 20px'>");
                sb.Append("<div id=\"previewTitle\" class='containerHeaderBlock' style='padding: 0 8px;'>" + HttpUtility.HtmlEncode(post.Title) + "</div>");
            }
            else
            {
                sb.Append("<div>");
            }

            sb.Append("<table class='MainBlogsTable' cellspacing='0' cellpadding='8' border='0'>");
            sb.Append("<tr>");
            sb.Append("<td valign='top' class='avatarContainer'>");
            sb.Append("<div>" + ImageHTMLHelper.GetHTMLUserAvatar(post.UserID) + "</div>");
            sb.Append("</td>");

            sb.Append("<td valign='top'>");

            sb.Append("<div class=\"author-title describe-text\">" + BlogsResource.PostedTitle + ":</div>");
            sb.Append("<div class=\"author-name\">");
            sb.AppendFormat("<a class='linkMedium' href=\"{0}\">{1}</a>", user.GetUserProfilePageURL(), user.DisplayUserName());
            sb.Append("</div>");
            sb.Append("<div>");
            sb.AppendFormat("<a class='linkMedium gray-text' href='{0}?userid={1}'>{2}</a>",
                            VirtualPathUtility.ToAbsolute(ASC.Blogs.Core.Constants.BaseVirtualPath),
                            user.ID,
                            BlogsResource.AllRecordsOfTheAutor);
            sb.Append("</div>");
            sb.Append("<div class='describe-text' style='margin-top:10px'>");
            sb.AppendFormat("{0}<span style='margin-left:20px'>{1}</span>", post.Datetime.ToString("d"), post.Datetime.ToString("t"));
            sb.Append("</div>");

            if (!IsPreview)
            {
                sb.Append("<div id=\"blogActionsMenuPanel\" class=\"studio-action-panel\">");
                sb.Append("<div class=\"corner-top left\"></div>");
                sb.Append("<ul class=\"dropdown-content\">");
                if (CommunitySecurity.CheckPermissions(post, ASC.Blogs.Core.Constants.Action_EditRemovePost))
                {
                    sb.Append("<li><a class=\"dropdown-item\" href=\"editblog.aspx?blogid=" + Request.QueryString["blogid"] + "\" >" + BlogsResource.EditBlogLink + "</a></li>");
                    sb.Append("<li><a class=\"dropdown-item\" onclick=\"javascript:return confirm('" + BlogsResource.ConfirmRemovePostMessage + "');\" href=\"editblog.aspx?blogid=" + Request.QueryString["blogid"] + "&action=delete\" >" + BlogsResource.DeleteBlogLink + "</a></li>");
                }
                sb.Append("</ul>");
                sb.Append("</div>");
            }
            sb.Append("</td></tr></table>");

            sb.Append("<div id='previewBody' class='longWordsBreak ContentMainBlog'>");

            sb.Append(HtmlUtility.GetFull(post.Content, CommunityProduct.ID));

            sb.Append("</div>");

            if (!IsPreview)
            {
                sb.Append("<div  class='clearFix'>");
                if (post.TagList.Count > 0)
                {
                    sb.Append("<div class=\"text-medium-describe TagsMainBlog\">");
                    sb.Append("<img class=\"TagsImgMainBlog\" src=\"" + WebImageSupplier.GetAbsoluteWebPath("tags.png", BlogsSettings.ModuleID) + "\">");

                    var j = 0;
                    foreach (var tag in post.TagList)
                    {
                        if (j != 0)
                            sb.Append(", ");
                        j++;
                        sb.Append("<a style='margin-left:5px;' class=\"linkMedium gray-text\" href=\"./?tagname=" + HttpUtility.UrlEncode(tag.Content) + "\">" + HttpUtility.HtmlEncode(tag.Content) + "</a>");
                    }

                    sb.Append("</div>");
                }

                sb.Append("</div>");
            }

            sb.Append("</div>");

            ltrContent.Text = sb.ToString();
        }

        public void UpdateValuesOn(Post post)
        {

        }

        protected void btnCancel_OnClick(object sender, EventArgs e)
        {
            if (UpdateCancelled != null)
            {
                UpdateCancelled(this, EventArgs.Empty);
            }
        }
    }
}