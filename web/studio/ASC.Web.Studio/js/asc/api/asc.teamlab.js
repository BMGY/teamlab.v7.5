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

;window.Teamlab = (function() {
    var
    isInit = false,
    eventManager = null;

    var customEvents = {
        getException: 'ongetexception',
        getAuthentication: 'ongetauthentication',

        addComment: 'onaddcomment',
        updateComment: 'onupdatecomment',
        removeComment: 'onremovecomment',

        getCmtBlog: 'ongetcmtyblog',

        subscribeProject: 'subscribeproject',
        addPrjComment: 'onaddprjcomment',
        updatePrjComment: 'onupdateprjcomment',
        removePrjComment: 'onremoveprjcomment',
        updatePrjTask: 'onupdateprjtask',
        addPrjTask: 'onaddprjtask',
        getPrjTask: 'ongetprjtask',
        getPrjTasks: 'ongetprjtasks',
        addPrjSubtask: 'onaddprjsubtask',
        removePrjSubtask: 'onremoveprjsubtask',
        updatePrjSubtask: 'onupdateprjsubtask',
        removePrjTask: 'onremoveprjtask',
        getPrjDiscussion: 'ongetprjdiscussion',
        getPrjDiscussions: 'ongetprjdiscussions',
        getPrjProjects: 'ongetprjprojects',
        getPrjTeam: 'ongetprjteam',
        setTeamSecurity: 'setteamsecurity',
        getPrjTemplates: 'getprjtemplates',
        getPrjTemplate: 'getprjtemplate',
        updatePrjTemplate: 'updateprjtemplate',
        createPrjTemplate: 'createprjtemplate',
        removePrjTemplate: 'removeprjtemplate',
        getPrjMilestones: 'ongetprjmilestones',
        updatePrjProjectStatus: 'onupdateprjprojectstatus',
        addPrjTime: 'onaddprjtime',
        getPrjTime: 'ongetprjtime',
        updatePrjTime: 'onupdateprjtime',
        removePrjTime: 'onremoveprjtime',
        getCrmContact: 'ongetcrmcontact',
        getCrmOpportunity: 'ongetcrmopportunity',
        getCrmCase: 'ongetcrmcase',
        getCrmContactsByPrefix: 'ongetcrmcontactbyprefix',
        getCrmOpportunitiesByPrefix: 'ongetcrmopportunitybyprefix',
        getCrmCasesByPrefix: 'ongetcrmcasebyprefix',

        getMailFilteredMessages: 'ongetmailmessages',
        getMailFolders: 'ongetmailfolders',
        getMailMessagesModifyDate: 'ongetmailmessagesmodifydate',
        getMailFolderModifyDate: 'ongetmailfoldermodifydate',
        getMailAccounts: 'ongetmailaccounts',
        getMailTags: 'ongetmailtags',
        getMailConversation: 'ongetmailconversation',
        getNextMailConversationId: 'ongetnextmailconversationid',
        getPrevMailConversationId: 'ongetprevmailconversationid',
        getMailMessage: 'ongetmailmessage',
        getNextMailMessageId: 'ongetnextmailmessageid',
        getPrevMailMessageId: 'ongetprevmailmessageid',
        getMailMessageTemplate: 'ongetmailmessagetemplate',
        getMailRandomGuid: 'ongetmailrandomguid',
        removeMailFolderMessages: 'onremovemailfoldermessages',
        restoreMailMessages: 'onrestoremailmessages',
        moveMailMessages: 'onmovemailmessages',
        removeMailMessages: 'onremovemailmessages',
        markMailMessages: 'onmarkmailmessages',
        createMailTag: 'oncreatemailtag',
        updateMailTag: 'onupdatemailtag',
        removeMailTag: 'onremovemailtag',
        addMailDocument: 'onaddmaildocument',
        setMailTag: 'onsetmailtag',
        setMailConversationsTag: 'onsetmailconversationstag',
        unsetMailTag: 'unsetmailtag',
        unsetMailConversationsTag: 'unsetmailconversationstag',
        removeMailMailbox: 'onremovemailmailbox',
        getMailDefaultMailboxSettings: 'ongetmaildefaultmailboxsettings',
        getMailMailbox: 'ongetmailmailbox',
        createMailMailboxSimple: 'oncreatemailmailboxsimple',
        createMailMailboxOAuth: 'oncreateMailMailboxOAuth',
        createMailMailbox: 'oncreatemailmailbox',
        updateMailMailbox: 'onupdatemailmailbox',
        setMailMailboxState: 'onsetmailmailboxstate',
        removeMailMessageAttachment: 'onremovemailmessageattachment',
        sendMailMessage: 'onsendmailmessage',
        saveMailMessage: 'onsavemailmessage',
        getMailContacts: 'ongetmailcontacts',
        getMailAlerts: 'ongetmailalerts',
        deleteMailAlert: 'ondeletemailalert',
        moveMailConversations: 'onmovemailconversations',
        restoreMailConversations: 'onrestoremailconversations',
        removeMailConversations: 'onremovemailconversations',
        markMailConversations: 'onmarkmailconversations',
        getMailFilteredConversations: 'ongetmailfilteredconversations',
        getMailDisplayImagesAddresses: 'ongetmaildisplayimagesaddresses',
        createDisplayImagesAddress: 'oncreatedisplayimagesaddress',
        removeDisplayImagesAddress: 'onremovedisplayimagesaddress',
        getLinkedCrmEntitiesInfo: 'ongetlinkedcrmentitiesinfo',
        markChainAsCrmLinked: 'onmarkchainascrmlinked',
        unmarkChainAsCrmLinked: 'onunmarkchainascrmlinked',
        isConversationLinkedWithCrm: "oncompleteconversationcheckforlinkingwithcrm",
        exportMessageToCrm: "onexportmessagetocrm",

        getTalkUnreadMessages: "gettalkunreadmessages"
    },
  customEventsHash = {},
  eventManager = new CustomEvent(customEvents);
    extendCustomEventsHash();

    function isArray(o) {
        return o ? o.constructor.toString().indexOf("Array") != -1 : false;
    }

    function extendCustomEventsHash() {
        for (var fld in customEvents) {
            customEventsHash[fld] = true;
            customEventsHash[customEvents[fld]] = true;
        }
    }

    function callMethodByName(handlername, container, self, args) {
        handlername = handlername.replace(/-/g, '_');
        if (container && typeof container === 'object' && typeof container[handlername] === 'function') {
            container[handlername].apply(self, args);
        }
    }

    function returnValue(value) {
        return value && isArray(value) ? window.Teamlab : value;
    }

    var init = function() {
        if (isInit === true) {
            return undefined;
        }
        isInit = true;

        ServiceManager.bind(null, onGetResponse);
        ServiceManager.bind('event', onGetEvent);
        ServiceManager.bind('extention', onGetExtention);
        //ServiceManager.bind('me', onGetOwnProfile);
    };

    var bind = function(eventname, handler, params) {
        return eventManager.bind(eventname, handler, params);
    };

    var unbind = function(handlerid) {
        return eventManager.unbind(handlerid);
    };

    var call = function(eventname, self, args) {
        eventManager.call(eventname, self, args);
    };

    var extendEventManager = function(events) {
        for (var fld in events) {
            if (events.hasOwnProperty(fld)) {
                customEvents[fld] = events[fld];
            }
        }
        eventManager.extend(customEvents);
        extendCustomEventsHash();
    };

    function onGetEvent(eventname, self, args) {
        if (customEventsHash.hasOwnProperty(eventname)) {
            call(eventname, self, args);
        }
    }

    function onGetExtention(eventname, params, errors) {
        eventManager.call(customEvents.getException, this, [params, errors]);
    }

    function onGetResponse(params, obj) {
        if (params.hasOwnProperty('___handler') && params.hasOwnProperty('___container')) {
            var args = [params];
            for (var i = 1, n = arguments.length; i < n; i++) {
                args.push(arguments[i]);
            }
            callMethodByName(params.___handler, params.___container, this, args);
        }
    }

    function onGetOwnProfile(params, profile) {
        //console.log('me: ', profile);
    }

    var joint = function() {
        ServiceManager.joint();
        return window.Teamlab;
    };

    var start = function(params, options) {
        return ServiceManager.start(params, options);
    };

    /* <common> */
    var getQuotas = function(params, options) {
        return returnValue(ServiceManager.getQuotas(customEvents.getQuotas, params, options));
    };
    /* </Common> */

    /* <people> */
    var addProfile = function(params, data, options) {
        return returnValue(ServiceManager.addProfile(customEvents.addProfile, params, data, options));
    };

    var getProfile = function(params, id, options) {
        return returnValue(ServiceManager.getProfile(customEvents.getProfile, params, id, options));
    };

    var getProfiles = function(params, options) {
        return returnValue(ServiceManager.getProfiles(customEvents.getProfiles, params, options));
    };

    var getProfilesByFilter = function(params, options) {
        return returnValue(ServiceManager.getProfilesByFilter(customEvents.getProfilesByFilter, params, options));
    };

    var addGroup = function(params, data, options) {
        return returnValue(ServiceManager.addGroup(customEvents.addGroup, params, data, options));
    };

    var updateGroup = function(params, id, data, options) {
        return returnValue(ServiceManager.updateGroup(customEvents.updateGroup, params, id, data, options));
    };

    var getGroup = function(id, options) {
        return returnValue(ServiceManager.getGroup(customEvents.getGroup, null, id, options));
    };

    var getGroups = function(params, options) {
        return returnValue(ServiceManager.getGroups(customEvents.getGroups, params, options));
    };

    var deleteGroup = function(id, options) {
        return returnValue(ServiceManager.deleteGroup(customEvents.deleteGroup, null, id, options));
    };

    var updateProfile = function(params, id, data, options) {
        return returnValue(ServiceManager.updateProfile(customEvents.updateProfile, params, id, data, options));
    };

    var updateUserType = function(params, type, data, options) {
        return returnValue(ServiceManager.updateUserType(customEvents.updateUserType, params, type, data, options));
    };

    var updateUserStatus = function(params, status, data, options) {
        return returnValue(ServiceManager.updateUserStatus(customEvents.updateUserStatus, params, status, data, options));
    };
    var updateUserPhoto = function(params, id, data, options) {
        return returnValue(ServiceManager.updateUserPhoto(customEvents.updateUserPhoto, params, id, data, options));
    };

    var removeUserPhoto = function (params, id, data, options) {
        return returnValue(ServiceManager.removeUserPhoto(customEvents.removeUserPhoto, params, id, data, options));
    };

    var sendInvite = function(params, data, options) {
        return returnValue(ServiceManager.sendInvite(customEvents.sendInvite, params, data, options));
    };

    var removeUsers = function (params, data, options) {
        return returnValue(ServiceManager.removeUsers(customEvents.removeUsers, params, data, options));
    };
    /* </people> */

    /* <community> */
    var addCmtBlog = function(params, data, options) {
        return returnValue(ServiceManager.addCmtBlog(customEvents.addCmtBlog, params, data, options));
    };

    var getCmtBlog = function(params, id, options) {
        return returnValue(ServiceManager.getCmtBlog(customEvents.getCmtBlog, params, id, options));
    };

    var getCmtBlogs = function(params, options) {
        return returnValue(ServiceManager.getCmtBlogs(customEvents.getCmtBlogs, params, options));
    };

    var addCmtForumTopic = function(params, threadid, data, options) {
        if (arguments.length === 3) {
            options = arguments[2];
            data = arguments[1];
            threadid = data && typeof data === 'object' && data.hasOwnProperty('threadid') ? data.threadid : null;
        }

        return returnValue(ServiceManager.addCmtForumTopic(customEvents.addCmtForumTopic, params, threadid, data, options));
    };

    var getCmtForumTopic = function(params, id, options) {
        return returnValue(ServiceManager.getCmtForumTopic(customEvents.getCmtForumTopic, params, id, options));
    };

    var getCmtForumTopics = function(params, options) {
        return returnValue(ServiceManager.getCmtForumTopics(customEvents.getCmtForumTopics, params, options));
    };

    var getCmtForumCategories = function(params, options) {
        return returnValue(ServiceManager.getCmtForumCategories(customEvents.getCmtForumCategories, params, options));
    };

    var addCmtForumToCategory = function(params, data, options) {
        return returnValue(ServiceManager.addCmtForumToCategory(customEvents.addCmtForumToCategory, params, data, options));
    };

    var addCmtEvent = function(params, data, options) {
        return returnValue(ServiceManager.addCmtEvent(customEvents.addCmtEvent, params, data, options));
    };

    var getCmtEvent = function(params, id, options) {
        return returnValue(ServiceManager.getCmtEvent(customEvents.getCmtEvent, params, id, options));
    };

    var getCmtEvents = function(params, options) {
        return returnValue(ServiceManager.getCmtEvents(customEvents.getCmtEvents, params, options));
    };

    var addCmtBookmark = function(params, data, options) {
        return returnValue(ServiceManager.addCmtBookmark(customEvents.addCmtBookmark, params, data, options));
    };

    var getCmtBookmark = function(params, id, options) {
        return returnValue(ServiceManager.getCmtBookmark(customEvents.getCmtBookmark, params, id, options));
    };

    var getCmtBookmarks = function(params, options) {
        return returnValue(ServiceManager.getCmtBookmarks(customEvents.getCmtBookmarks, params, options));
    };

    var addCmtForumTopicPost = function(params, id, data, options) {
        return returnValue(ServiceManager.addCmtForumTopicPost(customEvents.addCmtForumTopicPost, params, id, data, options));
    };

    var addCmtBlogComment = function(params, id, data, options) {
        return returnValue(ServiceManager.addCmtBlogComment(customEvents.addCmtBlogComment, params, id, data, options));
    };

    var getCmtBlogComments = function(params, id, options) {
        return returnValue(ServiceManager.getCmtBlogComments(customEvents.getCmtBlogComments, params, id, options));
    };

    var addCmtEventComment = function(params, id, data, options) {
        return returnValue(ServiceManager.addCmtEventComment(customEvents.addCmtEventComment, params, id, data, options));
    };

    var getCmtEventComments = function(params, id, options) {
        return returnValue(ServiceManager.getCmtEventComments(customEvents.getCmtEventComments, params, id, options));
    };

    var addCmtBookmarkComment = function(params, id, data, options) {
        return returnValue(ServiceManager.addCmtBookmarkComment(customEvents.addCmtBookmarkComment, params, id, data, options));
    };

    var getCmtBookmarkComments = function(params, id, options) {
        return returnValue(ServiceManager.getCmtBookmarkComments(customEvents.getCmtBookmarkComments, params, id, options));
    };
    /* </community> */

    /* <projects> */

    var subscribeProject = function(params, id, options) {
        return returnValue(ServiceManager.subscribeProject(customEvents.subscribeProject, params, id, options));
    };

    var getFeeds = function(params, options) {
        return returnValue(ServiceManager.getFeeds(customEvents.getFeeds, params, options));
    };

    var getNewFeedsCount = function(params, options) {
        return returnValue(ServiceManager.getNewFeedsCount(customEvents.getNewFeedsCount, params, options));
    };

    var readFeeds = function(params, options) {
        return returnValue(ServiceManager.readFeeds(customEvents.readFeeds, params, options));
    };

    var getPrjTags = function(params, options) {
        return returnValue(ServiceManager.getPrjTags(customEvents.getPrjTags, params, options));
    };

    var getPrjTagsByName = function(params, name, data, options) {
        return returnValue(ServiceManager.getPrjTagsByName(customEvents.getPrjTagsByName, params, name, data, options));
    };

    var addPrjComment = function(params, type, id, data, options) {
        var fn = null;
        switch (type.toLowerCase()) {
            case 'discussion':
                fn = ServiceManager.addPrjDiscussionComment;
                break;
        }
        if (typeof fn === 'function') {
            return returnValue(fn(customEvents.addPrjComment, params, id, data, options));
        }
        return false;
    };

    var updatePrjComment = function(params, type, id, data, options) {
        var fn = null;
        switch (type.toLowerCase()) {
            case 'discussion':
                fn = ServiceManager.updatePrjDiscussionComment;
                break;
        }
        if (typeof fn === 'function') {
            return returnValue(fn(customEvents.updatePrjComment, params, id, data, options));
        }
        return false;
    };

    var removePrjComment = function(params, type, id, options) {
        var fn = null;
        switch (type.toLowerCase()) {
            case 'discussion':
                fn = ServiceManager.removePrjDiscussionComment;
                break;
        }
        if (typeof fn === 'function') {
            return returnValue(fn(customEvents.removePrjComment, params, id, options));
        }
        return false;
    };

    var getPrjComments = function(params, type, id, options) {
        var fn = null;
        switch (type.toLowerCase()) {
            case 'discussion':
                fn = ServiceManager.getPrjDiscussionComments;
                break;
        }
        if (typeof fn === 'function') {
            return returnValue(fn(customEvents.getPrjComments, params, id, options));
        }
        return false;
    };

    var addPrjTaskComment = function(params, id, data, options) {
        return returnValue(ServiceManager.addPrjTaskComment(customEvents.addPrjTaskComment, params, id, data, options));
    };

    var updatePrjTaskComment = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjTaskComment(customEvents.updatePrjTaskComment, params, id, data, options));
    };

    var removePrjTaskComment = function(params, id, options) {
        return returnValue(ServiceManager.removePrjTaskComment(customEvents.removePrjTaskComment, params, id, options));
    };

    var getPrjTaskComments = function(params, id, options) {
        return returnValue(ServiceManager.getPrjTaskComments(customEvents.getPrjTaskComments, params, id, options));
    };

    var addPrjDiscussionComment = function(params, id, data, options) {
        return returnValue(ServiceManager.addPrjDiscussionComment(customEvents.addPrjDiscussionComment, params, id, data, options));
    };

    var updatePrjDiscussionComment = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjDiscussionComment(customEvents.updatePrjDiscussionComment, params, id, data, options));
    };

    var removePrjDiscussionComment = function(params, id, options) {
        return returnValue(ServiceManager.removePrjDiscussionComment(customEvents.removePrjDiscussionComment, params, id, options));
    };

    var getPrjDiscussionComments = function(params, id, options) {
        return returnValue(ServiceManager.getPrjDiscussionComments(customEvents.getPrjDiscussionComments, params, id, options));
    };

    var addPrjSubtask = function(params, taskid, data, options) {
        return returnValue(ServiceManager.addPrjSubtask(customEvents.addPrjSubtask, params, taskid, data, options));
    };

    var updatePrjSubtask = function(params, taskid, subtaskid, data, options) {
        return returnValue(ServiceManager.updatePrjSubtask(customEvents.updatePrjSubtask, params, taskid, subtaskid, data, options));
    };

    var removePrjSubtask = function(params, taskid, subtaskid, options) {
        return returnValue(ServiceManager.removePrjSubtask(customEvents.removePrjSubtask, params, taskid, subtaskid, options));
    };

    var addPrjTask = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addPrjTask(customEvents.addPrjTask, params, projectid, data, options));
    };

    var addPrjTaskByMessage = function(params, projectId, massegeId, options) {
        return returnValue(ServiceManager.addPrjTaskByMessage(customEvents.addPrjTaskByMessage, params, projectId, massegeId, options));
    };

    var updatePrjTask = function(params, taskid, data, options) {
        return returnValue(ServiceManager.updatePrjTask(customEvents.updatePrjTask, params, taskid, data, options));
    };

    var removePrjTask = function(params, id, options) {
        return returnValue(ServiceManager.removePrjTask(customEvents.removePrjTask, params, id, options));
    };

    var getPrjTask = function(params, id, options) {
        return returnValue(ServiceManager.getPrjTask(customEvents.getPrjTask, params, id, options));
    };

    var getPrjTasksById = function(params, ids, options) {
        return returnValue(ServiceManager.getPrjTasksById(customEvents.getPrjTasksById, params, ids, options));
    };

    var getPrjTasks = function(params, projectid, type, status, options) {
        return returnValue(ServiceManager.getPrjTasks(customEvents.getPrjTasks, params, projectid, type, status, options));
    };

    var getPrjTeam = function(params, ids, options) {
        return returnValue(ServiceManager.getPrjTeam(customEvents.getPrjTeam, params, ids, options));
    };

    var updatePrjTeam = function(params, projectid, data, options) {
        return returnValue(ServiceManager.updatePrjTeam(customEvents.updatePrjTeam, params, projectid, data, options));
    };

    var setTeamSecurity = function(params, projectid, data, options) {
        return returnValue(ServiceManager.setTeamSecurity(customEvents.setTeamSecurity, params, projectid, data, options));
    };

    var getPrjTaskFiles = function(params, taskid, options) {
        return returnValue(ServiceManager.getPrjTaskFiles(customEvents.getPrjTaskFiles, params, taskid, options));
    };

    var subscribeToPrjTask = function(params, taskid, options) {
        return returnValue(ServiceManager.subscribeToPrjTask(customEvents.subscribeToPrjTask, params, taskid, options));
    };

    var notifyPrjTaskResponsible = function(params, taskid, options) {
        return returnValue(ServiceManager.notifyPrjTaskResponsible(customEvents.notifyPrjTaskResponsible, params, taskid, options));
    };

    var addPrjTaskLink = function(params, taskid, data, options) {
        return returnValue(ServiceManager.addPrjTaskLink(customEvents.addPrjTaskLink, params, taskid, data, options));
    };

    var removePrjTaskLink = function(params, taskid, data, options) {
        return returnValue(ServiceManager.removePrjTaskLink(customEvents.removePrjTaskLink, params, taskid, data, options));
    };

    var getPrjProjectFolder = function(params, taskid, options) {
        return returnValue(ServiceManager.getPrjProjectFolder(customEvents.getPrjProjectFolder, params, taskid, options));
    };

    var addPrjEntityFiles = function(params, entityid, entitytype, data, options) {
        return returnValue(ServiceManager.addPrjEntityFiles(customEvents.addPrjEntityFiles, params, entityid, entitytype, data, options));
    };

    var removePrjEntityFiles = function(params, entityid, entitytype, data, options) {
        return returnValue(ServiceManager.removePrjEntityFiles(customEvents.removePrjEntityFiles, params, entityid, entitytype, data, options));
    };

    var getPrjEntityFiles = function(params, entityid, entitytype, options) {
        return returnValue(ServiceManager.getPrjEntityFiles(customEvents.getPrjEntityFiles, params, entityid, entitytype, options));
    };

    var addPrjMilestone = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addPrjMilestone(customEvents.addPrjMilestone, params, projectid, data, options));
    };

    var updatePrjMilestone = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjMilestone(customEvents.updatePrjMilestone, params, id, data, options));
    };

    var removePrjMilestone = function(params, id, options) {
        return returnValue(ServiceManager.removePrjMilestone(customEvents.removePrjMilestone, params, id, options));
    };

    var getPrjMilestone = function(params, id, options) {
        return returnValue(ServiceManager.getPrjMilestone(customEvents.getPrjMilestone, params, id, options));
    };

    var getPrjMilestones = function(params, projectid, options) {
        if (arguments.length < 3) {
            options = arguments[1];
            projectid = null;
        }

        return returnValue(ServiceManager.getPrjMilestones(customEvents.getPrjMilestones, params, projectid, options));
    };

    var addPrjDiscussion = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addPrjDiscussion(customEvents.addPrjDiscussion, params, projectid, data, options));
    };

    var updatePrjDiscussion = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjDiscussion(customEvents.updatePrjDiscussion, params, id, data, options));
    };

    var removePrjDiscussion = function(params, id, options) {
        return returnValue(ServiceManager.removePrjDiscussion(customEvents.removePrjDiscussion, params, id, options));
    };

    var getPrjDiscussion = function(params, id, options) {
        return returnValue(ServiceManager.getPrjDiscussion(customEvents.getPrjDiscussion, params, id, options));
    };

    var getPrjDiscussions = function(params, projectid, options) {
        if (arguments.length < 3) {
            options = arguments[1];
            projectid = null;
        }

        return returnValue(ServiceManager.getPrjDiscussions(customEvents.getPrjDiscussions, params, projectid, options));
    };

    var subscribeToPrjDiscussion = function(params, taskid, options) {
        return returnValue(ServiceManager.subscribeToPrjDiscussion(customEvents.subscribeToPrjDiscussion, params, taskid, options));
    };

    var addPrjProject = function(params, data, options) {
        return returnValue(ServiceManager.addPrjProject(customEvents.addPrjProject, params, data, options));
    };

    var updatePrjProject = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjProject(customEvents.updatePrjProject, params, id, data, options));
    };

    var updatePrjProjectStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjProjectStatus(customEvents.updatePrjProjectStatus, params, id, data, options));
    };

    var removePrjProject = function(params, id, options) {
        return returnValue(ServiceManager.removePrjProject(customEvents.removePrjProject, params, id, options));
    };

    var followingPrjProject = function(params, projectid, data, options) {
        return returnValue(ServiceManager.followingPrjProject(customEvents.followingPrjProject, params, projectid, data, options));
    };

    var getPrjProject = function(params, id, options) {
        return returnValue(ServiceManager.getPrjProject(customEvents.getPrjProject, params, id, options));
    };

    var getPrjProjects = function(params, options) {
        return returnValue(ServiceManager.getPrjProjects(customEvents.getPrjProjects, params, options));
    };

    var getPrjSelfProjects = function(params, options) {
        return returnValue(ServiceManager.getPrjSelfProjects(customEvents.getPrjProjects, params, options));
    };

    var getPrjFollowProjects = function(params, options) {
        return returnValue(ServiceManager.getPrjFollowProjects(customEvents.getPrjProjects, params, options));
    };

    var getProjectsForCrmContact = function(params, contactid, options) {
        return returnValue(ServiceManager.getProjectsForCrmContact(customEvents.getProjectsForCrmContact, params, contactid, options));
    };

    var addProjectForCrmContact = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addProjectForCrmContact(customEvents.addProjectForCrmContact, params, projectid, data, options));
    };

    var removeProjectFromCrmContact = function(params, projectid, data, options) {
        return returnValue(ServiceManager.removeProjectFromCrmContact(customEvents.removeProjectFromCrmContact, params, projectid, data, options));
    };

    var addPrjProjectTeamPerson = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addPrjProjectTeamPerson(customEvents.addPrjProjectTeamPerson, params, projectid, data, options));
    };

    var removePrjProjectTeamPerson = function(params, projectid, data, options) {
        return returnValue(ServiceManager.removePrjProjectTeamPerson(customEvents.removePrjProjectTeamPerson, params, projectid, data, options));
    };

    var getPrjProjectTeamPersons = function(params, projectid, options) {
        return returnValue(ServiceManager.getPrjProjectTeamPersons(customEvents.getPrjProjectTeamPersons, params, projectid, options));
    };

    var getPrjProjectFiles = function(params, projectid, options) {
        return returnValue(ServiceManager.getPrjProjectFiles(customEvents.getPrjProjectFiles, params, projectid, options));
    };

    var addPrjTime = function(params, taskid, data, options) {
        return returnValue(ServiceManager.addPrjTime(customEvents.addPrjTime, params, taskid, data, options));
    };

    var getPrjTime = function(params, taskid, options) {
        return returnValue(ServiceManager.getPrjTime(customEvents.getPrjTime, params, taskid, options));
    };

    var getTotalTimeByFilter = function(params, options) {
        return returnValue(ServiceManager.getTotalTaskTimeByFilter(customEvents.getTotalTaskTimeByFilter, params, options));
    };

    var getTotalBilledTimeByFilter = function(params, options) {
        return returnValue(ServiceManager.getTotalBilledTaskTimeByFilter(customEvents.getTotalBilledTaskTimeByFilter, params, options));
    };

    var updatePrjTime = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjTime(customEvents.updatePrjTime, params, id, data, options));
    };

    var changePaymentStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.changePaymentStatus(customEvents.changePaymentStatus, params, id, data, options));
    };

    var removePrjTime = function(params, id, options) {
        return returnValue(ServiceManager.removePrjTime(customEvents.removePrjTime, params, id, options));
    };

    var getPrjTemplates = function(params, options) {
        return returnValue(ServiceManager.getPrjTemplates(customEvents.getPrjTemplates, params, options));
    };

    var getPrjTemplate = function(params, id, options) {
        return returnValue(ServiceManager.getPrjTemplate(customEvents.getPrjTemplate, params, options));
    };

    var updatePrjTemplate = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjTemplate(customEvents.updatePrjTemplate, params, id, data, options));
    };

    var createPrjTemplate = function(params, data, options) {
        return returnValue(ServiceManager.createPrjTemplate(customEvents.createPrjTemplate, params, data, options));
    };

    var removePrjTemplate = function(params, id, options) {
        return returnValue(ServiceManager.removePrjTemplate(customEvents.removePrjTemplate, params, id, options));
    };

    var getPrjActivities = function(params, options) {
        return returnValue(ServiceManager.getPrjActivities(customEvents.getPrjActivities, params, options));
    };

    var addPrjImport = function(params, data, options) {
        return returnValue(ServiceManager.addPrjImport(customEvents.addPrjImport, params, data, options));
    };

    var getPrjImport = function(params, options) {
        return returnValue(ServiceManager.getPrjImport(customEvents.getPrjImport, params, options));
    };

    var getPrjImportProjects = function(params, data, options) {
        return returnValue(ServiceManager.getPrjImportProjects(customEvents.getPrjImportProjects, params, data, options));
    };

    var checkPrjImportQuota = function(params, data, options) {
        return returnValue(ServiceManager.checkPrjImportQuota(customEvents.checkPrjImportQuota, params, data, options));
    };

    var addPrjReportTemplate = function(params, data, options) {
        return returnValue(ServiceManager.addPrjReportTemplate(customEvents.addPrjReportTemplate, params, data, options));
    };

    var updatePrjReportTemplate = function(params, id, data, options) {
        return returnValue(ServiceManager.updatePrjReportTemplate(customEvents.updatePrjReportTemplate, params, id, data, options));
    };

    var deletePrjReportTemplate = function(params, id, options) {
        return returnValue(ServiceManager.deletePrjReportTemplate(customEvents.deletePrjReportTemplate, params, id, options));
    };

    var uploadFilesToPrjEntity = function(params, entityId, data, options) {
        return returnValue(ServiceManager.uploadFilesToPrjEntity(customEvents.uploadFilesToPrjEntity, params, entityId, data, options));
    };

    var getPrjGanttIndex = function(params, id, options){
        return returnValue(ServiceManager.getPrjGanttIndex(customEvents.getPrjGanttIndex, params, id, options));
    };

    var setPrjGanttIndex = function(params, id, data, options){
        return returnValue(ServiceManager.setPrjGanttIndex(customEvents.setPrjGanttIndex, params, id, data, options));
    };
    /* </projects> */

    /* <documents> */
    var createDocUploadFile = function(params, id, data, options) {
        return returnValue(ServiceManager.createDocUploadFile(customEvents.uploadDocFile, params, id, data, options));
    };

    var addDocFile = function(params, id, type, data, options) {
        if (arguments.length < 5) {
            options = arguments[3];
            data = arguments[3];
            type = null;
        }

        return returnValue(ServiceManager.addDocFile(customEvents.addDocFile, params, id, type, data, options));
    };

    var getDocFile = function(params, id, options) {
        return returnValue(ServiceManager.getDocFile(customEvents.getDocFile, params, id, options));
    };

    var addDocFolder = function(params, id, data, options) {
        return returnValue(ServiceManager.addDocFolder(customEvents.addDocFolder, params, id, data, options));
    };

    var getDocFolder = function(params, folderid, options) {
        return returnValue(ServiceManager.getDocFolder(customEvents.getDocFolder, params, folderid, options));
    };

    var removeDocFile = function(params, fileId, options) {
        return returnValue(ServiceManager.removeDocFile(customEvents.removeDocFile, params, fileId, options));
    };

    var createDocUploadSession = function(params, folderId, data, options) {
        return returnValue(ServiceManager.createDocUploadSession(customEvents.createDocUploadSession, params, folderId, data, options));
    };

    /* </documents> */

    /* <crm> */
    var createCrmUploadFile = function(params, type, id, data, options) {
        return returnValue(ServiceManager.createCrmUploadFile(customEvents.uploadCrmFile, params, type, id, data, options));
    };

    var addCrmContactInfo = function(params, contactid, data, options) {
        return returnValue(ServiceManager.addCrmContactInfo(customEvents.addCrmContactInfo, params, contactid, data, options));
    };

    var updateCrmContactInfo = function(params, contactid, data, options) {
        return returnValue(ServiceManager.updateCrmContactInfo(customEvents.updateCrmContactInfo, params, contactid, data, options));
    };

    var deleteCrmContactInfo = function(params, contactid, id, options) {
        return returnValue(ServiceManager.deleteCrmContactInfo(customEvents.deleteCrmContactInfo, params, contactid, id, options));
    };

    var addCrmContactData = function(params, id, data, options) {
        return returnValue(ServiceManager.addCrmContactData(customEvents.addCrmContactData, params, id, data, options));
    };

    var updateCrmContactData = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactData(customEvents.updateCrmContactData, params, id, data, options));
    };

    var addCrmContactTwitter = function(params, contactid, data, options) {
        return returnValue(ServiceManager.addCrmContactTwitter(customEvents.addCrmContactTwitter, params, contactid, data, options));
    };

    var addCrmEntityNote = function(params, type, id, data, options) {
        return returnValue(ServiceManager.addCrmEntityNote(customEvents.addCrmEntityNote, params, type, id, data, options));
    };

    var addCrmContact = function(params, isCompany, data, options) {
        if (isCompany === true) {
            return returnValue(ServiceManager.addCrmCompany(customEvents.addCrmCompany, params, data, options));
        } else {
            return returnValue(ServiceManager.addCrmPerson(customEvents.addCrmContact, params, data, options));
        }
    };

    var addCrmCompany = function(params, data, options) {
        return returnValue(ServiceManager.addCrmCompany(customEvents.addCrmCompany, params, data, options));
    };

    var updateCrmCompany = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmCompany(customEvents.updateCrmCompany, params, id, data, options));
    };

    var updateCrmContactContactStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactContactStatus(customEvents.updateCrmContactContactStatus, params, id, data, options));
    };

    var updateCrmCompanyContactStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmCompanyContactStatus(customEvents.updateCrmCompanyContactStatus, params, id, data, options));
    };

    var updateCrmPersonContactStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmPersonContactStatus(customEvents.updateCrmPersonContactStatus, params, id, data, options));
    };

    var addCrmPerson = function(params, data, options) {
        return returnValue(ServiceManager.addCrmPerson(customEvents.addCrmPerson, params, data, options));
    };

    var updateCrmPerson = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmPerson(customEvents.updateCrmPerson, params, id, data, options));
    };

    var removeCrmContact = function(params, ids, options) {
        if (arguments.length === 2) {
            options = arguments[1];
            ids = null;
        }

        return returnValue(ServiceManager.removeCrmContact(customEvents.removeCrmContact, params, ids, options));
    };

    var mergeCrmContacts = function(params, data, options) {
        return returnValue(ServiceManager.mergeCrmContacts(customEvents.mergeCrmContacts, params, data, options));
    };

    var addCrmTag = function(params, type, ids, tagname, options) {
        if (arguments.length === 4) {
            options = arguments[3];
            tagname = arguments[2];
            ids = null;
        }

        return returnValue(ServiceManager.addCrmTag(customEvents.addCrmTag, params, type, ids, tagname, options));
    };

    var addCrmContactTagToGroup = function(params, type, id, tagname, options) {
        return returnValue(ServiceManager.addCrmContactTagToGroup(customEvents.addCrmContactTagToGroup, params, type, id, tagname, options));
    };

    var addCrmEntityTag = function(params, type, tagname, options) {
        return returnValue(ServiceManager.addCrmEntityTag(customEvents.addCrmEntityTag, params, type, tagname, options));
    };

    var removeCrmTag = function(params, type, id, tagname, options) {
        return returnValue(ServiceManager.removeCrmTag(customEvents.removeCrmTag, params, type, id, tagname, options));
    };

    var removeCrmEntityTag = function(params, type, tagname, options) {
        return returnValue(ServiceManager.removeCrmEntityTag(customEvents.removeCrmEntityTag, params, type, tagname, options));
    };

    var removeCrmUnusedTag = function(params, type, options) {
        return returnValue(ServiceManager.removeCrmUnusedTag(customEvents.removeCrmUnusedTag, params, type, options));
    };

    var addCrmCustomField = function(params, type, data, options) {
        return returnValue(ServiceManager.addCrmCustomField(customEvents.addCrmCustomField, params, type, data, options));
    };

    var updateCrmCustomField = function(params, type, id, data, options) {
        return returnValue(ServiceManager.updateCrmCustomField(customEvents.updateCrmCustomField, params, type, id, data, options));
    };

    var removeCrmCustomField = function(params, type, id, options) {
        return returnValue(ServiceManager.removeCrmCustomField(customEvents.removeCrmCustomField, params, type, id, options));
    };

    var reorderCrmCustomFields = function(params, type, ids, options) {
        return returnValue(ServiceManager.reorderCrmCustomFields(customEvents.reorderCrmCustomFields, params, type, ids, options));
    };

    var addCrmDealMilestone = function(params, data, options) {
        return returnValue(ServiceManager.addCrmDealMilestone(customEvents.addCrmDealMilestone, params, data, options));
    };

    var updateCrmDealMilestone = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmDealMilestone(customEvents.updateCrmDealMilestone, params, id, data, options));
    };

    var updateCrmDealMilestoneColor = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmDealMilestoneColor(customEvents.updateCrmDealMilestoneColor, params, id, data, options));
    };

    var removeCrmDealMilestone = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmDealMilestone(customEvents.removeCrmDealMilestone, params, id, options));
    };

    var reorderCrmDealMilestones = function(params, ids, options) {
        return returnValue(ServiceManager.reorderCrmDealMilestones(customEvents.reorderCrmDealMilestones, params, ids, options));
    };

    var addCrmContactStatus = function(params, data, options) {
        return returnValue(ServiceManager.addCrmContactStatus(customEvents.addCrmContactStatus, params, data, options));
    };

    var updateCrmContactStatus = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactStatus(customEvents.updateCrmContactStatus, params, id, data, options));
    };

    var updateCrmContactStatusColor = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactStatusColor(customEvents.updateCrmContactStatusColor, params, id, data, options));
    };

    var removeCrmContactStatus = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmContactStatus(customEvents.removeCrmContactStatus, params, id, options));
    };

    var addCrmContactType = function(params, data, options) {
        return returnValue(ServiceManager.addCrmContactType(customEvents.addCrmContactType, params, data, options));
    };

    var updateCrmContactType = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactType(customEvents.updateCrmContactType, params, id, data, options));
    };

    var removeCrmContactType = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmContactType(customEvents.removeCrmContactType, params, id, options));
    };

    var getCrmListItem = function(params, type, options) {
        return returnValue(ServiceManager.getCrmListItem(customEvents.getCrmListItem, params, type, options));
    };

    var addCrmListItem = function(params, type, data, options) {
        return returnValue(ServiceManager.addCrmListItem(customEvents.addCrmListItem, params, type, data, options));
    };

    var updateCrmListItem = function(params, type, id, data, options) {
        return returnValue(ServiceManager.updateCrmListItem(customEvents.updateCrmListItem, params, type, id, data, options));
    };

    var updateCrmListItemIcon = function(params, type, id, data, options) {
        return returnValue(ServiceManager.updateCrmListItemIcon(customEvents.updateCrmListItemIcon, params, type, id, data, options));
    };

    var removeCrmListItem = function(params, type, id, options) {
        return returnValue(ServiceManager.removeCrmListItem(customEvents.removeCrmListItem, params, type, id, options));
    };

    var reorderCrmListItems = function(params, type, titles, options) {
        return returnValue(ServiceManager.reorderCrmListItems(customEvents.reorderCrmListItems, params, type, titles, options));
    };

    var addCrmTask = function(params, data, options) {
        return returnValue(ServiceManager.addCrmTask(customEvents.addCrmTask, params, data, options));
    };

    var addCrmTaskGroup = function(params, data, options) {
        return returnValue(ServiceManager.addCrmTaskGroup(customEvents.addCrmTaskGroup, params, data, options));
    };

    var getCrmTask = function(params, id, options) {
        return returnValue(ServiceManager.getCrmTask(customEvents.getCrmTask, params, id, options));
    };

    var updateCrmTask = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmTask(customEvents.updateCrmTask, params, id, data, options));
    };

    var removeCrmTask = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmTask(customEvents.removeCrmTask, params, id, options));
    };

    var addCrmEntityMember = function(params, type, entityid, id, data, options) {
        var fn = null;
        switch (type) {
            case 'company': fn = ServiceManager.addCrmPersonMember; break;
            case 'project': fn = ServiceManager.addCrmContactForProject; break;
            default: fn = ServiceManager.addCrmContactMember; break;
        }
        if (fn) {
            return returnValue(fn(customEvents.addCrmEntityMember, params, type, entityid, id, data, options));
        }
        return false;
    };

    var addCrmContactsForProject = function(params, projectid, data, options) {
        return returnValue(ServiceManager.addCrmContactsForProject(customEvents.addCrmContactsForProject, params, projectid, data, options));
    };

    var addCrmDealForContact = function(params, contactid, opportunityid, options) {
        return returnValue(ServiceManager.addCrmDealForContact(customEvents.addCrmDealForContact, params, contactid, opportunityid, options));
    };

    var removeCrmDealFromContact = function(params, contactid, opportunityid, options) {
        return returnValue(ServiceManager.removeCrmDealFromContact(customEvents.removeCrmDealFromContact, params, contactid, opportunityid, options));
    };

    var removeCrmEntityMember = function(params, type, entityid, id, options) {
        var fn = null;
        switch (type) {
            case 'company': fn = ServiceManager.removeCrmPersonMember; break;
            case 'project': fn = ServiceManager.removeCrmContactFromProject; break;
            default: fn = ServiceManager.removeCrmContactMember; break;
        }
        if (fn) {
            return returnValue(fn(customEvents.removeCrmEntityMember, params, type, entityid, id, options));
        }
        return false;
    };

    var getCrmCases = function(params, options) {
        return returnValue(ServiceManager.getCrmCases(customEvents.getCrmCases, params, options));
    };

    var getCrmCasesByPrefix = function(params, options) {
        return returnValue(ServiceManager.getCrmCasesByPrefix(customEvents.getCrmCasesByPrefix, params, options));
    };

    var removeCrmCase = function(params, ids, options) {
        if (arguments.length === 2) {
            options = arguments[1];
            ids = null;
        }
        return returnValue(ServiceManager.removeCrmCase(customEvents.removeCrmCase, params, ids, options));
    };

    var updateCrmCase = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmCase(customEvents.updateCrmCase, params, id, data, options));
    };

    var getCrmContacts = function(params, options) {
        return returnValue(ServiceManager.getCrmContacts(customEvents.getCrmContacts, params, options));
    };

    var getCrmSimpleContacts = function(params, options) {
        return returnValue(ServiceManager.getCrmSimpleContacts(customEvents.getCrmSimpleContacts, params, options));
    };

    var getCrmContactsForMail = function(params, data, options) {
        return returnValue(ServiceManager.getCrmContactsForMail(customEvents.getCrmContactsForMail, params, data, options));
    };

    var getCrmContactsByPrefix = function(params, options) {
        return returnValue(ServiceManager.getCrmContactsByPrefix(customEvents.getCrmContactsByPrefix, params, options));
    };

    var getCrmContact = function(params, id, options) {
        return returnValue(ServiceManager.getCrmContact(customEvents.getCrmContact, params, id, options));
    };

    var getCrmTags = function(params, type, id, options) {
        return returnValue(ServiceManager.getCrmTags(customEvents.getCrmTags, params, type, id, options));
    };
    var getCrmContactsForProject = function(params, id, options) {
        return returnValue(ServiceManager.getCrmContactsForProject(customEvents.getCrmContactsForProject, params, id, options));
    };

    var getCrmEntityMembers = function(params, type, id, options) {
        var fn = null;
        switch (type) {
            case 'company': fn = ServiceManager.getCrmPersonMembers; break;
            default: fn = ServiceManager.getCrmContactMembers; break;
        }
        if (fn) {
            return returnValue(fn(customEvents.getCrmEntityMembers, params, type, id, options));
        }
        return false;
    };

    var getCrmContactTasks = function(params, data, options) {
        return returnValue(ServiceManager.getCrmContactTasks(customEvents.getCrmContactTasks, params, data, options));
    };

    var getCrmTasks = function(params, options) {
        return returnValue(ServiceManager.getCrmTasks(customEvents.getCrmTasks, params, options));
    };

    var getCrmOpportunity = function(params, id, options) {
        return returnValue(ServiceManager.getCrmOpportunity(customEvents.getCrmOpportunity, params, id, options));
    };

    var getCrmCase = function (params, id, options) {
        return returnValue(ServiceManager.getCrmCase(customEvents.getCrmCase, params, id, options));
    };

    var getCrmOpportunities = function(params, options) {
        return returnValue(ServiceManager.getCrmOpportunities(customEvents.getCrmOpportunities, params, options));
    };

    var getCrmOpportunitiesByPrefix = function(params, options) {
        return returnValue(ServiceManager.getCrmOpportunitiesByPrefix(customEvents.getCrmOpportunitiesByPrefix, params, options));
    };

    var removeCrmOpportunity = function(params, ids, options) {
        if (arguments.length === 2) {
            options = arguments[1];
            ids = null;
        }
        return returnValue(ServiceManager.removeCrmOpportunity(customEvents.removeCrmOpportunity, params, ids, options));
    };

    var updateCrmOpportunityMilestone = function(params, opportunityid, stageid, options) {
        return returnValue(ServiceManager.updateCrmOpportunityMilestone(customEvents.updateCrmOpportunityMilestone, params, opportunityid, stageid, options));
    };

    var getCrmCurrencyConvertion = function(params, data, options) {
        return returnValue(ServiceManager.getCrmCurrencyConvertion(customEvents.getCrmCurrencyConvertion, params, data, options));
    };

    var getCrmCurrencySummaryTable = function(params, currency, options) {
        return returnValue(ServiceManager.getCrmCurrencySummaryTable(customEvents.getCrmCurrencySummaryTable, params, currency, options));
    };

    var updateCRMContactStatusSettings = function(params, changeContactStatusGroupAuto, options) {
        return returnValue(ServiceManager.updateCRMContactStatusSettings(customEvents.updateCRMContactStatusSettings, params, changeContactStatusGroupAuto, options));
    };

    var updateCRMContactTagSettings = function(params, addTagToContactGroupAuto, options) {
        return returnValue(ServiceManager.updateCRMContactTagSettings(customEvents.updateCRMContactTagSettings, params, addTagToContactGroupAuto, options));
    };

    var addCrmHistoryEvent = function(params, data, options) {
        return returnValue(ServiceManager.addCrmHistoryEvent(customEvents.addCrmHistoryEvent, params, data, options));
    };

    var removeCrmHistoryEvent = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmHistoryEvent(customEvents.removeCrmHistoryEvent, params, id, options));
    };

    var getCrmHistoryEvents = function(params, options) {
        return returnValue(ServiceManager.getCrmHistoryEvents(customEvents.getCrmHistoryEvents, params, options));
    };

    var removeCrmFile = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmFile(customEvents.removeCrmFile, params, id, options));
    };

    var getCrmFolder = function(params, id, options) {
        return returnValue(ServiceManager.getCrmFolder(customEvents.getCrmFolder, params, id, options));
    };

    var updateCrmContactRights = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmContactRights(customEvents.updateCrmContactRights, params, id, data, options));
    };

    var updateCrmCaseRights = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmCaseRights(customEvents.updateCrmCaseRights, params, id, data, options));
    };

    var updateCrmOpportunityRights = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmOpportunityRights(customEvents.updateCrmOpportunityRights, params, id, data, options));
    };

    var addCrmEntityFiles = function(params, id, type, data, options) {
        return returnValue(ServiceManager.addCrmEntityFiles(customEvents.addCrmEntityFiles, params, id, type, data, options));
    };

    var removeCrmEntityFiles = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmEntityFiles(customEvents.removeCrmEntityFiles, params, id, options));
    };

    var getCrmEntityFiles = function(params, id, type, options) {
        return returnValue(ServiceManager.getCrmEntityFiles(customEvents.getCrmEntityFiles, params, id, type, options));
    };

    var getCrmTaskCategories = function(params, options) {
        return returnValue(ServiceManager.getCrmTaskCategories(customEvents.getCrmTaskCategories, params, options));
    };

    var addCrmEntityTaskTemplateContainer = function(params, data, options) {
        return returnValue(ServiceManager.addCrmEntityTaskTemplateContainer(customEvents.addCrmEntityTaskTemplateContainer, params, data, options));
    };

    var updateCrmEntityTaskTemplateContainer = function(params, id, data, options) {
        return returnValue(ServiceManager.updateCrmEntityTaskTemplateContainer(customEvents.updateCrmEntityTaskTemplateContainer, params, id, data, options));
    };

    var removeCrmEntityTaskTemplateContainer = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmEntityTaskTemplateContainer(customEvents.removeCrmEntityTaskTemplateContainer, params, id, options));
    };

    var getCrmEntityTaskTemplateContainer = function(params, id, options) {
        return returnValue(ServiceManager.getCrmEntityTaskTemplateContainer(customEvents.getCrmEntityTaskTemplateContainer, params, id, options));
    };

    var getCrmEntityTaskTemplateContainers = function(params, type, options) {
        return returnValue(ServiceManager.getCrmEntityTaskTemplateContainers(customEvents.getCrmEntityTaskTemplateContainers, params, type, options));
    };

    var addCrmEntityTaskTemplate = function(params, data, options) {
        return returnValue(ServiceManager.addCrmEntityTaskTemplate(customEvents.addCrmEntityTaskTemplate, params, data, options));
    };

    var updateCrmEntityTaskTemplate = function(params, data, options) {
        return returnValue(ServiceManager.updateCrmEntityTaskTemplate(customEvents.updateCrmEntityTaskTemplate, params, data, options));
    };

    var removeCrmEntityTaskTemplate = function(params, id, options) {
        return returnValue(ServiceManager.removeCrmEntityTaskTemplate(customEvents.removeCrmEntityTaskTemplate, params, id, options));
    };

    var getCrmEntityTaskTemplate = function(params, id, options) {
        return returnValue(ServiceManager.getCrmEntityTaskTemplate(customEvents.getCrmEntityTaskTemplate, params, id, options));
    };

    var getCrmEntityTaskTemplates = function(params, containerid, options) {
        return returnValue(ServiceManager.getCrmEntityTaskTemplates(customEvents.getCrmEntityTaskTemplates, params, containerid, options));
    };

    /* </crm> */
    /* <mail> */
    var _single_sm_request = function() {
        // sm methods and event names are equal
        var method = ServiceManager[arguments[0]];
        // get event string value by its name
        arguments[0] = customEvents[arguments[0]];
        // just 1 request
        arguments[arguments.length - 1] = arguments[arguments.length - 1] || {};
        arguments[arguments.length - 1].max_request_attempts = 1;
        return returnValue(method.apply(this, arguments));
    };

    var getMailFilteredMessages = function(params, filter_data, options) {
        return _single_sm_request('getMailFilteredMessages', params, filter_data, options);
    };

    var getMailFolders = function(params, last_check_time, options) {
        return _single_sm_request('getMailFolders', params, last_check_time, options);
    };

    var getMailMessagesModifyDate = function(params, options) {
        return _single_sm_request('getMailMessagesModifyDate', params, options);
    };

    var getMailFolderModifyDate = function(params, folder_id, options) {
        return _single_sm_request('getMailFolderModifyDate', params, folder_id, options);
    };

    var getMailAccounts = function(params, options) {
        return _single_sm_request('getMailAccounts', params, options);
    };

    var getMailTags = function(params, options) {
        return _single_sm_request('getMailTags', params, options);
    };

    var getMailMessage = function(params, id, data, options) {
        return _single_sm_request('getMailMessage', params, id, data, options);
    };

    var getLinkedCrmEntitiesInfo = function (params, data, options) {
        return _single_sm_request('getLinkedCrmEntitiesInfo', params, data, options);
    };

    var getNextMailMessageId = function(params, id, filter_data, options) {
        return _single_sm_request('getNextMailMessageId', params, id, filter_data, options);
    };

    var getPrevMailMessageId = function(params, id, filter_data, options) {
        return _single_sm_request('getPrevMailMessageId', params, id, filter_data, options);
    };

    var getMailConversation = function(params, id, load_all_content, options) {
        return _single_sm_request('getMailConversation', params, id, load_all_content, options);
    };

    var getNextMailConversationId = function(params, id, filter_data, options) {
        return _single_sm_request('getNextMailConversationId', params, id, filter_data, options);
    };

    var getPrevMailConversationId = function(params, id, filter_data, options) {
        return _single_sm_request('getPrevMailConversationId', params, id, filter_data, options);
    };

    var getMailMessageTemplate = function(params, options) {
        return _single_sm_request('getMailMessageTemplate', params, options);
    };

    var getMailRandomGuid = function(params, options) {
        return _single_sm_request('getMailRandomGuid', params, options);
    };

    var removeMailFolderMessages = function(params, folder_id, options) {
        return _single_sm_request('removeMailFolderMessages', params, folder_id, options);
    };

    var restoreMailMessages = function(params, ids, options) {
        return _single_sm_request('restoreMailMessages', params, ids, options);
    };

    var moveMailMessages = function(params, ids, folder, options) {
        return _single_sm_request('moveMailMessages', params, ids, folder, options);
    };

    var removeMailMessages = function(params, ids, options) {
        return _single_sm_request('removeMailMessages', params, ids, options);
    };

    var markMailMessages = function(params, ids, status, options) {
        return _single_sm_request('markMailMessages', params, ids, status, options);
    };

    var updateCrmMessages = function(params, emails, userIds, options) {
        return _single_sm_request('updateCrmMessages', params, emails, userIds, options);
    };

    var createMailTag = function(params, name, style, addresses, options) {
        return _single_sm_request('createMailTag', params, name, style, addresses, options);
    };

    var updateMailTag = function(params, id, name, style, addresses, options) {
        return _single_sm_request('updateMailTag', params, id, name, style, addresses, options);
    };

    var removeMailTag = function(params, id, options) {
        return _single_sm_request('removeMailTag', params, id, options);
    };

    var setMailTag = function(params, messages_ids, tag_id, options) {
        return _single_sm_request('setMailTag', params, messages_ids, tag_id, options);
    };

    var setMailConversationsTag = function (params, messages_ids, tag_id, options) {
        return _single_sm_request('setMailConversationsTag', params, messages_ids, tag_id, options);
    };

    var unsetMailTag = function(params, messages_ids, tag_id, options) {
        return _single_sm_request('unsetMailTag', params, messages_ids, tag_id, options);
    };

    var unsetMailConversationsTag = function(params, messages_ids, tag_id, options) {
        return _single_sm_request('unsetMailConversationsTag', params, messages_ids, tag_id, options);
    };

    var addMailDocument = function(params, id, data, options) {
        return _single_sm_request('addMailDocument', params, id, data, options);
    };

    var removeMailMailbox = function(params, email, options) {
        return _single_sm_request('removeMailMailbox', params, email, options);
    };

    var getMailDefaultMailboxSettings = function(params, email, options) {
        return _single_sm_request('getMailDefaultMailboxSettings', params, email, options);
    };

    var getMailMailbox = function(params, email, options) {
        return _single_sm_request('getMailMailbox', params, email, options);
    };

    var createMailMailboxSimple = function(params, email, password, options) {
        return _single_sm_request('createMailMailboxSimple', params, email, password, options);
    };

    var createMailMailboxOAuth = function(params, email, refreshToken, serviceType, options) {
        return _single_sm_request('createMailMailboxOAuth', params, email, refreshToken, serviceType, options);
    };

    var createMailMailbox = function(params, name, email, ssl, pop3_account, pop3_password, pop3_port, pop3_server,
        smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, ssl_outgoing, incoming_encryption_type, outcoming_encryption_type, auth_type_in, auth_type_smtp, options) {
        return _single_sm_request('createMailMailbox', params, name, email, ssl, pop3_account, pop3_password, pop3_port, pop3_server,
            smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, ssl_outgoing, incoming_encryption_type, outcoming_encryption_type, auth_type_in, auth_type_smtp, options);
    };

    var updateMailMailbox = function(params, name, email, ssl, pop3_account, pop3_password, pop3_port, pop3_server,
        smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, ssl_outgoing, incoming_encryption_type, outcoming_encryption_type, auth_type_in, auth_type_smtp, options) {
        return _single_sm_request('updateMailMailbox', params, name, email, ssl, pop3_account, pop3_password, pop3_port, pop3_server,
            smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, ssl_outgoing, incoming_encryption_type, outcoming_encryption_type, auth_type_in, auth_type_smtp, options);
    };

    var setMailMailboxState = function(params, email, state, options) {
        return _single_sm_request('setMailMailboxState', params, email, state, options);
    };

    var removeMailMessageAttachment = function(params, message_id, attachment_id, options) {
        return _single_sm_request('removeMailMessageAttachment', params, message_id, attachment_id, options);
    };

    var sendMailMessage = function(params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options) {
        return _single_sm_request('sendMailMessage', params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options);
    };

    var saveMailMessage = function(params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options) {
        return _single_sm_request('saveMailMessage', params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options);
    };

    var getMailContacts = function(params, term, options) {
        return _single_sm_request('getMailContacts', params, term, options);
    };



    var getMailAlerts = function(params, options) {
        return _single_sm_request('getMailAlerts', params, options);
    };

    var deleteMailAlert = function(params, id, options) {
        return _single_sm_request('deleteMailAlert', params, id, options);
    };

    var getMailFilteredConversations = function(params, filter_data, options) {
        return _single_sm_request('getMailFilteredConversations', params, filter_data, options);
    };

    var moveMailConversations = function(params, ids, folder, options) {
        return _single_sm_request('moveMailConversations', params, ids, folder, options);
    };

    var restoreMailConversations = function(params, ids, options) {
        return _single_sm_request('restoreMailConversations', params, ids, options);
    };

    var removeMailConversations = function(params, ids, options) {
        return _single_sm_request('removeMailConversations', params, ids, options);
    };

    var markMailConversations = function(params, ids, status, options) {
        return _single_sm_request('markMailConversations', params, ids, status, options);
    };

    var getMailDisplayImagesAddresses = function(params, options) {
        return _single_sm_request('getMailDisplayImagesAddresses', params, options);
    };

    var createDisplayImagesAddress = function(params, email, options) {
        return _single_sm_request('createDisplayImagesAddress', params, email, options);
    };

    var removeDisplayImagesAddress = function(params, email, options) {
        return _single_sm_request('removeDisplayImagesAddress', params, email, options);
    };

    var markChainAsCrmLinked = function (params, id_message, crm_contact_ids, options) {
        return _single_sm_request('markChainAsCrmLinked', params, id_message, crm_contact_ids, options);
    };

    var unmarkChainAsCrmLinked = function (params, id_message, crm_contact_ids, options) {
        return _single_sm_request('unmarkChainAsCrmLinked', params, id_message, crm_contact_ids, options);
    };

    var exportMessageToCrm = function (params, id_message, crm_contact_ids, options) {
        return _single_sm_request('exportMessageToCrm', params, id_message, crm_contact_ids, options);
    };

    var isConversationLinkedWithCrm = function (params, message_id, options) {
        return _single_sm_request('isConversationLinkedWithCrm', params, message_id, options);
    };

    var getMailHelpCenterHtml = function(params, options) {
        return _single_sm_request('getMailHelpCenterHtml', params, options);
    };

    /* </mail> */

    /* <settings> */
    var getWebItemSecurityInfo = function(params, data, options) {
        return returnValue(ServiceManager.getWebItemSecurityInfo(customEvents.getWebItemSecurityInfo, params, data, options));
    };

    var setWebItemSecurity = function(params, data, options) {
        return returnValue(ServiceManager.setWebItemSecurity(customEvents.setWebItemSecurity, params, data, options));
    };

    var setAccessToWebItems = function(params, data, options) {
        return returnValue(ServiceManager.setAccessToWebItems(customEvents.setAccessToWebItems, params, data, options));
    };

    var setProductAdministrator = function(params, data, options) {
        return returnValue(ServiceManager.setProductAdministrator(customEvents.setProductAdministrator, params, data, options));
    };

    var isProductAdministrator = function(params, data, options) {
        return returnValue(ServiceManager.isProductAdministrator(customEvents.isProductAdministrator, params, data, options));
    };
    var getPortalSettings = function(params, options) {
        return returnValue(ServiceManager.getPortalSettings(customEvents.getPortalSettings, params, options));
    };

    var getPortalLogo = function (params, options) {
        return returnValue(ServiceManager.getPortalLogo(customEvents.getPortalLogo, params, options));
    };

    var isMobileAppUser = function (params, data, options) {
        return returnValue(ServiceManager.isMobileAppUser(customEvents.isMobileAppUser, params, data, options));
    };

    /* </settings> */

    var getTalkUnreadMessages = function (params, options) {
        return returnValue(ServiceManager.getTalkUnreadMessages(customEvents.getTalkUnreadMessages, params, options));
    };

    return {
        events: customEvents,

        profile: ServiceFactory.profile,

        constants: {
            dateFormats: ServiceFactory.dateFormats,
            contactTypes: ServiceFactory.contactTypes,
            nameCollections: ServiceFactory.nameCollections
        },

        create: ServiceFactory.create,
        formattingDate: ServiceFactory.formattingDate,
        serializeDate: ServiceFactory.serializeDate,
        serializeTimestamp: ServiceFactory.serializeTimestamp,
        getDisplayTime: ServiceFactory.getDisplayTime,
        getDisplayDate: ServiceFactory.getDisplayDate,
        getDisplayDatetime: ServiceFactory.getDisplayDatetime,
        sortCommentsByTree: ServiceFactory.sortCommentsByTree,

        joint: joint,
        start: start,

        init: init,
        bind: bind,
        unbind: unbind,
        call: call,
        extendEventManager: extendEventManager,

        getQuotas: getQuotas,

        addProfile: addProfile,
        getProfile: getProfile,
        getProfiles: getProfiles,
        getProfilesByFilter: getProfilesByFilter,
        addGroup: addGroup,
        updateGroup: updateGroup,
        getGroup: getGroup,
        getGroups: getGroups,
        deleteGroup: deleteGroup,
        updateProfile: updateProfile,
        updateUserType: updateUserType,
        updateUserStatus: updateUserStatus,
        updateUserPhoto: updateUserPhoto,
        removeUserPhoto: removeUserPhoto,
        sendInvite: sendInvite,
        removeUsers: removeUsers,

        addCmtBlog: addCmtBlog,
        getCmtBlog: getCmtBlog,
        getCmtBlogs: getCmtBlogs,
        addCmtForumTopic: addCmtForumTopic,
        getCmtForumTopic: getCmtForumTopic,
        getCmtForumTopics: getCmtForumTopics,
        getCmtForumCategories: getCmtForumCategories,
        addCmtForumToCategory: addCmtForumToCategory,
        addCmtEvent: addCmtEvent,
        getCmtEvent: getCmtEvent,
        getCmtEvents: getCmtEvents,
        addCmtBookmark: addCmtBookmark,
        getCmtBookmark: getCmtBookmark,
        getCmtBookmarks: getCmtBookmarks,

        addCmtForumTopicPost: addCmtForumTopicPost,
        addCmtBlogComment: addCmtBlogComment,
        getCmtBlogComments: getCmtBlogComments,
        addCmtEventComment: addCmtEventComment,
        getCmtEventComments: getCmtEventComments,
        addCmtBookmarkComment: addCmtBookmarkComment,
        getCmtBookmarkComments: getCmtBookmarkComments,

        subscribeProject: subscribeProject,
        getFeeds: getFeeds,
        getNewFeedsCount: getNewFeedsCount,
        readFeeds: readFeeds,
        getPrjTags: getPrjTags,
        getPrjTagsByName: getPrjTagsByName,
        addPrjComment: addPrjComment,
        updatePrjComment: updatePrjComment,
        removePrjComment: removePrjComment,
        getPrjComments: getPrjComments,
        addPrjTaskComment: addPrjTaskComment,
        updatePrjTaskComment: updatePrjTaskComment,
        removePrjTaskComment: removePrjTaskComment,
        getPrjTaskComments: getPrjTaskComments,
        addPrjDiscussionComment: addPrjDiscussionComment,
        updatePrjDiscussionComment: updatePrjDiscussionComment,
        removePrjDiscussionComment: removePrjDiscussionComment,
        getPrjDiscussionComments: getPrjDiscussionComments,

        addPrjEntityFiles: addPrjEntityFiles,
        uploadFilesToPrjEntity: uploadFilesToPrjEntity,
        removePrjEntityFiles: removePrjEntityFiles,
        getPrjEntityFiles: getPrjEntityFiles,
        addPrjSubtask: addPrjSubtask,
        updatePrjSubtask: updatePrjSubtask,
        updatePrjTask: updatePrjTask,
        removePrjSubtask: removePrjSubtask,
        addPrjTask: addPrjTask,
        getPrjTask: getPrjTask,
        addPrjTaskByMessage: addPrjTaskByMessage,
        getPrjTasks: getPrjTasks,
        getPrjTasksById: getPrjTasksById,
        addPrjMilestone: addPrjMilestone,
        updatePrjMilestone: updatePrjMilestone,
        removePrjMilestone: removePrjMilestone,
        getPrjMilestone: getPrjMilestone,
        getPrjMilestones: getPrjMilestones,
        addPrjDiscussion: addPrjDiscussion,
        updatePrjDiscussion: updatePrjDiscussion,
        removePrjDiscussion: removePrjDiscussion,
        getPrjDiscussion: getPrjDiscussion,
        getPrjDiscussions: getPrjDiscussions,
        subscribeToPrjDiscussion: subscribeToPrjDiscussion,
        addPrjProject: addPrjProject,
        updatePrjProject: updatePrjProject,
        updatePrjProjectStatus: updatePrjProjectStatus,
        removePrjProject: removePrjProject,
        followingPrjProject: followingPrjProject,
        getPrjProject: getPrjProject,
        getPrjProjects: getPrjProjects,
        getPrjTaskFiles: getPrjTaskFiles,
        subscribeToPrjTask: subscribeToPrjTask,
        notifyPrjTaskResponsible: notifyPrjTaskResponsible,

        addPrjTaskLink: addPrjTaskLink,
        removePrjTaskLink: removePrjTaskLink,

        getPrjGanttIndex: getPrjGanttIndex,
        setPrjGanttIndex: setPrjGanttIndex,

        getPrjProjectFolder: getPrjProjectFolder,
        getPrjSelfProjects: getPrjSelfProjects,
        getPrjFollowProjects: getPrjFollowProjects,

        getProjectsForCrmContact: getProjectsForCrmContact,
        addProjectForCrmContact: addProjectForCrmContact,
        removeProjectFromCrmContact: removeProjectFromCrmContact,
        getPrjTeam: getPrjTeam,
        updatePrjTeam: updatePrjTeam,
        addPrjProjectTeamPerson: addPrjProjectTeamPerson,
        removePrjProjectTeamPerson: removePrjProjectTeamPerson,
        getPrjProjectTeamPersons: getPrjProjectTeamPersons,
        setTeamSecurity: setTeamSecurity,
        getPrjProjectFiles: getPrjProjectFiles,
        addPrjTime: addPrjTime,
        getPrjTime: getPrjTime,
        getTotalTimeByFilter: getTotalTimeByFilter,
        getTotalBilledTimeByFilter: getTotalBilledTimeByFilter,
        updatePrjTime: updatePrjTime,
        removePrjTime: removePrjTime,
        changePaymentStatus: changePaymentStatus,
        getPrjTemplates: getPrjTemplates,
        getPrjTemplate: getPrjTemplate,
        updatePrjTemplate: updatePrjTemplate,
        createPrjTemplate: createPrjTemplate,
        removePrjTemplate: removePrjTemplate,
        getPrjActivities: getPrjActivities,
        addPrjImport: addPrjImport,
        getPrjImport: getPrjImport,
        getPrjImportProjects: getPrjImportProjects,
        checkPrjImportQuota: checkPrjImportQuota,
        addPrjReportTemplate: addPrjReportTemplate,
        updatePrjReportTemplate: updatePrjReportTemplate,
        deletePrjReportTemplate: deletePrjReportTemplate,

        createDocUploadFile: createDocUploadFile,
        addDocFile: addDocFile,
        removeDocFile: removeDocFile,
        getDocFile: getDocFile,
        addDocFolder: addDocFolder,
        addDocFile: addDocFile,
        getDocFile: getDocFile,
        addDocFolder: addDocFolder,
        addDocFile: addDocFile,
        getDocFile: getDocFile,
        addDocFolder: addDocFolder,
        getDocFolder: getDocFolder,
        createDocUploadSession: createDocUploadSession,

        createCrmUploadFile: createCrmUploadFile,

        addCrmContactInfo: addCrmContactInfo,
        updateCrmContactInfo: updateCrmContactInfo,
        deleteCrmContactInfo: deleteCrmContactInfo,
        addCrmContactData: addCrmContactData,
        updateCrmContactData: updateCrmContactData,
        addCrmContactTwitter: addCrmContactTwitter,
        addCrmEntityNote: addCrmEntityNote,

        addCrmContact: addCrmContact,
        addCrmCompany: addCrmCompany,
        updateCrmCompany: updateCrmCompany,
        updateCrmContactContactStatus: updateCrmContactContactStatus,
        updateCrmCompanyContactStatus: updateCrmCompanyContactStatus,
        updateCrmPersonContactStatus: updateCrmPersonContactStatus,
        addCrmPerson: addCrmPerson,
        updateCrmPerson: updateCrmPerson,
        removeCrmContact: removeCrmContact,
        mergeCrmContacts: mergeCrmContacts,
        addCrmTag: addCrmTag,
        addCrmContactTagToGroup: addCrmContactTagToGroup,
        addCrmEntityTag: addCrmEntityTag,
        removeCrmTag: removeCrmTag,
        removeCrmEntityTag: removeCrmEntityTag,
        removeCrmUnusedTag: removeCrmUnusedTag,
        addCrmCustomField: addCrmCustomField,
        updateCrmCustomField: updateCrmCustomField,
        removeCrmCustomField: removeCrmCustomField,
        reorderCrmCustomFields: reorderCrmCustomFields,
        addCrmDealMilestone: addCrmDealMilestone,
        updateCrmDealMilestone: updateCrmDealMilestone,
        updateCrmDealMilestoneColor: updateCrmDealMilestoneColor,
        removeCrmDealMilestone: removeCrmDealMilestone,
        reorderCrmDealMilestones: reorderCrmDealMilestones,
        addCrmContactStatus: addCrmContactStatus,
        updateCrmContactStatus: updateCrmContactStatus,
        updateCrmContactStatusColor: updateCrmContactStatusColor,
        removeCrmContactStatus: removeCrmContactStatus,

        addCrmContactType: addCrmContactType,
        updateCrmContactType: updateCrmContactType,
        removeCrmContactType: removeCrmContactType,

        getCrmListItem: getCrmListItem,
        addCrmListItem: addCrmListItem,
        updateCrmListItem: updateCrmListItem,
        updateCrmListItemIcon: updateCrmListItemIcon,
        removeCrmListItem: removeCrmListItem,
        reorderCrmListItems: reorderCrmListItems,
        removePrjTask: removePrjTask,
        addCrmTask: addCrmTask,
        addCrmTaskGroup: addCrmTaskGroup,
        getCrmTask: getCrmTask,
        addCrmEntityMember: addCrmEntityMember,
        addCrmContactsForProject: addCrmContactsForProject,
        removeCrmEntityMember: removeCrmEntityMember,
        addCrmDealForContact: addCrmDealForContact,
        removeCrmDealFromContact: removeCrmDealFromContact,
        updateCrmTask: updateCrmTask,
        removeCrmTask: removeCrmTask,
        getCrmCases: getCrmCases,
        getCrmCasesByPrefix: getCrmCasesByPrefix,
        removeCrmCase: removeCrmCase,
        updateCrmCase: updateCrmCase,
        getCrmContacts: getCrmContacts,
        getCrmSimpleContacts: getCrmSimpleContacts,
        getCrmContactsForMail: getCrmContactsForMail,
        getCrmContactsByPrefix: getCrmContactsByPrefix,
        getCrmContact: getCrmContact,
        getCrmTags: getCrmTags,
        getCrmEntityMembers: getCrmEntityMembers,
        getCrmContactTasks: getCrmContactTasks,
        getCrmTasks: getCrmTasks,
        getCrmOpportunity: getCrmOpportunity,
        getCrmOpportunities: getCrmOpportunities,
        getCrmOpportunitiesByPrefix: getCrmOpportunitiesByPrefix,
        removeCrmOpportunity: removeCrmOpportunity,
        updateCrmOpportunityMilestone: updateCrmOpportunityMilestone,
        getCrmCurrencyConvertion: getCrmCurrencyConvertion,
        getCrmCurrencySummaryTable: getCrmCurrencySummaryTable,
        updateCRMContactStatusSettings: updateCRMContactStatusSettings,
        updateCRMContactTagSettings: updateCRMContactTagSettings,
        addCrmHistoryEvent: addCrmHistoryEvent,
        removeCrmHistoryEvent: removeCrmHistoryEvent,
        getCrmHistoryEvents: getCrmHistoryEvents,
        removeCrmFile: removeCrmFile,
        getCrmFolder: getCrmFolder,
        updateCrmContactRights: updateCrmContactRights,
        updateCrmCaseRights: updateCrmCaseRights,
        updateCrmOpportunityRights: updateCrmOpportunityRights,
        addCrmEntityFiles: addCrmEntityFiles,
        removeCrmEntityFiles: removeCrmEntityFiles,
        getCrmEntityFiles: getCrmEntityFiles,
        getCrmTaskCategories: getCrmTaskCategories,
        getCrmCase: getCrmCase,

        addCrmEntityTaskTemplateContainer: addCrmEntityTaskTemplateContainer,
        updateCrmEntityTaskTemplateContainer: updateCrmEntityTaskTemplateContainer,
        removeCrmEntityTaskTemplateContainer: removeCrmEntityTaskTemplateContainer,
        getCrmEntityTaskTemplateContainer: getCrmEntityTaskTemplateContainer,
        getCrmEntityTaskTemplateContainers: getCrmEntityTaskTemplateContainers,
        addCrmEntityTaskTemplate: addCrmEntityTaskTemplate,
        updateCrmEntityTaskTemplate: updateCrmEntityTaskTemplate,
        removeCrmEntityTaskTemplate: removeCrmEntityTaskTemplate,
        getCrmEntityTaskTemplate: getCrmEntityTaskTemplate,
        getCrmEntityTaskTemplates: getCrmEntityTaskTemplates,
        getCrmContactsForProject: getCrmContactsForProject,

        getMailFilteredMessages: getMailFilteredMessages,
        getMailFolders: getMailFolders,
        getMailMessagesModifyDate: getMailMessagesModifyDate,
        getMailFolderModifyDate: getMailFolderModifyDate,
        getMailAccounts: getMailAccounts,
        getMailTags: getMailTags,
        getMailMessage: getMailMessage,
        getNextMailMessageId: getNextMailMessageId,
        getPrevMailMessageId: getPrevMailMessageId,
        getMailConversation: getMailConversation,
        getNextMailConversationId: getNextMailConversationId,
        getPrevMailConversationId: getPrevMailConversationId,
        getMailMessageTemplate: getMailMessageTemplate,
        getMailRandomGuid: getMailRandomGuid,
        removeMailFolderMessages: removeMailFolderMessages,
        restoreMailMessages: restoreMailMessages,
        moveMailMessages: moveMailMessages,
        removeMailMessages: removeMailMessages,
        markMailMessages: markMailMessages,
        updateCrmMessages: updateCrmMessages,
        createMailTag: createMailTag,
        updateMailTag: updateMailTag,
        removeMailTag: removeMailTag,
        setMailTag: setMailTag,
        setMailConversationsTag: setMailConversationsTag,
        unsetMailTag: unsetMailTag,
        unsetMailConversationsTag: unsetMailConversationsTag,
        addMailDocument: addMailDocument,
        removeMailMailbox: removeMailMailbox,
        getMailDefaultMailboxSettings: getMailDefaultMailboxSettings,
        getMailMailbox: getMailMailbox,
        createMailMailboxSimple: createMailMailboxSimple,
        createMailMailboxOAuth: createMailMailboxOAuth,
        createMailMailbox: createMailMailbox,
        updateMailMailbox: updateMailMailbox,
        setMailMailboxState: setMailMailboxState,
        removeMailMessageAttachment: removeMailMessageAttachment,
        sendMailMessage: sendMailMessage,
        saveMailMessage: saveMailMessage,
        getMailContacts: getMailContacts,
        getMailAlerts: getMailAlerts,
        deleteMailAlert: deleteMailAlert,
        getMailFilteredConversations: getMailFilteredConversations,
        moveMailConversations: moveMailConversations,
        restoreMailConversations: restoreMailConversations,
        removeMailConversations: removeMailConversations,
        markMailConversations: markMailConversations,
        getMailDisplayImagesAddresses: getMailDisplayImagesAddresses,
        createDisplayImagesAddress: createDisplayImagesAddress,
        removeDisplayImagesAddress: removeDisplayImagesAddress,
        markChainAsCrmLinked: markChainAsCrmLinked,
        unmarkChainAsCrmLinked: unmarkChainAsCrmLinked,
        exportMessageToCrm: exportMessageToCrm,
        getLinkedCrmEntitiesInfo: getLinkedCrmEntitiesInfo,
        isConversationLinkedWithCrm:isConversationLinkedWithCrm,
        getMailHelpCenterHtml: getMailHelpCenterHtml,

        getWebItemSecurityInfo: getWebItemSecurityInfo,
        setWebItemSecurity: setWebItemSecurity,
        setAccessToWebItems: setAccessToWebItems,
        setProductAdministrator: setProductAdministrator,
        isProductAdministrator: isProductAdministrator,
        getPortalSettings: getPortalSettings,
        getPortalLogo: getPortalLogo,
        
        isMobileAppUser: isMobileAppUser,

        getTalkUnreadMessages: getTalkUnreadMessages
    };
})();
