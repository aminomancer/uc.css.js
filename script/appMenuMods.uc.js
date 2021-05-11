(function () {
    class AppMenuMods {
        constructor() {
            this.addonStrings = new Localization(["toolkit/about/aboutAddons.ftl"], true);
            PanelUI.init();
            PanelUI.mainView.addEventListener("ViewShowing", this, { once: true });
        }
        static sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
        async handleEvent(_e) {
            await AppMenuMods.sleep(1);
            document.getElementById(
                gProton ? "appMenu-extensions-themes-button" : "appMenu-addons-button"
            ).label = await this.addonStrings.formatValue(["addon-category-extension"]);
        }
    }

    if (gBrowserInit.delayedStartupFinished) {
        new AppMenuMods();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new AppMenuMods();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
