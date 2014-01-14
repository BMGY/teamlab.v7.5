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
using ASC.Core;
using ASC.Core.Tenants;
using ASC.Files.Core;
using ASC.Projects.Core.DataInterfaces;
using ASC.Projects.Core.Domain;
using ASC.Projects.Core.Services.NotifyService;
using IDaoFactory = ASC.Projects.Core.DataInterfaces.IDaoFactory;

namespace ASC.Projects.Engine
{
    public class MessageEngine : ProjectEntityEngine
    {
        private readonly EngineFactory engineFactory;
        private readonly IMessageDao messageDao;
        private readonly ICommentDao commentDao;

        public MessageEngine(IDaoFactory daoFactory, EngineFactory engineFactory)
            : base(NotifyConstants.Event_NewCommentForMessage, engineFactory)
        {
            this.engineFactory = engineFactory;
            messageDao = daoFactory.GetMessageDao();
            commentDao = daoFactory.GetCommentDao();
        }

        #region Get Discussion

        public Message GetByID(int id)
        {
            return GetByID(id, true);
        }

        public Message GetByID(int id, bool checkSecurity)
        {
            var message = messageDao.GetById(id);

            if (message != null)
                message.CommentsCount = commentDao.GetCommentsCount(new List<ProjectEntity> {message}).FirstOrDefault();

            if (!checkSecurity)
                return message;

            return CanRead(message) ? message : null;
        }

        public IEnumerable<Message> GetAll()
        {
            return messageDao.GetAll().Where(CanRead);
        }

        public List<Message> GetByProject(int projectID)
        {
            var messages = messageDao.GetByProject(projectID)
                .Where(CanRead)
                .ToList();
            var commentsCount = commentDao.GetCommentsCount(messages.ConvertAll(r => (ProjectEntity)r));

            return messages.Select((message, index) =>
            { 
                                                    message.CommentsCount = commentsCount[index];
                                                    return message;
            }).ToList();

        }

        public List<Message> GetMessages(int startIndex,int maxResult)
        {
            var messages = messageDao.GetMessages(startIndex, maxResult)
                .Where(CanRead)
                .ToList();
            var commentsCount = commentDao.GetCommentsCount(messages.Select(r => (ProjectEntity)r).ToList());

            return messages.Select((message, index) =>
            {
                message.CommentsCount = commentsCount[index];
                return message;
            }).ToList();
            
        }

        public List<Message> GetRecentMessages(int maxResult)
        {
            int offset = 0;
            var recentMessages = new List<Message>();
            var messages = messageDao.GetRecentMessages(offset, maxResult)
                .Where(CanRead)
                .ToList();

            recentMessages.AddRange(messages);

            if (recentMessages.Count < maxResult)
            {
                do
                {
                    offset = offset + maxResult;
                    messages = messageDao.GetRecentMessages(offset, maxResult);

                    if (messages.Count == 0) return recentMessages;
                    messages = messages
                        .Where(CanRead)
                        .ToList();

                    recentMessages.AddRange(messages);
                }
                while (recentMessages.Count < maxResult);
            }

            var commentsCount = commentDao.GetCommentsCount(recentMessages.Select(r => (ProjectEntity)r).ToList());

            recentMessages = recentMessages.Select((message, index) =>
            {
                message.CommentsCount = commentsCount[index];
                return message;
            }).ToList();

            return recentMessages.Count == maxResult ? recentMessages : recentMessages.GetRange(0, maxResult);
        }

        public List<Message> GetRecentMessages(int maxResult, params int[] projectID)
        {
            int offset = 0;
            var recentMessages = new List<Message>();
            var messages = messageDao.GetRecentMessages(offset, maxResult, projectID)
                .Where(CanRead)
                .ToList();

            recentMessages.AddRange(messages);

            if (recentMessages.Count < maxResult)
            {
                do
                {
                    offset = offset + maxResult;
                    messages = messageDao.GetRecentMessages(offset, maxResult, projectID);

                    if (messages.Count == 0) return recentMessages;
                    messages = messages
                        .Where(CanRead)
                        .ToList();

                    recentMessages.AddRange(messages);
                }
                while (recentMessages.Count < maxResult);
            }

            return recentMessages.Count == maxResult ? recentMessages : recentMessages.GetRange(0, maxResult);
        }

        public List<Message> GetByFilter(TaskFilter filter)
        {
            var isAdmin = ProjectSecurity.IsAdministrator(SecurityContext.CurrentAccount.ID);

            var messages = messageDao.GetByFilter(filter, isAdmin);

            var commentsCount = commentDao.GetCommentsCount(messages.Select(r => (ProjectEntity)r).ToList());

            return messages.Select((message, index) =>
            {
                message.CommentsCount = commentsCount[index];
                return message;
            }).ToList();
        }

        public int GetByFilterCount(TaskFilter filter)
        {
            var isAdmin = ProjectSecurity.IsAdministrator(SecurityContext.CurrentAccount.ID);
            return messageDao.GetByFilterCount(filter, isAdmin);
        }

        public bool IsExists(int id)
        {
            return messageDao.IsExists(id);
        }

        public bool CanRead(Message message)
        {
            return ProjectSecurity.CanRead(message);
        }

        #endregion

        #region Save, Delete, Attach

        public Message SaveOrUpdate(Message message, bool notify, IEnumerable<Guid> participant, IEnumerable<int> fileIds)
        {
            if (message == null) throw new ArgumentNullException("message");

            var isNew = message.ID == default(int);

            message.LastModifiedBy = SecurityContext.CurrentAccount.ID;
            message.LastModifiedOn = TenantUtil.DateTimeNow();

            if (isNew)
            {
                if (message.CreateBy == default(Guid)) message.CreateBy = SecurityContext.CurrentAccount.ID;
                if (message.CreateOn == default(DateTime)) message.CreateOn = TenantUtil.DateTimeNow();

                ProjectSecurity.DemandCreateMessage(message.Project);
                messageDao.Save(message);
            }
            else
            {
                ProjectSecurity.DemandEdit(message);
                messageDao.Save(message);
            }

            if (fileIds != null)
            {
                foreach (var fileId in fileIds)
                {
                    AttachFile(message, fileId, false);
                }
            }

            if (!participant.Any())
                participant = GetSubscribers(message).Select(r=> new Guid(r.ID));

            NotifyParticipiant(message, isNew, participant, GetFiles(message), notify);

            return message;
        }

        public void Delete(Message message)
        {
            if (message == null) throw new ArgumentNullException("message");
            if (message.Project == null) throw new Exception("Project");

            ProjectSecurity.DemandEdit(message);

            messageDao.Delete(message.ID);

            var recipients = GetSubscribers(message);

            if (recipients.Any() && !engineFactory.DisableNotifications)
            {
                NotifyClient.Instance.SendAboutMessageDeleting(recipients, message);
            }

            UnSubscribe(message);
        }


        #endregion

        #region Notify

        protected void NotifyParticipiant(Message message, bool isMessageNew, IEnumerable<Guid> participant, IEnumerable<File> uploadedFiles, bool sendNotify)
        {
            //Don't send anything if notifications are disabled
            if (engineFactory.DisableNotifications) return;

            var subscriptionRecipients = GetSubscribers(message);
            var recipients = new HashSet<Guid>(participant) { SecurityContext.CurrentAccount.ID };

            foreach (var subscriptionRecipient in subscriptionRecipients)
            {
                var subscriptionRecipientId = new Guid(subscriptionRecipient.ID);
                if (!recipients.Contains(subscriptionRecipientId))
                {
                    UnSubscribe(message, subscriptionRecipientId);
                }
            }

            foreach (var subscriber in recipients)
            {
                Subscribe(message, subscriber);
            }

            if (sendNotify && recipients.Any())
            {
                NotifyClient.Instance.SendAboutMessageAction(GetSubscribers(message), message, isMessageNew, FileEngine.GetFileListInfoHashtable(uploadedFiles));
            }
        }

        #endregion
    }
}
