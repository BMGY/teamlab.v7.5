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
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Web;
using System.Web.UI;
using ASC.Data.Storage;

namespace ASC.Web.Studio.UserControls.Common.ViewSwitcher
{
    [ToolboxData("<{0}:ViewSwitcher runat=\"server\"/>"),
     ParseChildren(ChildrenAsProperties = true), PersistChildren(true)]
    public class ViewSwitcher : Control
    {
        #region Sort and Tab items

        private List<ViewSwitcherBaseItem> _sortItems;

        [Description("List of tabs."),
         Category("Data"), PersistenceMode(PersistenceMode.InnerProperty),
         DesignerSerializationVisibility(DesignerSerializationVisibility.Content), NotifyParentProperty(true)]
        public List<ViewSwitcherBaseItem> SortItems
        {
            get { return _sortItems ?? (_sortItems = new List<ViewSwitcherBaseItem>()); }
            set
            {
                var v = value;
                if (v != null && v is List<ViewSwitcherBaseItem>)
                {
                    _sortItems = v;
                }
            }
        }

        protected bool HasSortItems
        {
            get { return SortItems.Count > 0; }
        }

        private List<ViewSwitcherTabItem> _tabItems;

        [Description("List of tabs."),
         Category("Data"), PersistenceMode(PersistenceMode.InnerProperty),
         DesignerSerializationVisibility(DesignerSerializationVisibility.Content), NotifyParentProperty(true)]
        public List<ViewSwitcherTabItem> TabItems
        {
            get { return _tabItems ?? (_tabItems = new List<ViewSwitcherTabItem>()); }
            set { _tabItems = value; }
        }

        protected bool HasTabItems
        {
            get { return TabItems.Count > 0; }
        }

        public bool DisableJavascriptSwitch { get; set; }

        public bool RenderAllTabs { get; set; }

        #endregion

        public string SortItemsHeader { get; set; }

        protected string SortItemsDivID = Guid.NewGuid().ToString();

        protected override void OnInit(EventArgs e)
        {
            foreach (var tab in TabItems.Where(tab => tab.Visible))
            {
                Controls.Add(tab);
            }
            base.OnInit(e);
        }

        protected override void OnPreRender(EventArgs e)
        {
            base.OnPreRender(e);
            InitViewSwitcherScripts(Page, TabItems);
        }

        protected override void Render(HtmlTextWriter writer)
        {
            var sb = new StringBuilder();
            if (HasTabItems)
            {
                sb.AppendFormat("<div class='viewSwitcher'><ul class='clearFix viewSwitcherAreaWithBottomBorder'>");

                foreach (var tab in TabItems)
                {
                    tab.SortItemsDivID = SortItemsDivID;
                    if (tab.Visible)
                    {
                        sb.Append(tab.GetSortLink(RenderAllTabs));
                    }
                }
            }

            if (HasSortItems)
            {
                if (HasTabItems)
                    sb.Append("<li align='right' style='float: right; list-style: none;'><div class='clearFix'>");

                sb.Append("<table cellspacing='0' cellpadding='0'><tr>");

                if (!string.IsNullOrEmpty(SortItemsHeader))
                    sb.AppendFormat("<td class='viewSwitcherItem'>{0}</td>", SortItemsHeader.HtmlEncode());

                foreach (var sortItem in SortItems)
                    sb.AppendFormat("<td>{0}</td>", sortItem.GetSortLink);

                sb.Append("</tr></table>");

                if (HasTabItems)
                    sb.Append("</div></li>");
            }


            if (HasTabItems)
                sb.Append("</ul></div>");

            writer.Write(sb.ToString());

            foreach (var tab in TabItems.Where(tab => tab.Visible))
            {
                if (RenderAllTabs)
                {
                    tab.RenderTabContent(writer);
                    continue;
                }
                if (tab.IsSelected && DisableJavascriptSwitch)
                {
                    tab.RenderTabContent(writer);
                }
            }
        }

        public void InitViewSwitcherScripts(Page p, List<ViewSwitcherTabItem> tabs)
        {
            Page.RegisterBodyScripts(ResolveUrl("~/usercontrols/common/viewswitcher/js/viewswitcher.js"));
            Page.RegisterStyleControl(VirtualPathUtility.ToAbsolute("~/usercontrols/common/viewswitcher/css/viewswitcher.css"));

            if (tabs != null && tabs.Count > 0)
            {
                try
                {
                    ViewSwitcherTabItem tab = null;
                    try
                    {
                        tab = (from t in tabs
                               where t.IsSelected
                               select t).First<ViewSwitcherTabItem>();
                    }
                    catch
                    {
                        if (tabs.Count > 0)
                        {
                            tab = tabs[0];
                            tab.IsSelected = true;
                        }
                    }

                    var firstBootScript = string.Format("viewSwitcherToggleTabs('{0}_ViewSwitcherTab');", tab.DivID);

                    p.RegisterInlineScript(firstBootScript);
                }
                catch
                {
                }
            }
        }
    }
}