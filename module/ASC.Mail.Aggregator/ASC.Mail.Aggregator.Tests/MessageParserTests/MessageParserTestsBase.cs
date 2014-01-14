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

using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Linq;
using System.Xml;
using System.Xml.Serialization;
using ActiveUp.Net.Mail;
using NUnit.Framework;

namespace ASC.Mail.Aggregator.Tests.MessageParserTests
{
    internal class MessageParserTestsBase
    {
        protected const string test_folder_path = @"..\..\Data\";
        protected const string right_parser_results_path = @"..\..\Right_Parsing\";
        protected const string test_results_path = @"..\..\Out_Eml\";

        protected readonly string utf8_charset = Encoding.UTF8.HeaderName;

        protected void CreateRightResult(Message eml_message, string out_file_path)
        {
            var result = new RightParserResult();
            result.From = new TestAddress();

            result.From.Email = eml_message.From.Email;
            result.From.Name = eml_message.From.Name;

            result.To = new List<TestAddress>();
            foreach (var to_adresses in eml_message.To)
            {
                result.To.Add(new TestAddress {Name = to_adresses.Name, Email = to_adresses.Email});
            }

            result.Cc = new List<TestAddress>();
            foreach (var cc_adresses in eml_message.Cc)
            {
                result.Cc.Add(new TestAddress {Name = cc_adresses.Name, Email = cc_adresses.Email});
            }

            result.Subject = eml_message.Subject;
            result.AttachmentCount = eml_message.Attachments.Count;
            result.UnknownPatsCount = eml_message.UnknownDispositionMimeParts.Count;

            result.HtmlBody = eml_message.BodyHtml.Text;
            result.HtmlCharset = eml_message.BodyHtml.Charset;
            result.HtmlEncoding = eml_message.BodyHtml.ContentTransferEncoding;

            result.TextBody = eml_message.BodyText.Text;
            result.TextCharset = eml_message.BodyText.Charset;
            result.TextEncoding = eml_message.BodyText.ContentTransferEncoding;

            result.ToXml(out_file_path);
        }

        protected void Test(string eml_file_name)
        {
            var eml_message = Parser.ParseMessageFromFile(test_folder_path + eml_file_name);
            var right_result = RightParserResult.FromXml(right_parser_results_path + eml_file_name.Replace(".eml", ".xml"));
#if NEED_OUT
            eml_message.StoreToFile(test_results_path + eml_file_name);
#endif
            Assert.AreEqual(right_result.From.Email, eml_message.From.Email);
            Assert.AreEqual(right_result.From.Name, eml_message.From.Name);
            Assert.AreEqual(right_result.To.Count, eml_message.To.Count);

            var to_enumerator = eml_message.To.OrderBy(x => x.Email).GetEnumerator();
            foreach (var adress in right_result.To.OrderBy(x => x.Email))
            {
                to_enumerator.MoveNext();
                Assert.AreEqual(adress.Email, to_enumerator.Current.Email);
                Assert.AreEqual(adress.Name, to_enumerator.Current.Name);
            }

            var cc_enumerator = eml_message.Cc.OrderBy(x=>x.Email).GetEnumerator();
            foreach (var adress in right_result.Cc.OrderBy(x=>x.Email))
            {
                cc_enumerator.MoveNext();
                Assert.AreEqual(adress.Email, cc_enumerator.Current.Email);
                Assert.AreEqual(adress.Name, cc_enumerator.Current.Name);
            }

            Assert.AreEqual(right_result.Subject, eml_message.Subject);
            Assert.AreEqual(right_result.AttachmentCount, eml_message.Attachments.Count);
            Assert.AreEqual(right_result.UnknownPatsCount, eml_message.UnknownDispositionMimeParts.Count);

            //Replace needed for correct file loading
            Assert.AreEqual(right_result.HtmlBody, eml_message.BodyHtml.Text);
            Assert.AreEqual(right_result.HtmlEncoding, eml_message.BodyHtml.ContentTransferEncoding);
            Assert.AreEqual(right_result.HtmlCharset, eml_message.BodyHtml.Charset);

            Assert.AreEqual(right_result.TextBody, eml_message.BodyText.Text);
            Assert.AreEqual(right_result.TextCharset, eml_message.BodyText.Charset);
            Assert.AreEqual(right_result.TextEncoding, eml_message.BodyText.ContentTransferEncoding);
        }
    }


    public class TestAddress
    {
        public string Email { get; set; }
        public string Name { get; set; }
    }


    public class RightParserResult
    {
        public TestAddress From { get; set; }
        public List<TestAddress> To { get; set; }
        public List<TestAddress> Cc { get; set; }
        public string Subject { get; set; }

        public ContentTransferEncoding TextEncoding { get; set; }
        public string TextCharset { get; set; }
        public string TextBody { get; set; }
        public ContentTransferEncoding HtmlEncoding { get; set; }
        public string HtmlCharset { get; set; }
        public string HtmlBody { get; set; }

        public int AttachmentCount { get; set; }
        public int UnknownPatsCount { get; set; }


        public void ToXml(string file_path)
        {
            var settings = new XmlWriterSettings();
            settings.NewLineHandling = NewLineHandling.None;
            settings.Indent = false;

            var serializer = new XmlSerializer(typeof (RightParserResult));
            using (var text_writer = XmlWriter.Create(new StreamWriter(file_path), settings))
            {
                serializer.Serialize(text_writer, this);
            }
        }


        public static RightParserResult FromXml(string file_path)
        {
            var deserializer = new XmlSerializer(typeof (RightParserResult));
            RightParserResult result;
            using (var text_reader = new XmlTextReader(new StreamReader(file_path)))
            {
                text_reader.Normalization = false;
                result = (RightParserResult) deserializer.Deserialize(text_reader);
            }

            return result;
        }
    }
}