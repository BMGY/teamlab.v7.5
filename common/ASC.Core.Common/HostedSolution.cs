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
using System.Linq;
using System.Security;
using ASC.Core.Billing;
using ASC.Core.Data;
using ASC.Core.Security.Authentication;
using ASC.Core.Tenants;
using ASC.Core.Users;
using ASC.Security.Cryptography;

namespace ASC.Core
{
    public class HostedSolution
    {
        private readonly ITenantService tenantService;
        private readonly IUserService userService;
        private readonly IQuotaService quotaService;
        private readonly ITariffService tariffService;
        private readonly ClientTenantManager clientTenantManager;

        public string Region
        {
            get;
            private set;
        }

        public string DbId
        {
            get;
            private set;
        }


        public HostedSolution(ConnectionStringSettings connectionString)
            : this(connectionString, null)
        {
        }

        public HostedSolution(ConnectionStringSettings connectionString, string region)
        {
            tenantService = new DbTenantService(connectionString);
            userService = new DbUserService(connectionString);
            quotaService = new DbQuotaService(connectionString);
            tariffService = new TariffService(connectionString, quotaService, tenantService);
            clientTenantManager = new ClientTenantManager(tenantService, quotaService, tariffService);
            Region = region ?? string.Empty;
            DbId = connectionString.Name;
        }

        public List<Tenant> GetTenants(DateTime from)
        {
            return tenantService.GetTenants(from).Select(t => AddRegion(t)).ToList();
        }

        public List<Tenant> FindTenants(string login)
        {
            return FindTenants(login, null);
        }

        public List<Tenant> FindTenants(string login, string password)
        {
            var hash = !string.IsNullOrEmpty(password) ? Hasher.Base64Hash(password, HashAlg.SHA256) : null;
            if (hash != null && userService.GetUser(Tenant.DEFAULT_TENANT, login, hash) == null)
            {
                throw new SecurityException("Invalid login or password.");
            }
            return tenantService.GetTenants(login, hash).Select(t => AddRegion(t)).ToList();
        }

        public Tenant GetTenant(String domain)
        {
            return AddRegion(tenantService.GetTenant(domain));
        }

        public Tenant GetTenant(int id)
        {
            return AddRegion(tenantService.GetTenant(id));
        }

        public void CheckTenantAddress(string address)
        {
            tenantService.ValidateDomain(address);
        }

        public string RegisterTenant(TenantRegistrationInfo ri, out Tenant tenant)
        {
            tenant = null;

            if (ri == null) throw new ArgumentNullException("registrationInfo");
            if (string.IsNullOrEmpty(ri.Name)) throw new Exception("Community name can not be empty");
            if (string.IsNullOrEmpty(ri.Address)) throw new Exception("Community address can not be empty");

            if (string.IsNullOrEmpty(ri.Email)) throw new Exception("Account email can not be empty");
            if (string.IsNullOrEmpty(ri.FirstName)) throw new Exception("Account firstname can not be empty");
            if (string.IsNullOrEmpty(ri.LastName)) throw new Exception("Account lastname can not be empty");
            if (string.IsNullOrEmpty(ri.Password)) ri.Password = Crypto.GeneratePassword(6);

            // create tenant
            tenant = new Tenant(ri.Address.ToLowerInvariant())
            {
                Name = ri.Name,
                Language = ri.Culture.Name,
                TimeZone = ri.TimeZoneInfo,
                HostedRegion = ri.HostedRegion,
                PartnerId = ri.PartnerId
            };

            tenant = tenantService.SaveTenant(tenant);

            // create user
            var user = new UserInfo()
            {
                UserName = ri.Email.Substring(0, ri.Email.IndexOf('@')),
                LastName = ri.LastName,
                FirstName = ri.FirstName,
                Email = ri.Email,
                MobilePhone = ri.MobilePhone
            };
            user = userService.SaveUser(tenant.TenantId, user);
            userService.SetUserPassword(tenant.TenantId, user.ID, ri.Password);
            userService.SaveUserGroupRef(tenant.TenantId, new UserGroupRef(user.ID, Constants.GroupAdmin.ID, UserGroupRefType.Contains));

            // save tenant owner
            tenant.OwnerId = user.ID;
            tenant = tenantService.SaveTenant(tenant);

            return CreateAuthenticationCookie(tenant.TenantId, user.ID);
        }

        public Tenant SaveTenant(Tenant tenant)
        {
            return tenantService.SaveTenant(tenant);
        }

        public string CreateAuthenticationCookie(int tenantId, string login, string password)
        {
            var passwordhash = Hasher.Base64Hash(password, HashAlg.SHA256);
            var u = userService.GetUser(tenantId, login, passwordhash);
            return u != null ? CookieStorage.EncryptCookie(tenantId, u.ID, login, passwordhash) : null;
        }

        public string CreateAuthenticationCookie(int tenantId, Guid userId)
        {
            var u = userService.GetUser(tenantId, userId);
            var password = userService.GetUserPassword(tenantId, userId);
            var passwordhash = Hasher.Base64Hash(password, HashAlg.SHA256);
            return u != null ? CookieStorage.EncryptCookie(tenantId, userId, u.Email, passwordhash) : null;
        }

        public Tariff GetTariff(int tenant, bool withRequestToPaymentSystem = true)
        {
            return tariffService.GetTariff(tenant, withRequestToPaymentSystem);
        }

        public TenantQuota GetTenantQuota(int tenant)
        {
            return clientTenantManager.GetTenantQuota(tenant);
        }

        public void SetTariff(int tenant, bool paid)
        {
            var quota = quotaService.GetTenantQuotas().FirstOrDefault(q => paid ? q.NonProfit : q.Trial);
            if (quota != null)
            {
                tariffService.SetTariff(tenant, new Tariff { QuotaId = quota.Id, DueDate = DateTime.MaxValue, });
            }
        }

        public void SetTariff(int tenant, Tariff tariff)
        {
            tariffService.SetTariff(tenant, tariff);
        }


        private Tenant AddRegion(Tenant tenant)
        {
            if (tenant != null)
            {
                tenant.HostedRegion = Region;
            }
            return tenant;
        }
    }
}