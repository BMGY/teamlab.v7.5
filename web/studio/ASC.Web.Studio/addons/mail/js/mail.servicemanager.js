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

if (typeof window.serviceManager === 'undefined') {
    var xmlEncode = function(s) {
        return s.replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
    };

    window.serviceManager = (function($) {
        var is_init = false;

        var getNodeContent = function(o) {
            if (!o || typeof o !== 'object') {
                return '';
            }
            return o.text || o.textContent || (function() {
                var 
                    result = '',
                    childrens = o.childNodes;
                if (!childrens) {
                    return result;
                }
                for (var i = 0, n = childrens.length; i < n; i++) {
                    var child = childrens.item(i);
                    switch (child.nodeType) {
                        case 1:
                        case 5:
                            result += arguments.callee(child);
                            break;
                        case 3:
                        case 2:
                        case 4:
                            result += child.nodeValue;
                            break;
                        default:
                            break;
                    }
                }
                return result;
            })(o);
        };

        var init = function(timeout_ms) {
            if (true === is_init)
                return;

            is_init = true;

            setInterval(function() {
                updateFolders(undefined, TMMail.messages_modify_date, TMMail.GetFolderModifyDate(MailFilter.getFolder()));
            }, timeout_ms);
        };

        var bind = function(event, handler) {
            return window.Teamlab.bind(event, handler);
        };

        var unbind = function() {
            return window.Teamlab.unbind.apply(this, arguments);
        };

        var _hideCallback = function() {
            window.LoadingBanner.hideLoading();
        };

        var _wrapHideCallback = function(orig) {
            return function() {
                window.LoadingBanner.hideLoading();
                orig.apply(this, arguments);
            };
        };

        var _wrapper = function(params_count, orig) {
            return function() {
                var loading_message = arguments.length > params_count ? arguments[arguments.length - 1] : undefined;

                if (loading_message) {
                    ASC.Mail.hintManager.hide();
                    window.LoadingBanner.strLoading = loading_message;
                    window.LoadingBanner.displayMailLoading(true, true);

                    var options = arguments[arguments.length - 2] || {};
                    options.success = options.hasOwnProperty('success') && typeof options.success === 'function' ? _wrapHideCallback(options.success) : _hideCallback;
                    options.error = options.hasOwnProperty('error') && typeof options.error === 'function' ? _wrapHideCallback(options.error) : _hideCallback;
                }
                return orig.apply(this, arguments);
            };
        };

        var updateFolders = function(loading_message, messages_modify_date, folder_modify_date) {
            var options = {};
            if (loading_message) {
                ASC.Mail.hintManager.hide();
                window.LoadingBanner.strLoading = loading_message;
                window.LoadingBanner.displayMailLoading(true, true);

                options.success = _hideCallback;
                options.error = _hideCallback;
            }

            if (!messages_modify_date)
                messages_modify_date = new Date(0);

            if (!folder_modify_date)
                folder_modify_date = new Date(0);

            window.Teamlab.getMailFilteredConversations({ folder_id: MailFilter.getFolder() },
                    $.extend({}, MailFilter.toData(), { last_check_date: folder_modify_date }),
                    {});
            window.Teamlab.getMailFolders({}, messages_modify_date, {});
            window.Teamlab.getMailMessagesModifyDate({}, {});
            window.Teamlab.getMailFolderModifyDate({ folder_id: MailFilter.getFolder() }, MailFilter.getFolder(), options);
        };

        var getTags = _wrapper(2, function(params, options) {
            window.Teamlab.getMailTags(params, options);
        });

        var createTag = _wrapper(5, function(name, style, addresses, params, options) {
            window.Teamlab.createMailTag(params, name, style, addresses, options);
        });

        var updateTag = _wrapper(6, function(id, name, style, addresses, params, options) {
            window.Teamlab.updateMailTag(params, id, name, style, addresses, options);
        });

        var deleteTag = _wrapper(3, function(id, params, options) {
            window.Teamlab.removeMailTag(params, id, options);
        });

        var setTag = _wrapper(4, function(message_ids, tagId, params, options) {
            window.Teamlab.setMailTag(params, message_ids, tagId, options);
        });

        var setConverstationsTag = _wrapper(4, function (message_ids, tagId, params, options) {
            window.Teamlab.setMailConversationsTag(params, message_ids, tagId, options);
        });

        var unsetTag = _wrapper(4, function(message_ids, tagId, params, options) {
            window.Teamlab.unsetMailTag(params, message_ids, tagId, options);
        });

        var unsetConverstationsTag = _wrapper(4, function(message_ids, tagId, params, options) {
            window.Teamlab.unsetMailConversationsTag(params, message_ids, tagId, options);
        });

        var getMailAccounts = _wrapper(2, function(params, options) {
            window.Teamlab.getMailAccounts(params, options);
        });

        var getState = _wrapper(2, function(params, options) {
            window.Teamlab.getMailTags(params, options);
            window.Teamlab.getMailAccounts(params, options);
            window.Teamlab.getMailFolders(params, TMMail.messages_modify_date, options);
        });

        var createBox = _wrapper(19, function(name, email, pop3_account, pop3_password, pop3_port, pop3_server,
            smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, incoming_encyption_type,
            outcoming_encryption_type, auth_type_in, auth_type_smtp, params, options) {
            window.Teamlab.createMailMailbox(params, name, email, pop3_account, pop3_password, pop3_port, pop3_server,
                smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, incoming_encyption_type,
            outcoming_encryption_type, auth_type_in, auth_type_smtp, options);
        });

        var createMinBox = _wrapper(4, function(email, password, params, options) {
            window.Teamlab.createMailMailboxSimple(params, email, password, options);
        });

        var createOAuthBox = _wrapper(5, function(email, refreshToken, serviceType, params, options) {
            window.Teamlab.createMailMailboxOAuth(params, email, refreshToken, serviceType, options);
        });

        var getDefaultMailboxSettings = _wrapper(3, function(email, params, options) {
            window.Teamlab.getMailDefaultMailboxSettings(params, email, options);
        });

        var updateBox = _wrapper(19, function(name, email, pop3_account, pop3_password, pop3_port, pop3_server,
            smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, begin_date, incoming_encyption_type,
            outcoming_encryption_type, auth_type_in, auth_type_smtp, params, options) {
            window.Teamlab.updateMailMailbox(params, name, email, pop3_account, pop3_password, pop3_port, pop3_server,
                smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, begin_date, incoming_encyption_type,
            outcoming_encryption_type, auth_type_in, auth_type_smtp, options);
        });

        var setMailboxState = _wrapper(4, function(email, state, params, options) {
            window.Teamlab.setMailMailboxState(params, email, state, options);
        });

        var removeBox = _wrapper(3, function(email, params, options) {
            window.Teamlab.removeMailMailbox(params, email, options);
        });

        var getBox = _wrapper(3, function(email, params, options) {
            window.Teamlab.getMailMailbox(params, email, options);
        });

        var getMailFolders = _wrapper(2, function(params, options) {
            window.Teamlab.getMailFolders(params, new Date(0), options);
        });

        var getMessage = _wrapper(5, function(id, unblocked, is_need_to_sanitize_html, params, options) {
            var data = {};
            data.unblocked = unblocked;
            data.is_need_to_sanitize_html = is_need_to_sanitize_html;
            window.Teamlab.getMailMessage(params, id, data, options);
        });

        var getLinkedCrmEntitiesInfo = _wrapper(3, function (id, params, options) {
            var data = {};
            data.message_id = id;
            window.Teamlab.getLinkedCrmEntitiesInfo(params, data, options);
        });

        var getConversation = _wrapper(4, function(id, load_all_content, params, options) {
            window.Teamlab.getMailConversation(params, id, load_all_content, options);
        });


        var getNextMessageId = _wrapper(3, function(prev_message_id, params, options) {
            Teamlab.getNextMailMessageId(params, prev_message_id, MailFilter.toData(), options);
        });

        var getPrevMessageId = _wrapper(3, function(next_message_id, params, options) {
            Teamlab.getPrevMailMessageId(params, next_message_id, MailFilter.toData(), options);
        });


        var getNextConversationId = _wrapper(3, function(prev_message_id, params, options) {
            Teamlab.getNextMailConversationId(params, prev_message_id, MailFilter.toData(), options);
        });

        var getPrevConversationId = _wrapper(3, function(next_message_id, params, options) {
            Teamlab.getPrevMailConversationId(params, next_message_id, MailFilter.toData(), options);
        });


        var getMessageTemplate = _wrapper(2, function(params, options) {
            window.Teamlab.getMailMessageTemplate(params, options);
        });

        var generateGuid = _wrapper(2, function(params, options) {
            window.Teamlab.getMailRandomGuid(params, options);
        });

        var sendMessage = _wrapper(14, function(id, from, subject, to, cc, bcc, body, attachments,
            streamId, replyToId, importance, tags, params, options) {
            window.Teamlab.sendMailMessage(params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options);
        });

        var saveMessage = _wrapper(14, function(id, from, subject, to, cc, bcc, body, attachments,
            streamId, replyToId, importance, tags, params, options) {
            window.Teamlab.saveMailMessage(params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options);
        });

        // possible 'status' values: read/unread/important/normal
        var markMessages = _wrapper(4, function(ids, status, params, options) {
            window.Teamlab.markMailMessages(params, ids, status, options);
        });

        // possible 'status' values: read/unread/important/normal
        var markConversations = _wrapper(4, function(ids, status, params, options) {
            window.Teamlab.markMailConversations(params, ids, status, options);
        });

        var moveMailMessages = _wrapper(4, function(ids, toFolder, params, options) {
            window.Teamlab.moveMailMessages(params, ids, toFolder, options);
        });

        var moveMailConversations = _wrapper(4, function(ids, toFolder, params, options) {
            window.Teamlab.moveMailConversations(params, ids, toFolder, options);
        });

        var restoreMailMessages = _wrapper(3, function(ids, params, options) {
            window.Teamlab.restoreMailMessages(params, ids, options);
        });

        var restoreMailConversations = _wrapper(3, function(ids, params, options) {
            window.Teamlab.restoreMailConversations(params, ids, options);
        });

        var deleteMessages = _wrapper(3, function(ids, params, options) {
            window.Teamlab.removeMailMessages(params, ids, options);
        });

        var deleteConversations = _wrapper(3, function(ids, params, options) {
            window.Teamlab.removeMailConversations(params, ids, options);
        });

        var deleteMessageAttachment = _wrapper(4, function(message_id, attachment_id, params, options) {
            window.Teamlab.removeMailMessageAttachment(params, message_id, attachment_id, options);
        });

        var removeMailFolderMessages = _wrapper(3, function(folder_id, params, options) {
            window.Teamlab.removeMailFolderMessages(params, folder_id, options);
        });

        var attachDocuments = _wrapper(4, function(id, data, params, options) {
            window.Teamlab.addMailDocument(params, id, data, options);
        });

        var getAlerts = _wrapper(2, function(params, options) {
            window.Teamlab.getMailAlerts(params, options);
        });

        var deleteAlert = _wrapper(3, function(alert_id, params, options) {
            window.Teamlab.deleteMailAlert(params, alert_id, options);
        });

        var getProfiles = _wrapper(2, function(params, options) {
            window.Teamlab.getProfiles(params, options);
        });

        var getProfilesByFilter = _wrapper(2, function (params, options) {
            window.Teamlab.getProfilesByFilter(params, options);
        });

        var getCrmContacts = _wrapper(2, function(params, options) {
            window.Teamlab.getCrmContacts(params, options);
        });

        var getCrmContactsById = _wrapper(2, function (params, ids, options) {
            window.Teamlab.getCrmContactsForMail(params, ids, options);
        });

        var getTLGroups = _wrapper(2, function(params, options) {
            window.Teamlab.getGroups(params, options);
        });

        var getMailContacts = _wrapper(3, function(params, term, options) {
            window.Teamlab.getMailContacts(params, term, options);
        });

        var getCrmContactStatus = _wrapper(2, function(params, options) {
            window.Teamlab.getCrmListItem(params, 1 /*ContactStatus*/, options);
        });

        var markChainAsCrmLinked = _wrapper(4, function (id_message, crm_contact_ids, params, options) {
            window.Teamlab.markChainAsCrmLinked(params, id_message, crm_contact_ids, options);
        });

        var unmarkChainAsCrmLinked = _wrapper(4, function (id_message, crm_contact_ids, params, options) {
            window.Teamlab.unmarkChainAsCrmLinked(params, id_message, crm_contact_ids, options);
        });
        
        var exportMessageToCrm = _wrapper(4, function (id_message, crm_contact_ids, params, options) {
            window.Teamlab.exportMessageToCrm(params, id_message, crm_contact_ids, options);
        });

        var isConversationLinkedWithCrm = _wrapper(3, function (id_message, params, options) {
            window.Teamlab.isConversationLinkedWithCrm(params, id_message, options);
        });

        var getHelpCenterHtml = _wrapper(2, function (params, options) {
            window.Teamlab.getMailHelpCenterHtml(params, options);
        });


        return {
            init: init,
            bind: bind,
            unbind: unbind,
            getNodeContent: getNodeContent,
            getMailAccounts: getMailAccounts,
            createBox: createBox,
            createMinBox: createMinBox,
            createOAuthBox: createOAuthBox,
            getDefaultMailboxSettings: getDefaultMailboxSettings,
            removeBox: removeBox,
            updateBox: updateBox,
            setMailboxState: setMailboxState,
            getBox: getBox,
            getMailFolders: getMailFolders,
            getMessage: getMessage,
            getConversation: getConversation,
            getNextMessageId: getNextMessageId,
            getPrevMessageId: getPrevMessageId,

            getNextConversationId: getNextConversationId,
            getPrevConversationId: getPrevConversationId,

            sendMessage: sendMessage,
            saveMessage: saveMessage,
            markMessages: markMessages,
            markConversations: markConversations,
            moveMailMessages: moveMailMessages,
            moveMailConversations: moveMailConversations,
            restoreMailMessages: restoreMailMessages,
            restoreMailConversations: restoreMailConversations,
            deleteMessages: deleteMessages,
            deleteConversations: deleteConversations,
            deleteMessageAttachment: deleteMessageAttachment,
            getMessageTemplate: getMessageTemplate,
            getTags: getTags,
            createTag: createTag,
            setTag: setTag,
            setConverstationsTag: setConverstationsTag,
            unsetTag: unsetTag,
            unsetConverstationsTag: unsetConverstationsTag,
            deleteTag: deleteTag,
            updateTag: updateTag,
            removeMailFolderMessages: removeMailFolderMessages,
            getState: getState,
            updateFolders: updateFolders,
            generateGuid: generateGuid,
            attachDocuments: attachDocuments,
            getAlerts: getAlerts,
            deleteAlert: deleteAlert,
            getProfiles: getProfiles,
            getProfilesByFilter: getProfilesByFilter,
            getCrmContacts: getCrmContacts,
            getCrmContactsById: getCrmContactsById,
            getCrmContactStatus: getCrmContactStatus,
            getMailContacts: getMailContacts,
            getTLGroups: getTLGroups,
            markChainAsCrmLinked: markChainAsCrmLinked,
            unmarkChainAsCrmLinked: unmarkChainAsCrmLinked,
            exportMessageToCrm: exportMessageToCrm,
            getLinkedCrmEntitiesInfo: getLinkedCrmEntitiesInfo,
            isConversationLinkedWithCrm: isConversationLinkedWithCrm,
            getHelpCenterHtml: getHelpCenterHtml
        };
    })(jQuery);
}
