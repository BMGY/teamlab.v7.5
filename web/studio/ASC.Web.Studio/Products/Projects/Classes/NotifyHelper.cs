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
using System.Threading;
using System.Web;
using System.Web.Configuration;
using ASC.Core;
using ASC.Core.Billing;
using ASC.Core.Tenants;
using ASC.Core.Users;
using ASC.Notify.Cron;
using ASC.Notify.Messages;
using ASC.Notify.Patterns;
using ASC.Projects.Core.Domain.Reports;
using ASC.Projects.Core.Services.NotifyService;
using ASC.Projects.Data;
using ASC.Web.Studio.Core.Notify;
using log4net;

namespace ASC.Web.Projects.Classes
{
    public class NotifyHelper
    {
        public static void SendAutoReminderAboutTask(DateTime state)
        {
            try
            {
                var now = DateTime.UtcNow;
                foreach (var r in new DaoFactory(Global.DbID, Tenant.DEFAULT_TENANT).GetTaskDao().GetTasksForReminder(now))
                {
                    var tenant = CoreContext.TenantManager.GetTenant((int)r[0]);
                    if (tenant == null ||
                        tenant.Status != TenantStatus.Active ||
                        TariffState.NotPaid <= CoreContext.PaymentManager.GetTariff(tenant.TenantId).State)
                    {
                        continue;
                    }

                    var localTime = TenantUtil.DateTimeFromUtc(tenant, now);
                    if (!TimeToSendReminderAboutTask(localTime)) continue;

                    var deadline = (DateTime)r[2];
                    if (deadline.Date != localTime.Date) continue;

                    try
                    {
                        CoreContext.TenantManager.SetCurrentTenant(tenant);
                        SecurityContext.AuthenticateMe(ASC.Core.Configuration.Constants.CoreSystem);
                        var t = Global.EngineFactory.GetTaskEngine().GetByID((int)r[1]);
                        if (t == null) continue;

                        foreach (var responsible in t.Responsibles)
                        {
                            var user = CoreContext.UserManager.GetUsers(t.CreateBy);
                            if (!Constants.LostUser.Equals(user) && user.Status == EmployeeStatus.Active)
                            {
                                SecurityContext.AuthenticateMe(user.ID);

                                Thread.CurrentThread.CurrentCulture = user.GetCulture();
                                Thread.CurrentThread.CurrentUICulture = user.GetCulture();

                                NotifyClient.Instance.SendReminderAboutTaskDeadline(new List<Guid> { responsible }, t);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        LogManager.GetLogger("ASC.Projects.Tasks").Error("SendAutoReminderAboutTask", ex);
                    }
                }
            }
            catch (Exception ex)
            {
                LogManager.GetLogger("ASC.Projects.Tasks").Error("SendAutoReminderAboutTask", ex);
            }
        }

        private static bool TimeToSendReminderAboutTask(DateTime currentTime)
        {
            var hourToSend = 7;
            if (!string.IsNullOrEmpty(WebConfigurationManager.AppSettings["remindertime"]))
            {
                int hour;
                if (int.TryParse(WebConfigurationManager.AppSettings["remindertime"], out hour))
                {
                    hourToSend = hour;
                }
            }
            return currentTime.Hour == hourToSend;
        }

        public static void SendAutoReports(DateTime datetime)
        {
            try
            {
                var now = DateTime.UtcNow.Date.AddHours(DateTime.UtcNow.Hour);
                foreach (var t in new DaoFactory(Global.DbID, -1).GetReportDao().GetAutoTemplates())
                {
                    try
                    {
                        var tenant = CoreContext.TenantManager.GetTenant(t.Tenant);
                        if (tenant != null && tenant.Status == TenantStatus.Active && CoreContext.PaymentManager.GetTariff(tenant.TenantId).State < TariffState.NotPaid)
                        {
                            CoreContext.TenantManager.SetCurrentTenant(tenant);
                            var cron = new CronExpression(t.Cron) { TimeZone = CoreContext.TenantManager.GetCurrentTenant().TimeZone };
                            var date = cron.GetTimeAfter(now.AddTicks(-1));

                            LogManager.GetLogger("ASC.Web.Projects.Reports").DebugFormat("Find auto report: {0} - {1}, now: {2}, date: {3}", t.Name, t.Cron, now, date);
                            if (date == now)
                            {
                                var user = CoreContext.UserManager.GetUsers(t.CreateBy);
                                if (user.ID != Constants.LostUser.ID && user.Status == EmployeeStatus.Active)
                                {
                                    SecurityContext.AuthenticateMe(user.ID);

                                    Thread.CurrentThread.CurrentCulture = user.GetCulture();
                                    Thread.CurrentThread.CurrentUICulture = user.GetCulture();

                                    var result = ReportHelper.BuildReport(t.ReportType, t.Filter, ReportViewType.EMail, t.Id);
                                    var message = new NoticeMessage(user, HttpUtility.HtmlDecode(t.Name), result, "html");
                                    message.AddArgument(new TagValue(CommonTags.SendFrom, CoreContext.TenantManager.GetCurrentTenant().Name));
                                    message.AddArgument(new TagValue(CommonTags.Priority, 1));
                                    LogManager.GetLogger("ASC.Web.Projects.Reports").DebugFormat("Send auto report: {0} to {1}, tenant: {2}", t.Name, user, CoreContext.TenantManager.GetCurrentTenant());
                                    WorkContext.NotifyContext.DispatchEngine.Dispatch(message, "email.sender");
                                }
                            }
                        }
                    }
                    catch (System.Security.SecurityException se)
                    {
                        LogManager.GetLogger("ASC.Web.Projects.Reports").Info("SendAutoReports", se);
                    }
                    catch (Exception ex)
                    {
                        LogManager.GetLogger("ASC.Web.Projects.Reports").ErrorFormat("TemplateId: {0}, Temaplate: {1}\r\n{2}", t.Id, t.Filter.ToXml(), ex);
                    }
                }
            }
            catch (Exception ex)
            {
                LogManager.GetLogger("ASC.Web.Projects.Reports").Error("SendAutoReports", ex);
            }
        }

                
        public static void SendMsgMilestoneDeadline(DateTime scheduleDate)
        {
            var date = DateTime.UtcNow.AddDays(2);
            foreach (var r in new DaoFactory(Global.DbID, Tenant.DEFAULT_TENANT).GetMilestoneDao().GetInfoForReminder(date))
            {
                var tenant = CoreContext.TenantManager.GetTenant((int)r[0]);
                if (tenant == null ||
                    tenant.Status != TenantStatus.Active ||
                    TariffState.NotPaid <= CoreContext.PaymentManager.GetTariff(tenant.TenantId).State)
                {
                    continue;
                }

                var localTime = TenantUtil.DateTimeFromUtc(tenant, date);
                if (localTime.Date == ((DateTime)r[2]).Date)
                {
                    try
                    {
                        CoreContext.TenantManager.SetCurrentTenant(tenant);
                        SecurityContext.AuthenticateMe(ASC.Core.Configuration.Constants.CoreSystem);
                        var m = new DaoFactory(Global.DbID, tenant.TenantId).GetMilestoneDao().GetById((int)r[1]);
                        if (m != null)
                        {
                            var sender = !m.Responsible.Equals(Guid.Empty) ? m.Responsible : m.Project.Responsible;
                            var user = CoreContext.UserManager.GetUsers(sender);
                            if (!Constants.LostUser.Equals(user) && user.Status == EmployeeStatus.Active)
                            {
                                SecurityContext.AuthenticateMe(user.ID);

                                Thread.CurrentThread.CurrentCulture = user.GetCulture();
                                Thread.CurrentThread.CurrentUICulture = user.GetCulture();

                                NotifyClient.Instance.SendMilestoneDeadline(sender, m);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        LogManager.GetLogger("ASC.Projects.Tasks").Error("SendMsgMilestoneDeadline, tenant: " + tenant.TenantDomain, ex);
                    }
                }
            }
        }
    }
}
