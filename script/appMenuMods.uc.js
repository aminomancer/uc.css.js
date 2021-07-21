// ==UserScript==
// @name           App Menu Mods
// @version        1.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the app menu. (the popup opened by clicking the hamburger button on the far right of the navbar) It adds a restart button to the app menu (only if you're using fx-autoconfig), changes the "Add-ons and Themes" button to say "Extensions" (or whatever the equivalent is in your language, since the strings are localized automatically) and it adds a separator under the "Manage Account" button in the profile/account panel. I'll continue adding more mods to this script as I think of them.
// ==/UserScript==

(function () {
    class AppMenuMods {
        constructor() {
            PanelUI._initialized || PanelUI.init(shouldSuppressPopupNotifications);
            PanelUI.mainView.addEventListener("ViewShowing", this, { once: true });
            this.addSeparatorToAccountPanel();
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
                oncommand: `_ucUtils.restart(event.shiftKey || (AppConstants.platform == "macosx" ? event.metaKey : event.ctrlKey))`,
                onclick: `if (event.button == 0) return; _ucUtils.restart(true); event.preventDefault();`,
            });
            let exitButton = document.getElementById("appMenu-quit-button2");
            if (exitButton) exitButton.before(restartButton);
            else PanelUI.mainView.querySelector(".panel-subview-body").appendChild(restartButton);
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
