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
using ASC.Files.Core;
using ASC.Web.Core;
using ASC.Common.Data;
using ASC.Common.Data.Sql;
using ASC.Common.Data.Sql.Expressions;
using System.Configuration;
using ASC.Web.Projects.Classes;
using ASC.Web.Studio.Utility;

namespace ASC.Web.Projects.Configuration
{
    public class ProjectsSpaceUsageStatManager : SpaceUsageStatManager
    {
        private const string PROJECTS_DBID = "projects";

        public override List<UsageSpaceStatItem> GetStatData()
        {
            if (!DbRegistry.IsDatabaseRegistered(PROJECTS_DBID))
            {
                DbRegistry.RegisterDatabase(PROJECTS_DBID, ConfigurationManager.ConnectionStrings[PROJECTS_DBID]);
            }
            if (!DbRegistry.IsDatabaseRegistered(FileConstant.DatabaseId))
            {
                DbRegistry.RegisterDatabase(FileConstant.DatabaseId, ConfigurationManager.ConnectionStrings[FileConstant.DatabaseId]);
            }

            using (var filedb = new DbManager(FileConstant.DatabaseId))
            using (var projdb = new DbManager(PROJECTS_DBID))
            {
                var q = new SqlQuery("files_file f")
                    .Select("b.right_node")
                    .SelectSum("f.content_length")
                    .InnerJoin("files_folder_tree t", Exp.EqColumns("f.folder_id", "t.folder_id"))
                    .InnerJoin("files_bunch_objects b", Exp.EqColumns("t.parent_id", "b.left_node"))
                    .Where("b.tenant_id", TenantProvider.CurrentTenantID)
                    .Where(Exp.Like("b.right_node", "projects/project/", SqlLike.StartWith))
                    .GroupBy(1);

                var sizes = filedb.ExecuteList(q)
                    .Select(r => new {ProjectId = Convert.ToInt32(((string) r[0]).Substring(17)), Size = Convert.ToInt64(r[1])})
                    .GroupBy(r => r.ProjectId)
                    .ToDictionary(g => g.Key, g => g.Sum(a => a.Size));

                q = new SqlQuery("projects_projects")
                    .Select("id", "title")
                    .Where("tenant_id", TenantProvider.CurrentTenantID)
                    .Where(Exp.In("id", sizes.Keys));

                return projdb.ExecuteList(q)
                    .Select(r => new UsageSpaceStatItem
                        {
                            Name = Convert.ToString(r[1]),
                            SpaceUsage = sizes[Convert.ToInt32(r[0])],
                            Url = String.Concat(PathProvider.BaseAbsolutePath, "projects.aspx?prjID=" + Convert.ToInt32(r[0]))
                        })
                    .OrderByDescending(i => i.SpaceUsage)
                    .ToList();
            }
        }
    }
}