﻿<%@ Control Language="C#" AutoEventWireup="false" EnableViewState="false" %>
<%@ Import Namespace="Resources" %>

<script id="dropFeedTmpl" type="text/x-jquery-tmpl">
    <div class="item">
        <div class="avatar">
            {{if byGuest}}
            <img src="${authorAvatar}" title="${author.DisplayName}"/>
            {{else}}
            <a href="${author.ProfileUrl}" title="${author.DisplayName}" target="_blank"><img src="${authorAvatar}"/></a>
            {{/if}}
        </div>
        <div class="content-box">
            <div class="description">
                <span class="menu-item-icon ${itemClass}" />
                <span class="product">${productText}.</span>
                {{if location}}
                <span class="location" title="${location}">${location}.</span>
                {{/if}}
                <span class="action">${actionText}</span>
                {{if extraAction}}
                <span class="extra-action"><a href="${extraActionUrl}" target="_blank">"${extraAction}"</a></span>
                {{/if}}
                {{if groupedFeeds.length}}
                <span class="grouped-feeds-count">
                    ${ASC.Resources.Master.FeedResource.OtherFeedsCountMsg.format(groupedFeeds.length)}
                </span>
                {{/if}}
            </div>
            <a class="title" href="${itemUrl}" title="${title}" target="_blank">${title}</a>
            <div class="date">
                {{if isToday}}
                <span><%= FeedResource.TodayAt + " " %>${displayCreatedTime}</span>
                {{else isYesterday}}
                <span><%= FeedResource.YesterdayAt + " " %>${displayCreatedTime}</span>
                {{else}}
                <span>${displayCreatedDatetime}</span>
                {{/if}}
            </div>
        </div>
    </div>
</script>