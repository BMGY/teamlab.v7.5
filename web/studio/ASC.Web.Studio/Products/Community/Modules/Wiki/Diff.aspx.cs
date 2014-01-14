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
using ASC.Web.Community.Wiki.Common;
using ASC.Web.UserControls.Wiki;
using System.Linq;
using System.Text;
using ASC.Web.UserControls.Wiki.Resources;

namespace ASC.Web.Community.Wiki
{
    public partial class Diff : WikiBasePage
    {
        protected int OldVer
        {
            get
            {
                int result;
                if (Request["ov"] == null || !int.TryParse(Request["ov"], out result))
                    return 0;

                return result;
            }
        }

        protected int NewVer
        {
            get
            {
                int result;
                if (Request["nv"] == null || !int.TryParse(Request["nv"], out result))
                    return 0;

                return result;
            }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            UpdateBreadCrumb();

            if (!IsPostBack)
            {
                FindDiff();
            }
        }

        private void FindDiff()
        {
            var pageName = PageNameUtil.Decode(WikiPage);

            //Page oldPage = PagesProvider.PagesHistGetByNameVersion(pageName, OldVer, TenantId);
            //Page newPage = PagesProvider.PagesHistGetByNameVersion(pageName, NewVer, TenantId);
            var oldPage = Wiki.GetPage(pageName, OldVer);
            var newPage = Wiki.GetPage(pageName, NewVer);

            var oldVersion = oldPage == null ? string.Empty : oldPage.Body;

            var newVersion = newPage == null ? string.Empty : newPage.Body;


            var f = DiffHelper.DiffText(oldVersion, newVersion, true, true, false);
            var aLines = oldVersion.Split('\n');
            var bLines = newVersion.Split('\n');

            var n = 0;
            var sb = new StringBuilder();
            foreach (var aItem in f)
            {
                // write unchanged lines
                while ((n < aItem.StartB) && (n < bLines.Length))
                {
                    WriteLine(n, null, bLines[n], sb);
                    n++;
                } // while

                // write deleted lines
                for (var m = 0; m < aItem.deletedA; m++)
                {
                    WriteLine(-1, "d", aLines[aItem.StartA + m], sb);
                } // for

                // write inserted lines
                while (n < aItem.StartB + aItem.insertedB)
                {
                    WriteLine(n, "i", bLines[n], sb);
                    n++;
                } // while
            } // while

            if (f.Length > 0 || (from bline in bLines where !bline.Trim().Equals(string.Empty) select bline).Count() > 0)
            {
                // write rest of unchanged lines
                while (n < bLines.Length)
                {
                    WriteLine(n, null, bLines[n], sb);
                    n++;
                } // while
            }
            litDiff.Text = sb.ToString();
        }

        private void UpdateBreadCrumb()
        {
            if (OldVer == 0 || NewVer == 0 || OldVer == NewVer)
            {
                Response.RedirectLC(ActionHelper.GetViewPagePath(this.ResolveUrlLC("PageHistoryList.aspx"), PageNameUtil.Decode(WikiPage)), this);
            }

            WikiMaster.CurrentPageCaption = string.Format(WikiResource.wikiDiffDescriptionFormat, OldVer, NewVer);
        }

        private void WriteLine(int nr, string typ, string aText, StringBuilder sb)
        {
            sb.Append(nr >= 0 ? "<li>" : "<br/>");

            sb.Append("<span style='width:100%'");
            if (typ != null)
            {
                sb.Append(" class=\"" + typ + "\"");
            }
            sb.AppendFormat(@">{0}</span>", Server.HtmlEncode(aText).Replace("\r", "").Replace(" ", "&nbsp;"));
        }
    }
}