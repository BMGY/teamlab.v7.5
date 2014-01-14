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
using ASC.Common.Security;
using ASC.Common.Security.Authorizing;
using ASC.Core.Users;

namespace ASC.Forum
{
    public enum TopicType
    {
        Informational = 0,
        Poll = 1
    }

    [Flags]
    public enum TopicStatus
    {
        Normal = 0,
        Closed = 1,
        Sticky = 2
    }

    public class Topic : ISecurityObject
    {
        public virtual int ID { get; set; }

        public virtual string Title { get; set; }

        public virtual TopicType Type { get; set; }

        public virtual TopicStatus Status
        {
            get
            {
                var status = TopicStatus.Normal;
                if (Closed)
                    status |= TopicStatus.Closed;
                if (Sticky)
                    status |= TopicStatus.Sticky;

                return status;
            }
        }

        public virtual Guid PosterID { get; set; }

        public virtual UserInfo Poster
        {
            get { return Core.CoreContext.UserManager.GetUsers(PosterID); }
        }

        public virtual UserInfo RecentPostAuthor
        {
            get { return Core.CoreContext.UserManager.GetUsers(RecentPostAuthorID); }
        }

        public virtual DateTime CreateDate { get; set; }

        public virtual bool IsApproved { get; set; }

        public virtual int ViewCount { get; set; }

        public virtual int PostCount { get; set; }

        public virtual bool Closed { get; set; }

        public virtual bool Sticky { get; set; }

        public Topic()
        {
            CreateDate = DateTime.MinValue;
            Tags = new List<Tag>(0);
        }

        public virtual List<Tag> Tags { get; set; }

        public virtual int ThreadID { get; set; }

        public virtual int RecentPostID { get; set; }

        public virtual int TenantID { get; set; }

        public virtual int QuestionID { get; set; }

        public virtual string RecentPostText { get; set; }

        public virtual DateTime RecentPostCreateDate { get; set; }

        public virtual Guid RecentPostAuthorID { get; set; }

        public virtual PostTextFormatter RecentPostFormatter { get; set; }

        public virtual string ThreadTitle { get; set; }

        public Topic(string title, TopicType type)
        {
            Title = title;
            Type = type;
            Tags = new List<Tag>(0);
        }

        public bool IsNew()
        {
            var tvi = ThreadVisitInfo.GetThreadVisitInfo(ThreadID);
            if (tvi == null)
                return true;

            if (tvi.TopicViewRecentPostIDs.ContainsKey(ID) && RecentPostID > 0)
            {
                if (tvi.TopicViewRecentPostIDs[ID] >= RecentPostID)
                    return false;
            }
            else if (RecentPostID > 0 && tvi.RecentVisitDate.CompareTo(RecentPostCreateDate) >= 0)
                return false;

            else if (PostCount == 0)
                return false;

            return true;
        }

        #region ISecurityObjectId Members

        /// <inheritdoc/>
        public object SecurityId
        {
            get { return ID; }
        }

        /// <inheritdoc/>
        public Type ObjectType
        {
            get { return GetType(); }
        }

        #endregion

        #region ISecurityObjectProvider Members

        /// <inheritdoc/>
        public IEnumerable<IRole> GetObjectRoles(ISubject account, ISecurityObjectId objectId, SecurityCallContext callContext)
        {
            var roles = new List<IRole>();
            if (account.ID.Equals(PosterID))
            {
                if (callContext.ObjectsStack == null || callContext.ObjectsStack.Find(so => so.ObjectType == typeof(Post)) == null)
                    roles.Add(Common.Security.Authorizing.Constants.Owner);
            }

            return roles;
        }

        /// <inheritdoc/>
        public ISecurityObjectId InheritFrom(ISecurityObjectId objectId)
        {
            return new Thread {ID = ThreadID};
        }

        /// <inheritdoc/>
        public bool InheritSupported
        {
            get { return true; }
        }

        /// <inheritdoc/>
        public bool ObjectRolesSupported
        {
            get { return true; }
        }

        #endregion
    }
}