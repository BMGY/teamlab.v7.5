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

;
window.ServiceManager = (function(helper) {
    var ADD = 'post',
        UPDATE = 'put',
        REMOVE = 'delete',
        GET = 'get';

    function isArray(o) {
        return o ? o.constructor.toString().indexOf("Array") != -1 : false;
    }

    function getQuery(o) {
        return o && typeof o === 'object' && o.hasOwnProperty('query') ? o.query : null;
    }

    /* <common> */
    var getQuotas = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'settings/quota.json',
            null,
            options
        );
    };
    /* </common> */

    /* <people> */
    var addProfile = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'people.json',
            data,
            options
        );
        return true;
    };

    var getProfile = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'people/' + id + '.json',
            null,
            options
        );
    };

    var getProfiles = function(eventname, params, options) {
        var status = null;
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            status = options.filter.hasOwnProperty('status') ? options.filter.status : status;
        }

        var query = getQuery(options),
            url = 'people' + (status !== null ? '/status/' + status : '') + '.json';

        if (query) {
            if (options.filter) {
                options.filter.query = query;
                url = 'people' + (status !== null ? '/status/' + status : '') + '/search.json';
            } else {

                url = 'people' + (status !== null ? '/status/' + status : '') + (query ? '/@search/' + query : '') + '.json';
            }
        }

        return helper.request(
            eventname,
            params,
            GET,
            url,
            null,
            options
        );
    };

    var getProfilesByFilter = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'people/filter.json',
            null,
            options
        );
    };

    var addGroup = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'group.json',
            data,
            options
        );
        return true;
    };

    var getGroup = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'group/' + id + '.json',
            null,
            options
        );
    };

    var getGroups = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'group.json',
            null,
            options
        );
    };

    var updateGroup = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'group/' + id + '.json',
            data,
            options
        );
    };

    var deleteGroup = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'group/' + id + '.json',
            null,
            options
        );
    };

    var updateProfile = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'people/' + id + '.json',
            data,
            options
        );
    };

    var updateUserType = function(eventname, params, type, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'people/type/' + type + '.json',
            data,
            options
        );
    };

    var updateUserStatus = function(eventname, params, status, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'people/status/' + status + '.json',
            data,
            options
        );
    };
    var updateUserPhoto = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'people/' + id + '/photo.json',
            data,
            options
        );
    };

    var removeUserPhoto = function (eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'people/' + id + '/photo.json',
            data,
            options
        );
    };

    var sendInvite = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'people/invite.json',
            data,
            options
        );
    };

    var removeUsers = function (eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'people/delete.json',
            data,
            options
        );
    };
    /* </people> */

    /* <community> */
    var addCmtBlog = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/blog.json',
            data,
            options
        );
        return true;
    };

    var getCmtBlog = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/blog/' + id + '.json',
            null,
            options
        );
    };

    var getCmtBlogs = function(eventname, params, options) {
        var query = getQuery(options);
        return helper.request(
            eventname,
            params,
            GET,
            'community/blog' + (query ? '/@search/' + query : '') + '.json',
            null,
            options
        );
    };

    var addCmtForumTopic = function(eventname, params, threadid, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/forum/' + threadid + '.json',
            data,
            options
        );
        return true;
    };

    var getCmtForumTopic = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/forum/topic/' + id + '.json',
            null,
            options
        );
    };

    var getCmtForumTopics = function(eventname, params, options) {
        var query = getQuery(options);
        return helper.request(
            eventname,
            params,
            GET,
            'community/forum' + (query ? '/@search/' + query : '/topic/recent') + '.json',
            null,
            options
        );
    };

    var getCmtForumCategories = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/forum.json',
            null,
            options
        );
    };

    var addCmtForumToCategory = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'community/forum.json',
            data,
            options
        );
    };

    var addCmtEvent = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/event.json',
            data,
            options
        );
        return true;
    };

    var getCmtEvent = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/event/' + id + '.json',
            null,
            options
        );
    };

    var getCmtEvents = function(eventname, params, options) {
        var query = getQuery(options);
        return helper.request(
            eventname,
            params,
            GET,
            'community/event' + (query ? '/@search/' + query : '') + '.json',
            null,
            options
        );
    };

    var addCmtBookmark = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/bookmark.json',
            data,
            options
        );
        return true;
    };

    var getCmtBookmark = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/bookmark/' + id + '.json',
            null,
            options
        );
    };

    var getCmtBookmarks = function(eventname, params, options) {
        var query = getQuery(options);
        return helper.request(
            eventname,
            params,
            GET,
            'community/bookmark' + (query ? '/@search/' + query : '/top/recent') + '.json',
            null,
            options
        );
    };

    var addCmtForumTopicPost = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/forum/topic/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var addCmtBlogComment = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/blog/' + id + '/comment.json',
            data,
            options
        );
        return true;
    };

    var getCmtBlogComments = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/blog/' + id + '/comment.json',
            null,
            options
        );
    };

    var addCmtEventComment = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/event/' + id + '/comment.json',
            data,
            options
        );
        return true;
    };

    var getCmtEventComments = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/event/' + id + '/comment.json',
            null,
            options
        );
    };

    var addCmtBookmarkComment = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'community/bookmark/' + id + '/comment.json',
            data,
            options
        );
        return true;
    };

    var getCmtBookmarkComments = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'community/bookmark/' + id + '/comment.json',
            null,
            options
        );
    };
    /* </community> */

    /* <projects> */

    var subscribeProject = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/follow.json',
            id,
            options
        );
        return true;
    };

    var getFeeds = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'feed/filter.json',
            null,
            options
        );
    };

    var getNewFeedsCount = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'feed/newfeedscount.json',
            null,
            options
        );
    };

    var readFeeds = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'feed/read.json',
            null,
            options
        );
    };

    var getPrjTags = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            'get',
            'project/tag.json',
            null,
            options
        );
    };

    var getPrjTagsByName = function(eventname, params, name, data, options) {
        return helper.request(
            eventname,
            params,
            'get',
            'project/tag/search.json',
            data,
            options
        );
    };

    var addPrjSubtask = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/task/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var updatePrjSubtask = function(eventname, params, parentid, id, data, options) {
        var updateStatus = false;
        for (var fld in data) {
            if (data.hasOwnProperty(fld)) {
                switch (fld) {
                    case 'status':
                        updateStatus = true;
                        break;
                }
            }
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'project/task/' + parentid + '/' + id + (updateStatus ? '/status' : '') + '.json',
            data,
            options
        );
        return true;
    };

    var removePrjSubtask = function(eventname, params, parentid, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/task/' + parentid + '/' + id + '.json',
            id,
            options
        );
        return true;
    };

    var addPrjTask = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/' + id + '/task.json',
            data,
            options
        );
        return true;
    };

    var addPrjTaskByMessage = function(eventname, params, prjId, messageId, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/' + prjId + '/task/' + messageId + '.json',
            null,
            options
        );
    };

    var updatePrjTask = function(eventname, params, id, data, options) {
        var updateStatus = false;
        var updateMilestone = false;
        for (var fld in data) {
            if (data.hasOwnProperty(fld)) {
                switch (fld) {
                    case 'status':
                        updateStatus = true;
                        break;
                    case 'newMilestoneID':
                        updateMilestone = true;
                        data.milestoneid = data.newMilestoneID;
                        break;
                }
            }
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'project/task/' + id + (updateStatus ? '/status' : '') + (updateMilestone ? '/milestone' : '') + '.json',
            data,
            options
        );
        return true;
    };

    var removePrjTask = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/task/' + id + '.json',
            id,
            options
        );
        return true;
    };

    var getPrjTask = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/task/' + id + '.json',
            null,
            options
        );
    };

    var getPrjTasksById = function(eventname, params, ids, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/task.json',
            ids,
            options
        );
    };

    var getPrjTasks = function(eventname, params, id, type, status, options) {
        if (!id || !type || !status || !options) {
            var filter = null, _id = null, _type = null, _status = null, _options = null;
            for (var i = 2, n = arguments.length; i < n; i++) {
                switch (arguments[i]) {
                    case '@all':
                    case '@self':
                        _type = _type || arguments[i];
                        break;
                    case 'notaccept':
                    case 'open':
                    case 'closed':
                    case 'disable':
                    case 'unclassified':
                    case 'notinmilestone':
                        _status = _status || arguments[i];
                        break;
                    default:
                        _options = _options || (typeof arguments[i] === 'function' || typeof arguments[i] === 'object' ? arguments[i] : _options);
                        _id = _id || (isFinite(+arguments[i]) ? +arguments[i] : _id);
                        break;
                }
            }

            options = _options;
            status = _status;
            type = _type;
            id = _id;
        }
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            filter = options.filter;
        }

        return helper.request(
            eventname,
            params,
            GET,
            'project' + (id ? '/' + id : '') + '/task' + (type ? '/' + type : '') + (status ? '/' + status : '') + (filter ? '/filter' : '') + '.json',
            null,
            options
        );
    };

    var getPrjTaskFiles = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/task/' + id + '/files.json',
            null,
            options
        );
    };

    var subscribeToPrjTask = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/task/' + id + '/subscribe.json',
            id,
            options
        );
    };

    var notifyPrjTaskResponsible = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/task/' + id + '/notify.json',
            null,
            options
        );
    };

    var addPrjTaskLink = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/task/' + id + '/link.json',
            data,
            options
        );
        return true;
    };

    var removePrjTaskLink = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/task/' + id + '/link.json',
            data,
            options
        );
        return true;
    };

    var getPrjTeam = function(eventname, params, ids, options) {
        var isId = ids && (typeof ids === 'number' || typeof ids === 'string');
        return helper.request(
            eventname,
            params,
            isId ? GET : ADD,
            'project' + (isId ? '/' + ids : '') + '/team.json',
            isId ? null : { ids: ids },
            options
        );
    };

    var updatePrjTeam = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/team.json',
            data,
            options
        );
    };

    var setTeamSecurity = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/team/security.json',
            data,
            options
        );
    };

    var getPrjProjectFolder = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '/files.json',
            null,
            options
        );
    };

    var addPrjEntityFiles = function(eventname, params, id, type, data, options) {
        options = options || {};
        if (typeof options === 'function') {
            options = { success: options };
        }
        if (!options.hasOwnProperty('filter')) {
            options.filter = {};
        }
        if (!options.filter.hasOwnProperty('entityType')) {
            options.filter.entityType = type;
        }

        helper.request(
            eventname,
            params,
            ADD,
            'project/' + id + '/entityfiles.json',
            isArray(data) ? { files: data } : data,
            options
        );
        return true;
    };

    var removePrjEntityFiles = function(eventname, params, id, type, data, options) {
        options = options || {};
        if (typeof options === 'function') {
            options = { success: options };
        }
        if (!options.hasOwnProperty('filter')) {
            options.filter = {};
        }
        if (!options.filter.hasOwnProperty('entityType')) {
            options.filter.entityType = type;
        }

        if (data && typeof data === 'object' && !data.hasOwnProperty('entityType')) {
            data.entityType = type;
        }

        helper.request(
            eventname,
            params,
            REMOVE,
            'project/' + id + '/entityfiles.json',
            typeof data === 'number' || typeof data === 'string' ? { entityType: type, fileid: data } : data,
            options
        );
        return true;
    };

    var getPrjEntityFiles = function(eventname, params, id, type, options) {
        options = options || {};
        if (typeof options === 'function') {
            options = { success: options };
        }
        if (!options.hasOwnProperty('filter')) {
            options.filter = {};
        }
        if (!options.filter.hasOwnProperty('entityType')) {
            options.filter.entityType = type;
        }

        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '/entityfiles.json',
            null,
            options
        );
    };

    var addPrjMilestone = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/' + id + '/milestone.json',
            data,
            options
        );
        return true;
    };

    var updatePrjMilestone = function(eventname, params, id, data, options) {
        var fldInd = 0,
            updateItem = null;
        for (var fld in data) {
            if (data.hasOwnProperty(fld)) {
                fldInd++;
                switch (fld) {
                    case 'status':
                        updateItem = 'status';
                        break;
                }
            }
        }
        if (fldInd > 1) {
            updateItem = null;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'project/milestone/' + id + (updateItem ? '/' + updateItem : '') + '.json',
            data,
            options
        );
        return true;
    };

    var removePrjMilestone = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/milestone/' + id + '.json',
            id,
            options
        );
        return true;
    };

    var getPrjMilestone = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/milestone/' + id + '.json',
            null,
            options
        );
    };

    var getPrjMilestones = function(eventname, params, id, options) {
        var type = null;

        var _id = id, _type = type;
        switch (id) {
            case 'late':
                _type = id;
                _id = null;
                break;
        }

        if (id instanceof Date) {
            _type = id.getFullYear() + '/' + (id.getMonth() + 1);
            _id = null;
        }

        id = _id;
        type = _type;

        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            var filter = options.filter;
            for (var fld in filter) {
                switch (fld) {
                    case 'participant':
                    case 'tag':
                    case 'projectId':
                    case 'status':
                    case 'deadlineStart':
                    case 'deadlineStop':
                    case 'sortBy':
                    case 'sortOrder':
                        type = type || 'filter';
                        break;
                }
            }
        }

        return helper.request(
            eventname,
            params,
            GET,
            'project' + (id ? '/' + id : '') + '/milestone' + (type ? '/' + type : '') + '.json',
            null,
            options
        );
    };

    var addPrjDiscussion = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/' + id + '/message.json',
            data,
            options
        );
        return true;
    };

    var updatePrjDiscussion = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/message/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removePrjDiscussion = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/message/' + id + '.json',
            id,
            options
        );
        return true;
    };

    var getPrjDiscussion = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/message/' + id + '.json',
            null,
            options
        );
    };

    var getPrjDiscussions = function(eventname, params, id, options) {
        var type = null;
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            var filter = options.filter;
            for (var fld in filter) {
                switch (fld) {
                    case 'participant':
                    case 'tag':
                    case 'projectId':
                    case 'sortBy':
                    case 'sortOrder':
                        type = type || 'filter';
                        break;
                }
            }
        }

        return helper.request(
            eventname,
            params,
            GET,
            'project' + (id ? '/' + id : '') + '/message' + (type ? '/' + type : '') + '.json',
            null,
            options
        );
    };

    var subscribeToPrjDiscussion = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/message/' + id + '/subscribe.json',
            id,
            options
        );
    };

    var addPrjProject = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project.json',
            data,
            options
        );
        return true;
    };

    var updatePrjProject = function(eventname, params, id, data, options) {
        var fldInd = 0,
            updateItem = null;
        for (var fld in data) {
            if (data.hasOwnProperty(fld)) {
                fldInd++;
                switch (fld) {
                    case 'tags':
                        updateItem = 'tag';
                        break;
                    case 'status':
                        updateItem = 'status';
                        break;
                }
            }
        }
        if (fldInd > 1) {
            updateItem = null;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + (updateItem ? '/' + updateItem : '') + '.json',
            data,
            options
        );
        return true;
    };

    var updatePrjProjectStatus = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/status.json',
            data,
            options
        );
        return true;
    };

    var removePrjProject = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/' + id + '.json',
            id,
            options
        );
        return true;
    };

    var followingPrjProject = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/follow.json',
            data,
            options
        );
    };

    var getPrjProject = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '.json',
            null,
            options
        );
    };

    var getPrjProjects = function(eventname, params, type, options) {
        if (arguments.length < 4) {
            options = type;
            type = null;
        }

        var filter = null;
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            filter = options.filter;
            for (var fld in filter) {
                switch (fld) {
                    case 'tag':
                    case 'follow':
                    case 'status':
                    case 'participant':
                    case 'sortBy':
                    case 'sortOrder':
                        type = type || 'filter';
                        break;
                }
            }
        }

        var query = getQuery(options);

        return helper.request(
            eventname,
            params,
            GET,
            'project' + (type ? '/' + type : '') + (query ? '/@search/' + query : '') + '.json',
            null,
            options
        );
    };

    var getPrjSelfProjects = function(eventname, params, options) {
        return getPrjProjects(eventname, params, '@self', options);
    };

    var getPrjFollowProjects = function(eventname, params, options) {
        return getPrjProjects(eventname, params, '@follow', options);
    };

    var getProjectsForCrmContact = function(eventname, params, contactid, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/contact/' + contactid + '.json',
            null,
            options
        );
    };

    var addProjectForCrmContact = function(eventname, params, projectid, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'project/' + projectid + '/contact.json',
            data,
            options
        );
    };

    var removeProjectFromCrmContact = function(eventname, params, projectid, data, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'project/' + projectid + '/contact.json',
            data,
            options
        );
    };

    var updatePrjComment = function(eventname, params, id, data, options) {
        if (!data.parentid) {
            data.parentid = '00000000-0000-0000-0000-000000000000';
        }
        if (!data.hasOwnProperty('text') && data.hasOwnProperty('content')) {
            data.text = data.content;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'project/comment/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removePrjComment = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/comment/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var addPrjTaskComment = function(eventname, params, id, data, options) {
        if (!data.parentid) {
            data.parentid = '00000000-0000-0000-0000-000000000000';
        }

        helper.request(
            eventname,
            params,
            ADD,
            'project/task/' + id + '/comment.json',
            data,
            options
        );
        return true;
    };

    var getPrjTaskComments = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/task/' + id + '/comment.json',
            null,
            options
        );
    };

    var addPrjDiscussionComment = function(eventname, params, id, data, options) {
        if (!data.parentid) {
            data.parentid = '00000000-0000-0000-0000-000000000000';
        }

        helper.request(
            eventname,
            params,
            ADD,
            'project/message/' + id + '/comment.json',
            data,
            options
        );
        return true;
    };

    var getPrjDiscussionComments = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/message/' + id + '/comment.json',
            null,
            options
        );
    };

    var addPrjProjectTeamPerson = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/' + id + '/team.json',
            data,
            options
        );
        return true;
    };

    var removePrjProjectTeamPerson = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/' + id + '/team.json',
            data,
            options
        );
        return true;
    };

    var getPrjProjectTeamPersons = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '/team.json',
            null,
            options
        );
    };

    var getPrjProjectFiles = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '/entityfiles.json',
            null,
            options
        );
    };

    // tasks index for gantt
    var getPrjGanttIndex = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/' + id + '/order.json',
            null,
            options
        );
    };

    var setPrjGanttIndex = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/' + id + '/order.json',
            data,
            options
        );
        return true;
    };

    // time-traking

    var addPrjTime = function(eventname, params, taskid, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/task/' + taskid + '/time.json',
            data,
            options
        );
        return true;
    };

    var getPrjTime = function(eventname, params, taskid, options) {

        if (!taskid || !options) {
            var filter = null, _taskid = null, _options = null;
            for (var i = 2, n = arguments.length; i < n; i++) {
                _options = _options || (typeof arguments[i] === 'function' || typeof arguments[i] === 'object' ? arguments[i] : _options);
                _taskid = _taskid || (isFinite(+arguments[i]) ? +arguments[i] : _taskid);
            }

            options = _options;
            taskid = _taskid;
        }
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            filter = options.filter;
        }

        return helper.request(
            eventname,
            params,
            GET,
            'project' + (taskid ? '/task/' + taskid : '') + '/time' + (filter ? '/filter' : '') + '.json',
            null,
            options
        );
    };

    var getTotalTaskTimeByFilter = function(eventname, params, options) {
        var data = null;
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            data = options.filter;
        }
        return helper.request(
            eventname,
            params,
            GET,
            'project/time/filter/total.json',
            null,
            options
        );
    }

    var getTotalBilledTaskTimeByFilter = function(eventname, params, options) {
        var data = null;
        if (options && typeof options === 'object' && options.hasOwnProperty('filter')) {
            data = options.filter;
        }
        return helper.request(
            eventname,
            params,
            GET,
            'project/time/filter/billed.json',
            null,
            options
        );
    }

    var updatePrjTime = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/time/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var changePaymentStatus = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/time/times/status.json',
            data,
            options
        );
        return true;
    };

    var removePrjTime = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/time/times/remove.json',
            data,
            options
        );
        return true;
    };

    // project templates

    var getPrjTemplates = function(eventname, params, options) {
        helper.request(
            eventname,
            params,
            GET,
            'project/template.json',
            null,
            options
        );
        return true;
    };

    var getPrjTemplate = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            GET,
            'project/template/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var updatePrjTemplate = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'project/template/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var createPrjTemplate = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'project/template.json',
            data,
            options
        );
        return true;
    };

    var removePrjTemplate = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'project/template/' + id + '.json',
            null,
            options
        );
        return true;
    };

    //activities
    var getPrjActivities = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/activities/filter.json',
            null,
            options
        );
    };

    //import
    var checkPrjImportQuota = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'project/import/quota.json',
            data,
            options
        );
    };
    var addPrjImport = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'project/import.json',
            data,
            options
        );
    };
    var getPrjImport = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'project/import.json',
            null,
            options
        );
    };
    var getPrjImportProjects = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'project/import/projects.json',
            data,
            options
        );
    };
    //reports
    var addPrjReportTemplate = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'project/report.json',
            data,
            options
        );
    };
    var updatePrjReportTemplate = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'project/report/' + id + '.json',
            data,
            options
        );
    };
    var deletePrjReportTemplate = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'project/report/' + id + '.json',
            null,
            options
        );
    };
    // upload files
    var uploadFilesToPrjEntity = function(eventname, params, entityId, data, options) {
        return helper.uploader(
            eventname,
            params,
            'file',
            'project/' + entityId + '/entityfiles/upload.tml',
            data,
            options
        );
    };

    /* </projects> */

    /* <documents> */
    var createDocUploadFile = function(eventname, params, id, data, options) {
        return helper.uploader(
            eventname,
            params,
            'file',
            'files/' + id + '/upload.tml',
            data,
            options
        );
    };

    var addDocFile = function(eventname, params, id, type, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'files/' + id + (type ? '/' + type : '') + '.json',
            data,
            options
        );
        return true;
    };

    var getDocFile = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'files/file/' + id + '.json',
            null,
            options
        );
    };

    var addDocFolder = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'files/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var getDocFolder = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'files/' + id + '.json',
            null,
            options
        );
    };

    var removeDocFile = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'files/file/' + id + '.json',
            null,
            options
        );
    };

    var createDocUploadSession = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'files/' + id + '/upload/create_session.json',
            data,
            options
        );
    };
    /* </documents> */

    /* <crm> */
    var createCrmUploadFile = function(eventname, params, type, id, data, options) {
        return helper.uploader(
            eventname,
            params,
            'file',
            'crm/' + type + '/' + id + '/files/upload.tml',
            data,
            options
        );
    };

    var addCrmContactInfo = function(eventname, params, contactid, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + contactid + '/data.json',
            data,
            options
        );
        return true;
    };

    var updateCrmContactInfo = function(eventname, params, contactid, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/' + contactid + '/data/' + data.id + '.json',
            data,
            options
        );
        return true;
    };

    var deleteCrmContactInfo = function(eventname, params, contactid, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/' + contactid + '/data/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var addCrmContactData = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + id + '/batch.json',
            isArray(data) ? { data: data } : data,
            options
        );
        return true;
    };

    var updateCrmContactData = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/' + id + '/batch.json',
            isArray(data) ? { data: data } : data,
            options
        );
        return true;
    };

    var addCrmContactTwitter = function(eventname, params, contactid, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + contactid + '/data.json',
            data,
            options
        );
        return true;
    };

    var addCrmEntityNote = function(eventname, params, type, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + '/' + id + '/files/text.json',
            data,
            options
        );
        return true;
    };

    var addCrmCompany = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/company' + (isArray(data) ? '/quick' : '') + '.json',
            isArray(data) ? { data: data } : data,
            options
        );
        return true;
    };

    var updateCrmCompany = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/company/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var updateCrmCompanyContactStatus = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/company/' + id + '/status.json',
            data,
            options
        );
        return true;
    };

    var updateCrmPersonContactStatus = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/person/' + id + '/status.json',
            data,
            options
        );
        return true;
    };

    var updateCrmContactContactStatus = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/' + id + '/status.json',
            data,
            options
        );
        return true;
    };

    var addCrmPerson = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/person' + (isArray(data) ? '/quick' : '') + '.json',
            isArray(data) ? { data: data } : data,
            options
        );
        return true;
    };

    var updateCrmPerson = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/person/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removeCrmContact = function(eventname, params, ids, options) {
        var isNumberOrString = ids && (typeof ids === 'number' || typeof ids === 'string');
        var isObject = ids && typeof ids === 'object';
        helper.request(
            eventname,
            params,
            isNumberOrString ? REMOVE : UPDATE,
            'crm/contact' + (isNumberOrString ? '/' + ids : '') + '.json',
            isObject ? { contactids: ids } : null,
            options
        );
        return true;
    };

    var mergeCrmContacts = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/merge.json',
            data,
            options
        );
        return true;
    };

    var getCrmContactsForProject = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/project/' + id + '.json',
            null,
            options
        );
    };

    var addCrmTag = function(eventname, params, type, ids, tagname, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + (typeof ids === 'object' ? '/taglist' : '/' + ids + '/tag') + '.json',
            { entityid: ids, tagName: tagname },
            options
        );
        return true;
    };

    var addCrmContactTagToGroup = function(eventname, params, type, id, tagname, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + '/' + id + '/tag/group.json',
            { entityid: id, entityType: type, tagName: tagname },
            options
        );
        return true;
    };

    var removeCrmTag = function(eventname, params, type, id, tagname, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/' + type + '/' + id + '/tag.json',
            { tagName: tagname },
            options
        );
        return true;
    };

    var getCrmTags = function(eventname, params, type, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/' + type + '/' + id + '/tag.json',
            null,
            options
        );
    };

    var addCrmEntityTag = function(eventname, params, type, tagname, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + '/tag.json',
            { entityType: type, tagName: tagname },
            options
        );
        return true;
    };

    var removeCrmEntityTag = function(eventname, params, type, tagname, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/' + type + '/tag.json',
            { tagName: tagname },
            options
        );
        return true;
    };

    var removeCrmUnusedTag = function(eventname, params, type, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/' + type + '/tag/unused.json',
            null,
            options
        );
        return true;
    };

    var addCrmCustomField = function(eventname, params, type, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + '/customfield.json',
            data,
            options
        );
        return true;
    };

    var updateCrmCustomField = function(eventname, params, type, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/' + type + '/customfield/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removeCrmCustomField = function(eventname, params, type, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/' + type + '/customfield/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var reorderCrmCustomFields = function(eventname, params, type, ids, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/' + type + '/customfield/reorder.json',
            { fieldids: ids, entityType: type },
            options
        );
        return true;
    };

    var addCrmDealMilestone = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/opportunity/stage.json',
            data,
            options
        );
        return true;
    };

    var updateCrmDealMilestone = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/opportunity/stage/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var updateCrmDealMilestoneColor = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/opportunity/stage/' + id + '/color.json',
            data,
            options
        );
        return true;
    };

    var removeCrmDealMilestone = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/opportunity/stage/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var reorderCrmDealMilestones = function(eventname, params, ids, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/opportunity/stage/reorder.json',
            { ids: ids },
            options
        );
        return true;
    };

    var addCrmContactStatus = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/status.json',
            data,
            options
        );
        return true;
    };

    var updateCrmContactStatus = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/status/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var updateCrmContactStatusColor = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/status/' + id + '/color.json',
            data,
            options
        );
        return true;
    };

    var removeCrmContactStatus = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/status/' + id + '.json',
            null,
            options
        );
        return true;
    };


    var addCrmContactType = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/type.json',
            data,
            options
        );
        return true;
    };

    var updateCrmContactType = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/type/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removeCrmContactType = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/type/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var getCrmListItem = function(eventname, params, type, options) {
        var path = "";
        switch (type) {
            case 1:
                //ContactStatus
                path = 'crm/contact/status.json';
                break;
            case 2:
                //TaskCategory
                path = 'crm/task/category.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category.json';
                break;
            case 4:
                //ContactType
                path = 'crm/contact/type.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            GET,
            path,
            null,
            options
        );
        return true;
    };

    var addCrmListItem = function(eventname, params, type, data, options) {
        var path = "";
        switch (type) {
            case 1:
                //ContactStatus
                path = 'crm/contact/status.json';
                break;
            case 2:
                //TaskCategory
                path = 'crm/task/category.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category.json';
                break;
            case 4:
                //ContactType
                path = 'crm/contact/type.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            ADD,
            path,
            data,
            options
        );
        return true;
    };

    var updateCrmListItem = function(eventname, params, type, id, data, options) {
        var path = "";
        switch (type) {
            case 1:
                //ContactStatus
                path = 'crm/contact/status/' + id + '.json';
                break;
            case 2:
                //TaskCategory
                path = 'crm/task/category/' + id + '.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category/' + id + '.json';
                break;
            case 4:
                //ContactType
                path = 'crm/contact/type/' + id + '.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            path,
            data,
            options
        );
        return true;
    };

    var updateCrmListItemIcon = function(eventname, params, type, id, data, options) {
        var path = "";
        switch (type) {
            case 2:
                //TaskCategory
                path = 'crm/task/category/' + id + '/icon.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category/' + id + '/icon.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            path,
            data,
            options
        );
        return true;
    };

    var removeCrmListItem = function(eventname, params, type, id, options) {
        var path = "";
        switch (type) {
            case 1:
                //ContactStatus
                path = 'crm/contact/status/' + id + '.json';
                break;
            case 2:
                //TaskCategory
                path = 'crm/task/category/' + id + '.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category/' + id + '.json';
                break;
            case 4:
                //ContactType
                path = 'crm/contact/type/' + id + '.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            REMOVE,
            path,
            null,
            options
        );
        return true;
    };

    var reorderCrmListItems = function(eventname, params, type, titles, options) {
        var path = "";
        switch (type) {
            case 1:
                //ContactStatus
                path = 'crm/contact/status/reorder.json';
                break;
            case 2:
                //TaskCategory
                path = 'crm/task/category/reorder.json';
                break;
            case 3:
                //HistoryCategory
                path = 'crm/history/category/reorder.json';
                break;
            case 4:
                //ContactType
                path = 'crm/contact/type/reorder.json';
                break;
            default:
                return false;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            path,
            { titles: titles },
            options
        );
        return true;
    };

    var addCrmTask = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/task.json',
            data,
            options
        );
        return true;
    };

    var addCrmTaskGroup = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/task/group.json',
            data,
            options
        );
        return true;
    };

    var getCrmTask = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/task/' + id + '.json',
            null,
            options
        );
    };

    var updateCrmTask = function(eventname, params, id, data, options) {
        var isUpdateStatusAction = data.hasOwnProperty('isClosed');

        if (isUpdateStatusAction) {
            helper.request(
                eventname,
                params,
                UPDATE,
                !!data.isClosed ? 'crm/task/' + id + '/close.json' : 'crm/task/' + id + '/reopen.json',
                data,
                options
            );
        } else {
            helper.request(
                eventname,
                params,
                UPDATE,
                'crm/task/' + id + '.json',
                data,
                options
            );
        }

        return true;
    };

    var removeCrmTask = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/task/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var addCrmContactForProject = function(eventname, params, type, entityid, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + id + '/project/' + entityid + '.json',
            data,
            options
        );
    };

    var addCrmContactsForProject = function(eventname, params, projectid, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/project/' + projectid + '.json',
            data,
            options
        );
    };

    var removeCrmContactFromProject = function(eventname, params, type, entityid, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/' + id + '/project/' + entityid + '.json',
            null,
            options
        );
    };

    var addCrmDealForContact = function(eventname, params, contactid, opportunityid, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + contactid + '/opportunity/' + opportunityid + '.json',
            {
                contactid: contactid,
                opportunityid: opportunityid
            },
            options
        );
    };

    var removeCrmDealFromContact = function(eventname, params, contactid, opportunityid, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/' + contactid + '/opportunity/' + opportunityid + '.json',
            {
                contactid: contactid,
                opportunityid: opportunityid
            },
            options
        );
    };

    var addCrmContactMember = function(eventname, params, type, entityid, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + type + '/' + entityid + '/contact' + (type === 'opportunity' ? '/' + id : '') + '.json',
            data,
            options
        );
    };

    var removeCrmContactMember = function(eventname, params, type, entityid, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/' + type + '/' + entityid + '/contact/' + id + '.json',
            null,
            options
        );
    };

    var getCrmContactMembers = function(eventname, params, type, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/' + type + '/' + id + '/contact.json',
            null,
            options
        );
    };

    var addCrmPersonMember = function(eventname, params, type, entityid, id, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/' + type + '/' + entityid + '/person.json',
            data,
            options
        );
    };

    var removeCrmPersonMember = function(eventname, params, type, entityid, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/contact/' + type + '/' + entityid + '/person.json',
            { personid: id },
            options
        );
    };

    var getCrmPersonMembers = function(eventname, params, type, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/' + type + '/' + id + '/person.json',
            null,
            options
        );
    };

    var getCrmContactTasks = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'crm/contact/task/near.json',
            typeof data === 'number' || typeof data === 'string' ? { contactid: [data] } : data,
            options
        );
    };

    var getCrmCases = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/case/filter.json',
            null,
            options
        );
    };

    var getCrmCasesByPrefix = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/case/byprefix.json',
            null,
            options
        );
    };

    var removeCrmCase = function(eventname, params, ids, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/case' + (ids && (typeof ids === 'number' || typeof ids === 'string') ? '/' + ids : '') + '.json',
            ids && typeof ids === 'object' ? { casesids: ids } : null,
            options
        );
        return true;
    };

    var updateCrmCase = function(eventname, params, id, data, options) {
        var isUpdateStatusAction = data.hasOwnProperty('isClosed');

        if (isUpdateStatusAction) {
            helper.request(
                eventname,
                params,
                UPDATE,
                !!data.isClosed ? 'crm/case/' + id + '/close.json' : 'crm/case/' + id + '/reopen.json',
                data,
                options
            );
        } else {
            helper.request(
                eventname,
                params,
                UPDATE,
                'crm/case/' + id + '.json',
                data,
                options
            );
        }
        return true;
    };

    var getCrmContacts = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/filter.json',
            null,
            options
        );
    };

    var getCrmSimpleContacts = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/simple/filter.json',
            null,
            options
        );
    };

    var getCrmContactsForMail = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/mail.json',
            typeof data === 'number' || typeof data === 'string' ? { contactids: [data] } : data,
            options
        );
    };

    var getCrmContactsByPrefix = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/byprefix.json',
            null,
            options
        );
    };

    var getCrmContact = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/contact/' + id + '.json',
            null,
            options
        );
    };

    var getCrmTasks = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/task/filter.json',
            null,
            options
        );
    };

    var getCrmOpportunity = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/opportunity/' + id + '.json',
            null,
            options
        );
    };

    var getCrmCase = function (eventname, params, id, options) {
        return helper.request(
          eventname,
          params,
          GET,
          'crm/case/' + id + '.json',
          null,
          options
        );
    };

    var getCrmOpportunities = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/opportunity/filter.json',
            null,
            options
        );
    };

    var getCrmOpportunitiesByPrefix = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/opportunity/byprefix.json',
            null,
            options
        );
    };

    var removeCrmOpportunity = function(eventname, params, ids, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/opportunity' + (ids && (typeof ids === 'number' || typeof ids === 'string') ? '/' + ids : '') + '.json',
            ids && typeof ids === 'object' ? { opportunityids: ids } : null,
            options
        );
        return true;
    };

    var updateCrmOpportunityMilestone = function(eventname, params, opportunityid, stageid, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/opportunity/' + opportunityid + '/stage/' + stageid + '.json',
            { opportunityid: opportunityid, stageid: stageid },
            options
        );
    };

    var getCrmCurrencyConvertion = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            GET,
            'crm/settings/currency/convert.json',
            data,
            options
        );
    };

    var getCrmCurrencySummaryTable = function(eventname, params, currency, options) {
        helper.request(
            eventname,
            params,
            GET,
            'crm/settings/currency/' + currency + '/summarytable.json',
            { currency: currency },
            options
        );
    };

    var updateCRMContactStatusSettings = function(eventname, params, changeContactStatusGroupAuto, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/status/settings.json',
            { changeContactStatusGroupAuto: changeContactStatusGroupAuto },
            options
        );
    };

    var updateCRMContactTagSettings = function(eventname, params, addTagToContactGroupAuto, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact/tag/settings.json',
            { addTagToContactGroupAuto: addTagToContactGroupAuto },
            options
        );
    };

    var addCrmHistoryEvent = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/history.json',
            data,
            options
        );
    };

    var removeCrmHistoryEvent = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/history/' + id + '.json',
            null,
            options
        );
    };

    var getCrmHistoryEvents = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/history/filter.json',
            null,
            options
        );
    };

    var removeCrmFile = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/files/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var getCrmFolder = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/files/' + id + '.json',
            null,
            options
        );
    };

    var updateCrmContactRights = function(eventname, params, id, data, options) {
        if (!data || !options) {
            options = data;
            data = id;
            id = null;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/contact' + (id ? '/' + id : '') + '/access.json',
            data,
            options
        );
        return true;
    };

    var updateCrmCaseRights = function(eventname, params, id, data, options) {
        if (!data || !options) {
            options = data;
            data = id;
            id = null;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/case' + (id ? '/' + id : '') + '/access.json',
            data,
            options
        );
        return true;
    };

    var updateCrmOpportunityRights = function(eventname, params, id, data, options) {
        if (!data || !options) {
            options = data;
            data = id;
            id = null;
        }

        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/opportunity' + (id ? '/' + id : '') + '/access.json',
            data,
            options
        );
        return true;
    };

    var addCrmEntityFiles = function(eventname, params, id, type, data, options) {
        if (data && typeof data === 'object' && !data.hasOwnProperty('entityType')) {
            data.entityType = type;
        }

        helper.request(
            eventname,
            params,
            ADD,
            'crm' + (type ? '/' + type : '') + '/' + id + '/files.json',
            isArray(data) ? { entityType: type, entityid: id, fileids: data } : data,
            options
        );
        return true;
    };

    var removeCrmEntityFiles = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/files/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var getCrmEntityFiles = function(eventname, params, id, type, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm' + (type ? '/' + type : '') + '/' + id + '/files.json',
            null,
            options
        );
    };

    var getCrmTaskCategories = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/task/category.json',
            null,
            options
        );
    };

    var addCrmEntityTaskTemplateContainer = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/' + data.entityType + '/tasktemplatecontainer.json',
            data,
            options
        );
        return true;
    };

    var updateCrmEntityTaskTemplateContainer = function(eventname, params, id, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/tasktemplatecontainer/' + id + '.json',
            data,
            options
        );
        return true;
    };

    var removeCrmEntityTaskTemplateContainer = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/tasktemplatecontainer/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var getCrmEntityTaskTemplateContainer = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/tasktemplatecontainer/' + id + '.json',
            null,
            options
        );
    };

    var getCrmEntityTaskTemplateContainers = function(eventname, params, type, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/' + type + '/tasktemplatecontainer.json',
            null,
            options
        );
    };

    var addCrmEntityTaskTemplate = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            ADD,
            'crm/tasktemplatecontainer/' + data.containerid + '/tasktemplate.json',
            data,
            options
        );
        return true;
    };

    var updateCrmEntityTaskTemplate = function(eventname, params, data, options) {
        helper.request(
            eventname,
            params,
            UPDATE,
            'crm/tasktemplatecontainer/' + data.containerid + '/tasktemplate.json',
            data,
            options
        );
        return true;
    };

    var removeCrmEntityTaskTemplate = function(eventname, params, id, options) {
        helper.request(
            eventname,
            params,
            REMOVE,
            'crm/tasktemplatecontainer/tasktemplate/' + id + '.json',
            null,
            options
        );
        return true;
    };

    var getCrmEntityTaskTemplate = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/tasktemplatecontainer/tasktemplate/' + id + '.json',
            null,
            options
        );
    };

    var getCrmEntityTaskTemplates = function(eventname, params, containerid, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'crm/tasktemplatecontainer/' + containerid + '/tasktemplate.json',
            null,
            options
        );
    };
    /* </crm> */

    /* <mail> */
    var getMailFilteredMessages = function(eventname, params, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages.json',
            filter_data,
            options
        );
    };

    var getMailFolders = function(eventname, params, last_check_time, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/folders.json',
            last_check_time != undefined ? { last_check_time: last_check_time } : null,
            options
        );
    };

    var getMailMessagesModifyDate = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages/modify_date.json',
            null,
            options
        );
    };

    var getMailFolderModifyDate = function(eventname, params, folder_id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/folders/' + folder_id + '/modify_date.json',
            null,
            options
        );
    };

    var getMailAccounts = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/accounts.json',
            null,
            options
        );
    };

    var getMailTags = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/tags.json',
            null,
            options
        );
    };

    var getMailMessage = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages/' + id + '.json',
            data,
            options
        );
    };

    var getLinkedCrmEntitiesInfo = function (eventname, params, data, options) {
        return helper.request(
      eventname,
      params,
      GET,
      'mail/crm/linked/entities.json',
      data,
      options
    );
    };
    var getNextMailMessageId = function(eventname, params, id, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages/' + id + '/next.json',
            filter_data,
            options
        );
    };

    var getPrevMailMessageId = function(eventname, params, id, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages/' + id + '/prev.json',
            filter_data,
            options
        );
    };

    var getMailConversation = function(eventname, params, id, load_all_content, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/conversation/' + id + '.json',
            { load_all_content: load_all_content },
            options
        );
    };

    var getNextMailConversationId = function(eventname, params, id, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/conversation/' + id + '/next.json',
            filter_data,
            options
        );
    };

    var getPrevMailConversationId = function(eventname, params, id, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/conversation/' + id + '/prev.json',
            filter_data,
            options
        );
    };

    var getMailMessageTemplate = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/messages/template.json',
            null,
            options
        );
    };

    var getMailRandomGuid = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/random_guid.json',
            null,
            options
        );
    };

    var removeMailFolderMessages = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/folders/' + id + '/messages.json',
            null,
            options
        );
    };

    var restoreMailMessages = function(eventname, params, ids, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/restore.json',
            { ids: ids },
            options
        );
    };

    var moveMailMessages = function(eventname, params, ids, folder, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/move.json',
            { ids: ids, folder: folder },
            options
        );
    };

    var removeMailMessages = function(eventname, params, ids, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/remove.json',
            { ids: ids },
            options
        );
    };

    var markMailMessages = function(eventname, params, ids, status, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/mark.json',
            { ids: ids, status: status },
            options
        );
    };

    var updateCrmMessages = function(eventname, params, emails, userIds, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/update_crm.json',
            { emails: emails, userIds: userIds },
            options
        );
    };

    var createMailTag = function(eventname, params, name, style, addresses, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'mail/tags.json',
            { name: name, style: style, addresses: addresses },
            options
        );
    };

    var updateMailTag = function(eventname, params, id, name, style, addresses, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/tags/' + id + '.json',
            { name: name, style: style, addresses: addresses },
            options
        );
    };

    var removeMailTag = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/tags/' + id + '.json',
            null,
            options
        );
    };

    var setMailTag = function(eventname, params, messages_ids, tag_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/tags/' + tag_id + '/set.json',
            { messages: messages_ids },
            options
        );
    };

    var setMailConversationsTag = function(eventname, params, messages_ids, tag_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/tag/' + tag_id + '/set.json',
            { messages: messages_ids },
            options
        );
    };

    var unsetMailTag = function(eventname, params, messages_ids, tag_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/tags/' + tag_id + '/unset.json',
            { messages: messages_ids },
            options
        );
    };

    var unsetMailConversationsTag = function(eventname, params, messages_ids, tag_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/tag/' + tag_id + '/unset.json',
            { messages: messages_ids },
            options
        );
    };

    var addMailDocument = function(eventname, params, id, data, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'mail/messages/' + id + '/document.json',
            data,
            options
        );
    };

    var removeMailMailbox = function(eventname, params, email, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/accounts/' + encodeURIComponent(email) + '.json',
            null,
            options
        );
    };

    var getMailDefaultMailboxSettings = function(eventname, params, email, options) {
        var data = {
            action: params.action
        };
        return helper.request(
            eventname,
            params,
            GET,
            'mail/accounts/' + encodeURIComponent(email) + '/default.json',
            data,
            options
        );
    };

    var getMailMailbox = function(eventname, params, email, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/accounts/' + encodeURIComponent(email) + '.json',
            null,
            options
        );
    };

    var createMailMailboxSimple = function(eventname, params, email, password, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'mail/accounts/simple.json',
            { email: email, password: password },
            options
        );
    };

    var createMailMailboxOAuth = function(eventname, params, email, refreshToken, serviceType, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'mail/accounts/oauth.json',
            { email: email, token: refreshToken, type: serviceType },
            options
        );
    };

    var createMailMailbox = function(eventname, params, name, email, pop3_account, pop3_password, pop3_port, pop3_server,
                                     smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, incoming_encryption_type,
                                     outcoming_encryption_type, auth_type_in, auth_type_smtp, options) {
        var data = {
            name: name,
            email: email,
            account: pop3_account,
            password: pop3_password,
            port: pop3_port,
            server: pop3_server,
            smtp_account: smtp_account,
            smtp_password: smtp_password,
            smtp_port: smtp_port,
            smtp_server: smtp_server,
            smtp_auth: smtp_auth,
            imap: imap,
            restrict: restrict,
            incoming_encryption_type: incoming_encryption_type,
            outcoming_encryption_type: outcoming_encryption_type,
            auth_type_in: auth_type_in,
            auth_type_smtp: auth_type_smtp
        };

        return helper.request(
            eventname,
            params,
            ADD,
            'mail/accounts.json',
            data,
            options
        );
    };

    var updateMailMailbox = function(eventname, params, name, email, pop3_account, pop3_password, pop3_port, pop3_server,
                                     smtp_account, smtp_password, smtp_port, smtp_server, smtp_auth, imap, restrict, incoming_encryption_type,
                                     outcoming_encryption_type, auth_type_in, auth_type_smtp, options) {
        var data = {
            name: name,
            email: email,
            account: pop3_account,
            password: pop3_password,
            port: pop3_port,
            server: pop3_server,
            smtp_account: smtp_account,
            smtp_password: smtp_password,
            smtp_port: smtp_port,
            smtp_server: smtp_server,
            smtp_auth: smtp_auth,
            imap: imap,
            restrict: restrict,
            incoming_encryption_type: incoming_encryption_type,
            outcoming_encryption_type: outcoming_encryption_type,
            auth_type_in: auth_type_in,
            auth_type_smtp: auth_type_smtp
        };

        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/accounts.json',
            data,
            options
        );
    };

    var setMailMailboxState = function(eventname, params, email, state, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/accounts/' + encodeURIComponent(email) + '/state.json',
            { state: state },
            options
        );
    };

    var removeMailMessageAttachment = function(eventname, params, message_id, attachment_id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/messages/' + message_id + '/attachments/' + attachment_id + '.json',
            null,
            options
        );
    };

    var sendMailMessage = function(eventname, params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/send.json',
            {
                id: id,
                from: from,
                subject: subject,
                to: to,
                cc: cc,
                bcc: bcc,
                body: body,
                attachments: attachments,
                streamId: streamId,
                replyToId: replyToId,
                importance: importance,
                tags: tags
            },
            options
        );
    };

    var saveMailMessage = function(eventname, params, id, from, subject, to, cc, bcc, body, attachments, streamId, replyToId, importance, tags, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/save.json',
            {
                id: id,
                from: from,
                subject: subject,
                to: to,
                cc: cc,
                bcc: bcc,
                body: body,
                attachments: attachments,
                streamId: streamId,
                replyToId: replyToId,
                importance: importance,
                tags: tags
            },
            options
        );
    };

    var getMailContacts = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/contacts.json',
            data,
            options
        );
    };



    var getMailAlerts = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/alert.json',
            null,
            options
        );
    };

    var deleteMailAlert = function(eventname, params, id, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/alert/' + id + '.json',
            null,
            options
        );
    };

    var getMailFilteredConversations = function(eventname, params, filter_data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/conversations.json',
            filter_data,
            options
        );
    };

    var moveMailConversations = function(eventname, params, ids, folder, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/move.json',
            { ids: ids, folder: folder },
            options
        );
    };

    var restoreMailConversations = function(eventname, params, ids, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/restore.json',
            { ids: ids },
            options
        );
    };

    var removeMailConversations = function(eventname, params, ids, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/remove.json',
            { ids: ids },
            options
        );
    };

    var markMailConversations = function(eventname, params, ids, status, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/mark.json',
            { ids: ids, status: status },
            options
        );
    };

    var getMailDisplayImagesAddresses = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/display_images/addresses.json',
            null,
            options
        );
    };

    var createDisplayImagesAddress = function(eventname, params, email, options) {
        return helper.request(
            eventname,
            params,
            ADD,
            'mail/display_images/address.json',
            { address: email },
            options
        );
    };

    var removeDisplayImagesAddress = function(eventname, params, email, options) {
        return helper.request(
            eventname,
            params,
            REMOVE,
            'mail/display_images/address.json',
            { address: email },
            options
        );
    };

    var markChainAsCrmLinked = function (eventname, params, message_id, crm_contacts_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/link/crm/set.json',
            {
                id_message: message_id,
                crm_contact_ids: crm_contacts_id
            },
            options
        );
    };

    var unmarkChainAsCrmLinked = function (eventname, params, message_id, crm_contacts_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/conversations/link/crm/unset.json',
            {
                id_message: message_id,
                crm_contact_ids: crm_contacts_id
            },
            options
        );
    };

    var exportMessageToCrm = function(eventname, params, message_id, crm_contacts_id, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'mail/messages/crm/export.json',
            {
                id_message: message_id,
                crm_contact_ids: crm_contacts_id
            },
            options
        );
    };

    var isConversationLinkedWithCrm = function (eventname, params, message_id, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/conversations/link/crm/status.json',
            {
                message_id: message_id,
            },
            options
        );
    };

    var getMailHelpCenterHtml = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'mail/helpcenter.json',
            null,
            options
        );
    };
    /* </mail> */

    /* <settings> */
    var getWebItemSecurityInfo = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'settings/security.json',
            typeof data === 'number' || typeof data === 'string' ? { ids: [data] } : data,
            options
        );
    };

    var setWebItemSecurity = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'settings/security.json',
            data,
            options
        );
    };

    var setAccessToWebItems = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'settings/security/access.json',
            data,
            options
        );
    };

    var setProductAdministrator = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            UPDATE,
            'settings/security/administrator.json',
            data,
            options
        );
    };

    var isProductAdministrator = function(eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'settings/security/administrator.json',
            data,
            options
        );
    };
    var getPortalSettings = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'settings.json',
            null,
            options
        );
    };
    var getPortalLogo = function(eventname, params, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'settings/logo.json',
            null,
            options
        );
    };

    var isMobileAppUser = function (eventname, params, data, options) {
        return helper.request(
            eventname,
            params,
            GET,
            'push/isappuser.json',
            data,
            options
        );
    };
    /* </settings> */

    var getTalkUnreadMessages = function (eventname, params, options) {
        helper.request(
            eventname,
            params,
            GET,
            'portal/talk/unreadmessages.json',
            null,
            options
        );
        return true;
    };


    return {
        test: helper.test,
        init: helper.init,
        bind: helper.bind,
        exec: helper.exec,
        joint: helper.joint,
        start: helper.start,
        login: helper.login,
        logged: helper.logged,

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
        removeUserPhoto :removeUserPhoto,
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

        getFeeds: getFeeds,
        getNewFeedsCount: getNewFeedsCount,
        readFeeds: readFeeds,
        getPrjTags: getPrjTags,
        getPrjTagsByName: getPrjTagsByName,
        addPrjSubtask: addPrjSubtask,
        updatePrjSubtask: updatePrjSubtask,
        removePrjSubtask: removePrjSubtask,
        addPrjTask: addPrjTask,
        addPrjTaskByMessage: addPrjTaskByMessage,
        updatePrjTask: updatePrjTask,
        removePrjTask: removePrjTask,
        getPrjTask: getPrjTask,
        getPrjTasksById: getPrjTasksById,
        getPrjTasks: getPrjTasks,
        getPrjTaskFiles: getPrjTaskFiles,
        subscribeToPrjTask: subscribeToPrjTask,
        notifyPrjTaskResponsible: notifyPrjTaskResponsible,

        addPrjTaskLink: addPrjTaskLink,
        removePrjTaskLink: removePrjTaskLink,

        getPrjProjectFolder: getPrjProjectFolder,
        uploadFilesToPrjEntity: uploadFilesToPrjEntity,
        addPrjEntityFiles: addPrjEntityFiles,
        removePrjEntityFiles: removePrjEntityFiles,
        getPrjEntityFiles: getPrjEntityFiles,
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
        getPrjSelfProjects: getPrjSelfProjects,
        getPrjFollowProjects: getPrjFollowProjects,
        getProjectsForCrmContact: getProjectsForCrmContact,
        addProjectForCrmContact: addProjectForCrmContact,
        removeProjectFromCrmContact: removeProjectFromCrmContact,
        subscribeProject: subscribeProject,

        addPrjTime: addPrjTime,
        getPrjTime: getPrjTime,
        getTotalTaskTimeByFilter: getTotalTaskTimeByFilter,
        getTotalBilledTaskTimeByFilter: getTotalBilledTaskTimeByFilter,
        updatePrjTime: updatePrjTime,
        removePrjTime: removePrjTime,
        changePaymentStatus: changePaymentStatus,

        addPrjTaskComment: addPrjTaskComment,
        updatePrjTaskComment: updatePrjComment,
        removePrjTaskComment: removePrjComment,
        getPrjTaskComments: getPrjTaskComments,
        addPrjDiscussionComment: addPrjDiscussionComment,
        updatePrjDiscussionComment: updatePrjComment,
        removePrjDiscussionComment: removePrjComment,
        getPrjDiscussionComments: getPrjDiscussionComments,

        getPrjTeam: getPrjTeam,
        updatePrjTeam: updatePrjTeam,
        setTeamSecurity: setTeamSecurity,
        addPrjProjectTeamPerson: addPrjProjectTeamPerson,
        removePrjProjectTeamPerson: removePrjProjectTeamPerson,
        getPrjProjectTeamPersons: getPrjProjectTeamPersons,
        getPrjProjectFiles: getPrjProjectFiles,
        getPrjTemplates: getPrjTemplates,
        getPrjTemplate: getPrjTemplate,
        updatePrjTemplate: updatePrjTemplate,
        createPrjTemplate: createPrjTemplate,
        removePrjTemplate: removePrjTemplate,

        getPrjGanttIndex: getPrjGanttIndex,
        setPrjGanttIndex: setPrjGanttIndex,

        getPrjActivities: getPrjActivities,
        checkPrjImportQuota: checkPrjImportQuota,
        addPrjImport: addPrjImport,
        getPrjImport: getPrjImport,
        getPrjImportProjects: getPrjImportProjects,

        addPrjReportTemplate: addPrjReportTemplate,
        updatePrjReportTemplate: updatePrjReportTemplate,
        deletePrjReportTemplate: deletePrjReportTemplate,

        createDocUploadFile: createDocUploadFile,
        addDocFile: addDocFile,
        getDocFile: getDocFile,
        addDocFolder: addDocFolder,
        getDocFolder: getDocFolder,
        removeDocFile: removeDocFile,
        createDocUploadSession: createDocUploadSession,

        createCrmUploadFile: createCrmUploadFile,

        addCrmContactInfo: addCrmContactInfo,
        updateCrmContactInfo: updateCrmContactInfo,
        deleteCrmContactInfo: deleteCrmContactInfo,
        addCrmContactData: addCrmContactData,
        updateCrmContactData: updateCrmContactData,
        addCrmContactTwitter: addCrmContactTwitter,
        addCrmEntityNote: addCrmEntityNote,

        addCrmCompany: addCrmCompany,
        updateCrmCompany: updateCrmCompany,
        updateCrmCompanyContactStatus: updateCrmCompanyContactStatus,
        updateCrmPersonContactStatus: updateCrmPersonContactStatus,
        updateCrmContactContactStatus: updateCrmContactContactStatus,
        addCrmPerson: addCrmPerson,
        updateCrmPerson: updateCrmPerson,
        removeCrmContact: removeCrmContact,
        mergeCrmContacts: mergeCrmContacts,
        getCrmContactsForProject: getCrmContactsForProject,

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
        addCrmTask: addCrmTask,
        addCrmTaskGroup: addCrmTaskGroup,
        getCrmTask: getCrmTask,
        updateCrmTask: updateCrmTask,
        removeCrmTask: removeCrmTask,

        addCrmPersonMember: addCrmPersonMember,
        removeCrmPersonMember: removeCrmPersonMember,
        addCrmContactMember: addCrmContactMember,
        removeCrmContactMember: removeCrmContactMember,

        addCrmContactForProject: addCrmContactForProject,
        addCrmContactsForProject: addCrmContactsForProject,
        removeCrmContactFromProject: removeCrmContactFromProject,
        addCrmDealForContact: addCrmDealForContact,
        removeCrmDealFromContact: removeCrmDealFromContact,

        getCrmTags: getCrmTags,
        getCrmContactMembers: getCrmContactMembers,
        getCrmPersonMembers: getCrmPersonMembers,
        getCrmContactTasks: getCrmContactTasks,
        getCrmCases: getCrmCases,
        getCrmCasesByPrefix: getCrmCasesByPrefix,
        removeCrmCase: removeCrmCase,
        updateCrmCase: updateCrmCase,
        getCrmContacts: getCrmContacts,
        getCrmSimpleContacts: getCrmSimpleContacts,
        getCrmContactsForMail: getCrmContactsForMail,
        getCrmContactsByPrefix: getCrmContactsByPrefix,
        getCrmContact: getCrmContact,
        getCrmTasks: getCrmTasks,
        getCrmOpportunities: getCrmOpportunities,
        getCrmOpportunitiesByPrefix: getCrmOpportunitiesByPrefix,
        getCrmOpportunity: getCrmOpportunity,
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
        isConversationLinkedWithCrm: isConversationLinkedWithCrm,
        getMailHelpCenterHtml: getMailHelpCenterHtml,

        getWebItemSecurityInfo: getWebItemSecurityInfo,
        setWebItemSecurity: setWebItemSecurity,
        setAccessToWebItems: setAccessToWebItems,
        setProductAdministrator: setProductAdministrator,
        isProductAdministrator: isProductAdministrator,
        getPortalSettings: getPortalSettings,
        getPortalLogo: getPortalLogo,
        
        isMobileAppUser: isMobileAppUser,

        getTalkUnreadMessages: getTalkUnreadMessages,
    };
})(ServiceHelper);