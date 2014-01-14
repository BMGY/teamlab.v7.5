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
using System.Security.Authentication;
using ASC.Api.Attributes;
using ASC.Api.Interfaces;
using ASC.Api.Utils;
using ASC.Core;
using ASC.Core.Users;
using ASC.Security.Cryptography;
using ASC.Web.Studio.Core.SMS;

namespace ASC.Specific.AuthorizationApi
{
    /// <summary>
    /// Authorization for api
    /// </summary>
    public class AuthenticationEntryPoint : IApiEntryPoint
    {
        /// <summary>
        /// Entry point name
        /// </summary>
        public string Name
        {
            get { return "authentication"; }
        }

        /// <summary>
        /// Gets authentication token for use in api authorization
        /// </summary>
        /// <short>
        /// Get token
        /// </short>
        /// <param name="userName">user name or email</param>
        /// <param name="password">password</param>
        /// <returns>tokent to use in 'Authorization' header when calling API methods</returns>
        /// <exception cref="AuthenticationException">Thrown when not authenticated</exception>
        [Create(@"", false)] //NOTE: this method doesn't requires auth!!!
        public AuthenticationTokenData AuthenticateMe(string userName, string password)
        {
            userName.ThrowIfNull(new ArgumentException("userName empty", "userName"));
            password.ThrowIfNull(new ArgumentException("password empty", "password"));

            if (!StudioSmsNotificationSettings.IsVisibleSettings
                || !StudioSmsNotificationSettings.Enable)
            {
                var token = SecurityContext.AuthenticateMe(userName, password);
                if (string.IsNullOrEmpty(token))
                    throw new AuthenticationException("User authentication failed");
                return new AuthenticationTokenData
                    {
                        Token = token,
                        Expires = new ApiDateTime(DateTime.UtcNow.AddYears(1))
                    };
            }

            var user = GetUser(userName, password);

            if (string.IsNullOrEmpty(user.MobilePhone) || user.MobilePhoneActivationStatus == MobilePhoneActivationStatus.NotActivated)
                return new AuthenticationTokenData
                    {
                        Sms = true
                    };

            SmsManager.PutAuthCode(user, false);

            return new AuthenticationTokenData
                {
                    Sms = true,
                    PhoneNoise = SmsManager.BuildPhoneNoise(user.MobilePhone),
                    Expires = new ApiDateTime(DateTime.UtcNow.AddMinutes(10))
                };
        }

        /// <summary>
        /// Set mobile phone for user
        /// </summary>
        /// <param name="userName">user name or email</param>
        /// <param name="password">password</param>
        /// <param name="mobilePhone">new mobile phone</param>
        /// <returns>mobile phone</returns>
        [Create(@"setphone", false)] //NOTE: this method doesn't requires auth!!!
        public AuthenticationTokenData SaveMobilePhone(string userName, string password, string mobilePhone)
        {
            var user = GetUser(userName, password);
            mobilePhone = SmsManager.SaveMobilePhone(user, mobilePhone);

            return new AuthenticationTokenData
                {
                    Sms = true,
                    PhoneNoise = SmsManager.BuildPhoneNoise(mobilePhone)
                };
        }

        /// <summary>
        /// Send sms code again
        /// </summary>
        /// <param name="userName">user name or email</param>
        /// <param name="password">password</param>
        /// <returns>mobile phone</returns>
        [Create(@"sendsms", false)] //NOTE: this method doesn't requires auth!!!
        public AuthenticationTokenData SendSmsCode(string userName, string password)
        {
            var user = GetUser(userName, password);
            SmsManager.PutAuthCode(user, true);

            return new AuthenticationTokenData
                {
                    Sms = true,
                    PhoneNoise = SmsManager.BuildPhoneNoise(user.MobilePhone)
                };
        }

        /// <summary>
        /// Gets authentication token for use in api authorization
        /// </summary>
        /// <short>
        /// Get token
        /// </short>
        /// <param name="userName">user name or email</param>
        /// <param name="password">password</param>
        /// <param name="code">sms code</param>
        /// <returns>tokent to use in 'Authorization' header when calling API methods</returns>
        [Create(@"{code}", false)] //NOTE: this method doesn't requires auth!!!
        public AuthenticationTokenData AuthenticateMe(string userName, string password, string code)
        {
            var user = GetUser(userName, password);

            SmsManager.ValidateSmsCode(user, code);

            var token = SecurityContext.AuthenticateMe(user.ID);
            if (string.IsNullOrEmpty(token))
                throw new AuthenticationException("User authentication failed");

            return new AuthenticationTokenData
                {
                    Token = token,
                    Expires = new ApiDateTime(DateTime.UtcNow.AddYears(1)),
                    Sms = true,
                    PhoneNoise = SmsManager.BuildPhoneNoise(user.MobilePhone)
                };
        }

        private static UserInfo GetUser(string userName, string password)
        {
            var user = CoreContext.UserManager.GetUsers(
                CoreContext.TenantManager.GetCurrentTenant().TenantId,
                userName,
                Hasher.Base64Hash(password, HashAlg.SHA256));

            if (user == null || Equals(user, Constants.LostUser))
                throw new AuthenticationException("User authentication failed");

            return user;
        }
    }
}