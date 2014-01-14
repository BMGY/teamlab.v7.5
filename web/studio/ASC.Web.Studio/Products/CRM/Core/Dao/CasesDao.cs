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
using System.Globalization;
using System.Linq;
using System.Web.Caching;
using ASC.Collections;
using ASC.Common.Data;
using ASC.Common.Data.Sql;
using ASC.Common.Data.Sql.Expressions;
using ASC.Core;
using ASC.Core.Tenants;
using ASC.CRM.Core.Entities;
using ASC.Files.Core;
using ASC.FullTextIndex;
using ASC.Web.Files.Api;
using OrderBy = ASC.CRM.Core.Entities.OrderBy;

namespace ASC.CRM.Core.Dao
{
    public class CachedCasesDao : CasesDao
    {
        private readonly HttpRequestDictionary<Cases> _casesCache = new HttpRequestDictionary<Cases>("crm_cases");

        public CachedCasesDao(int tenantID, string storageKey)
            : base(tenantID, storageKey)
        {
        }

        public override Cases GetByID(int caseID)
        {
            return _casesCache.Get(caseID.ToString(CultureInfo.InvariantCulture), () => GetByIDBase(caseID));

        }

        private Cases GetByIDBase(int caseID)
        {
            return base.GetByID(caseID);
        }

        public override void UpdateCases(Cases cases)
        {

            if (cases != null && cases.ID > 0)
                ResetCache(cases.ID);

            base.UpdateCases(cases);

        }

        public override void DeleteCases(int casesID)
        {

            ResetCache(casesID);

            base.DeleteCases(casesID);

        }

        private void ResetCache(int taskID)
        {
            _casesCache.Reset(taskID.ToString(CultureInfo.InvariantCulture));
        }
    }

    public class CasesDao : AbstractDao
    {
        public CasesDao(int tenantID, String storageKey)
            : base(tenantID, storageKey)
        {
        }

        public void AddMember(int caseID, int memberID)
        {
            using (var db = GetDb())
            {
                SetRelative(memberID, EntityType.Case, caseID, db);
            }
        }

        public Dictionary<int, int[]> GetMembers(int[] caseID)
        {
            return GetRelativeToEntity(null, EntityType.Case, caseID);
        }

        public int[] GetMembers(int caseID)
        {
            return GetRelativeToEntity(null, EntityType.Case, caseID);
        }

        public void SetMembers(int caseID, int[] memberID)
        {
            SetRelative(memberID, EntityType.Case, caseID);
        }

        public void RemoveMember(int caseID, int memberID)
        {
            using (var db = GetDb())
            {
                RemoveRelative(memberID, EntityType.Case, caseID, db);
            }
        }

        public virtual int[] SaveCasesList(List<Cases> items)
        {
            using (var db = GetDb())
            using (var tx = db.BeginTransaction())
            {
                var result = items.Select(item => CreateCases(item.Title, db)).ToArray();
                tx.Commit();
                // Delete relative  keys
                _cache.Insert(_caseCacheKey, String.Empty);
                return result;
            }
        }


        public void CloseCases(int caseID)
        {
            if (caseID <= 0) throw new ArgumentException();

            var cases = GetByID(caseID);

            if (cases == null) throw new ArgumentException();

            CRMSecurity.DemandAccessTo(cases);
            
            using (var db = GetDb())
            {
                db.ExecuteNonQuery(
                    Update("crm_case")
                        .Set("is_closed", true)
                        .Where(Exp.Eq("id", caseID))
                    );
            }
        }

        public void ReOpenCases(int caseID)
        {
            if (caseID <= 0) throw new ArgumentException();

            var cases = GetByID(caseID);

            if (cases == null) throw new ArgumentException();

            CRMSecurity.DemandAccessTo(cases);

            using (var db = GetDb())
            {
                db.ExecuteNonQuery(
                   Update("crm_case")
                   .Set("is_closed", false)
                   .Where(Exp.Eq("id", caseID))
                );
            }
        }

        public int CreateCases(String title)
        {
            using (var db = GetDb())
            {
                var result = CreateCases(title, db);
                // Delete relative  keys
                _cache.Insert(_caseCacheKey, String.Empty);
                return result;
            }
        }

        private int CreateCases(String title, DbManager db)
        {
            return db.ExecuteScalar<int>(
                  Insert("crm_case")
                 .InColumnValue("id", 0)
                 .InColumnValue("title", title)
                 .InColumnValue("is_closed", false)
                 .InColumnValue("create_on", TenantUtil.DateTimeToUtc(TenantUtil.DateTimeNow()))
                 .InColumnValue("create_by", SecurityContext.CurrentAccount.ID)
                 .InColumnValue("last_modifed_on", TenantUtil.DateTimeToUtc(TenantUtil.DateTimeNow()))
                 .InColumnValue("last_modifed_by", SecurityContext.CurrentAccount.ID)
                 .Identity(1, 0, true));
        }

        public virtual void UpdateCases(Cases cases)
        {
            CRMSecurity.DemandAccessTo(cases);

            // Delete relative  keys
            _cache.Insert(_caseCacheKey, String.Empty);

            using (var db = GetDb())
            {
                db.ExecuteNonQuery(
                     Update("crm_case")
                    .Set("title", cases.Title)
                    .Set("is_closed", cases.IsClosed)
                    .Set("last_modifed_on", TenantUtil.DateTimeToUtc(TenantUtil.DateTimeNow()))
                    .Set("last_modifed_by", SecurityContext.CurrentAccount.ID)
                    .Where(Exp.Eq("id", cases.ID))
                );
            }
        }

        public virtual void DeleteCases(int casesID)
        {

            if (casesID <= 0) return;

            var cases = GetByID(casesID);

            CRMSecurity.DemandAccessTo(cases);

            DeleteBatchCases(new[] { casesID });
        }

        public virtual void DeleteBatchCases(List<Cases> caseses)
        {
            if (!caseses.Any()) return;

            //// Delete relative  keys
            _cache.Insert(_caseCacheKey, String.Empty);

            var casesID = caseses.Where(CRMSecurity.CanAccessTo).Select(x => x.ID).ToArray();

            using (var db = GetDb())
            {
                var tagNames = db.ExecuteList(Query("crm_relationship_event").Select("id")
                .Where(Exp.Eq("have_files", true) &
                       Exp.In("entity_id", casesID) &
                       Exp.Eq("entity_type", (int)EntityType.Case)))
               .Select(row => String.Format("RelationshipEvent{0}", row[0])).ToArray();

                using (var tx = db.BeginTransaction(true))
                {

                    db.ExecuteNonQuery(Delete("crm_field_value")
                                             .Where(Exp.In("entity_id", casesID) & Exp.Eq("entity_type", (int)EntityType.Case)));

                    db.ExecuteNonQuery(Delete("crm_relationship_event")
                                          .Where(Exp.In("entity_id", casesID) & Exp.Eq("entity_type", (int)EntityType.Case)));

                    db.ExecuteNonQuery(Delete("crm_task")
                                          .Where(Exp.In("entity_id", casesID) & Exp.Eq("entity_type", (int)EntityType.Case)));

                    db.ExecuteNonQuery(new SqlDelete("crm_entity_tag").Where(Exp.In("entity_id", casesID) & Exp.Eq("entity_type", (int)EntityType.Case)));

                    db.ExecuteNonQuery(Delete("crm_case").Where(Exp.In("id", casesID)));

                    tx.Commit();
                }

                caseses.ForEach(item => CoreContext.AuthorizationManager.RemoveAllAces(item));

                if (tagNames.Length == 0) return;

                using (var tagdao = FilesIntegration.GetTagDao())
                using (var filedao = FilesIntegration.GetFileDao())
                {

                    var filesIDs = tagdao.GetTags(tagNames, TagType.System).Where(t => t.EntryType == FileEntryType.File).Select(t => t.EntryId).ToArray();

                    foreach (var filesID in filesIDs)
                    {
                        filedao.DeleteFolder(filesID);
                        filedao.DeleteFile(filesID);
                    }
                }
            }
        }

        public virtual void DeleteBatchCases(int[] casesID)
        {

            if (casesID == null || !casesID.Any()) return;

            var cases = GetCases(casesID).ToList();

            DeleteBatchCases(cases);

        }

        public List<Cases> GetAllCases()
        {
            return GetCases(String.Empty, 0, null, null, 0, 0, new OrderBy(SortedByType.Title, true));
        }

        public int GetCasesCount()
        {
            return GetCasesCount(String.Empty, 0, null, null);
        }

        public int GetCasesCount(
                                String searchText,
                                int contactID,
                                bool? isClosed,
                                IEnumerable<String> tags)
        {

            var cacheKey = TenantID.ToString(CultureInfo.InvariantCulture) +
                           "cases" +
                           SecurityContext.CurrentAccount.ID.ToString() +
                           searchText +
                           contactID;

            if (tags != null)
                cacheKey += String.Join("", tags.ToArray());

            if (isClosed.HasValue)
                cacheKey += isClosed.Value;

            var fromCache = _cache.Get(cacheKey);

            if (fromCache != null) return Convert.ToInt32(fromCache);


            var withParams = !(String.IsNullOrEmpty(searchText) &&
                               contactID <= 0 &&
                               isClosed == null &&
                               (tags == null || !tags.Any()));


            var exceptIDs = CRMSecurity.GetPrivateItems(typeof(Cases)).ToList();

            int result;

            using (var db = GetDb())
            {
                if (withParams)
                {
                    var whereConditional = WhereConditional(exceptIDs, searchText, contactID, isClosed, tags);
                    result = whereConditional != null ? db.ExecuteScalar<int>(Query("crm_case").Where(whereConditional).SelectCount()) : 0;
                }
                else
                {
                    var countWithoutPrivate = db.ExecuteScalar<int>(Query("crm_case").SelectCount());
                    var privateCount = exceptIDs.Count;

                    if (privateCount > countWithoutPrivate)
                    {
                        _log.ErrorFormat(@"Private cases count more than all cases. Tenant: {0}. CurrentAccount: {1}", 
                                                               TenantID, 
                                                               SecurityContext.CurrentAccount.ID);
                 
                        privateCount = 0;
                    }

                    result = countWithoutPrivate - privateCount;

                }
            }

            if (result > 0)
                _cache.Insert(cacheKey, result, new CacheDependency(null, new[] { _caseCacheKey }), Cache.NoAbsoluteExpiration,
                                      TimeSpan.FromSeconds(30));

            return result;
        }


        private Exp WhereConditional(
                                ICollection<int> exceptIDs,
                                String searchText,
                                int contactID,
                                bool? isClosed,
                                IEnumerable<String> tags)
        {

            var conditions = new List<Exp>();

            var ids = new List<int>();

            if (!String.IsNullOrEmpty(searchText))
            {
                searchText = searchText.Trim();

                var keywords = searchText.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)
                   .ToArray();

                if (keywords.Length > 0)
                    if (FullTextSearch.SupportModule(FullTextSearch.CRMCasesModule))
                    {
                        ids = FullTextSearch.Search(searchText, FullTextSearch.CRMCasesModule)
                            .GetIdentifiers()
                            .Select(item => Convert.ToInt32(item.Split('_')[1])).Distinct().ToList();

                        if (ids.Count == 0) return null;
                    }
                    else
                        conditions.Add(BuildLike(new[] { "title" }, keywords));
            }

            if (contactID > 0)
            {

                var sqlQuery = new SqlQuery("crm_entity_contact")
                    .Select("entity_id")
                    .Where(Exp.Eq("contact_id", contactID) & Exp.Eq("entity_type", (int)EntityType.Case));

                if (ids.Count > 0)
                    sqlQuery.Where(Exp.In("entity_id", ids));
                using (var db = GetDb())
                {
                    ids = db.ExecuteList(sqlQuery).Select(item => Convert.ToInt32(item[0])).ToList();
                }
                if (ids.Count == 0) return null;
            }

            if (isClosed.HasValue)
                conditions.Add(Exp.Eq("is_closed", isClosed));

            if (tags != null && tags.Any())
            {
                ids = SearchByTags(EntityType.Case, ids.ToArray(), tags);

                if (ids.Count == 0) return null;
            }

            if (ids.Count > 0)
            {
                if (exceptIDs.Count > 0)
                {
                    ids = ids.Except(exceptIDs).ToList();

                    if (ids.Count == 0) return null;
                }

                conditions.Add(Exp.In("id", ids));

            }
            else if (exceptIDs.Count > 0)
            {
                conditions.Add(!Exp.In("id", exceptIDs.ToArray()));
            }

            if (conditions.Count == 0) return null;

            return conditions.Count == 1 ? conditions[0] : conditions.Aggregate((i, j) => i & j);
        }

        public List<Cases> GetCases(IEnumerable<int> casesID)
        {

            if (casesID == null || !casesID.Any()) return new List<Cases>();

            var sqlQuery = GetCasesSqlQuery(Exp.In("id", casesID.ToArray()));

            using (var db = GetDb())
            {
                return db.ExecuteList(sqlQuery).ConvertAll(ToCases).FindAll(CRMSecurity.CanAccessTo);
            }
        }

        public List<Cases> GetCases(
                                 String searchText,
                                 int contactID,
                                 bool? isClosed,
                                 IEnumerable<String> tags,
                                 int from,
                                 int count,
                                 OrderBy orderBy)
        {
            var sqlQuery = GetCasesSqlQuery(null);

            var withParams = !(String.IsNullOrEmpty(searchText) &&
                          contactID <= 0 &&
                          isClosed == null &&
                          (tags == null || !tags.Any()));

            var whereConditional = WhereConditional(CRMSecurity.GetPrivateItems(typeof(Cases)).ToList(), searchText,
                                                    contactID, isClosed,
                                                    tags);

            if (withParams && whereConditional == null)
                return new List<Cases>();

            sqlQuery.Where(whereConditional);

            if (0 < from && from < int.MaxValue) sqlQuery.SetFirstResult(from);
            if (0 < count && count < int.MaxValue) sqlQuery.SetMaxResults(count);

            sqlQuery.OrderBy("is_closed", true);

            if (orderBy != null && Enum.IsDefined(typeof(SortedByType), orderBy.SortedBy))
                switch ((SortedByType)orderBy.SortedBy)
                {
                    case SortedByType.Title:
                        sqlQuery.OrderBy("title", orderBy.IsAsc);
                        break;
                    case SortedByType.CreateBy:
                        sqlQuery.OrderBy("create_by", orderBy.IsAsc);
                        break;
                    case SortedByType.DateAndTime:
                        sqlQuery.OrderBy("create_on", orderBy.IsAsc);
                        break;
                }


            using (var db = GetDb())
            {
                return db.ExecuteList(sqlQuery).ConvertAll(ToCases);
            }
        }

        public List<Cases> GetCasesByPrefix(String prefix, int from, int count)
        {
            if (count == 0)
                throw new ArgumentException();

            prefix = prefix.Trim();

            var keywords = prefix.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries).ToArray();

            var q = GetCasesSqlQuery(null);

            if (keywords.Length == 1)
            {
                q.Where(Exp.Like("title", keywords[0]));
            }
            else
            {
                foreach (var k in keywords)
                {
                    q.Where(Exp.Like("title", k));
                }
            }

            if (0 < from && from < int.MaxValue) q.SetFirstResult(from);
            if (0 < count && count < int.MaxValue) q.SetMaxResults(count);

            using (var db = GetDb())
            {
                var sqlResult = db.ExecuteList(q).ConvertAll(row => ToCases(row)).FindAll(CRMSecurity.CanAccessTo);
                return sqlResult.OrderBy(cases => cases.Title).ToList();
            }
        }

        public virtual List<Cases> GetByID(int[] ids)
        {
            using (var db = GetDb())
            {
                return db.ExecuteList(GetCasesSqlQuery(Exp.In("id", ids))).ConvertAll(ToCases);
            }
        }

        public virtual Cases GetByID(int id)
        {
            if (id <= 0) return null;

            var cases = GetByID(new[] { id });

            return cases.Count == 0 ? null : cases[0];
        }

        #region Private Methods

        private static Cases ToCases(object[] row)
        {
            return new Cases
                       {
                           ID = Convert.ToInt32(row[0]),
                           Title = Convert.ToString(row[1]),
                           CreateBy = ToGuid(row[2]),
                           CreateOn = TenantUtil.DateTimeFromUtc(DateTime.Parse(row[3].ToString())),
                           IsClosed = Convert.ToBoolean(row[4])
                       };
        }

        private SqlQuery GetCasesSqlQuery(Exp where)
        {
            var sqlQuery = Query("crm_case")
                .Select("id","title","create_by","create_on","is_closed");

            if (where != null)
            {
                sqlQuery.Where(where);
            }

            return sqlQuery;
        }

        #endregion
    }
}