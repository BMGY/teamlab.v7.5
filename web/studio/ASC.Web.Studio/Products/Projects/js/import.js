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

ASC.Projects.Import = (function() {
    var quotaEndFlag = false;

    var init = function() {
        jq("#chooseProjects, #importClosed, #sendInvitations, #agreement").removeAttr("checked");

        if (jq("#importAsCollaborators").attr("disabled") != "disabled") {
            jq("#importAsCollaborators").removeAttr("checked");
        } else {
            quotaEndFlag = true;
        }

        jq('#tbxURL').focus();

        checkImportStatus(true);

        jq('#startImportButton').on('click', function() {
            if (jq(this).hasClass("disable")) return;

            if (!validateData()) return;

            if (jq("#importAsCollaborators").is(":checked"))
                beforeStartImport();
            else
                Teamlab.checkPrjImportQuota({}, getDataForImport(), { success: onCheckQuota, error: showOverLimitPopup });
        });

        jq('#agreement').on('click', function() {
            changeAgreementCheckBox(this);
        });

        jq('#viewImport').on('click', function() {
            viewImportInfoPanel(jq("#import_info_popup"));
        });

        jq(".basecamp-projects-container").on("click", "input", function(event) {
            var row = jq(this).parents("li");
            onProjectClick(row);
            event.stopPropagation();
        });
        jq(".basecamp-projects-container").on("click", "label", function(event) {
            event.stopPropagation();
        });
        jq(".basecamp-projects-container").on("click", "li", function() {
            var input = jq(this).children("input");
            if (input.is(":checked")) {
                input.removeAttr("checked");
            } else {
                input.attr("checked", "checked");
            }
            onProjectClick(this);
        });
        jq("#checkArchivedProj").change(function() {
            var archivedProjCont = jq("#archivedProjects");
            if (!jq(this).is(":checked")) {
                archivedProjCont.find("input").removeAttr("checked");
                archivedProjCont.find("li").addClass("unchecked");
            } else {
                archivedProjCont.find("input").attr("checked", "checked");
                archivedProjCont.find("li").removeClass("unchecked");
            }
        });
        jq("#checkActiveProj").change(function() {
            var activeProjCont = jq("#activeProjects");
            if (!jq(this).is(":checked")) {
                activeProjCont.find("input").removeAttr("checked");
                activeProjCont.find("li").addClass("unchecked");
            } else {
                activeProjCont.find("input").attr("checked", "checked");
                activeProjCont.find("li").removeClass("unchecked");
            }
        });
        jq("#importCheckedProjects").click(function() {
            if (jq(this).hasClass("disable")) return;

            var projects = jq(".basecamp-projects-container li input");
            importCheckedProjects(projects);
        });
        jq("#continueImport").click(function() {
            beforeStartImport();
            jq.unblockUI();
        });
    };

    beforeStartImport = function() {
        if (jq("#chooseProjects").is(":checked")) {
            getBasecampProjects();
        } else {
            startImport();
        }
    };

    onCheckQuota = function(params, response) {
        if (response < 0) {
            jq("#userLimit").text(-response);
            viewImportInfoPanel(jq("#popupUsersQuotaEnds"));
            return;
        }
        beforeStartImport();
    };

    showOverLimitPopup = function(params, response) {
        if (response[0] != "empty response") {
            showErrorPopup(response);
            return;
        }

        var limitHeaderContainer = jq(".tariff-limitexceed-users .header-base-medium");
        limitHeaderContainer.text(limitHeaderContainer.attr("data-zero-users-text"));

        var limitReasonContainer = jq("#limitReasonText");
        limitReasonContainer.text(limitReasonContainer.attr("data-zero-users-text"));

        viewImportInfoPanel(jq("#popupUsersQuotaEnds"));
    }

    var onProjectClick = function(row) {
        if (jq(row).hasClass("unchecked")) {
            jq(row).removeClass("unchecked");
        } else {
            jq(row).addClass("unchecked");
        }
        var importButton = jq("#importCheckedProjects");
        var checkedFlag = false;
        var inputs = jq(".basecamp-projects-container input");
        for (var i = 0; i < inputs.length; i++) {
            if (!checkedFlag) {
                checkedFlag = jq(inputs[i]).is(":checked");
            }
        };

        if (checkedFlag) {
            importButton.removeClass("disable");
        } else {
            importButton.addClass("disable");
        }
    };

    var importCheckedProjects = function(projects) {
        var projIds = [];
        for (var i = 0; i < projects.length; i++) {
            if (jq(projects[i]).is(":checked")) {
                projIds.push(parseInt(jq(projects[i]).attr("id")));
            }
        }
        startImport(projIds);
    };

    var getBasecampProjects = function() {
        var data = getDataForImport();
        if (!data) return;
        LoadingBanner.displayLoading();
        Teamlab.getPrjImportProjects({ getProjects: true, isInit: true }, data, { success: onGetImportedProjects, error: onGetImportStatus });
    };

    var onGetImportedProjects = function(params, data) {
        var activeProjCont = jq("#activeProjects");
        var archivedProjCont = jq("#archivedProjects");
        var template = "<li><input type='checkbox' id='${id}' checked='checked'/><label for='${id}' title='${title}'>${title}</label></li>";

        var activeProjs = [];
        var archevedProjs = [];

        for (var i = 0; i < data.length; i++) {
            if (data[i].status == 0) {
                activeProjs.push(data[i]);
            } else {
                archevedProjs.push(data[i]);
            }
        }

        activeProjCont.empty();
        archivedProjCont.empty();
        jq.tmpl(template, activeProjs).appendTo(activeProjCont);
        jq.tmpl(template, archevedProjs).appendTo(archivedProjCont);

        LoadingBanner.hideLoading();
        jq("#checkArchivedProj").removeAttr("disabled");
        jq("#checkActiveProj").attr("checked", "checked");
        archivedProjCont.find("input").removeAttr("checked");
        archivedProjCont.find("li").addClass("unchecked");
        viewImportInfoPanel(jq("#chooseProjectsPopup"));
    };

    var validateData = function() {

        if (jq("#tbxURL").val().trim() == "") {
            jq("#companyUrl").addClass("requiredFieldError");
            jq("#companyUrl").find(".requiredErrorText").text(ASC.Projects.Resources.ImportResource.EmptyURL);
            return false;
        } else {
            jq("#companyUrl").removeClass("requiredFieldError");
        }
        if (jq("#tbxUserName").val().trim() == "") {
            jq("#companyEmail").addClass("requiredFieldError");
            jq("#companyEmail").find(".requiredErrorText").text(ASC.Projects.Resources.ImportResource.EmptyEmail);
            return false;
        } else {
            jq("#companyEmail").removeClass("requiredFieldError");
        }
        if (jq("#tbxPassword").val().trim() == "") {
            jq("#companyPassword").addClass("requiredFieldError");
            return false;
        } else {
            jq("#companyPassword").removeClass("requiredFieldError");
        }

        var regExpForCompanyUrl = /^(https:\/\/basecamp.com)\/([0-9]{6,8})(\/?)$/;
        var regExpForEmail = /^([a-z0-9_\.-]+)@([a-z0-9_\.-]+)\.([a-z\.]{2,6})$/;

        // company url
        var urlTbContainer = jq("#companyUrl");
        var url = jq("#tbxURL").val().trim();
        if (!regExpForCompanyUrl.test(url)) {
            urlTbContainer.addClass("requiredFieldError");
            urlTbContainer.find(".requiredErrorText").text(ASC.Projects.Resources.ImportResource.InvalidCompaniUrl);
            return false;
        }
        // company url
        var emailTbContainer = jq("#companyEmail");
        var email = jq("#tbxUserName").val().trim();
        if (!regExpForEmail.test(email)) {
            emailTbContainer.addClass("requiredFieldError");
            emailTbContainer.find(".requiredErrorText").text(ASC.Projects.Resources.ImportResource.InvalidEmail);
            return false;
        }
        return true;
    };

    var getDataForImport = function() {
        if (validateData()) {
            jq('#importPeopleStatus').removeClass('importStatusClosed');
            jq('#importProjectsStatus').removeClass('importStatusClosed');
            jq('#importFilesStatus').removeClass('importStatusClosed');

            var data = {};
            data.url = jq("[id$=tbxURL]").val();
            data.userName = jq("[id$=tbxUserName]").val();
            data.password = jq("[id$=tbxPassword]").val();
            data.importClosed = jq("#importClosed").is(':checked');
            data.importUsersAsCollaborators = jq("#importAsCollaborators").is(":checked");
            data.disableNotifications = !jq("#sendInvitations").is(':checked');

            return data;
        }
        return false;
    };

    var startImport = function(projects) {
        var data = getDataForImport();
        if (!data) return;
        if (projects) data.projects = projects;
        Teamlab.addPrjImport({}, data, { success: onStartImport });
    };

    var showErrorPopup = function(response) {
        var errorText = "";
        if (!response.error) {
            errorText = response[0];
        } else {
            errorText = response.error.Message;
        }
        if (errorText.indexOf("404") < 0) {
            errorText = ASC.Projects.Resources.ImportResource.ImportFailed + ":" + errorText;
            jq("#popupImportErrorContainer .popup-header").text(ASC.Projects.Resources.ImportResource.ImportFailed);
            jq("#popupImportErrorContainer .error-message").text(errorText);
        }
        viewImportInfoPanel(jq("#popupImportErrorContainer"));
    };

    var onStartImport = function(params, status) {
        if (status.error != null) {
            showErrorPopup(status);
            return;
        }
        else {
            lockImportTools();
            viewImportInfoPanel(jq("#import_info_popup"));
            jq('#importPeopleStatus').html("<span class='gray-text'>" + ASC.Projects.Resources.ImportResource.StatusAwaiting + " </span>");
            jq('#importProjectsStatus').html("<span class='gray-text'>" + ASC.Projects.Resources.ImportResource.StatusAwaiting + " </span>");
            jq('#importFilesStatus').html("<span class='gray-text'>" + ASC.Projects.Resources.ImportResource.StatusAwaiting + " </span>");
            jq('#importProgress').html('0');
            jq('#popupPanelBodyError').hide();
            setTimeout("ASC.Projects.Import.checkImportStatus()", 5000);
        }
    };

    var onGetImportStatus = function(params, status) {
        if (params.getProjects) {
            LoadingBanner.hideLoading();
            showErrorPopup(status);
            unlockImportTools();
            return;
        }
        if (status.error != null) {
            if (!params.isInit && !jq("#import_info_popup").is(":visible")) {
                showErrorPopup(status);
                jq('#popupPanelBodyError').hide();
            }
            unlockImportTools();
            buildErrorList(status);
        }
        else if (status != null && status.completed && status.error == null) {
            jq('#importPeopleStatus').html('').removeClass('importStatus').addClass('importStatusClosed');
            jq('#importProjectsStatus').html('').removeClass('importStatus').addClass('importStatusClosed');
            jq('#importFilesStatus').html('').removeClass('importStatus').addClass('importStatusClosed'); ;
            jq('#importProgress').html('3');
            jq('#popupPanelBodyError').hide();
            buildErrorList(status);
            unlockImportTools();
            if (!jq("#import_info_popup").is(":visible")) {
                jq("#popupImportErrorContainer .popup-header").text(ASC.Projects.Resources.ImportResource.PopupPanelHeader);
                jq("#popupImportErrorContainer .error-message").text(ASC.Projects.Resources.ImportResource.ImportCompleted);
                viewImportInfoPanel(jq("#popupImportErrorContainer"));
            }
        }
        else if (status != null && status.error != null) {
            buildErrorList(status);
            unlockImportTools();
        }
        else {
            lockImportTools();
            setTimeout("ASC.Projects.Import.checkImportStatus()", 5000);
            buildErrorList(status);
            if (status != null) {
                if (status.userProgress > 0) {
                    jq('#importPeopleStatus').html(Math.round(status.userProgress) + '%');
                    if (status.userProgress == 100) {
                        jq('#importPeopleStatus').html('').removeClass('importStatus').addClass('importStatusClosed'); ;
                        jq('#importProgress').html('1');
                    }
                }
                if (status.projectProgress > 0) {
                    jq('#importProjectsStatus').html(Math.round(status.projectProgress) + '%');
                    if (status.projectProgress == 100) {
                        jq('#importProjectsStatus').html('').removeClass('importStatus').addClass('importStatusClosed'); ;
                        jq('#importProgress').html('2');
                    }
                }
                if (status.fileProgress > 0) {
                    jq('#importFilesStatus').html(Math.round(status.fileProgress) + '%');
                    if (status.fileProgress == 100) {
                        jq('#importFilesStatus').html('').removeClass('importStatus').addClass('importStatusClosed'); ;
                        jq('#importProgress').html('3');
                    }
                }
            }
        }
    };

    var checkImportStatus = function(isInit) {
        Teamlab.getPrjImport({ isInit: isInit }, { success: onGetImportStatus });
    };

    var buildErrorList = function(res) {
        if (res == null)
            return;
        if (res.log == null)
            return;
        if (res.log.length == 0)
            return;

        var statusStr = "";
        if (res.error != null && res.error.Message != "") {
            statusStr = statusStr + '<div class="errorBox fatal">' + res.error.Message + '</div>';
        }
        for (var i = res.log.length - 1; i >= 0; i--) {

            var messageClass = "ok";
            if (res.log[i].Type == "warn" || res.log[i].type == "error")
                messageClass = "warn";

            statusStr = statusStr + '<div class="' + messageClass + 'Box">' + res.log[i].message + '</div>';
        }

        if (statusStr != "") {
            jq('#popupPanelBodyError').html(statusStr);
            jq('#popupPanelBodyError').show();
        }
        else {
            jq('#popupPanelBodyError').hide();
        }
    };

    var lockImportTools = function() {
        jq('#tbxURL').attr("readonly", "readonly").addClass("disabled");
        jq('#tbxUserName').attr("readonly", "readonly").addClass("disabled");
        jq('#tbxPassword').attr("readonly", "readonly").addClass("disabled");

        jq("#importClosed").attr('disabled', 'disabled');
        jq("#sendInvitations").attr('disabled', 'disabled');
        jq("#chooseProjects").attr('disabled', 'disabled');
        jq("#importAsCollaborators").attr('disabled', 'disabled');

        jq('div.pm-action-block').hide();

        jq('div.pm-ajax-info-block').show();


        jq('#importCompletedContent').hide();
    };

    var unlockImportTools = function() {

        jq('#tbxURL').removeAttr("readonly").removeClass("disabled");
        jq('#tbxUserName').removeAttr("readonly").removeClass("disabled");
        jq('#tbxPassword').removeAttr("readonly").removeClass("disabled");

        jq("#importClosed").removeAttr('disabled');
        jq("#sendInvitations").removeAttr('disabled');
        jq("#chooseProjects").removeAttr('disabled');
        if (!quotaEndFlag) {
            jq("#importAsCollaborators").removeAttr('disabled');
        }

        jq('div.pm-action-block').show();
        jq('div.pm-ajax-info-block').hide();

        jq('#importCompletedContent').show();
    };

    var viewImportInfoPanel = function(popup) {
        jq("#import_info_attention_popup").hide();
        jq("#importCheckedProjects").removeClass("disable");

        var margintop = jq(window).scrollTop() - 135;
        margintop = margintop + 'px';

        jq.blockUI({ message: popup,
            css: {
                left: '50%',
                top: '35%',
                opacity: '1',
                border: 'none',
                padding: '0px',
                width: '480px',

                cursor: 'default',
                textAlign: 'left',
                position: 'absolute',
                'margin-left': '-300px',
                'margin-top': margintop,
                'background-color': 'White'
            },

            overlayCSS: {
                backgroundColor: '#AAA',
                cursor: 'default',
                opacity: '0.3'
            },
            focusInput: false,
            baseZ: 6667,

            fadeIn: 0,
            fadeOut: 0
        });
    };

    var changeAgreementCheckBox = function(obj) {
        if (jq(obj).is(':checked')) {
            jq("#startImportButton").removeClass('disable');
        }
        else {
            jq("#startImportButton").addClass('disable');
        }
    };
    return {
        init: init,
        checkImportStatus: checkImportStatus
    };
})(jQuery);

jq(document).ready(function() {
    if (location.href.indexOf("import.aspx") > 0) {
        ASC.Projects.Import.init();
    }
});