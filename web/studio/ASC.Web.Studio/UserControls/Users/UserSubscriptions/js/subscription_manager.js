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

var CommonSubscriptionManager = new function() {
    this.currentModuleSubsTab;
    this.currentModuleSubsSubtabContents;

    this.LoadSubscriptions = function() {
        AjaxPro.onLoading = function(b) {
            if (b) {
                LoadingBanner.displayLoading();
            } else {
                LoadingBanner.hideLoading();
            }
        };

        var timeoutPeriod = AjaxPro.timeoutPeriod;
        AjaxPro.timeoutPeriod = 5 * 60 * 1000;
        AjaxPro.SubscriptionManager.GetAllSubscriptions(function(result) {
            jq('#modules_notifySenders').html(jq("#headerSubscriptionsTemplate").tmpl(result.value));
            jq('#contents_notifySenders').html(jq("#contentSubscriptionsTemplate").tmpl(result.value));
            CommonSubscriptionManager.InitNotifyByComboboxes();
            CommonSubscriptionManager.InitListTabsComboboxes();
            AjaxPro.timeoutPeriod = timeoutPeriod;
        });

        jq('.subs-tabs .subs-module').on('click', function() {
            CommonSubscriptionManager.ClickProductTag(jq(this).attr("data-id"));
        });

    };

    this.ConfirmMessage = 'Are you sure?';

    this.SubscribeToWhatsNew = function() {
        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };
        AjaxPro.SubscriptionManager.SubscribeToWhatsNew(function(result) {
            var res = result.value;
            if (res.rs1 == '1') {
                jq('#studio_newSubscriptionButton').html(res.rs2);
            } else {
                jq('#studio_newSubscriptionButton').html('<div class="errorBox">' + res.rs2 + '</div>');
            }
        });
    };

    this.SubscribeToAdminNotify = function() {
        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };
        AjaxPro.SubscriptionManager.SubscribeToAdminNotify(function(result) {
            var res = result.value;
            if (res.rs1 == '1') {
                jq('#studio_adminSubscriptionButton').html(res.rs2);
            } else {
                jq('#studio_adminSubscriptionButton').html('<div class="errorBox">' + res.rs2 + '</div>');
            }
        });
    };

    var UpdateProductSubscriptionCallback = function(result) {
        var res = result.value;
        if (res.Status == 1) {
            jq('#content_product_subscribeBox_' + res.Data.Id).replaceWith(jq('#contentSubscriptionsTemplate').tmpl({ Items: [res.Data] }));
            var subscribeBox = jq('#content_product_subscribeBox_' + res.Data.Id);
            subscribeBox.addClass("active");
            if (subscribeBox.find(".subs-subtab").length) {
                subscribeBox.find("#" + CommonSubscriptionManager.currentModuleSubsTab).addClass("active");
                subscribeBox.find("#" + CommonSubscriptionManager.currentModuleSubsSubtabContents).addClass("active");
            }
            CommonSubscriptionManager.InitNotifyByComboboxes();
            CommonSubscriptionManager.InitListTabsComboboxes();
        } else {
            jq('#content_product_subscribeBox_' + res.ItemId).html('<div class="errorBox">' + res.Message + '</div>');
        }
    };

    this.RememberCurrentModuleSubtab = function(productID) {
        var subscribeBox = jq('#content_product_subscribeBox_' + productID);
        if (subscribeBox.find(".subs-subtab").length) {
            CommonSubscriptionManager.currentModuleSubsTab = subscribeBox.find(".subs-subtab .active").attr("id");
            CommonSubscriptionManager.currentModuleSubsSubtabContents = subscribeBox.find(".subs-subtab-contents .active").attr("id");
        }
    };

    this.UnsubscribeProduct = function(productID) {
        if (!confirm(this.ConfirmMessage))
            return;

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };

        AjaxPro.SubscriptionManager.UnsubscribeProduct(productID, UpdateProductSubscriptionCallback);
    };

    this.UnsubscribeType = function(productID, moduleID, subscribeType) {
        if (!confirm(this.ConfirmMessage))
            return;

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq('#content_product_subscribeBox_' + productID).block();
            } else {
                jq('#content_product_subscribeBox_' + productID).unblock();
            }
        };

        CommonSubscriptionManager.RememberCurrentModuleSubtab(productID);

        AjaxPro.SubscriptionManager.UnsubscribeType(productID, moduleID, subscribeType, UpdateProductSubscriptionCallback);
    };

    this.SubscribeType = function(productID, moduleID, subscribeType) {

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq('#content_product_subscribeBox_' + productID).block();
            } else {
                jq('#content_product_subscribeBox_' + productID).unblock();
            }
        };

        CommonSubscriptionManager.RememberCurrentModuleSubtab(productID);

        AjaxPro.SubscriptionManager.SubscribeType(productID, moduleID, subscribeType, UpdateProductSubscriptionCallback);
    };

    this.UnsubscribeObject = function(productID, moduleID, subscribeType, obj) {
        var item = jq(obj).attr("data-value");
        AjaxPro.SubscriptionManager.UnsubscribeObject(productID, moduleID, subscribeType, item, function(result) {
            var res = result.value;
            var productID = res.rs2;
            var moduleID = res.rs3;
            var typeID = res.rs4;
            var item = res.rs5;
            if (res.rs1 == '1') {

                jq('#studio_subscribeItem_' + productID + '_' + moduleID + '_' + typeID + '_' + item).remove();

                if (jq('div[id^="studio_subscribeItem_' + productID + '_' + moduleID + '_' + typeID + '_"]').length == 0) {
                    jq('#studio_subscribeType_' + productID + '_' + moduleID + '_' + typeID).remove();
                }
            } else {
                jq('#studio_subscribeType_' + productID + '_' + moduleID + '_' + typeID).html(res.rs6);
            }

        });
    }

    this.ClickProductTag = function(productID) {

        var id = "product_subscribeBox_" + productID;
        var module;

        if (id != jq(".subs-tabs .subs-module.active").attr("id")) {
            jq(".subs-tabs .subs-module").removeClass("active");
            jq("#" + id).addClass("active");
            jq(".subs-contents div").removeClass("active");
            jq("#content_" + id).addClass("active");

            var left = jq("#" + id).position().left + (jq("#" + id).width() - jq("#productSelector").width()) / 2;
            jq("#productSelector").css("left", left);

            if (jq("#content_" + id + " .subs-subtab select").length != 0) {
                var option = jq("#content_" + id + " .subs-subtab option");
                var num = jq("#content_" + id + " .selected-item").attr("data-value");
                module = jq(option[num]).attr("data-id");

                jq("#content_" + id + " .subs-subtab select").change(function() {
                    var elem = jq("#content_" + id + " .subs-subtab option")[jq(this).val()];
                    var selected = jq(elem).attr("data-id");
                    CommonSubscriptionManager.ClickModuleTag(productID, selected);
                });
            }
            else {
                module = jq("#content_" + id + " .subs-subtab span").first().attr("data-id");
            }
            CommonSubscriptionManager.ClickModuleTag(productID, module);
        }
    }
    this.ClickModuleTag = function(productID, moduleID) {
        var id = "module_subscribeBox_" + productID + "_" + moduleID;

        if (id != jq(".subs-subtab .module.active").attr("id")) {
            jq(".subs-subtab .module").removeClass("active");
            jq("#" + id).addClass("active");
            jq(".subs-subtab-contents div").removeClass("active");
            jq("#content_" + id).addClass("active");
        }
        var sections = jq("#content_" + id).children(".subs-sections");
        jq(sections).each(function() {
            var typeID = jq(this).attr("data-type");
            var subscriptionElementID = 'studio_subscriptions_' + productID + '_' + moduleID + '_' + typeID;
            var subscriptionElement = jq('#' + subscriptionElementID);

            if (subscriptionElement == null || subscriptionElement.attr('id') == null) {

                AjaxPro.SubscriptionManager.RenderGroupItemSubscriptions(productID, moduleID, typeID, function(res) {
                    var el = jq('#studio_types_' + productID + '_' + moduleID + '_' + typeID);
                    var resultHTML = '';
                    if (res.value.Status = 1) {

                        resultHTML = jq('<div></div>').html(jq("#subscribtionObjectsTemplate").tmpl(res.value)).html();
                    }

                    if (resultHTML == null || '' == resultHTML) {
                        resultHTML = "<div id='" + subscriptionElementID + "' style='height: 0px;'>&nbsp</div>";
                    }
                    el.html(resultHTML);
                });
            };
        });
    }

    this.InitNotifyByComboboxes = function() {
        jq('select[id^="NotifyByCombobox_"]').each(
            function() {
                jq(this).tlcombobox();
            }
		);
    };

    this.InitListTabsComboboxes = function() {
        jq('select[id^="ListTabsCombobox_"]').each(
            function() {
                jq(this).tlcombobox();
            }
		);
    };

    this.SetNotifyByMethod = function(productID, notifyBy) {

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };
        AjaxPro.SubscriptionManager.SetNotifyByMethod(productID, notifyBy, function(result) { });
    };

    this.SetWhatsNewNotifyByMethod = function(notifyBy) {

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };
        AjaxPro.SubscriptionManager.SetWhatsNewNotifyByMethod(notifyBy, function(result) { });
    };
    this.SetAdminNotifyNotifyByMethod = function(notifyBy) {

        AjaxPro.onLoading = function(b) {
            if (b) {
                jq.blockUI();
            } else {
                jq.unblockUI();
            }
        };
        AjaxPro.SubscriptionManager.SetAdminNotifyNotifyByMethod(notifyBy, function(result) { });
    };


};