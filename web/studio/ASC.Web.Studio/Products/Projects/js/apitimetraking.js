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

ASC.Projects.TimeTraking = (function() {
    var timer,
        seconds = 0,
        timerHours = 0,
        timerMin = 0,
        timerSec = 0,
        startTime = null,
        focusTime = null,
        pausedTime = null,
        clickPauseFlag = false,
        isPlay = true;

    var init = function() {
        window.onfocus = function () {
            var diffTime = {};
            if (startTime && seconds > 0 && !isPlay) {
                var focusTime = new Date();
                if (focusTime.getHours() > startTime.getHours()) {
                    diffTime.h = focusTime.getHours() - startTime.getHours();
                } else {
                    diffTime.h = 0;
                }
                if (focusTime.getMinutes() >= startTime.getMinutes()) {
                    diffTime.m = focusTime.getMinutes() - startTime.getMinutes(); 
                } else if (diffTime.h > 0) {
                    diffTime.m = (focusTime.getMinutes() + 60) - startTime.getMinutes();
                    diffTime.h--;
                    if (diffTime.m == 60) {
                        diffTime.m = 0;
                        diffTime.h++;
                    }
                } else {
                    diffTime.m = 0;
                }
                if (focusTime.getSeconds() >= startTime.getSeconds()) {
                    diffTime.s = focusTime.getSeconds() - startTime.getSeconds();
                } else if (diffTime.m > 0) {
                    diffTime.s = (focusTime.getSeconds() + 60) - startTime.getSeconds();
                    diffTime.m--;
                    if (diffTime.s == 60) {
                        diffTime.s = 0;
                        diffTime.m++;
                    }
                } else {
                    diffTime.s = 0;
                }
                var time = {};
                if (clickPauseFlag) {
                    time = timeSum(pausedTime, diffTime);
                } else {
                    time = diffTime;
                }
                timerHours = time.h;
                timerMin = time.m;
                timerSec = time.s;
                updateTimer(time);
            }
        };

        if (jq("#addLog").length) {
            window.onbeforeunload = function(evt) {
                if (jq("#timerTime .start").hasClass("stop")) {
                    window.ASC.Projects.TimeTraking.playPauseTimer();
                    return '';
                }

                if (window.ASC.Projects.TimeTraking.ifNotAdded()) {
                    return '';
                }
                return;
            };

            unlockElements();
            jq('#inputTimeHours').focus();
            
            if (jq("#teamList option").length == 0 || jq("#selectUserTasks option").length == 0) {
                lockStartAndAddButtons();
            }

            if (!jq('#inputDate').hasClass('hasDatepicker')) {
                jq('#inputDate').datepicker({ selectDefaultDate: false, onSelect: function() { jq('#inputDate').blur(); } });
            }

            jq("#inputDate").mask(ASC.Resources.Master.DatePatternJQ);
            jq("#inputDate").datepicker('setDate', Teamlab.getDisplayDate(new Date()));

            jq('#timerTime #selectUserProjects').bind('change', function(event) {
                var prjid = parseInt(jq("#selectUserProjects option:selected").val());

                Teamlab.getPrjTeam({}, prjid, {
                    before: function() {
                        jq("#teamList").attr("disabled", "disabled");
                        jq("#selectUserTasks").attr("disabled", "disabled");
                    },
                    success: onGetTeam,
                    after: function() {
                        jq("#teamList").removeAttr("disabled");
                        jq("#selectUserTasks").removeAttr("disabled"); ;
                    }
                });

                Teamlab.getPrjTasks({}, null, null, null, { success: onGetTasks, filter: { sortBy: 'title', sortOrder: 'ascending', projectId: prjid} });
            });

            jq('#timerTime .start').bind('click', function(event) {
                if (jq(this).hasClass("disable")) return;
                playPauseTimer();
            });

            jq('#timerTime .reset').bind('click', function(event) {
                resetTimer();
            });

            jq('#timerTime #addLog').bind('click', function(event) {
                lockStartAndAddButtons();
                var h, m, s;
                var prjid = parseInt(jq("#selectUserProjects option:selected").attr("value"));
                var personid = jq("#teamList option:selected").attr("value");
                var taskid = parseInt(jq("#selectUserTasks option:selected").attr("value"));
                var description = jq.trim(jq("#textareaTimeDesc").val());
                jq("#inputTimeHours").removeClass('error');
                jq("#inputTimeMinutes").removeClass('error');
                jq("#timeTrakingErrorPanel").empty();
                var invalidTime = false;

                if (seconds > 0) {
                    h = parseInt(jq("#firstViewStyle .h").text(), 10);
                    m = parseInt(jq("#firstViewStyle .m").text(), 10);
                    s = parseInt(jq("#firstViewStyle .s").text(), 10);
                    if (!(h > 0)) h = 0;
                    if (!(m > 0)) m = 0;
                    if (!(s > 0)) s = 0;
                    var hours = h + m / 60 + s / 3600;

                    resetTimer();
                } else {
                    var errorPanel = jq("#timeTrakingErrorPanel");
                    if (jq("#inputTimeHours").val() == "" && jq("#inputTimeMinutes").val() == "") {
                        errorPanel.addClass('error').removeClass("success");
                        errorPanel.text(ASC.Projects.Resources.ProjectsJSResource.TimerNoData);
                        unlockStartAndAddButtons();
                        return;
                    }
                    h = parseInt(jq("#inputTimeHours").val(), 10);
                    m = parseInt(jq("#inputTimeMinutes").val(), 10);

                    if (h < 0 || !isInt(h)) {
                        jq("#inputTimeHours").addClass('error');
                        invalidTime = true;
                    }

                    if (m > 59 || m < 0 || !isInt(m)) {
                        jq("#inputTimeMinutes").addClass('error');
                        invalidTime = true;
                    }

                    if (invalidTime) {
                        errorPanel.addClass('error').removeClass("success");
                        errorPanel.text(ASC.Projects.Resources.ProjectsJSResource.InvalidTime).show();
                        unlockStartAndAddButtons();
                        return;
                    }

                    if (!(h > 0)) h = 0;
                    if (!(m > 0)) m = 0;

                    var hours = h + m / 60;
                }

                var data = {};
                data.date = jq('#inputDate').datepicker('getDate');
                data.date.setHours(0);
                data.date.setMinutes(0);
                data.date = Teamlab.serializeTimestamp(data.date);
                data.hours = hours;
                data.note = description;
                data.personId = personid;
                data.projectId = prjid;

                Teamlab.addPrjTime({}, taskid, data, { success: onAddTaskTime });
            });
        }
    };

    var isInt = function(input) {
        return parseInt(input, 10) == input;
    };

    var playTimer = function() {
        lockElements(true);

        jq("#inputTimeHours").val('');
        jq("#inputTimeMinutes").val('');
        jq("#timeTrakingErrorPanel").empty();
        jq("#inputTimeHours").removeClass('error');
        jq("#inputTimeMinutes").removeClass('error');

        timer = setInterval(timerTick, 1000);
    };

    var timerTick = function () {
        timerSec++;
        if (timerSec == 60) {
            timerSec = 0;
            timerMin++;
            if (timerMin == 60) {
                timerMin = 0;
                timerHours++;
            }
        }
        var time = { h: timerHours, m: timerMin, s: timerSec };
        updateTimer(time);
    };

    var pauseTimer = function () {
        pausedTime = getCurrentTime();
        window.clearTimeout(timer);
    };

    var updateTimer = function (time) {
        seconds = time.h * 60 * 60 + time.m * 60 + time.s;      // refactor?
        if (time.h < 10) showHours = "0" + time.h; else showHours = time.h;
        if (time.m < 10) showMin = "0" + time.m; else showMin = time.m;
        if (time.s < 10) showSec = "0" + time.s; else showSec = time.s;

        jq("#firstViewStyle .h").text(showHours);
        jq("#firstViewStyle .m").text(showMin);
        jq("#firstViewStyle .s").text(showSec);
    };

    var getCurrentTime = function () {
        var time = {};
        time.h = parseInt(jq("#firstViewStyle .h").text(), 10);
        time.m = parseInt(jq("#firstViewStyle .m").text(), 10);
        time.s = parseInt(jq("#firstViewStyle .s").text(), 10);
        return time;
    };

    var timeSum = function (firstTime, secondTime) {
        var resultTime = {};
        resultTime.h = firstTime.h + secondTime.h;
        resultTime.m = firstTime.m + secondTime.m;
        if (resultTime.m >= 60) {
            resultTime.h++;
            resultTime.m -= 60;
        }
        resultTime.s = firstTime.s + secondTime.s;
        if (resultTime.s >= 60) {
            resultTime.m++;
            resultTime.s -= 60;
        }
        return resultTime;
    };

    var resetTimer = function() {
        unlockElements();
        pauseTimer();

        jq("#firstViewStyle .h").text('00');
        jq("#firstViewStyle .m").text('00');
        jq("#firstViewStyle .s").text('00');

        var startButton = jq("#timerTime .start");
        startButton.removeClass("stop").attr("title", startButton.attr("data-title-start"));
        isPlay = true;
        seconds = 0;
        timerSec = 0;
        timerMin = 0;
        timerHours = 0;
        startTime = null;
        clickPauseFlag = false;
    };

    var lockElements = function(onlyManualInput) {
        jq("#inputTimeHours").attr("disabled", "true");
        jq("#inputTimeMinutes").attr("disabled", "true");
        if (!onlyManualInput) {
            jq("#inputDate").attr("disabled", "true");
            jq("#textareaTimeDesc").attr("disabled", "true");
        }
    };

    var unlockElements = function() {
        jq("#inputTimeHours").removeAttr("disabled");
        jq("#inputTimeMinutes").removeAttr("disabled");
        jq("#inputDate").removeAttr("disabled");
        jq("#textareaTimeDesc").removeAttr("disabled");
    };

    var lockStartAndAddButtons = function() {
        jq("#firstViewStyle .start, #addLog").addClass("disable");
        lockElements();
    };

    var unlockStartAndAddButtons = function() {
        jq("#firstViewStyle .start, #addLog").removeClass("disable");
        unlockElements();
    };

    var playPauseTimer = function() {
        var startButton = jq("#timerTime .start");
        if (isPlay) {
            startButton.addClass("stop").attr("title", startButton.attr("data-title-pause"));
            isPlay = false;
            startTime = new Date();
            playTimer();
        }
        else {
            startButton.removeClass("stop").attr("title", startButton.attr("data-title-start"));
            isPlay = true;
            clickPauseFlag = true;
            startTime = null;
            pauseTimer();
        }
    };

    var onAddTaskTime = function(data) {
        var errorPanel = jq("#timeTrakingErrorPanel");
        errorPanel.removeClass("error").addClass("success");
        errorPanel.text(ASC.Projects.Resources.ProjectsJSResource.SuccessfullyAdded);
        jq("#textareaTimeDesc").val('');
        jq("#inputTimeHours").val('');
        jq("#inputTimeMinutes").val('');
        jq("#firstViewStyle .h,#firstViewStyle .m,#firstViewStyle .s").val('00');
        unlockStartAndAddButtons();
    };

    var onGetTeam = function(params, team) {
        team = ASC.Projects.Common.excludeVisitors(team);
        var teamList = jq('#teamList');
        var teamInd = team ? team.length : 0;
        teamList.find('option').remove();

        for (var i = 0; i < teamInd; i++) {
            if (team[i].displayName != "profile removed") {
                jq('#teamList').append('<option value="' + team[i].id + '" id="optionUser_' + team[i].id + '">' + team[i].displayName + '</option>');
            }
        }
        if (teamList.find('option').length == 0) {
            lockStartAndAddButtons();
        } else {
            unlockStartAndAddButtons();
        }
    };

    var onGetTasks = function(params, tasks) {
        var taskInd = tasks ? tasks.length : 0;
        jq('#selectUserTasks option').remove();

        if (Teamlab.profile.isVisitor) {
            var visitorId = Teamlab.profile.id;
            var taskForVisitor = [];
            for (var i = 0; i < taskInd; i++) {
                for (var j = 0; j < tasks[i].responsibles.length; j++) {
                    if (visitorId == tasks[i].responsibles[j])
                        taskForVisitor.push[tasks[i]];
                }
            }
            if (taskForVisitor.length > 0) {
                tasks = taskForVisitor;
                taskInd = tasks.length;
            } else {
                tasks = [];
                taskInd = 0;
            }
        }

        var openTasks = jq('#openTasks');
        var closedTasks = jq('#closedTasks');

        for (var i = 0; i < taskInd; i++) {
            if (tasks[i].status == 1) {
                openTasks.append('<option value="' + tasks[i].id + '" id="optionUser_' + tasks[i].id + '">' + jq.htmlEncodeLight(tasks[i].title) + '</option>');
            }
            if (tasks[i].status == 2) {
                closedTasks.append('<option value="' + tasks[i].id + '" id="optionUser_' + tasks[i].id + '">' + jq.htmlEncodeLight(tasks[i].title) + '</option>');
            }
        }
        if (jq("#selectUserTasks option").length == 0) {
            lockStartAndAddButtons();
        } else {
            unlockStartAndAddButtons();
        }
    };

    var ifNotAdded = function() {
        return seconds > 0 || jq("#inputTimeHours").val() != '' || jq("#inputTimeMinutes").val() != '';
    };

    return {
        init: init,
        playPauseTimer: playPauseTimer,
        ifNotAdded: ifNotAdded
    };
})(jQuery);

ASC.Projects.TimeTrakingEdit = (function () {
    var timeCreator;
    var oldTime = {};
    var loadListTeamFlag = false;

    var init = function () {


        if (jq.getURLParam("prjID"))
            ASC.Projects.Common.bind(ASC.Projects.Common.events.loadTeam, function () {
                loadListTeamFlag = true;
            });

        jq('#timeTrakingPopup .middle-button-container a.button.blue.middle').bind('click', function (event) {
            var data = {};
            var h = jq("#inputTimeHours").val();
            var m = jq("#inputTimeMinutes").val();

            if (parseInt(m, 10) > 59 || parseInt(m, 10) < 0 || !isInt(m)) {
                jq("#timeTrakingErrorPanel").show();
                jq("#timeTrakingErrorPanel").text(ASC.Projects.Resources.ProjectsJSResource.InvalidTime);
                setInterval('jq("#timeTrakingErrorPanel").hide();', 5000);
                jq("#inputTimeMinutes").focus();
                return;
            }
            if (parseInt(h, 10) < 0 || !isInt(h)) {
                jq("#timeTrakingErrorPanel").show();
                jq("#timeTrakingErrorPanel").text(ASC.Projects.Resources.ProjectsJSResource.InvalidTime);
                setInterval('jq("#timeTrakingErrorPanel").hide();', 5000);
                jq("#inputTimeHours").focus();
                return;
            }
            if (!parseInt(h, 10) && !parseInt(m, 10)) {
                jq("#timeTrakingErrorPanel").show();
                jq("#timeTrakingErrorPanel").text(ASC.Projects.Resources.ProjectsJSResource.InvalidTime);
                setInterval('jq("#timeTrakingErrorPanel").hide();', 5000);
                jq("#inputTimeMinutes").focus();
                return;
            }
            m = parseInt(m, 10);
            h = parseInt(h, 10);

            if (!(h > 0)) h = 0;
            if (!(m > 0)) m = 0;

            data.hours = h + m / 60;

            data.date = jq('#timeTrakingPopup #timeTrakingDate').val();
            var isValidDate = jq.isValidDate(data.date);
            if (jq.trim(data.date) == "" || data.date == null || !isValidDate) {
                jq("#timeTrakingErrorPanel").text(ASC.Projects.Resources.ProjectsJSResource.IncorrectDate);
                jq("#timeTrakingErrorPanel").show();
                setInterval('jq("#timeTrakingErrorPanel").hide();', 5000);
                jq('#timeTrakingPopup #timeTrakingDate').focus();
                return;
            }
            data.date = jq('#timeTrakingPopup #timeTrakingDate').datepicker('getDate');
            var timeid = jq("#timeTrakingPopup").attr('timeid');
            data.date = Teamlab.serializeTimestamp(data.date);
            data.note = jq('#timeTrakingPopup #timeDescription').val();
            data.personId = jq('#teamList option:selected').attr('value');

            Teamlab.updatePrjTime({ oldTime: oldTime, timeid: timeid }, timeid, data, { error: onUpdatePrjTimeError });

            jq.unblockUI();

        });
    };
    var isInt = function (input) {
        return parseInt(input, 10) == input;
    };
    var showPopup = function (prjid, taskid, taskName, timeId, time, date, description, responsible) {
        timeCreator = responsible;
        jq("#timeTrakingPopup").attr('timeid', timeId);
        jq("#timeTrakingPopup #timeDescription").val(description);
        jq("#timeTrakingPopup #TimeLogTaskTitle").text(taskName);
        jq("#timeTrakingPopup #TimeLogTaskTitle").attr('taskid', taskid);

        oldTime = time;
        jq("#inputTimeHours").val(time.hours);
        jq("#inputTimeMinutes").val(time.minutes);

        date = Teamlab.getDisplayDate(new Date(date));
        jq("#timeTrakingPopup #timeTrakingDate").mask(ASC.Resources.Master.DatePatternJQ);
        jq("#timeTrakingPopup #timeTrakingDate").datepicker({ popupContainer: "#timeTrakingPopup", selectDefaultDate: true });
        jq("#timeTrakingPopup #timeTrakingDate").datepicker('setDate', date);
        jq('select#teamList option').remove();

        Teamlab.getPrjTime({}, taskid, { success: onGetTimeSpend });
        if (loadListTeamFlag) {
            jq('select#teamList option').remove();
            if (ASC.Projects.Master.Team.length) {
                appendListOptions(ASC.Projects.Common.excludeVisitors(ASC.Projects.Master.Team));
            }
        } else {
            Teamlab.getPrjProjectTeamPersons({}, prjid, { success: onGetTeamByProject });
        }

        var margintop = jq(window).scrollTop() - 100;
        margintop = margintop + 'px';
        jq.blockUI({
            message: jq("#timeTrakingPopup"),
            css: {
                left: '50%',
                top: '25%',
                opacity: '1',
                border: 'none',
                padding: '0px',
                width: '550px',

                cursor: 'default',
                textAlign: 'left',
                position: 'absolute',
                'margin-left': '-275px',
                'margin-top': margintop,
                'background-color': 'White'
            },
            overlayCSS: {
                backgroundColor: '#AAA',
                cursor: 'default',
                opacity: '0.3'
            },
            focusInput: false,
            baseZ: 666,

            fadeIn: 0,
            fadeOut: 0,

            onBlock: function () {
                jq('#inputTimeHours').focus();
            }
        });
    };

    var onGetTimeSpend = function (params, data) {
        var hours = 0;
        for (var i = 0; i < data.length; i++) {
            hours += data[i].hours;
        }
        var time = jq.timeFormat(hours);
        jq(".addLogPanel-infoPanelBody #TotalHoursCount").text(time);
    };

    var appendListOptions = function (team) {
        var teamListSelect = jq('select#teamList');
        for (var i = 0; i < team.length; i++) {
            var p = team[i];
            if (timeCreator == team[i].id) {
                teamListSelect.append(jq('<option value="' + p.id + '" selected="selected"></option>').html(p.displayName));
            } else {
                teamListSelect.append(jq('<option value="' + p.id + '"></option>').html(p.displayName));
            }
        }
    };
    var onUpdatePrjTimeError = function (params, data) {
        jq("div.entity-menu[timeid=" + params.timeid + "]").hide();
    };

    var onGetTeamByProject = function (params, data) {
        var team = data;
        if (team.length) {
            appendListOptions(ASC.Projects.Common.excludeVisitors(team));
        }
    };
    return {
        init: init,
        showPopup: showPopup
    };
})(jQuery);