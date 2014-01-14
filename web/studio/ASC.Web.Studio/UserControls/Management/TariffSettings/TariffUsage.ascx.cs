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
using System.Web;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Runtime.Serialization;
using System.Threading;
using System.Web.Configuration;
using System.Web.UI;
using ASC.Core;
using ASC.Web.Core.Utility.Settings;
using ASC.Web.Core.Utility.Skins;
using ASC.Web.Studio.Core;
using ASC.Web.Studio.Core.SMS;
using ASC.Web.Studio.UserControls.Statistics;
using ASC.Core.Billing;
using ASC.Core.Tenants;
using ASC.Web.Studio.Utility;
using AjaxPro;
using Resources;
using System.Text;
using log4net;

namespace ASC.Web.Studio.UserControls.Management
{
    [AjaxNamespace("TariffUsageController")]
    public partial class TariffUsage : UserControl
    {
        [Serializable]
        [DataContract]
        internal class TariffSettings : ISettings
        {
            [DataMember(Name = "HideRecommendation")]
            public bool HideBuyRecommendation { get; set; }

            public ISettings GetDefault()
            {
                return new TariffSettings { HideBuyRecommendation = false };
            }

            public Guid ID
            {
                get { return new Guid("{07956D46-86F7-433b-A657-226768EF9B0D}"); }
            }

            public static bool GetTariffSettings()
            {
                return SettingsManager.Instance.LoadSettingsFor<TariffSettings>(SecurityContext.CurrentAccount.ID).HideBuyRecommendation;
            }

            public static void SaveHideBuyRecommendation(bool hide)
            {
                var tariffSettings = new TariffSettings { HideBuyRecommendation = hide };
                SettingsManager.Instance.SaveSettingsFor(tariffSettings, SecurityContext.CurrentAccount.ID);
            }
        }

        public static string Location
        {
            get { return "~/UserControls/Management/TariffSettings/TariffUsage.ascx"; }
        }

        protected Partner Partner;
        protected string SalesMail = "sales@teamlab.com";

        protected bool HideBuyRecommendation;
        protected Dictionary<string, bool> ListStarRemark = new Dictionary<string, bool>();

        protected int UsersCount;
        protected long UsedSize;
        protected bool SmsEnable;

        protected Tariff CurrentTariff;
        protected TenantQuota CurrentQuota;
        protected RegionInfo Region = new RegionInfo("US");

        protected string CurrencySymbol
        {
            get { return Region.CurrencySymbol; }
        }

        private IEnumerable<TenantQuota> _quotaList;
        protected List<TenantQuota> QuotasYear;

        private TenantQuota _quotaForDisplay;

        protected TenantQuota QuotaForDisplay
        {
            get
            {
                if (_quotaForDisplay != null) return _quotaForDisplay;
                TenantQuota quota = null;
                if (CurrentQuota.Trial
                    || CoreContext.Configuration.Standalone && CurrentTariff.QuotaId.Equals(Tenant.DEFAULT_TENANT))
                {
                    quota = _quotaList.FirstOrDefault(q => q.Id == TenantExtra.GetRightQuotaId());
                }
                _quotaForDisplay = quota ?? CurrentQuota;
                return _quotaForDisplay;
            }
        }

        protected void Page_Load(object sender, EventArgs e)
        {
            UsersCount = TenantStatisticsProvider.GetUsersCount();
            UsedSize = TenantStatisticsProvider.GetUsedSize();
            CurrentTariff = TenantExtra.GetCurrentTariff();
            CurrentQuota = TenantExtra.GetTenantQuota();

            var partnerId = CoreContext.TenantManager.GetCurrentTenant().PartnerId;
            if (!string.IsNullOrEmpty(partnerId))
            {
                var partner = CoreContext.PaymentManager.GetPartner(partnerId);

                if (partner != null && partner.Status == PartnerStatus.Approved && !partner.Removed && partner.PartnerType != PartnerType.System)
                {
                    Partner = partner;

                    _quotaList = CoreContext.PaymentManager.GetPartnerTariffs(Partner.Id);
                    SalesMail = Partner.SalesEmail;
                    if (!string.IsNullOrEmpty(Partner.Currency))
                    {
                        Region = new RegionInfo(Partner.Currency);
                    }

                    var control = (TariffPartner)LoadControl(TariffPartner.Location);
                    control.CurPartner = Partner;
                    control.TariffNotPaid = CurrentTariff.State >= TariffState.NotPaid;
                    control.TariffProlongable = CurrentTariff.Prolongable;
                    PaymentsCodeHolder.Controls.Add(control);
                }
            }

            if (_quotaList == null || !_quotaList.Any())
            {
                _quotaList = TenantExtra.GetTenantQuotas();
            }
            else if (!CurrentQuota.Trial)
            {
                CurrentQuota = _quotaList.First(q => q.Id == CurrentQuota.Id) ?? CurrentQuota;
            }
            _quotaList = _quotaList.OrderBy(r => r.ActiveUsers).ToList().Where(r => !r.Trial);
            QuotasYear = _quotaList.Where(r => r.Year).ToList();

            HideBuyRecommendation = CurrentTariff.Autorenewal || TariffSettings.GetTariffSettings() || Partner != null;

            downgradeInfoContainer.Options.IsPopup = true;
            buyRecommendationContainer.Options.IsPopup = true;
            AjaxPro.Utility.RegisterTypeForAjax(GetType());

            if (StudioSmsNotificationSettings.IsVisibleSettings
                && SettingsManager.Instance.LoadSettings<StudioSmsNotificationSettings>(TenantProvider.CurrentTenantID).EnableSetting
                && Partner == null)
            {
                SmsEnable = true;
                SmsBuyHolder.Controls.Add(LoadControl(SmsBuy.Location));
            }

            if (Partner == null)
            {
                RegisterScript();
            }
        }

        protected string TariffDescription()
        {
            if (CoreContext.Configuration.Standalone && CurrentTariff.QuotaId.Equals(Tenant.DEFAULT_TENANT))
            {
                return "<b>"
                       + UserControlsCommonResource.TariffLicenseOver
                       + "</b><br/>"
                       + UserControlsCommonResource.TariffLicenseOverReason;
            }

            if (CurrentQuota.Trial)
            {
                if (CurrentTariff.State == TariffState.Trial)
                {
                    return "<b>" + Resource.TariffTrial + "</b> "
                           + (CurrentTariff.DueDate.Date != DateTime.MaxValue.Date
                                  ? string.Format(Resource.TariffExpiredDate, CurrentTariff.DueDate.ToLongDateString())
                                  : "")
                           + "<br />" + Resource.TariffChooseLabel;
                }
                return String.Format(Resource.TariffTrialOverdue,
                                     "<span>",
                                     "</span>",
                                     "<br />", string.Empty, string.Empty);
            }

            if (CurrentTariff.State == TariffState.Paid)
            {
                var str = "<b>"
                          + String.Format(UserControlsCommonResource.TariffPaid,
                                          (int)CurrentQuota.Price + CurrencySymbol,
                                          CurrentQuota.Year ? UserControlsCommonResource.TariffPerYear : UserControlsCommonResource.TariffPerMonth,
                                          SetStar(Resource.TariffRemarkPrice))
                          + "</b> ";
                if (CurrentTariff.DueDate.Date != DateTime.MaxValue.Date)
                    str += string.Format(Resource.TariffExpiredDate, CurrentTariff.DueDate.ToLongDateString());

                if (CurrentTariff.Autorenewal) return str;
                str += "<br />" + Resource.TariffCanProlong;
                return str;
            }

            return String.Format(UserControlsCommonResource.TariffOverdue,
                                 (int)CurrentQuota.Price + CurrencySymbol,
                                 CurrentQuota.Year ? UserControlsCommonResource.TariffPerYear : UserControlsCommonResource.TariffPerMonth,
                                 SetStar(Resource.TariffRemarkPrice),
                                 "<span>",
                                 "</span>",
                                 "<br />");
        }

        protected TenantQuota GetQuotaMonth(TenantQuota quota)
        {
            return _quotaList.FirstOrDefault(r =>
                                             r.ActiveUsers == quota.ActiveUsers
                                             && !r.Year);
        }

        protected string GetTypeLink(TenantQuota quota)
        {
            return quota.ActiveUsers >= UsersCount
                   && quota.MaxTotalSize >= UsedSize
                       ? (CurrentQuota.Trial || Equals(quota.Id, CurrentQuota.Id))
                             ? "pay"
                             : "change"
                       : "limit";
        }

        protected string GetShoppingUri(TenantQuota quota)
        {
            var uri = string.Empty;
            if (quota != null
                && quota.ActiveUsers >= TenantStatisticsProvider.GetUsersCount()
                && quota.MaxTotalSize >= TenantStatisticsProvider.GetUsedSize())
            {
                if (Partner == null)
                {
                    var link = CoreContext.PaymentManager.GetShoppingUri(TenantProvider.CurrentTenantID, quota.Id);
                    if (link == null)
                    {
                        LogManager.GetLogger("ASC.Web.Billing").Error(string.Format("GetShoppingUri return null for tenant {0} and quota {1}", TenantProvider.CurrentTenantID, quota == null ? 0 : quota.Id));
                    }
                    else
                    {
                        uri = link.ToString();
                    }
                }
                else if (Partner.PaymentMethod == PartnerPaymentMethod.External)
                {
                    uri = (Partner.PaymentUrl ?? "")
                                       .ToLower()
                                       .Replace("{partnerid}", Partner.Id)
                                       .Replace("{tariffid}", quota.ActiveUsers + (quota.Year ? "year" : "month"))
                                       .Replace("{portal}", CoreContext.TenantManager.GetCurrentTenant().TenantAlias)
                                       .Replace("{currency}", Region.ISOCurrencySymbol)
                                       .Replace("{price}", ((int)quota.Price).ToString());
                }
            }
            return uri;
        }

        protected string WithFullRemarks()
        {
            if (CurrentTariff.Autorenewal)
                return SetStar(Resource.TariffRemarkProlongEnable);
            if (!CurrentQuota.Visible)
                return SetStar(Resource.TariffPeriodExpired);
            if (CurrentTariff.Prolongable)
                return SetStar(Resource.TariffRemarkProlongDisable);
            return "";
        }

        protected string SetStar(string starType)
        {
            return SetStar(starType, false);
        }

        protected string SetStar(string starType, bool withHighlight)
        {
            if (Partner != null) return string.Empty;
            if (!ListStarRemark.Keys.Contains(starType))
            {
                ListStarRemark.Add(starType, withHighlight);
            }

            return GetStar(starType);
        }

        protected string GetStar(string starType)
        {
            if (!ListStarRemark.Keys.Contains(starType))
            {
                return null;
            }

            var result = string.Empty;
            for (var i = 0; i < ListStarRemark.Keys.ToList().IndexOf(starType) + 1; i++)
            {
                result += "*";
            }

            return result;
        }

        protected string GetRemarks()
        {
            var result = string.Empty;

            foreach (var starType in ListStarRemark)
            {
                if (!string.IsNullOrEmpty(result))
                    result += "<br />";

                if (starType.Value)
                    result += "<span class=\"tariff-remark-highlight\">";
                result += GetStar(starType.Key) + " ";
                result += starType.Key;
                if (starType.Value)
                    result += "</span>";
            }

            return result;
        }

        protected string GetSupportDescr()
        {
            var userVoiceLink = " href=\"http://feedback.teamlab.com\" target=\"_blank\" ";
            if (MakeUserVoice)
            {
                userVoiceLink = " href=\"javascript:UserVoice.showPopupWidget();\" ";
            }

            return string.Format(Resource.TariffAnyQuestionsAnswer,
                                 "<a class=\"link underline gray\" href=\"" + CommonLinkUtility.GetHelpLink(true) + "faq/pricing.aspx\">",
                                 "</a>",
                                 "<a class=\"link underline gray\" " + userVoiceLink + " >",
                                 "</a>");
        }

        protected bool MakeUserVoice
        {
            get { return !string.IsNullOrEmpty(SetupInfo.UserVoiceURL); }
        }

        protected bool MonthIsDisable()
        {
            return CurrentQuota.Year && CurrentTariff.State == TariffState.Paid;
        }

        protected string GetChatBannerPath()
        {
            var lng = Thread.CurrentThread.CurrentCulture.TwoLetterISOLanguageName.ToLower();
            var cult = string.Empty;
            var cultArray = new[] { "de", "es", "fr", "it", "lv", "ru" };
            if (cultArray.Contains(lng))
            {
                cult = "_" + lng;
            }
            var imgName = "support/live_support_banner" + cult + ".png";

            return WebImageSupplier.GetAbsoluteWebPath(imgName);
        }

        protected DateTime GetSaleDate()
        {
            DateTime date;
            if (!DateTime.TryParse(WebConfigurationManager.AppSettings["web.payment-sale"], out date))
            {
                date = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1).AddMonths(1);
            }
            return date;
        }

        [AjaxMethod]
        public void SaveHideRecommendation(bool hide)
        {
            TariffSettings.SaveHideBuyRecommendation(hide);
        }

        [AjaxMethod]
        public void GetTrial()
        {
            if (CoreContext.Configuration.Standalone && string.IsNullOrEmpty(StudioKeySettings.GetSKey()))
                TenantExtra.TrialRequest();
        }

        private void RegisterScript()
        {
            var sb = new StringBuilder();

            sb.Append(@"
                var __lc = {};
                __lc.license = 2673891;

                (function () {
                    var lc = document.createElement('script'); lc.type = 'text/javascript'; lc.async = true;
                    lc.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'cdn.livechatinc.com/tracking.js';
                    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(lc, s);

                    (function loopForCorrectLoading(i) {
                        setTimeout(function () {
                            if (--i && typeof(window.LC_API) === 'undefined') {
                                loopForCorrectLoading(i);
                            }
                            if (typeof(window.LC_API) === 'object') {
                                window.LC_API.on_after_load = function () {
                                    if (window.LC_API.agents_are_available()) {
                                        jq('.livechat.online').show();
                                    }
                                };
                            }
                        }, 100);
                    })(500);
                })();"
            );

            Page.RegisterInlineScript(sb.ToString(), onReady: false);
        }
    }
}