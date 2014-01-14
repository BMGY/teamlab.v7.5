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

var BlogsManager = new function() {
    this.ratingsSortField = 'Name';
    this.ratingsSortDirection = true; // true - asc; false - desc
    this.isSubscribe = false;
    this.groupid = null;
    this.userid = null;
    this.mSearchDefaultString = "";
    this.IsMobile = false;

    this.BlockButtons = function() {
        jq('#panel_buttons').hide();
        jq('#action_loader').show();
    };

    this.UnBlockButtons = function() {
        jq('#action_loader').hide();
        jq('#panel_buttons').show();
    };
    this.CheckData = function() {
        var titleText = jq("input[id$='PageContent_CommunityPageContent_txtTitle']").val();
        if (jq.trim(titleText) == "") {
            ShowRequiredError(jq("input[id$='PageContent_CommunityPageContent_txtTitle']"));
            BlogsManager.UnBlockButtons();
        }
        else {
            __doPostBack('', '');
        }
    };
    this.ShowPreview = function(fckid, titleid) {

        var html = '';
        if (this.IsMobile) {
            html = ASC.Controls.HtmlHelper.Text2EncodedHtml(jq('#mobiletextEdit').val());
        }
        else {
            var iFCKEditor = FCKeditorAPI.GetInstance(fckid);
            html = iFCKEditor.GetXHTML(true);
        }

        var title = jq('#' + titleid).val();

        AjaxPro.onLoading = function(b) {
            if (b) { BlogsManager.BlockButtons(); }
            else { BlogsManager.UnBlockButtons(); }
        };

        BlogsPage.GetPreview(title, html, this.CallBackPreview);
    };

    this.CallBackPreview = function(result) {
        jq('#previewBody').html(result.value[1]);
        jq('#previewTitle').html(result.value[0]);
        jq('#previewHolder').show();
        var scroll_to = jq('#previewHolder').position();
        jq.scrollTo(scroll_to.top, { speed: 500 });
    };

    this.PerformMobilePost = function() {
        if (this.IsMobile) {
            var text = jq('#mobiletextEdit').val();
            jq('#mobiletext').val(ASC.Controls.HtmlHelper.Text2EncodedHtml(text));
        }
    };

    this.HidePreview = function() {
        jq('#previewHolder').hide();
        var scroll_to = jq('#postHeader').position();
        jq.scrollTo(scroll_to.top, { speed: 500 });
    };

    this.SubscribeOnGroupBlog = function(groupID) {
        AjaxPro.onLoading = function(b) { if (b) { jq.blockUI(); } else { jq.unblockUI(); } };
        this.groupid = groupID;

        var subscribe;

        var elements = document.getElementsByName(groupID);
        if (elements[0].value == 1) {
            subscribe = true;
        }
        else {
            subscribe = false;
        }

        Default.SubscribeOnNewPostCorporate(groupID, subscribe, this.callbackSubscribeOnGroupBlog);
    };

    this.callbackSubscribeOnGroupBlog = function(result) {
        var elements = document.getElementsByName(BlogsManager.userid);
        var elementsLinks = document.getElementsByName('subscriber_' + BlogsManager.groupid);
        var subscribe = elements[0].value;

        for (var i = 0; i < elements.length; i++) {
            if (subscribe == 1)
                elements[i].value = 0;
            else
                elements[i].value = 1;

            elementsLinks[i].innerHTML = result.value;
        }
    };


    this.RatingSort = function(filedName) {
        if (this.ratingsSortField == filedName) {
            this.ratingsSortDirection = !this.ratingsSortDirection;
        }
        else {
            this.ratingsSortDirection = true;
        }

        this.ratingsSortField = filedName;

        AjaxPro.onLoading = function(b) { if (b) { jq('#blg_ratings').block(); } else { jq('#blg_ratings').unblock(); } };
        RatingList.Sort(this.ratingsSortField, this.ratingsSortDirection, this.callBackSort);
    };

    this.callBackSort = function(result) {
        if (result.value != null)
            jq('#blg_rating_list').html(result.value);
    };

    this.BlogTblSort = function(filedID) {
        if (this.ratingsSortField == filedID) {
            this.ratingsSortDirection = !this.ratingsSortDirection;
        }
        else {
            this.ratingsSortDirection = true;
        }

        this.ratingsSortField = filedID;

        AjaxPro.onLoading = function(b) { if (b) { jq('#blg_ratings').block(); } else { jq('#blg_ratings').unblock(); } };
        AllBlogs.Sort(this.ratingsSortField, this.ratingsSortDirection, this.callBackSort);
    };
};


BlogsManager.ratingsSortField = 'Name';
BlogsManager.ratingsSortDirection = true;

BlogSubscriber = new function() {
    this.SubscribeOnComments = function(blogID, state) {
        AjaxPro.onLoading = function(b) {
            if (b)
                jq('#blogs_subcribeOnCommentsBox').block();
            else
                jq('#blogs_subcribeOnCommentsBox').unblock();
        };

        Subscriber.SubscribeOnComments(blogID, state, function(result) {
            var res = result.value;
            jq('#blogs_subcribeOnCommentsBox').replaceWith(res.rs2);
        });
    };

    this.SubscribeOnBlogComments = function(blogID, state, link) {
        AjaxPro.onLoading = function(b) {
            if (b)
                jq('.BlogsHeaderBlock').block();
            else
                jq('.BlogsHeaderBlock').unblock();
        }
        
        Subscriber.SubscribeOnBlogComments(blogID, state, function(result) {
            var res = result.value;
            jq(link).replaceWith(res.rs2);
        });
        jq("#blogActionsMenuPanel").hide();
    };

    this.SubscribeOnPersonalBlog = function(userID, state) {
        AjaxPro.onLoading = function(b) {
            if (b)
                jq('#blogs_subcribeOnPersonalBlogBox').block();
            else
                jq('#blogs_subcribeOnPersonalBlogBox').unblock();
        }

        Subscriber.SubscribeOnPersonalBlog(userID, state, function(result) {
            var res = result.value;
            jq('#blogs_subcribeOnPersonalBlogBox').replaceWith(res.rs2);
        });
    };

    this.SubscribePersonalBlog = function(userID, state, link) {
        AjaxPro.onLoading = function(b) {
            if (b)
                jq(link).parent().block();
            else
                jq(link).parent().unblock();
        }

        Subscriber.SubscribePersonalBlog(userID, state, function(result) {
            var res = result.value;
            jq(link).replaceWith(res.rs2);
        });
    };

    this.SubscribeOnNewPosts = function(state) {
        AjaxPro.onLoading = function(b) {
            if (b)
                jq('#blogs_subcribeOnNewPostsBox').block();
            else
                jq('#blogs_subcribeOnNewPostsBox').unblock();
        }

        Subscriber.SubscribeOnNewPosts(state, function(result) {
            var res = result.value;
            jq('#blogs_subcribeOnNewPostsBox').replaceWith(res.rs2);
        });
    };

};


function blogTagsAutocompleteInputOnKeyDown(event) {
	//Enter key was pressed
	if (event.keyCode == 13) {
		return false;
	}
	return true;
};

function getURLParam(strParamName) {

        strParamName = strParamName.toLowerCase();

        var strReturn = "";
        var strHref = window.location.href.toLowerCase();
        var bFound = false;

        var cmpstring = strParamName + "=";
        var cmplen = cmpstring.length;

        if (strHref.indexOf("?") > -1) {
            var strQueryString = strHref.substr(strHref.indexOf("?") + 1);
            var aQueryString = strQueryString.split("&");
            for (var iParam = 0; iParam < aQueryString.length; iParam++) {
                if (aQueryString[iParam].substr(0, cmplen) == cmpstring) {
                    var aParam = aQueryString[iParam].split("=");
                    strReturn = aParam[1];
                    bFound = true;
                    break;
                }

            }
        }
        if (bFound == false) return null;

        if (strReturn.indexOf("#") > -1)
            return strReturn.split("#")[0];

        return strReturn;
}

function changeBlogsCountOfRows (val) {    
    var page = getURLParam("page");
    var search = getURLParam("search");
    var href = window.location.href.split("?")[0]+"?";
    href += "&size=" + val;
    if(page!=null)
        href += "&page=1";
    if(search!=null)
        href += "&search=" + search;
    window.location.href = href;
}

function showCommentBox() {
    if(typeof(FCKeditorAPI)!="undefined" && FCKeditorAPI!=null) {
        CommentsManagerObj.AddNewComment();
    } else {
        setTimeout("showCommentBox();", 500);
    }
}

function resizeContent() {

    var windowWidth = jq(window).width() - 24 * 2,
           newWidth = windowWidth,
           mainBlockWidth = parseInt(jq(".mainPageLayout").css("min-width"));
    if (windowWidth < mainBlockWidth) {
        newWidth = mainBlockWidth;
    }
    jq(".BlogsBodyBlock").each(
        function() {
            jq(this).css("max-width", newWidth - jq(".mainPageTableSidePanel").width() - 24 * 2 + "px");
        }
    );
        jq(".ContentMainBlog, .container-list").each(
        function() {
            jq(this).css("max-width", newWidth - jq(".mainPageTableSidePanel").width() - 24*2 + "px");
        }
    );
       
};

jq(document).ready(function() {
    jq.dropdownToggle({
        dropdownID: "blogActionsMenuPanel",
        switcherSelector: ".BlogsHeaderBlock .menu-small",
        addTop: -4,
        addLeft: -11,
        showFunction: function(switcherObj, dropdownItem) {
            jq('.BlogsHeaderBlock .menu-small.active').removeClass('active');
            if (dropdownItem.is(":hidden")) {
                switcherObj.addClass('active');
            }
        },
        hideFunction: function() {
            jq('.BlogsHeaderBlock .menu-small.active').removeClass('active');
        }
    });
    resizeContent();

    jq(window).resize(function() {
        resizeContent();
    });

    var elemParent = jq('.container-list .content-list div.asccut').parents(".content-list");
    for (var i = 0; i < elemParent.length; i++) {
        var href = jq(elemParent[i]).find('#postIndividualLink').text();
        jq(elemParent[i]).find(".comment-list").before('<div><a href="' + href + '" class="read-more"><font>' + ASC.Community.BlogsJSResource.ReadMoreLink + '</font></a></div>');
    }
    jq(".content-list p").filter(function(index) { return jq(this).html() == ("&nbsp;" && ""); }).remove();

    if (jq("#blogActionsMenuPanel .dropdown-content li").length == 0) {
        jq(".menu-small").hide();
    }
    var anchor = ASC.Controls.AnchorController.getAnchor();
    if (anchor == "addcomment" && CommentsManagerObj) {
        showCommentBox();

    }


});
