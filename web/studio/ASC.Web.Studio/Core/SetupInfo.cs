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
using System.Configuration;
using System.Globalization;
using System.Linq;
using System.Web;
using ASC.Web.Core.Utility;
using ASC.Web.Studio.Utility;

namespace ASC.Web.Studio.Core
{
    public class SetupInfo
    {
        public static string SecureFilter
        {
            get { return GetAppSettings("web.secure-filter", string.Empty); }
        }

        public static string SslPort
        {
            get { return GetAppSettings("web.secure-filter.ssl-port", "443"); }
        }

        public static string HttpPort
        {
            get { return GetAppSettings("web.secure-filter.http-port", "80"); }
        }

        public static string StatisticTrackURL
        {
            get { return GetAppSettings("web.track-url", string.Empty); }
        }

        public static string UserVoiceURL
        {
            get { return GetAppSettings("web.uservoice", string.Empty); }
        }
        public static string MainLogoURL
        {
            get { return GetAppSettings("web.logo.main", string.Empty); }
        }
        public static string MainLogoMailURL
        {
            get { return GetAppSettings("web.logo.mail", string.Empty); }
        }
        public static string MainLogoMailTmplURL
        {
            get { return GetAppSettings("web.logo.mail.tmpl", string.Empty); }
        }
        public static string MainLogoLoadingURL
        {
            get { return GetAppSettings("web.logo.loading", string.Empty); }
        }
        public static bool PortalTestDataEnable
        {
            get { return String.Equals(GetAppSettings("web.portal.test-data", "true"), "true"); }
        }

        public static List<CultureInfo> EnabledCultures
        {
            get
            {
                return GetAppSettings("web.cultures", "en-US")
                    .Split(new char[] {','}, StringSplitOptions.RemoveEmptyEntries)
                    .Select(l => CultureInfo.GetCultureInfo(l.Trim()))
                    .OrderBy(l => l.Name)
                    .ToList();
            }
        }

        public static long MaxImageUploadSize
        {
            get { return 1024*1024; }
        }

        /// <summary>
        /// Max possible file size for not chunked upload. Less or equal than 100 mb.
        /// </summary>
        public static long MaxUploadSize
        {
            get { return Math.Min(AvailableFileSize, MaxChunkedUploadSize); }
        }

        public static long AvailableFileSize
        {
            get { return 100L*1024L*1024L; }
        }

        /// <summary>
        /// Max possible file size for chunked upload.
        /// </summary>
        public static long MaxChunkedUploadSize
        {
            get
            {
                var diskQuota = TenantExtra.GetTenantQuota();
                var usedSize = UserControls.Statistics.TenantStatisticsProvider.GetUsedSize();

                if (diskQuota != null)
                {
                    var freeSize = diskQuota.MaxTotalSize - usedSize;
                    if (freeSize < diskQuota.MaxFileSize)
                        return freeSize < 0 ? 0 : freeSize;

                    return diskQuota.MaxFileSize;
                }

                return 5*1024*1024;
            }
        }

        public static string TeamlabSiteRedirect
        {
            get { return GetAppSettings("web.teamlab-site", string.Empty); ; }
        }

        public static long ChunkUploadSize
        {
            get { return GetAppSettings("files.uploader.chunk-size", 5*1024*1024); }
        }

        public static bool ThirdPartyAuthEnabled
        {
            get { return String.Equals(GetAppSettings("web.thirdparty-auth", "true"), "true"); }
        }

        public static string NoTenantRedirectURL
        {
            get { return GetAppSettings("web.notenant-url", "http://www.teamlab.com/wrongportalname.aspx"); }
        }

        public static string TenantTransferingRedirectURL
        {
            get { return VirtualPathUtility.ToAbsolute(GetAppSettings("web.transfering-url", "~/migration-portal.htm")); }
        }

        public static string[] CustomScripts
        {
            get { return GetAppSettings("web.custom-scripts", string.Empty).Split(new char[] {','}, StringSplitOptions.RemoveEmptyEntries); }
        }

        public static string NotifyAddress
        {
            get { return GetAppSettings("web.promo-url", string.Empty); }
        }

        public static string ImportDomain
        {
            get { return GetAppSettings("web.import-contacts-domain", HttpContext.Current.Request.GetUrlRewriter().Host); }
        }

        public static string GetImportServiceUrl()
        {
            var url = GetAppSettings("web.import-contacts-url", string.Empty);
            if (string.IsNullOrEmpty(url))
            {
                return string.Empty;
            }
            var urlSeparatorChar = "?";
            if (url.Contains(urlSeparatorChar))
            {
                urlSeparatorChar = "&";
            }
            var cultureName = HttpUtility.HtmlEncode(System.Threading.Thread.CurrentThread.CurrentUICulture.Name);
            return UrlSwitcher.SelectCurrentUriScheme(string.Format("{0}{2}culture={1}&mobile={3}", url, cultureName, urlSeparatorChar, Web.Core.Mobile.MobileDetector.IsRequestMatchesMobile(HttpContext.Current)));
        }

        public static string BaseDomain
        {
            get { return GetAppSettings("core.base-domain", string.Empty); }
        }

        public static string WebApiBaseUrl
        {
            get { return VirtualPathUtility.ToAbsolute(GetAppSettings("api.url", "~/api/2.0/")); }
        }

        public static TimeSpan ValidEamilKeyInterval
        {
            get { return GetAppSettings("email.validinterval", TimeSpan.FromDays(7)); }
        }

        public static bool IsVisibleSettings<TSettings>()
        {
            return IsVisibleSettings(typeof (TSettings).Name);
        }

        public static bool IsVisibleSettings(string settings)
        {
            var s = GetAppSettings("web.hide-settings", null);
            if (string.IsNullOrEmpty(s)) return true;

            var hideSettings = s.Split(new[] {',', ';', ' '});
            return !hideSettings.Contains(settings, StringComparer.CurrentCultureIgnoreCase);
        }

        public static bool IsPersonal
        {
            get { return String.Equals(GetAppSettings("web.personal", "false"), "true"); }
        }

        private static string GetAppSettings(string key, string defaultValue)
        {
            return ConfigurationManager.AppSettings[key] ?? defaultValue;
        }

        private static T GetAppSettings<T>(string key, T defaultValue)
        {
            var configSetting = ConfigurationManager.AppSettings[key];
            if (!string.IsNullOrEmpty(configSetting))
            {
                var converter = TypeDescriptor.GetConverter(typeof (T));
                if (converter != null && converter.CanConvertFrom(typeof (string)))
                {
                    return (T) converter.ConvertFromString(configSetting);
                }
            }
            return defaultValue;
        }
    }
}