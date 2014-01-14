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
using System.Globalization;
using System.Web;
using ASC.Core;
using ASC.Web.Core.Client.HttpHandlers;
using ASC.Web.Core.Utility.Settings;
using ASC.Web.Core.Utility.Skins;
using ASC.Web.Studio.Core;
using ASC.Web.Studio.Utility;

namespace ASC.Web.Studio.Masters.MasterResources
{
    public class MasterSettingsResources : ClientScript
    {
        protected override string BaseNamespace
        {
            get { return "ASC.Resources.Master"; }
        }

        protected override IEnumerable<KeyValuePair<string, object>> GetClientVariables(HttpContext context)
        {
            yield return RegisterObject("ApiPath", SetupInfo.WebApiBaseUrl);

            yield return RegisterObject("MaxImageFCKWidth", System.Configuration.ConfigurationManager.AppSettings["MaxImageFCKWidth"] ?? "620");

            yield return RegisterObject("IsAuthenticated", SecurityContext.IsAuthenticated);
            yield return RegisterObject("IsAdmin", CoreContext.UserManager.IsUserInGroup(SecurityContext.CurrentAccount.ID, ASC.Core.Users.Constants.GroupAdmin.ID));
            yield return RegisterObject("CurrentTenantVersion", CoreContext.TenantManager.GetCurrentTenant().Version);
            yield return RegisterObject("CurrentTenantUtcOffset", CoreContext.TenantManager.GetCurrentTenant().TimeZone);
            yield return RegisterObject("CurrentTenantUtcHoursOffset", CoreContext.TenantManager.GetCurrentTenant().TimeZone.GetUtcOffset(DateTime.UtcNow).Hours);
            yield return RegisterObject("CurrentTenantUtcMinutesOffset", CoreContext.TenantManager.GetCurrentTenant().TimeZone.GetUtcOffset(DateTime.UtcNow).Minutes);

            yield return RegisterObject("SetupInfoNotifyAddress", SetupInfo.NotifyAddress);

            var curQuota = TenantExtra.GetTenantQuota();

            yield return RegisterObject("TenantQuotaIsTrial", curQuota.Trial ? "No" : "Yes");
            yield return RegisterObject("TenantTariff", curQuota.Id);
            yield return RegisterObject("TenantTariffDocsEdition", curQuota.DocsEdition);

            if (CoreContext.Configuration.YourDocsDemo)
                yield return RegisterObject("YourDocsDemo", CoreContext.Configuration.YourDocsDemo);

            yield return RegisterObject("ShowPromotions", SettingsManager.Instance.LoadSettings<StudioNotifyBarSettings>(TenantProvider.CurrentTenantID).ShowPromotions);

            yield return RegisterObject("EmailRegExpr", @"^(([^<>()[\]\\.,;:\s@\""]+(\.[^<>()[\]\\.,;:\s@\""]+)*)|(\"".+\""))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$");

            yield return RegisterObject("UserPhotoHandlerUrl", VirtualPathUtility.ToAbsolute("~/UserPhoto.ashx"));
            yield return RegisterObject("ImageWebPath", WebImageSupplier.GetImageFolderAbsoluteWebPath());

            yield return RegisterObject("GroupSelector_MobileVersionGroup", new { Id = -1, Name = Resources.UserControlsCommonResource.LblSelect.HtmlEncode().ReplaceSingleQuote() });
            yield return RegisterObject("GroupSelector_WithGroupEveryone", new { Id = ASC.Core.Users.Constants.GroupEveryone.ID, Name = Resources.UserControlsCommonResource.Everyone.HtmlEncode().ReplaceSingleQuote() });
            yield return RegisterObject("GroupSelector_WithGroupAdmin", new { Id = ASC.Core.Users.Constants.GroupAdmin.ID, Name = Resources.UserControlsCommonResource.Admin.HtmlEncode().ReplaceSingleQuote() });
            yield return RegisterObject("FilterHelpCenterLink", "http://helpcenter.teamlab.com/tipstricks/using-search.aspx");
        }

        protected override string GetCacheHash()
        {
            /* return user last mod time + culture */
            var hash = SecurityContext.CurrentAccount.ID.ToString()
                       + CoreContext.UserManager.GetUsers(SecurityContext.CurrentAccount.ID).LastModified.ToString(CultureInfo.InvariantCulture)
                       + CoreContext.TenantManager.GetCurrentTenant().LastModified.ToString(CultureInfo.InvariantCulture);
            if (CoreContext.Configuration.Standalone)
            {
                // flush javascript for due tariff
                hash += DateTime.UtcNow.Date.ToString(CultureInfo.InvariantCulture);
            }
            return hash;
        }
    }
}