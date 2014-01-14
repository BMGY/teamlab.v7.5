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

window.PagesNavigation = (function($) {
    var 
    VisiblePageCount = 3;

    var _changeSysfolderPageCallback = function(number) {
        var anchor = "#" + TMMail.GetSysFolderNameById(MailFilter.getFolder());
        var prev_flag, el;
        var messages_rows = $('.messages:visible .message[messageid]');

        if (1 !== number) {
            // next button was pressed
            el = messages_rows.last();
            prev_flag = false;
        } else {
            //previous btn was pressed
            el = messages_rows.first();
            prev_flag = true;
        }

        var date = el.attr('chain_date');
        var message = el.attr('messageid');

        anchor += MailFilter.toAnchor(
            true,
            { from_date: new Date(date),
                from_message: +message,
                prev_flag: prev_flag
            });

        mailBox.keepSelection(true);
        ASC.Controls.AnchorController.move(anchor);
    };

    var RedrawFolderNavigationBar = function(pager_navigator, page_size, change_page_size_callback, has_next, has_prev) {
        var page = 1;
        var page_count = 1;
        // fake second page for previos button if has prev
        if (true === has_prev) {
            page_count++;
            page = 2;
        }
        if (true === has_next)
            page_count++;

        var total = page_count * page_size;

        return RedrawNavigationBar(pager_navigator,
            page,
            page_size,
            total,
            _changeSysfolderPageCallback,
            change_page_size_callback,
            "",
            true);
    };


    var RedrawNavigationBar = function(pager_navigator, page, page_size, total_items_count,
                    change_page_callback, change_page_size_callback, total_items_text, sysfolder_flag) {

        var $navigation_bar_div = $('#bottomNavigationBar');

        if (true === sysfolder_flag)
            !$navigation_bar_div.is('.sysfolder') && $navigation_bar_div.addClass('sysfolder');
        else
            $navigation_bar_div.removeClass('sysfolder');

        pager_navigator.changePageCallback = change_page_callback;
        pager_navigator.NavigatorParent = $navigation_bar_div.find('#divForMessagesPager');
        pager_navigator.VisiblePageCount = +VisiblePageCount;
        pager_navigator.EntryCountOnPage = +page_size;

        pager_navigator.drawPageNavigator(+page, +total_items_count);

        if (!sysfolder_flag) {
            $navigation_bar_div.find('#TotalItems').show();
            $navigation_bar_div.find('#totalItemsOnAllPages').show();
            $navigation_bar_div.find('#TotalItems').text(total_items_text);
            $navigation_bar_div.find('#totalItemsOnAllPages').text(total_items_count);
        }
        else {
            // dirty hack
            var regex = /;[^\.]+.drawPageNavigator\([^\)]+\);/i;
            var prev = $navigation_bar_div.find('.pagerPrevButtonCSSClass').attr('onclick');
            prev && $navigation_bar_div.find('.pagerPrevButtonCSSClass').attr('onclick', prev.replace(regex, ';'));
            var next = $navigation_bar_div.find('.pagerNextButtonCSSClass').attr('onclick');
            next && $navigation_bar_div.find('.pagerNextButtonCSSClass').attr('onclick', next.replace(regex, ';'));
            $navigation_bar_div.find('#TotalItems').hide();
            $navigation_bar_div.find('#totalItemsOnAllPages').hide();
        }

        var $select = $navigation_bar_div.find('select');
        $select.val(page_size).tlCombobox();

        $select.unbind('change');
        $select.change(function(evt) { change_page_size_callback(this.value); });

        $navigation_bar_div.show();
        _DecideComboUpOrDown($navigation_bar_div);

    };

    var RedrawPrevNextControl = function($prev_next_div) {
        var $prev_next_div = $('.menu-action-simple-pagenav');

        var $navigation_bar_source_div = $('#bottomNavigationBar');
        $prev_next_div.html("");

        var $simplePN = jq("<div></div>");
        var $prev_source = $navigation_bar_source_div.find(".pagerPrevButtonCSSClass");
        var $next_source = $navigation_bar_source_div.find(".pagerNextButtonCSSClass");

        if ($prev_source.length != 0) {
            $prev_source.clone().appendTo($simplePN);
        }
        if ($next_source.length != 0) {
            if ($prev_source.length != 0) {
                $("<span style='padding: 0 8px;'>&nbsp;</span>").clone().appendTo($simplePN);
            }
            $next_source.clone().appendTo($simplePN);
        }
        if ($simplePN.children().length != 0) {
            $simplePN.appendTo($prev_next_div);
            $prev_next_div.show();
        }
        else
            $prev_next_div.hide();

    };

    var _DecideComboUpOrDown = function($navigation_bar_div) {
        var $combo = $navigation_bar_div.find('.tl-combobox');
        var $combo_drop_list = $combo.find('.combobox-container');
        var direction_is_up = $('.page-menu').height() < $('.mainContainerClass').height() + $combo_drop_list.height();
        $combo.attr('direction_is_up', direction_is_up);
    };


    var FixAnchorPageNumberIfNecessary = function(page) {
        var anchor = ASC.Controls.AnchorController.getAnchor();

        var new_anchor = anchor.replace(/\/page=(\d+)/, "\/page=" + page);
        if (new_anchor != anchor) {
            ASC.Controls.AnchorController.safemove(new_anchor);
        }
    };

    var FixAnchorPageSizeIfNecessary = function(page_size) {
        if (25 == page_size || 50 == page_size || 75 == page_size || 100 == page_size)
            return false;

        var anchor = ASC.Controls.AnchorController.getAnchor();
        var new_anchor = anchor.replace(/\/page_size=(\d+)/, "\/page_size=" + 25);
        ASC.Controls.AnchorController.move(new_anchor);

        return true;
    };


    return {
        RedrawNavigationBar: RedrawNavigationBar,
        FixAnchorPageNumberIfNecessary: FixAnchorPageNumberIfNecessary,
        FixAnchorPageSizeIfNecessary: FixAnchorPageSizeIfNecessary,
        RedrawPrevNextControl: RedrawPrevNextControl,
        RedrawFolderNavigationBar: RedrawFolderNavigationBar
    };

})(jQuery);

