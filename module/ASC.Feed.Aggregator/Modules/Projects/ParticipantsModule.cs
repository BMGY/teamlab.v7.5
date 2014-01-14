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
using System.Data;
using ASC.Common.Data;
using ASC.Common.Data.Sql;
using ASC.Common.Data.Sql.Expressions;
using ASC.Projects.Core.Domain;
using ASC.Projects.Engine;
using ASC.Web.Studio.Utility;
using System.Linq;

namespace ASC.Feed.Aggregator.Modules.Projects
{
    internal class ParticipantsModule : FeedModule
    {
        private const string item = "participant";

        public override string Name
        {
            get { return Constants.ProjectsModule; }
        }

        public override string Product
        {
            get { return ModulesHelper.ProjectsProductName; }
        }

        public override Guid ProductID
        {
            get { return ModulesHelper.ProjectsProductID; }
        }

        protected override string Table
        {
            get { return "projects_project_participant"; }
        }

        protected override string LastUpdatedColumn
        {
            get { return "created"; }
        }

        protected override string TenantColumn
        {
            get { return "tenant"; }
        }

        protected override string DbId
        {
            get { return Constants.ProjectsDbId; }
        }

        public override bool VisibleFor(Feed feed, object data, Guid userId)
        {
            return base.VisibleFor(feed, data, userId)
                   && ProjectSecurity.CanGoToFeed(((ParticipantFull)data).Project, userId);
        }

        public override IEnumerable<Tuple<Feed, object>> GetFeeds(FeedFilter filter)
        {
            var q = new SqlQuery("projects_project_participant" + " pp")
                .Select("pp.participant_id", "pp.created", "pp.updated")
                .InnerJoin("projects_projects" + " p",
                           Exp.EqColumns("p.id", "pp.project_id") & Exp.Eq("p.tenant_id", filter.Tenant))
                .Select("p.id", "p.title", "p.description", "p.status", "p.status_changed", "p.responsible_id")
                .Select("p.private", "p.create_by", "p.create_on", "p.last_modified_by", "p.last_modified_on")
                .Where("pp.removed", 0)
                .Where("pp.tenant", filter.Tenant)
                .Where(Exp.Between("pp.created", filter.Time.From, filter.Time.To) &
                       !Exp.Between("p.create_on - pp.created", -10, 10));

            using (var db = new DbManager(DbId))
            {
                var participants = db.ExecuteList(q).ConvertAll(ToParticipant);
                return participants.Select(p => new Tuple<Feed, object>(ToFeed(p), p));
            }
        }

        private static ParticipantFull ToParticipant(object[] r)
        {
            var participantId = new Guid(Convert.ToString(r[0]));
            return new ParticipantFull(participantId)
                {
                    Created = Convert.ToDateTime(r[1]),
                    Updated = Convert.ToDateTime(r[2]),
                    Project = new Project
                        {
                            ID = Convert.ToInt32(r[3]),
                            Title = Convert.ToString(r[4]),
                            Description = Convert.ToString(r[5]),
                            Status = (ProjectStatus)Convert.ToInt32(6),
                            StatusChangedOn = Convert.ToDateTime(r[7]),
                            Responsible = new Guid(Convert.ToString(r[8])),
                            Private = Convert.ToBoolean(r[9]),
                            CreateBy = new Guid(Convert.ToString(r[10])),
                            CreateOn = Convert.ToDateTime(r[11]),
                            LastModifiedBy = new Guid(Convert.ToString(r[12])),
                            LastModifiedOn = Convert.ToDateTime(r[13])
                        }
                };
        }

        private Feed ToFeed(ParticipantFull participant)
        {
            var itemUrl = "/products/projects/tasks.aspx?prjID=" + participant.Project.ID;
            var feed = new Feed(participant.ID, participant.Created)
                {
                    Item = item,
                    ItemId = string.Format("{0}_{1}", participant.ID, participant.Project.ID),
                    ItemUrl = CommonLinkUtility.ToAbsolute(itemUrl),
                    Product = Product,
                    Module = Name,
                    Title = participant.Project.Title,
                    HasPreview = false,
                    CanComment = false,
                    GroupId = string.Format("{0}_{1}_{2}", item, participant.Project.ID, participant.ID)
                };
            feed.Keywords = feed.Author.DisplayName;
            return feed;
        }
    }
}