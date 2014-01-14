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

window.tagsModal = (function($) {
    var 
        is_init = false,
        _page,
        _wnd,
        REQUIRED_FIELD_ERROR_CSS = "requiredFieldError"; ;

    var init = function() {
        if (is_init === false) {
            is_init = true;

            _wnd = $('#tagWnd');

            _wnd.find('.tag.color .outer .inner').bind('click', function(e) {
                if ($('.tag.color .outer .inner').attr('disabled'))
                    return false;

                tagsColorsPopup.show(this, _changeWndTagColor);
                e.stopPropagation();
                return false;
            });

            _wnd.find('.linked_addresses a.plusmail').bind('click', function() {
                if ($('.linked_addresses a.plusmail').attr('disabled'))
                    return false;
                _addAddressHandler(this);
                return false;
            });

            _wnd.find('input.addemail').emailAutocomplete({ emailOnly: true });

            _wnd.find('.buttons .del').unbind('click').bind('click', function() {
                if ($('.buttons .del').attr('disabled'))
                    return false;
                hide();
                _deleteTag();
                return false;
            });

            _wnd.find('.buttons .cancel').bind('click', function() {
                if ($('.buttons .cancel').attr('disabled'))
                    return false;
                hide();
                return false;
            });

            tagsManager.events.bind('delete', _onTagsChange);
            tagsManager.events.bind('create', _onTagsChange);
            tagsManager.events.bind('update', _onTagsChange);
            tagsManager.events.bind('error', _onTagsError);

            $(document).keyup(function(e) {
                if (e.which == 13) {
                    if ($('#tagWnd').is(':visible')) {
                        if ($('#tagWnd input.addemail').is(':focus'))
                            _addAddressHandler(this);
                        else
                            $('#tagWnd .containerBodyBlock .buttons .button.blue:visible').trigger('click');

                    }
                }
            });
        }
    };

    var _setRequiredHint = function(container_id, text) {
        $("#" + container_id + ".requiredField span").text(text);
    };

    var _setRequiredError = function(container_id, need_show) {
        if (need_show)
            $("#" + container_id + ".requiredField").addClass(REQUIRED_FIELD_ERROR_CSS);
        else
            $("#" + container_id + ".requiredField").removeClass(REQUIRED_FIELD_ERROR_CSS);
    };

    var _onTagsChange = function() {
        hide();
    };

    var showCreate = function() {
        return _show({ id: 0, name: '', addresses: {}, style: tagsManager.getVacantStyle() }, 'new');
    };
    var showDelete = function(tag) {
        return _show(tag, 'delete');
    };
    var showEdit = function(tag) {
        return _show(tag);
    };
    var _show = function(tag, type) {
        if (type === 'delete') {
            _wnd.find('.del').show();
            _wnd.find('.save').hide();
            var text = MailScriptResource.DeleteTagShure;
            _wnd.find('#deleteTagShure').text(text.replace(/%1/g, tag.name));
        }
        else {
            _wnd.find('.del').hide();
            _wnd.find('.save').show();
        }

        var header_text;
        if (type === 'delete') {
            header_text = _wnd.attr('deletetag');
        } else if (type === 'new') {
            header_text = _wnd.attr('newtag');
        }
        else {
            header_text = _wnd.attr('savetag');
        }
        _wnd.find('div.containerHeaderBlock:first td:first').html(header_text);


        _wnd.find('#mail_CreateTag_Name input').val(TMMail.translateSymbols(tag.name));
        _changeWndTagColor(undefined, tag.style);
        _wnd.find('#mail_EmailsContainer').html('');
        $.each(tag.addresses, function(i) {
            _addAddressHtml(tag.addresses[i]);
        });

        _wnd.attr('tagid', tag.id);

        _wnd.find('.buttons .save').bind('click', function() {
            if (!_wnd.find('.buttons .save').attr('disabled')) {

                if (_wnd.find('input.addemail').val() && !_wnd.find('input.addemail').hasClass('placeholder'))
                    if (!_addAddressHandler(this))
                    return false;

                tag = _getTagFromWnd();
                if (tag.name.length == 0) {
                    _setRequiredHint('mail_CreateTag_Name', MailScriptResource.ErrorEmptyField);
                    _setRequiredError('mail_CreateTag_Name', true);
                    return false;
                }

                _showLoader(MailScriptResource.TagCreation);

                _setRequiredError('mail_CreateTag_Name', false);
                _setRequiredError('mail_CreateTag_Email', false);

                if ('new' === type)
                    _createTag(tag);
                else
                    _updateTag(tag);
            }
            return false;
        });

        _wnd.find('input.addemail').val('');

        _wnd.find('.addemail_error').hide();
        _setRequiredError('mail_CreateTag_Name', false);
        _setRequiredError('mail_CreateTag_Email', false);

        var margintop = jq(window).scrollTop() - 135;
        margintop = margintop + 'px';

        _wnd.find('input[placeholder]').placeholder();

        jq.blockUI({ message: _wnd,
            css: {
                left: '50%',
                top: '25%',
                opacity: '1',
                border: 'none',
                padding: '0px',
                width: '350px',

                cursor: 'default',
                textAlign: 'left',
                position: 'absolute',
                'margin-left': '-175px',
                'margin-top': margintop,
                'background-color': 'White'
            },
            overlayCSS: {
                backgroundColor: '#AAA',
                cursor: 'default',
                opacity: '0.3'
            },
            focusInput: true,
            baseZ: 666,

            fadeIn: 0,
            fadeOut: 0,

            onBlock: function() {
            }
        });
    };

    var _showLoader = function(message) {
        $('#tagWnd').find('.addemail_error').hide();
        $('#tagWnd').find('.progressContainer').show();
        $('#tagWnd').find('.progressContainer .loader').show().html(message || '');
        $('#tagWnd .save #mail_tag_name').attr('disabled', 'true');
        $('#tagWnd .save .tag.color .outer .inner').attr('disabled', 'true').css('cursor', 'default');
        $('#tagWnd .save .tag.color').css('cursor', 'default');
        $('#tagWnd .linked_addresses.save #mail_tag_email').attr('disabled', 'true');
        $('#tagWnd .linked_addresses a.plusmail').attr('disabled', 'true').css('cursor', 'default');
        $('#tagWnd .delete_tag_address').attr('disabled', 'true').css('cursor', 'default');
        $('#tagWnd .buttons .save').attr('disabled', 'true').removeClass("disable").addClass("disable");
        $('#tagWnd .buttons .cancel').attr('disabled', 'true').removeClass("disable").addClass("disable");
    };

    var _hideLoader = function() {
        $('#tagWnd').find('.progressContainer .loader').hide();
        $('#tagWnd .save #mail_tag_name').removeAttr('disabled');
        $('#tagWnd .save .tag.color .outer .inner').removeAttr('disabled').css('cursor', 'pointer');
        $('#tagWnd .save .tag.color').css('cursor', 'pointer');
        $('#tagWnd .linked_addresses.save #mail_tag_email').removeAttr('disabled');
        $('#tagWnd .linked_addresses a.plusmail').removeAttr("disabled").css('cursor', 'pointer');
        $('#tagWnd .delete_tag_address').removeAttr("disabled").css('cursor', 'pointer');
        $('#tagWnd .buttons .save').removeAttr('disabled').removeClass("disable");
        $('#tagWnd .buttons .cancel').removeAttr('disabled').removeClass("disable");
    };

    var _changeWndTagColor = function(obj, new_style) {
        _wnd.find('a.square').removeClass().addClass('square tag' + new_style);
        _wnd.find('.tag.color .inner').removeClass().addClass('inner tag' + new_style);
        _wnd.find('.tag.color .inner').attr('colorstyle', new_style);
    };

    var _updateTag = function(tag) {
        var current_value = tagsManager.getTag(tag.id);
        tag.lettersCount = current_value.lettersCount;
        // Google Analytics
        window.ASC.Mail.ga_track(ga_Categories.tagsManagement, ga_Actions.update, "update_tag");
        tagsManager.updateTag(tag);
    };

    var _createTag = function(tag) {
        // Google Analytics
        window.ASC.Mail.ga_track(ga_Categories.tagsManagement, ga_Actions.createNew, "create_new_tag");
        tagsManager.createTag(tag);
    };

    var _deleteTag = function() {
        var tag = _getTagFromWnd();
        tagsManager.deleteTag(tag.id);
    };

    var hide = function(error) {
        _wnd.find('.buttons .save').unbind('click');

        if (typeof error === 'object')
            return _onTagsError(null, error);
        else _hideLoader();

        tagsColorsPopup.hide();

        if (_wnd.is(':visible'))
            $.unblockUI();
    };

    var _addAddressHandler = function(obj) {
        var address = _wnd.find('input.addemail').val();

        //check on errors
        if (address == undefined || address.length == 0) {
            _setRequiredHint('mail_CreateTag_Email', MailScriptResource.ErrorEmptyField);
            _setRequiredError('mail_CreateTag_Email', true);
            return undefined;
        }

        var fromArray = [];
        $addresses = _wnd.find('.linked_address');
        itmInd = $addresses.length;
        while (itmInd--) {
            $item = $($addresses[itmInd]);
            fromArray.push($item.html().toLowerCase());
        }

        if (TMMail.in_array(address.toLowerCase(), fromArray)) {
            _setRequiredHint('mail_CreateTag_Email', MailResource.ErrorEmailExist);
            _setRequiredError('mail_CreateTag_Email', true);
            return undefined;
        }

        if (!TMMail.reEmailStrict.test(address)) {
            _setRequiredHint('mail_CreateTag_Email', MailScriptResource.ErrorIncorrectEmail);
            _setRequiredError('mail_CreateTag_Email', true);
            return undefined;
        }

        _wnd.find('.addemail_error').hide();
        _setRequiredError('mail_CreateTag_Email', false);

        _addAddressHtml(address);
        _wnd.find('input.addemail').val('');
        return true;
    };

    var _addAddressHtml = function(address) {
        if (address) {
            var html = $('<tr><td class="linked_address" title="' + address + '">' + address + '</td><td class="delete_tag_address"></td></tr>');

            html.find('.delete_tag_address').bind('click', function() {
                if ($('.delete_tag_address').attr('disabled'))
                    return false;

                $(this).parent().remove();
                return false;
            });

            _wnd.find('#mail_EmailsContainer').append(html);
        }
    };

    var _getTagFromWnd = function() {
        var id = _wnd.attr('tagid'),
            style = _wnd.find('.tag.color .inner').attr('colorstyle'),
            name = $.trim(TMMail.ltgt(_wnd.find('#mail_tag_name').val())),
            addresses = [];

        _wnd.find('.linked_address').each(function(i, v) {
            addresses.push($(v).html());
        });

        return { id: id, name: name, style: style, addresses: addresses };
    };

    var _onTagsError = function(e, error) {
        _setErrorMessage(error.message + (error.comment ? ': ' + error.comment : ''));
	    $('#tagWnd .delete_tag_address').removeAttr("disabled").css('cursor', 'pointer');
    };

    var _setErrorMessage = function(error_message) {
        _hideLoader();
        _wnd.find('.addemail_error').show().html(error_message);
        _wnd.find('.addemail_error').css('display', 'inline-block');
    };
    return {
        init: init,
        hide: hide,
        showCreate: showCreate,
        showDelete: showDelete,
        showEdit: showEdit
    };
})(jQuery);