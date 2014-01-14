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
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using ASC.Data.Backup.Extensions;
using ASC.Common.Data;
using ASC.Data.Backup.Tasks.Data;

namespace ASC.Data.Backup.Tasks.Modules
{
    internal class FilesModuleSpecifics : ModuleSpecificsBase
    {
        private static readonly Guid ShareForEveryoneID = new Guid("{D77BD6AF-828B-41f5-84ED-7FFE2565B13A}");
        private static readonly Regex RegexIsInteger = new Regex(@"^\d+$", RegexOptions.Compiled);
        private const string TagStartMessage = "Message";
        private const string TagStartTask = "Task";
        private const string TagStartProject = "Project";
        private const string TagStartRelationshipEvent = "RelationshipEvent_";
        private const string BunchRightNodeStartProject = "projects/project/";
        private const string BunchRightNodeStartCrmOpportunity = "crm/opportunity/";
        private const string BunchRightNodeStartMy = "files/my/";
        private const string BunchRightNodeStartTrash = "files/trash/";

        private readonly TableInfo[] _tables = new[]
            {
                new TableInfo("files_bunch_objects") {TenantColumn = "tenant_id"},
                new TableInfo("files_file") {TenantColumn = "tenant_id", UserIDColumns = new[] {"create_by", "modified_by"}},
                new TableInfo("files_folder") {AutoIncrementColumn = "id", TenantColumn = "tenant_id", UserIDColumns = new[] {"create_by", "modified_by"}},
                new TableInfo("files_folder_tree"),
                new TableInfo("files_security") {TenantColumn = "tenant_id", UserIDColumns = new[] {"owner"}},
                new TableInfo("files_tag") {AutoIncrementColumn = "id", TenantColumn = "tenant_id", UserIDColumns = new[] {"owner"}},
                new TableInfo("files_tag_link") {TenantColumn = "tenant_id", UserIDColumns = new[] {"create_by"}},
                new TableInfo("files_thirdparty_account") {AutoIncrementColumn = "id", TenantColumn = "tenant_id", UserIDColumns = new[] {"user_id"}},
                new TableInfo("files_thirdparty_id_mapping") {TenantColumn = "tenant_id"}
            };

        private readonly RelationInfo[] _tableRelations = new[]
            {
                new RelationInfo("core_user", "id", "files_bunch_objects", "right_node", typeof(TenantsModuleSpecifics),
                                 x =>
                                     {
                                         var rightNode = Convert.ToString(x["right_node"]);
                                         return rightNode.StartsWith(BunchRightNodeStartMy) || rightNode.StartsWith(BunchRightNodeStartTrash);
                                     }),

                new RelationInfo("core_user", "id", "files_security", "subject", typeof(TenantsModuleSpecifics)),

                new RelationInfo("core_group", "id", "files_security", "subject", typeof(TenantsModuleSpecifics)),

                new RelationInfo("crm_deal", "id", "files_bunch_objects", "right_node", typeof(CrmModuleSpecifics),
                                 x => Convert.ToString(x["right_node"]).StartsWith(BunchRightNodeStartCrmOpportunity)),

                new RelationInfo("projects_projects", "id", "files_bunch_objects", "right_node", typeof(ProjectsModuleSpecifics),
                                 x => Convert.ToString(x["right_node"]).StartsWith(BunchRightNodeStartProject, StringComparison.InvariantCultureIgnoreCase)),

                new RelationInfo("files_folder", "id", "files_bunch_objects", "left_node"),

                new RelationInfo("files_folder", "id", "files_file", "folder_id"),

                new RelationInfo("files_folder", "id", "files_folder", "parent_id"),

                new RelationInfo("files_folder", "id", "files_folder_tree", "folder_id"),

                new RelationInfo("files_folder", "id", "files_folder_tree", "parent_id"),

                new RelationInfo("files_file", "id", "files_security", "entry_id",
                                 x => Convert.ToInt32(x["entry_type"]) == 2 && RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("files_folder", "id", "files_security", "entry_id",
                                 x => Convert.ToInt32(x["entry_type"]) == 1 && RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("files_thirdparty_id_mapping", "hash_id", "files_security", "entry_id",
                                 x => !RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("projects_messages", "id", "files_tag", "name", typeof(ProjectsModuleSpecifics),
                                 x => Convert.ToString(x["name"]).StartsWith(TagStartMessage, StringComparison.InvariantCultureIgnoreCase)),

                new RelationInfo("projects_tasks", "id", "files_tag", "name", typeof(ProjectsModuleSpecifics),
                                 x => Convert.ToString(x["name"]).StartsWith(TagStartTask, StringComparison.InvariantCultureIgnoreCase)),

                new RelationInfo("projects_projects", "id", "files_tag", "name", typeof(ProjectsModuleSpecifics),
                                 x => Convert.ToString(x["name"]).StartsWith(TagStartProject, StringComparison.InvariantCultureIgnoreCase)),

                new RelationInfo("crm_relationship_event", "id", "files_tag", "name", typeof(CrmModuleSpecifics2),
                                 x => Convert.ToString(x["name"]).StartsWith(TagStartRelationshipEvent, StringComparison.InvariantCultureIgnoreCase)),

                new RelationInfo("files_tag", "id", "files_tag_link", "tag_id"),

                new RelationInfo("files_file", "id", "files_tag_link", "entry_id",
                                 x => Convert.ToInt32(x["entry_type"]) == 2 && RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("files_folder", "id", "files_tag_link", "entry_id",
                                 x => Convert.ToInt32(x["entry_type"]) == 1 && RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("files_thirdparty_id_mapping", "hash_id", "files_tag_link", "entry_id",
                                 x => !RegexIsInteger.IsMatch(Convert.ToString(x["entry_id"]))),

                new RelationInfo("files_thirdparty_account", "id", "files_thirdparty_id_mapping", "id"),

                new RelationInfo("files_thirdparty_account", "id", "files_thirdparty_id_mapping", "hash_id")
            };

        public override ModuleName ModuleName
        {
            get { return ModuleName.Files; }
        }

        public override IEnumerable<TableInfo> Tables
        {
            get { return _tables; }
        }

        public override IEnumerable<RelationInfo> TableRelations
        {
            get { return _tableRelations; }
        }

        public override bool TryAdjustFilePath(ColumnMapper columnMapper, ref string filePath)
        {
            var match = Regex.Match(filePath, @"^folder_\d+/file_(?'fileId'\d+)/(?'versionExtension'v\d+/[\.\w]+)$", RegexOptions.Compiled);
            if (match.Success)
            {
                var fileId = columnMapper.GetMapping("files_file", "id", match.Groups["fileId"].Value);
                if (fileId == null)
                    return false;

                filePath = string.Format("folder_{0}/file_{1}/{2}", (Convert.ToInt32(fileId)/1000 + 1)*1000, fileId, match.Groups["versionExtension"].Value);
                return true;
            }

            return false;
        }

        protected override string GetSelectCommandConditionText(int tenantId, TableInfo table)
        {
            if (table.Name == "files_folder_tree")
                return "inner join files_folder as t1 on t1.id = t.folder_id where t1.tenant_id = " + tenantId;

            return base.GetSelectCommandConditionText(tenantId, table);
        }

        protected override bool TryPrepareRow(IDbConnection connection, ColumnMapper columnMapper, TableInfo table, DataRowInfo row, out Dictionary<string, object> preparedRow)
        {
            if (row.TableName == "files_thirdparty_id_mapping")
            {
                //todo: think...
                preparedRow = new Dictionary<string, object>();

                object folderId = null;

                var sboxId = Regex.Replace(row[1].ToString(), @"(?<=sbox-)\d+", match =>
                {
                    folderId = columnMapper.GetMapping("files_thirdparty_account", "id", match.Value);
                    return Convert.ToString(folderId);
                }, RegexOptions.Compiled);

                if (folderId == null)
                    return false;

                var hashBytes = MD5.Create().ComputeHash(Encoding.UTF8.GetBytes(sboxId));
                var hashedId = BitConverter.ToString(hashBytes).Replace("-", "").ToLower();

                preparedRow.Add("hash_id", hashedId);
                preparedRow.Add("id", sboxId);
                preparedRow.Add("tenant_id", columnMapper.GetTenantMapping());

                columnMapper.SetMapping("files_thirdparty_id_mapping", "hash_id", row["hash_id"], hashedId);

                return true;
            }

            return base.TryPrepareRow(connection, columnMapper, table, row, out preparedRow);
        }

        protected override bool TryPrepareValue(IDbConnection connection, ColumnMapper columnMapper, TableInfo table, string columnName, ref object value)
        {
            if (table.Name == "files_file" && columnName == "id")
            {
                //In `files_file` possible multiple rows with the same value of the column `id`.
                //If such row was not inserted before current iteration then we need to create value for the `id` first.
                var fileId = columnMapper.GetMapping(table.Name, columnName, value);
                if (fileId == null)
                {
                    fileId = connection
                                 .CreateCommand("select max(id) from files_file;")
                                 .WithTimeout(120)
                                 .ExecuteScalar<int>() + 1;

                    columnMapper.SetMapping(table.Name, columnName, value, fileId);
                }
                value = fileId;
                return true;
            }
            return base.TryPrepareValue(connection, columnMapper, table, columnName, ref value);
        }

        protected override bool TryPrepareValue(IDbConnection connection, ColumnMapper columnMapper, TableInfo table, string columnName, IEnumerable<RelationInfo> relations, ref object value)
        {
            var relationList = relations.ToList();
            if (relationList.All(x => x.ChildTable == "files_security" && x.ChildColumn == "subject"))
            {
                //note: value could be ShareForEveryoneID and in that case result should be always false
                var strVal = Convert.ToString(value);
                if (Helpers.IsEmptyOrSystemUser(strVal) || Helpers.IsEmptyOrSystemGroup(strVal))
                    return true;

                foreach (var relation in relationList)
                {
                    var mapping = columnMapper.GetMapping(relation.ParentTable, relation.ParentColumn, value);
                    if (mapping != null)
                    {
                        value = mapping;
                        return true;
                    }
                }
                return false;
            }
            return base.TryPrepareValue(connection, columnMapper, table, columnName, relationList, ref value);
        }

        protected override bool TryPrepareValue(IDbConnection connection, ColumnMapper columnMapper, RelationInfo relation, ref object value)
        {
            if (relation.ChildTable == "files_bunch_objects" && relation.ChildColumn == "right_node"
                || relation.ChildTable == "files_tag" && relation.ChildColumn == "name")
            {
                var strValue = Convert.ToString(value);

                string start = GetStart(strValue);
                if (start == null)
                    return false;

                var entityId = columnMapper.GetMapping(relation.ParentTable, relation.ParentColumn, strValue.Substring(start.Length));
                if (entityId == null)
                    return false;

                value = strValue.Substring(0, start.Length) + entityId;
                return true;
            }

            return base.TryPrepareValue(connection, columnMapper, relation, ref value);
        }

        private static string GetStart(string value)
        {
            var allStarts = new[] {TagStartMessage, TagStartTask, TagStartRelationshipEvent, TagStartProject, BunchRightNodeStartProject, BunchRightNodeStartMy, BunchRightNodeStartTrash, BunchRightNodeStartCrmOpportunity};
            return allStarts.FirstOrDefault(value.StartsWith);
        }
    }
}
