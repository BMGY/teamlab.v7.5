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

var TariffSettings = new function () {
    var isInit = false;
    var selectBuyLink = "";
    var selectActiveUsers = "0-0";
    var selectStorage = "0 byte";

    var init = function () {
        if (isInit === false) {
            isInit = true;
        }

        jq.switcherAction("#switcherPayments", "#paymentsContainer");

        jq(".tariffs-selected input:radio").prop("checked", true);
        TariffSettings.selectTariff();
    };

    var clickOnBuy = function (object) {
        if (!jq("#buyRecommendationDialog").length) {
            return true;
        }
        if (typeof object == "undefined") {
            return true;
        }

        StudioBlockUIManager.blockUI("#buyRecommendationDialog", 550, 300, 0);
        PopupKeyUpActionProvider.EnterAction = "TariffSettings.redirectToBuy();";
        PopupKeyUpActionProvider.CloseDialogAction = "TariffSettings.dialogRecommendationClose();";

        return false;
    };

    var selectTariff = function (tariffLabel) {
        if (!tariffLabel) {
            tariffLabel = jq(".tariffs-selected");
        }

        jq(".tariffs-selected").removeClass("tariffs-selected");
        tariffLabel.addClass("tariffs-selected");

        var tariffHidden = tariffLabel.find(".tariff-hidden-link");
        var tariffLink = tariffHidden.val();

        jq(".tariff-buy-action").hide();
        jq(".tariff-pay-key-prolongable").removeClass("disable");

        var button = jq();
        if (tariffHidden.hasClass("tariff-hidden-pay")) {
            button = jq(".tariff-buy-pay, .tariff-pay-pal");
            jq(".tariff-pay-key-prolongable").addClass("disable").removeAttr("href");
        } else if (tariffHidden.hasClass("tariff-hidden-limit")) {
            button = jq(".tariff-buy-limit");
            TariffSettings.selectBuyLink = "";
            TariffSettings.selectActiveUsers = tariffLabel.find(".tariff-hidden-users").val();
            TariffSettings.selectStorage = tariffLabel.find(".tariff-hidden-storage").val();
        } else {
            if (tariffHidden.length) {
                button = jq(".tariff-buy-change, .tariff-pay-pal");
            }
        }

        button.css({ "display": "inline-block" });
        if (!button.hasClass("disable"))
            button.attr("href", tariffLink);
        TariffSettings.selectBuyLink = tariffLink;
    };

    var showDowngradeDialog = function () {
        var quotaActiveUsers = TariffSettings.selectActiveUsers;
        var quotaStorageSize = TariffSettings.selectStorage;
        jq("#downgradeUsers").html(quotaActiveUsers);
        jq("#downgradeStorage").html(quotaStorageSize);

        StudioBlockUIManager.blockUI("#tafirrDowngradeDialog", 450, 300, 0);
    };

    var hideBuyRecommendation = function (obj) {
        var dontDisplay = jq(obj).is(":checked");
        TariffUsageController.SaveHideRecommendation(dontDisplay,
            function (result) {
                if (result.error != null) {
                    alert(result.error.Message);
                    return;
                }
            });
    };

    var dialogRecommendationClose = function () {
        if (jq("#buyRecommendationDisplay").is(":checked")) {
            jq("#buyRecommendationDialog").remove();
        }
    };

    var redirectToBuy = function () {
        location.href = TariffSettings.selectBuyLink;
        PopupKeyUpActionProvider.CloseDialog();
    };

    var getTrial = function () {
        TariffUsageController.GetTrial(
            function (result) {
                if (result.error != null) {
                    alert(result.error.Message);
                }
                location.reload();
            });
    };

    var selectedQuotaId = function () {
        return jq(".tariffs-selected").attr("data");
    };

    return {
        init: init,

        selectBuyLink: selectBuyLink,
        selectActiveUsers: selectActiveUsers,
        selectStorage: selectStorage,

        clickOnBuy: clickOnBuy,
        selectTariff: selectTariff,

        showDowngradeDialog: showDowngradeDialog,
        hideBuyRecommendation: hideBuyRecommendation,
        dialogRecommendationClose: dialogRecommendationClose,
        redirectToBuy: redirectToBuy,

        selectedQuotaId: selectedQuotaId,

        getTrial: getTrial
    };
};

jq(function () {

    TariffSettings.init();

    jq(".tariffs-panel").on("change", "input:radio", function () {
        TariffSettings.selectTariff(jq(this).closest(".tariff-price-block"));
    });

    jq(".tariffs-button-block").on("click", ".tariff-buy-pay:not(.disable), .tariff-buy-change", function () {
        return TariffSettings.clickOnBuy(this);
    });

    jq(".tariffs-button-block").on("click", ".tariff-buy-limit", function () {
        TariffSettings.showDowngradeDialog();
        return false;
    });

    jq("#buyRecommendationDisplay").click(function () {
        TariffSettings.hideBuyRecommendation(this);
        return true;
    });

    jq("#buyRecommendationOk").click(function () {
        TariffSettings.redirectToBuy();
        return false;
    });

    jq(".tariff-buy-try").click(function () {
        TariffSettings.getTrial();
        return false;
    });
});