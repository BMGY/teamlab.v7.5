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
using System.Configuration;
using System.Net.Mail;
using System.Runtime.Serialization;
using System.ServiceModel;
using ASC.Core;
using ASC.Mail.Aggregator;
using ASC.Mail.Aggregator.Collection;
using ASC.Mail.Aggregator.Filter;
using ASC.Mail.Service.DAO;
using System.ServiceModel.Activation;
using System.Linq;
using System.Net;
using ASC.Data.Storage;
using System.Web;
using System.Xml.Serialization;
using System.Xml;
using System.IO;
using System.Reflection;
using ASC.Mail.Service.Resources;

// The following line sets the default namespace for DataContract serialized typed to_addresses be ""
[assembly: ContractNamespace("", ClrNamespace = "ASC.Mail.Service")]
[assembly: ContractNamespace("", ClrNamespace = "ASC.Mail.Service.DAO")]
[assembly: ContractNamespace("", ClrNamespace = "ASC.Mail.Aggregator")]
namespace ASC.Mail.Service
{
    //Now service behave like per call. so db instance will be new on any request
    [ServiceBehavior(IncludeExceptionDetailInFaults = true, InstanceContextMode = InstanceContextMode.PerCall, ConcurrencyMode = ConcurrencyMode.Multiple)]
    [AspNetCompatibilityRequirements(RequirementsMode = AspNetCompatibilityRequirementsMode.Required)]
    public class Service : MailServiceBase
    {
        private MailBoxManager mailBoxManager;
        private MailSendQueue mailSendQueue;

        public Service()
        {
            mailBoxManager = new MailBoxManager(ConfigurationManager.ConnectionStrings["mail"], 25);
            mailSendQueue = new MailSendQueue(mailBoxManager);
        }

        protected override List<MailFolder> DB_GetFoldersList()
        {
            return mailBoxManager.GetFoldersList(TenantId, Username);
        }

        protected override IEnumerable<MailTag> DB_GetTagsList()
        {
            return mailBoxManager.GetTagsList(TenantId, Username).Concat<MailTag>(mailBoxManager.GetCRMTagsList(TenantId, Username));
        }

        protected override List<MailAccount> DB_GetMailboxesList()
        {
            return mailBoxManager.GetMailBoxes(TenantId, Username).ConvertAll(x => new MailAccount(x.EMail.ToString(), x.Name, x.Enabled));
        }

        private MailBox CreateMailboxObject(MailBox initialValue)
        {
            MailBox mbox = mailBoxManager.CreateMailBox(TenantId, Username, initialValue.Name, initialValue.EMail, initialValue.UseSsl, initialValue.MailBoxId);

            mbox.Account = initialValue.Account;
            mbox.Name = initialValue.Name;
            mbox.Password = initialValue.Password;
            mbox.SmtpAccount = initialValue.SmtpAccount;
            mbox.SmtpPassword = initialValue.SmtpPassword;
            if (initialValue.Port != 0)
            {
                mbox.Port = initialValue.Port;
            }
            if (!string.IsNullOrEmpty(initialValue.Server))
            {
                mbox.Server = initialValue.Server;
            }
            if (initialValue.SmtpPort != 0)
            {
                mbox.SmtpPort = initialValue.SmtpPort;
            }
            if (!string.IsNullOrEmpty(initialValue.SmtpServer))
            {
                mbox.SmtpServer = initialValue.SmtpServer;
            }
            mbox.SmtpAuth = initialValue.SmtpAuth;
            
            mbox.UseSsl = initialValue.UseSsl;
            mbox.ServerLoginDelay = initialValue.ServerLoginDelay;
            return mbox;
        }

        protected override int DB_SaveMessage(int id, MailSendItem item)
        {
            return mailSendQueue.Save(TenantId, Username, item, id);
        }

        protected override int DB_SendMessage(int id, MailSendItem item)
        {
            return mailSendQueue.Send(TenantId, Username, item, id);
        }

        protected override void DB_UpdateUserActivity()
        {
            mailBoxManager.UpdateUserActivity(TenantId, Username);
        }

        protected override IList<MailMessageItem> DB_GetFilteredMessages(MailFilter filter, int page, int page_size)
        {
            int total_messages_count;
            return mailBoxManager.GetMailsFiltered(TenantId, Username, filter, page, page_size, out total_messages_count);
        }

        protected override long DB_GetFilteredMessagesCount(MailFilter filter)
        {
            return mailBoxManager.GetMailsFilteredCount(TenantId, Username, filter);
        }

        protected override List<int> DB_GetFilteredMessagesIds(MailFilter filter)
        {
            return mailBoxManager.GetFilteredMessagesIds(TenantId, Username, filter);
        }

        private int TenantId
        {
            get { return CoreContext.TenantManager.GetCurrentTenant().TenantId; }
        }

        private string Username
        {
            get { return SecurityContext.CurrentAccount.ID.ToString(); }
        }

        #region Implementation of IDisposable


        #endregion


        protected override string DB_GetTimeAll()
        {
            return mailBoxManager.GetTimeAll(Username);
        }

        protected override string DB_GetTimeFolder(int folder_id)
        {
            return mailBoxManager.GetTimeFolder(Username, folder_id);
        }

        protected override MailFolder DB_GetInboxState()
        {
            return mailBoxManager.GetInboxState(TenantId, Username);
        }

        protected override List<string> DB_SearchContacts(string searchText)
        {
            ContactEqualityComparer equality = new ContactEqualityComparer();
            List<string> contacts = new List<string>();
            //contacts = mailBoxManager.SearchCRMContacts(TenantId, Username, searchText);
            contacts = contacts.Concat(mailBoxManager.SearchTeamLabContacts(TenantId, searchText)).Distinct(equality).ToList();
            //contacts = contacts.Concat(mailBoxManager.SearchMailContacts(TenantId, Username, searchText)).Distinct(equality).ToList();
            return contacts;
        }
    }
}