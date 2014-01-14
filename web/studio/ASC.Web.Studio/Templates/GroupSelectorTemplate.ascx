﻿<%@ Control Language="C#" AutoEventWireup="false" EnableViewState="false" %>

<script id="groupSelectorTemplate" type="text/x-jquery-tmpl">
    <div class="groupSelectorBox">
       {{if jq.browser.mobile === true}}
            <select id="grpselector_mgroupList_${selectorID}" class="comboBox addGroupLink mobileSelectList">
            </select>
        {{else}}
            <span id="groupSelectorBtn_${selectorID}" class="addGroupLink">
                <a class="link dotline">${linkText}</a><span class="sort-down-black"></span>
            </span>
            <div id="groupSelectorContainer_${selectorID}" class="borderBase tintLight groupSelectorContainer{{if jq.browser.mobile === true}} groupSelectorContainerMobile{{/if}}">
                <div class="clearFix filterBox">
                    <input type="text" id="grpselector_filter_${selectorID}" class="textEdit" autocomplete="off"/>    
                    <a id="grpselector_clearFilterBtn_${selectorID}" class="baseLinkAction float-left"><%=Resources.Resource.ClearFilterButton%></a>
                </div>

                <div id="grpselector_groupList_${selectorID}" class="grpselector_groupList"></div>
            </div>
        {{/if}}
    </div>
</script>

<script id="groupSelectorListTemplate" type="text/x-jquery-tmpl">
    {{if jq.browser.mobile === true}}
        {{each(i, gpr) Groups}} 
        <option value="${gpr.Id}" style="max-width:300px;">
            ${gpr.Name}
        </option>
        {{/each}}
    {{else}}
        {{each(i, gpr) Groups}} 
        <div class="group" data="${gpr.Id}" title="${gpr.Name}">
            ${gpr.Name}
        </div>
        {{/each}}
    {{/if}}
</script>