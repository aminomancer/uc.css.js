// ==UserScript==
// @name           App Menu Mods
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the app menu. (the popup opened by clicking the hamburger button on the far right of the navbar) Currently, it changes the "Add-ons and Themes" button to say "Extensions" (or whatever the equivalent is in your language, since the strings are localized automatically) and it adds a separator under the "Manage Account" button in the profile/account panel. I'll continue adding more mods to this script as I think of them.
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
            this.addonStrings = await new Localization(["toolkit/about/aboutAddons.ftl"], true);
        }
        get fxaPanelView() {
            return PanelMultiView.getViewNode(document, "PanelUI-fxa");
        }
        async handleEvent(_e) {
            await this.generateStrings();
            await AppMenuMods.sleep(1);
            document.getElementById(
                gProton ? "appMenu-extensions-themes-button" : "appMenu-addons-button"
            ).label = await this.addonStrings.formatValue(["addon-category-extension"]);
        }
        addSeparatorToAccountPanel() {
            this.manageAccountSeparator =
                this.fxaPanelView.ownerDocument.createXULElement("toolbarseparator");
            this.fxaPanelView
                .querySelector("#fxa-manage-account-button")
                .after(this.manageAccountSeparator);
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
