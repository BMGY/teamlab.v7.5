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
using System.Linq;
using System.Reflection;
using System.Web;
using System.Xml;
using ASC.Web.Core;
using ASC.Web.Core.Utility;
using ASC.Web.Core.WebZones;
using ASC.Web.Files.Classes;
using ASC.Web.Files.Resources;
using ASC.Web.Studio.Utility;

namespace ASC.Web.Files.Configuration
{
    [WebZoneAttribute(WebZoneType.CustomProductList | WebZoneType.StartProductList | WebZoneType.TopNavigationProductList)]
    public class ProductEntryPoint : Product
    {
        #region Members

        public static readonly Guid ID = WebItemManager.DocumentsProductID;

        private ProductContext _productContext;

        #endregion

        public override void Init()
        {
            _productContext =
                new ProductContext
                    {
                        MasterPageFile = CommonLinkUtility.FilesBaseVirtualPath + "masters/basictemplate.master",
                        DisabledIconFileName = "product_disabled_logo.png",
                        IconFileName = "product_logo.png",
                        LargeIconFileName = "product_logolarge.png",
                        DefaultSortOrder = 10,
                        SubscriptionManager = new SubscriptionManager(),
                        SpaceUsageStatManager = new FilesSpaceUsageStatManager(),
                        AdminOpportunities = () => FilesCommonResource.ProductAdminOpportunities.Split('|').ToList(),
                        UserOpportunities = () => FilesCommonResource.ProductUserOpportunities.Split('|').ToList(),
                        CanNotBeDisabled = true,
                    };
            SearchHandlerManager.Registry(new SearchHandler());
        }

        public String GetModuleResource(String ResourceClassTypeName, String ResourseKey)
        {
            if (string.IsNullOrEmpty(ResourseKey)) return string.Empty;
            try
            {
                return (String) Type.GetType(ResourceClassTypeName).GetProperty(ResourseKey, BindingFlags.Static | BindingFlags.Public).GetValue(null, null);
            }
            catch (Exception)
            {
                return String.Empty;
            }
        }

        private static Dictionary<String, XmlDocument> _xslTemplates;

        public void ProcessRequest(HttpContext context)
        {
            if (_xslTemplates == null)
                _xslTemplates = new Dictionary<String, XmlDocument>();

            if (String.IsNullOrEmpty(context.Request["id"]) || String.IsNullOrEmpty(context.Request["name"]))
                return;

            var TemplateName = context.Request["name"];
            var TemplatePath = context.Request["id"];
            var Template = new XmlDocument();
            try
            {
                Template.Load(context.Server.MapPath(String.Format("~{0}{1}.xsl", TemplatePath, TemplateName)));
            }
            catch (Exception)
            {
                return;
            }
            if (Template.GetElementsByTagName("xsl:stylesheet").Count == 0)
                return;

            var Aliases = new Dictionary<String, String>();

            var RegisterAliases = Template.GetElementsByTagName("register");
            while ((RegisterAliases = Template.GetElementsByTagName("register")).Count > 0)
            {
                var RegisterAlias = RegisterAliases.Item(0);
                if (!String.IsNullOrEmpty(RegisterAlias.Attributes["alias"].Value) &&
                    !String.IsNullOrEmpty(RegisterAlias.Attributes["type"].Value))
                    Aliases.Add(RegisterAlias.Attributes["alias"].Value, RegisterAlias.Attributes["type"].Value);
                RegisterAlias.ParentNode.RemoveChild(RegisterAlias);
            }

            var CurrentResources = Template.GetElementsByTagName("resource");

            while ((CurrentResources = Template.GetElementsByTagName("resource")).Count > 0)
            {
                var CurrentResource = CurrentResources.Item(0);
                if (!String.IsNullOrEmpty(CurrentResource.Attributes["name"].Value))
                {
                    var FullName = CurrentResource.Attributes["name"].Value.Split('.');
                    if (FullName.Length == 2 && Aliases.ContainsKey(FullName[0]))
                    {
                        var ResourceValue =
                            Template.CreateTextNode(GetModuleResource(Aliases[FullName[0]], FullName[1]));
                        CurrentResource.ParentNode.InsertBefore(ResourceValue, CurrentResource);
                    }
                }
                CurrentResource.ParentNode.RemoveChild(CurrentResource);
            }

            context.Response.ContentType = "text/xml";
            context.Response.Write(Template.InnerXml);
        }


        public override Guid ProductID
        {
            get { return ID; }
        }

        public override string Name
        {
            get { return FilesCommonResource.ProductName; }
        }


        public override string ExtendedDescription
        {
            get { return FilesCommonResource.ProductDescriptionEx; }
        }

        public override string Description
        {
            get { return FilesCommonResource.ProductDescription; }
        }

        public override string StartURL
        {
            get { return PathProvider.StartURL; }
        }
        public override string ProductClassName
        {
            get { return "documents"; }
        }
        public override ProductContext Context
        {
            get { return _productContext; }
        }
    }
}