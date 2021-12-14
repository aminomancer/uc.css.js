// ==UserScript==
// @name           App Menu Mods
// @version        1.3.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the app menu. (the popup opened by clicking the hamburger button on the far right of the navbar) It adds a restart button to the app menu (only if you're using fx-autoconfig), changes the "Add-ons and Themes" button to say "Extensions" (or whatever the equivalent is in your language, since the strings are localized automatically) and it adds a separator under the "Manage Account" button in the profile/account panel. I'll continue adding more mods to this script as I think of them.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    class AppMenuMods {
        constructor() {
            PanelUI._initialized || PanelUI.init(shouldSuppressPopupNotifications);
            PanelUI.mainView.addEventListener("ViewShowing", this, { once: true });
            this.addSeparatorToAccountPanel();
            this.fixSyncSubviewButtonAlignment();
        }
        static sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
        async generateStrings() {
            if (!this.strings)
                this.strings = await new Localization(
                    ["toolkit/about/aboutAddons.ftl", "toolkit/about/aboutSupport.ftl"],
                    true
                );
            return this.strings;
        }
        get fxaPanelView() {
            return PanelMultiView.getViewNode(document, "PanelUI-fxa");
        }
        async handleEvent(_e) {
            let strings = await this.generateStrings();
            await AppMenuMods.sleep(1);
            document.getElementById("appMenu-extensions-themes-button").label =
                await strings.formatValue(["addon-category-extension"]);
            this.addRestartButton(strings);
        }
        addSeparatorToAccountPanel() {
            this.manageAccountSeparator =
                this.fxaPanelView.ownerDocument.createXULElement("toolbarseparator");
            this.fxaPanelView
                .querySelector("#fxa-manage-account-button")
                .after(this.manageAccountSeparator);
        }
        async addRestartButton(strings) {
            if (!_ucUtils) return;
            let restartButton = _ucUtils.createElement(document, "toolbarbutton", {
                id: "appMenu-restart-button2",
                class: "subviewbutton",
                label: await strings.formatValue(["restart-button-label"]),
                oncommand: `if (event.shiftKey || (AppConstants.platform == "macosx" ? event.metaKey : event.ctrlKey)) Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`,
                onclick: `if (event.button === 0) return; Services.appinfo.invalidateCachesOnRestart(); setTimeout(() => Services.startup.quit(Ci.nsIAppStartup.eRestart | Ci.nsIAppStartup.eAttemptQuit), 300); this.closest("panel").hidePopup(true); event.preventDefault();`,
            });
            let exitButton = document.getElementById("appMenu-quit-button2");
            if (exitButton) exitButton.before(restartButton);
            else PanelUI.mainView.querySelector(".panel-subview-body").appendChild(restartButton);
        }
        fixSyncSubviewButtonAlignment() {
            eval(
                `gSync.populateSendTabToDevicesView = function ` +
                    gSync.populateSendTabToDevicesView
                        .toSource()
                        .replace(/^populateSendTabToDevicesView/, ``)
                        .replace(/item.setAttribute\(\"align\", \"start\"\);/, ``)
            );
        }
    }

    if (gBrowserInit.delayedStartupFinished) new AppMenuMods();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new AppMenuMods();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
