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

#region Import

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Web;
using ASC.Common.Security.Authentication;
using ASC.Common.Threading.Progress;
using ASC.Common.Threading.Workers;
using ASC.Common.Utils;
using ASC.Common.Web;
using ASC.Core;
using ASC.Core.Users;
using ASC.CRM.Core;
using ASC.CRM.Core.Dao;
using ASC.CRM.Core.Entities;
using ASC.Data.Storage;
using ASC.Web.CRM.Classes;
using ASC.Web.CRM.Services.NotifyService;
using ASC.Web.Studio.Utility;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Schema;
using log4net;
using Constants = ASC.Core.Users.Constants;
using LumenWorks.Framework.IO.Csv;
using ASC.Common.Security;

#endregion

namespace LumenWorks.Framework.IO.Csv
{
    public static class CsvReaderExtension
    {
        public static String[] GetCurrentRowFields(this CsvReader csvReader, bool htmlEncodeColumn)
        {
            var fieldCount = csvReader.FieldCount;
            var result = new String[fieldCount];

            for (int index = 0; index < fieldCount; index++)
            {
                if (htmlEncodeColumn)
                    result[index] = csvReader[index].HtmlEncode().ReplaceSingleQuote();
                else
                    result[index] = csvReader[index];

            }

            return result;
        }

    }
}

namespace ASC.Web.CRM.Classes
{

    public class ImportCSVSettings
    {

        public ImportCSVSettings(String jsonStr)
        {
            var json = JObject.Parse(jsonStr);

            if (json == null) return;

            HasHeader = json["has_header"].Value<bool>();
            DelimiterCharacter = Convert.ToChar(json["delimiter_character"].Value<int>());
            Encoding = Encoding.GetEncoding(json["encoding"].Value<int>());
            QuoteType =  Convert.ToChar(json["quote_character"].Value<int>());
            
            JToken columnMappingToken;

            if (json.TryGetValue("column_mapping", out columnMappingToken))
                ColumnMapping = (JObject)columnMappingToken;
           
            JToken duplicateRecordRuleToken;

            if (json.TryGetValue("removing_duplicates_behavior", out duplicateRecordRuleToken))
                DuplicateRecordRule = duplicateRecordRuleToken.Value<int>();

            JToken isPrivateToken;
            if (json.TryGetValue("is_private", out isPrivateToken))
            {
                IsPrivate = isPrivateToken.Value<bool>();
                AccessList = json["access_list"].Values<String>().Select(item => new Guid(item)).ToList();
            }

            JToken isSharedToken;
            if (json.TryGetValue("is_shared", out isSharedToken))
            {
                IsShared = isSharedToken.Value<bool>();
                ContactManagers = json["contact_managers"].Values<String>().Select(item => new Guid(item)).ToList();
            }
        
        }

        public bool IsPrivate { get; set; }

        public bool IsShared { get; set; }

        public int DuplicateRecordRule { get; set; }

        public bool HasHeader { get; set; }

        public char DelimiterCharacter { get; set; }

        public char QuoteType { get; set; }

        public Encoding Encoding { get; set; }

        public List<Guid> AccessList { get; set; }

        public List<Guid> ContactManagers { get; set; }

        public JObject ColumnMapping { get; set; }

    }

    public partial class ImportDataOperation : IProgressItem
    {
        #region Constructor

        public ImportDataOperation()
            : this(EntityType.Contact, String.Empty, String.Empty)
        {

        }

        public ImportDataOperation(EntityType entityType, String CSVFileURI, String importSettingsJSON)
        {

            _CSVFileURI = CSVFileURI;
            _dataStore = Global.GetStore();
            _tenantID = TenantProvider.CurrentTenantID;
            _daoFactory = Global.DaoFactory;
            _entityType = entityType;
            _author = SecurityContext.CurrentAccount;

            _notifyClient = NotifyClient.Instance;

            Id = String.Format("{0}_{1}", TenantProvider.CurrentTenantID, (int)_entityType);

            _log = LogManager.GetLogger("ASC.CRM");
          
            if (!String.IsNullOrEmpty(importSettingsJSON))
                _importSettings = new ImportCSVSettings(importSettingsJSON);

        }

        #endregion

        #region Members

        private readonly ILog _log;

        private readonly IDataStore _dataStore;

        private readonly IAccount _author;

        private readonly NotifyClient _notifyClient;

        private readonly int _tenantID;

        private readonly DaoFactory _daoFactory;

        private readonly String _CSVFileURI;

        private readonly ImportCSVSettings _importSettings;

        private readonly EntityType _entityType;
      
        private String[] _columns;
     
        #endregion

        public override bool Equals(object obj)
        {
            if (obj == null) return false;
            if (!(obj is ImportDataOperation)) return false;

            var dataOperation = (ImportDataOperation)obj;

            if (_tenantID == dataOperation._tenantID && _entityType == dataOperation._entityType) return true;

            return base.Equals(obj);
        }

        public override int GetHashCode()
        {
            return _tenantID.GetHashCode() + _entityType.GetHashCode();
        }

        public object Clone()
        {
            var cloneObj = new ImportDataOperation();

            cloneObj.Error = Error;
            cloneObj.Id = Id;
            cloneObj.IsCompleted = IsCompleted;
            cloneObj.Percentage = Percentage;
            cloneObj.Status = Status;

            return cloneObj;
        }

        #region Property

        public object Id { get; set; }

        public object Status { get; set; }

        public object Error { get; set; }

        public double Percentage { get; set; }

        public bool IsCompleted { get; set; }

        #endregion

        private String GetPropertyValue(String propertyName)
        {
            if (_importSettings.ColumnMapping[propertyName] == null) return String.Empty;
         
            var values =
                _importSettings.ColumnMapping[propertyName].Values<int>().ToList().ConvertAll(columnIndex => _columns[columnIndex]);
            
            values.RemoveAll(item => item == String.Empty);

            return String.Join(",", values.ToArray());

        }

        private void Complete()
        {
            IsCompleted = true;

            Percentage = 100;

            _log.Debug("Import is completed");

            _notifyClient.SendAboutImportCompleted(_author.ID);

        }

        public void RunJob()
        {
            CoreContext.TenantManager.SetCurrentTenant(_tenantID);

            SecurityContext.AuthenticateMe(_author);

            var userCulture = CoreContext.UserManager.GetUsers(SecurityContext.CurrentAccount.ID).GetCulture();

            System.Threading.Thread.CurrentThread.CurrentCulture = userCulture;
            System.Threading.Thread.CurrentThread.CurrentUICulture = userCulture;
            
            //Fake http context allows fearlessly use shared DbManager.
            bool fakeContext = HttpContext.Current == null;
            
            try
            {
                if (fakeContext)
                {
                    HttpContext.Current = new HttpContext(
                        new HttpRequest("fake", CommonLinkUtility.GetFullAbsolutePath(PathProvider.BaseAbsolutePath), string.Empty),
                        new HttpResponse(new StringWriter()));
                }

                switch (_entityType)
                {
                    case EntityType.Contact:
                        ImportContactsData();
                        break;
                    case EntityType.Opportunity:
                        ImportOpportunityData();
                        break;
                    case EntityType.Case:
                        ImportCaseData();
                        break;
                    case EntityType.Task:
                        ImportTaskData();
                        break;
                    default:
                        throw new ArgumentException("entity type is unknown");
                }
            }
            finally
            {
                if (fakeContext && HttpContext.Current != null)
                {
                    new DisposableHttpContext(HttpContext.Current).Dispose();
                    HttpContext.Current = null;
                }
            }
        }

    }

    public class ImportFromCSV
    {
        #region Members

        private static readonly Object _syncObj = new Object();

        private static readonly ProgressQueue _importQueue = new ProgressQueue(1, TimeSpan.FromSeconds(15), true);

        public static readonly int MaxRoxCount = 10000;

        #endregion

        public static int GetQuotas()
        {
            return MaxRoxCount;
        }

        public static CsvReader CreateCsvReaderInstance(Stream CSVFileStream, ImportCSVSettings importCsvSettings)
        {

            var result = new CsvReader(
              new StreamReader(CSVFileStream, importCsvSettings.Encoding, true),
              importCsvSettings.HasHeader, importCsvSettings.DelimiterCharacter, importCsvSettings.QuoteType, '"', '#', ValueTrimmingOptions.UnquotedOnly);

            result.SkipEmptyLines = true;
            result.SupportsMultiline = true;
            result.DefaultParseErrorAction = ParseErrorAction.AdvanceToNextLine;
            result.MissingFieldAction = MissingFieldAction.ReplaceByEmpty;

            return result;
        }

        public static String GetRow(Stream CSVFileStream, int index, String jsonSettings)
        {
            var importCSVSettings = new ImportCSVSettings(jsonSettings);

            using (CsvReader csv = CreateCsvReaderInstance(CSVFileStream, importCSVSettings))
            {
         

                int countRows = 0;

                index++;

                while (countRows++ != index && csv.ReadNextRecord()) ;

                return new JObject(new JProperty("data", new JArray(csv.GetCurrentRowFields(false).ToArray())),
                                   new JProperty("isMaxIndex", csv.EndOfStream)).ToString();
            }
        }

        public static JObject GetInfo(Stream CSVFileStream, String jsonSettings)
        {
            var importCSVSettings = new ImportCSVSettings(jsonSettings);

            using (CsvReader csv = CreateCsvReaderInstance(CSVFileStream, importCSVSettings))
            {
                csv.ReadNextRecord();
                
                var firstRowFields = csv.GetCurrentRowFields(false);

                String[] headerRowFields =  csv.GetFieldHeaders().ToArray();

                if (!importCSVSettings.HasHeader)
                    headerRowFields = firstRowFields;
               
                return new JObject(
                    new JProperty("headerColumns", new JArray(headerRowFields)),
                    new JProperty("firstContactFields", new JArray(firstRowFields)),
                    new JProperty("isMaxIndex", csv.EndOfStream)
                    );

            }
        }

        public static IProgressItem GetStatus(EntityType entityType)
        {
            return _importQueue.GetStatus(String.Format("{0}_{1}", TenantProvider.CurrentTenantID, (int)entityType));
        }

        public static IProgressItem Start(EntityType entityType, String CSVFileURI, String importSettingsJSON)
        {

            lock (_syncObj)
            {

                var operation = GetStatus(entityType);

                if (operation == null)
                {

                    operation = new ImportDataOperation(entityType, CSVFileURI, importSettingsJSON);

                    _importQueue.Add(operation);
                }

                if (!_importQueue.IsStarted)
                    _importQueue.Start(x => x.RunJob());

                return operation;

            }
        }
    }
}