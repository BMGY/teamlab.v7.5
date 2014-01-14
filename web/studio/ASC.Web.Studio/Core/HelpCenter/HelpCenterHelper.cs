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
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Web.Configuration;
using ASC.Data.Storage;
using ASC.Web.Core.Client;
using ASC.Web.Core.Users;
using ASC.Web.Studio.Utility;
using HtmlAgilityPack;
using log4net;

namespace ASC.Web.Studio.Core.HelpCenter
{
    public class HelpCenterHelper
    {
        #region VideoGuide

        public static List<VideoGuideItem> GetVideoGuides()
        {
            var data = GetVideoGuidesAll();

            var wathced = UserVideoSettings.GetUserVideoGuide();
            data.RemoveAll(r => wathced.Contains(r.Id));

            if (!UserHelpTourHelper.IsNewUser)
                data.RemoveAll(r => r.Status == "default");

            return data;
        }

        private static List<VideoGuideItem> GetVideoGuidesAll()
        {
            var url = CommonLinkUtility.GetHelpLink(true) + "video.aspx";

            VideoGuideData videoGuideData = null;

            var storageData = VideoGuideStorage.GetVideoGuide() ?? new Dictionary<string, VideoGuideData>();

            if (storageData.ContainsKey(url))
            {
                videoGuideData = storageData[url];
            }

            if (videoGuideData != null && String.CompareOrdinal(videoGuideData.ResetCacheKey, ClientSettings.ResetCacheKey) != 0)
            {
                videoGuideData = null;
            }

            if (videoGuideData == null)
            {
                var html = SendRequest(url);
                var data = ParseVideoGuideHtml(html);

                videoGuideData = new VideoGuideData();
                if (data.Any())
                {
                    videoGuideData.ListItems = data;
                    videoGuideData.ResetCacheKey = ClientSettings.ResetCacheKey;

                    storageData.Remove(url);
                    storageData.Add(url, videoGuideData);
                    VideoGuideStorage.UpdateVideoGuide(storageData);
                }
            }

            return videoGuideData.ListItems ?? new List<VideoGuideItem>();
        }

        private static List<VideoGuideItem> ParseVideoGuideHtml(string html)
        {
            var data = new List<VideoGuideItem>();

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var titles = doc.DocumentNode.SelectNodes("//div[@class='MainHelpCenter PageVideo']//li");

            if (titles == null || titles.Count(a => a.Attributes["id"] != null) != titles.Count() || !titles.Elements("a").Any()) return data;

            var helpLinkBlock = CommonLinkUtility.GetHelpLink(false);

            var needTitles = titles.Where(x =>
                                          x.Attributes["data-status"] != null
                                          && (x.Attributes["data-status"].Value == "new" || x.Attributes["data-status"].Value == "default")).ToList();

            foreach (var needTitle in needTitles)
            {
                var title = needTitle.SelectSingleNode(".//span[@class='link_to_video']").InnerText;
                var id = needTitle.Attributes["id"].Value;
                var link = helpLinkBlock + needTitle.Element("a").Attributes["href"].Value.Substring(1);
                var status = needTitle.Attributes["data-status"].Value;

                data.Add(new VideoGuideItem { Title = title, Id = id, Link = link, Status = status });
            }
            return data;
        }

        #endregion

        #region GettingStarted

        public static List<HelpCenterItem> GetHelpCenter(string module, string helpLinkBlock)
        {
            var url = CommonLinkUtility.GetHelpLink(true) + "gettingstarted/" + module;

            HelpCenterData helpCenterData = null;

            var storageData = HelpCenterStorage.GetHelpCenter() ?? new Dictionary<string, HelpCenterData>();

            if (storageData.ContainsKey(url))
            {
                helpCenterData = storageData[url];
            }

            if (helpCenterData != null && String.CompareOrdinal(helpCenterData.ResetCacheKey, ClientSettings.ResetCacheKey) != 0)
            {
                helpCenterData = null;
            }

            if (helpCenterData == null)
            {
                var html = SendRequest(url);
                var data = ParseHelpCenterHtml(html, helpLinkBlock);

                helpCenterData = new HelpCenterData();
                if (data.Any())
                {
                    helpCenterData.ListItems = data;
                    helpCenterData.ResetCacheKey = ClientSettings.ResetCacheKey;

                    storageData.Remove(url);
                    storageData.Add(url, helpCenterData);
                    HelpCenterStorage.UpdateHelpCenter(storageData);
                }
            }

            return helpCenterData.ListItems ?? new List<HelpCenterItem>();
        }

        private static List<HelpCenterItem> ParseHelpCenterHtml(string html, string helpLinkBlock)
        {
            var helpCenterItems = new List<HelpCenterItem>();

            if (string.IsNullOrEmpty(html)) return helpCenterItems;

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var urlHelp = CommonLinkUtility.GetHelpLink(false);
            var mainContent = doc.DocumentNode.SelectSingleNode("//div[@class='MainHelpCenter GettingStarted']");

            if (mainContent == null) return helpCenterItems;

            var blocks = (mainContent.SelectNodes(".//div[@class='gs_content']"))
                .Where(r => r.Attributes["id"] != null)
                .Select(x => x.Attributes["id"].Value).ToList();

            foreach (var block in mainContent.SelectNodes(".//div[@class='gs_content']"))
            {
                var hrefs = block.SelectNodes(".//a[@href]")
                                 .Where(r =>
                                            {
                                                var value = r.Attributes["href"].Value;
                                                return r.Attributes["href"] != null
                                                       && !string.IsNullOrEmpty(value)
                                                       && !value.StartsWith("mailto:")
                                                       && !value.StartsWith("http");
                                            });

                foreach (var href in hrefs)
                {
                    var value = href.Attributes["href"].Value;

                    if (value.IndexOf("#", StringComparison.Ordinal) != 0 && value.Length > 1)
                    {
                        href.Attributes["href"].Value = urlHelp + value.Substring(1);
                        href.SetAttributeValue("target", "_blank");
                    }
                    else
                    {
                        if (!blocks.Contains(value.Substring(1))) continue;

                        href.Attributes["href"].Value = helpLinkBlock + blocks.IndexOf(value.Substring(1)).ToString(CultureInfo.InvariantCulture);
                    }
                }

                var images = block.SelectNodes(".//img");
                if (images != null)
                {
                    foreach (var img in images.Where(img => img.Attributes["src"] != null))
                    {
                        img.Attributes["src"].Value = GetInternalLink(urlHelp + img.Attributes["src"].Value);
                    }

                    foreach (var screenPhoto in images.Where(img =>
                                                     img.Attributes["class"] != null && img.Attributes["class"].Value.Contains("screenphoto")
                                                     && img.Attributes["target"] != null && img.ParentNode != null))
                    {
                        var bigphotoScreenId = screenPhoto.Attributes["target"].Value;

                        var bigphotoScreen = images.FirstOrDefault(img =>
                                                             img.Attributes["id"] != null && img.Attributes["id"].Value == bigphotoScreenId
                                                             && img.Attributes["class"] != null && img.Attributes["class"].Value.Contains("bigphoto_screen")
                                                             && img.Attributes["src"] != null);
                        if (bigphotoScreen == null) continue;

                        var hrefNode = doc.CreateElement("a");
                        var hrefAttribute = doc.CreateAttribute("href");
                        hrefAttribute.Value = bigphotoScreen.Attributes["src"].Value;
                        hrefNode.Attributes.Append(hrefAttribute);

                        hrefAttribute = doc.CreateAttribute("class");
                        hrefAttribute.Value = "screenzoom";
                        hrefNode.Attributes.Append(hrefAttribute);

                        hrefAttribute = doc.CreateAttribute("rel");
                        hrefAttribute.Value = "imageHelpCenter";
                        hrefNode.Attributes.Append(hrefAttribute);

                        screenPhoto.ParentNode.ReplaceChild(hrefNode, screenPhoto);
                        hrefNode.AppendChild(screenPhoto);
                    }
                }

                var titles = block.SelectSingleNode(".//h2");
                var contents = block.SelectSingleNode(".//div[@class='PortalHelp']");

                if (titles != null && contents != null)
                {
                    helpCenterItems.Add(new HelpCenterItem { Title = titles.InnerText, Content = contents.InnerHtml });
                }
            }
            return helpCenterItems;
        }

        private static string GetInternalLink(string externalUrl)
        {
            if ((WebConfigurationManager.AppSettings["web.help-center.internal-uri"] ?? "true") != "true")
                return externalUrl;

            try
            {
                externalUrl = externalUrl.ToLower().Trim();
                var imagePath = ClientSettings.StorePath + "/helpcenter/" + externalUrl.GetHashCode().ToString(CultureInfo.InvariantCulture);
                imagePath += FileUtility.GetFileExtension(externalUrl);

                const string storageName = "common_static";
                var storage = StorageFactory.GetStorage("-1", storageName);

                if (storage.IsFile(imagePath))
                    return storage.GetUri(imagePath).ToString();

                var req = (HttpWebRequest)WebRequest.Create(externalUrl);
                using (var fileStream = req.GetResponse().GetResponseStream().GetBuffered())
                {
                    return storage.Save(imagePath, fileStream).ToString();
                }
            }
            catch (Exception e)
            {
                LogManager.GetLogger("HelpCenter").Error(e.Message);
            }
            return externalUrl;
        }

        #endregion

        private static String SendRequest(string url)
        {
            try
            {
                var httpWebRequest = (HttpWebRequest)WebRequest.Create(url);

                httpWebRequest.AllowAutoRedirect = false;
                httpWebRequest.Method = "GET";

                using (var httpWebResponse = (HttpWebResponse)httpWebRequest.GetResponse())
                using (var stream = httpWebResponse.GetResponseStream())
                using (var reader = new StreamReader(stream.GetBuffered(), Encoding.GetEncoding(httpWebResponse.CharacterSet)))
                {
                    return reader.ReadToEnd();
                }
            }
            catch (Exception exception)
            {
                LogManager.GetLogger("ASC.Web").Error(string.Format("HelpCenter is not avaliable by url {0}", url), exception);
            }
            return "";
        }
    }
}