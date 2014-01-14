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
using System.Linq;
using ASC.Common.Data;
using ASC.Common.Data.Sql;
using ASC.Common.Data.Sql.Expressions;
using ASC.Core;
using ASC.Core.Billing;
using ASC.Core.Notify;
using ASC.Core.Tenants;
using ASC.Core.Users;
using ASC.Notify;
using ASC.Notify.Model;
using ASC.Notify.Patterns;
using ASC.Notify.Recipients;
using ASC.Web.Community.Birthdays.Resources;
using ASC.Web.Studio.Core.Notify;
using ASC.Web.Studio.Utility;
using log4net;

namespace ASC.Web.Community.Birthdays
{
    class BirthdaysNotifyClient
    {
        private readonly INotifyClient client;

        public static INotifyAction Event_BirthdayReminder = new NotifyAction("BirthdayReminder");

        public static BirthdaysNotifyClient Instance
        {
            get;
            private set;
        }

        public static INotifySource NotifySource
        {
            get;
            private set;
        }

        static BirthdaysNotifyClient()
        {
            NotifySource = new BirthdaysNotifySource();
            Instance = new BirthdaysNotifyClient(WorkContext.NotifyContext.NotifyService.RegisterClient(NotifySource));
        }

        private BirthdaysNotifyClient(INotifyClient client)
        {
            this.client = client;
        }

        public void RegisterSendMethod()
        {
            client.RegisterSendMethod(SendBirthdayReminders, "0 0 12 ? * *");
        }

        public void SetSubscription(Guid subscriber, Guid to, bool subscribe)
        {
            var subscriptions = NotifySource.GetSubscriptionProvider();
            var recipient = ToRecipient(subscriber);
            if (subscribe)
            {
                subscriptions.Subscribe(Event_BirthdayReminder, to.ToString(), recipient);
            }
            else
            {
                subscriptions.UnSubscribe(Event_BirthdayReminder, to.ToString(), recipient);
            }
        }

        public bool IsSubscribe(Guid subscriber, Guid to)
        {
            return NotifySource.GetSubscriptionProvider()
                .IsSubscribed(Event_BirthdayReminder, ToRecipient(subscriber), to.ToString());
        }

        public void SendBirthdayReminders(DateTime scheduleDate)
        {
            try
            {
                scheduleDate = scheduleDate.AddDays(1);
                var tenants = CoreContext.TenantManager.GetTenants();
                try
                {
                    using (var db = new DbManager("core"))
                    {
                        var q = new SqlQuery("core_user")
                            .Select("tenant")
                            .Where(!Exp.Eq("bithdate", null))
                            .Where("date_format(bithdate, '%m%d')", scheduleDate.ToString("MMdd"))
                            .Where("removed", 0)
                            .Where("status", EmployeeStatus.Active)
                            .GroupBy(1);
                        tenants = db.ExecuteList(q)
                            .ConvertAll(r => Convert.ToInt32(r[0]))
                            .Select(id => CoreContext.TenantManager.GetTenant(id))
                            .ToList();
                    }
                }
                catch
                {
                    if (100 < tenants.Count)
                    {
                        throw;
                    }
                }

                foreach (var tenant in tenants)
                {
                    if (tenant == null ||
                        tenant.Status != TenantStatus.Active ||
                        TariffState.NotPaid <= CoreContext.PaymentManager.GetTariff(tenant.TenantId).State)
                    {
                        continue;
                    }

                    CoreContext.TenantManager.SetCurrentTenant(tenant);
                    var users = CoreContext.UserManager.GetUsers(EmployeeStatus.Active, EmployeeType.User);
                    var birthdays = users.Where(u => u.BirthDate.HasValue && u.BirthDate.Value.Month == scheduleDate.Month && u.BirthDate.Value.Day == scheduleDate.Day);
                    var subscriptionProvider = NotifySource.GetSubscriptionProvider();

                    foreach (var user in users)
                    {
                        var allSubscription = subscriptionProvider.IsSubscribed(Event_BirthdayReminder, user, null);
                        foreach (var birthday in birthdays)
                        {
                            if (user.Equals(birthday)) continue;

                            if ((allSubscription && !subscriptionProvider.IsUnsubscribe(user, Event_BirthdayReminder, birthday.ID.ToString())) ||
                                (!allSubscription && subscriptionProvider.IsSubscribed(Event_BirthdayReminder, user, birthday.ID.ToString())))
                            {
                                client.SendNoticeToAsync(
                                    Event_BirthdayReminder,
                                    birthday.ID.ToString(),
                                    new[] { user },
                                    true,
                                    new TagValue("BirthdayUserName", birthday.DisplayUserName(false)),
                                    new TagValue("BirthdayUserUrl", CommonLinkUtility.GetUserProfile(birthday.ID)),
                                    new TagValue("BirthdayDate", birthday.BirthDate.Value.ToShortDayMonth()),
                                    new TagValue(CommonTags.Priority, 1));
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                LogManager.GetLogger(typeof(BirthdaysNotifyClient)).Error(ex);
            }
        }

        private IRecipient ToRecipient(Guid userID)
        {
            return NotifySource.GetRecipientsProvider().GetRecipient(userID.ToString());
        }


        private class BirthdaysNotifySource : NotifySource
        {
            public BirthdaysNotifySource()
                : base(BirthdaysModule.ModuleId)
            {
            }

            protected override IActionProvider CreateActionProvider()
            {
                return new ConstActionProvider(Event_BirthdayReminder);
            }

            protected override IPatternProvider CreatePatternsProvider()
            {
                return new XmlPatternProvider2(BirthdayPatternResource.patterns);
            }
        }
    }
}
