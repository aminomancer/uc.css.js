// ==UserScript==
// @name           Update Banner Labels with Version Number
// @homepage       https://github.com/aminomancer
// @description    This script simply changes the update banners in the hamburger button app menu to show the version number (for the available update, not for the currently installed version), and to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download update: Nightly 90.0a1" for example.
// @author         aminomancer
// ==/UserScript==

(function () {
    class UpdateBannerLabelProvider {
        constructor() {
            XPCOMUtils.defineLazyModuleGetters(this, {
                AppUpdater: "resource:///modules/AppUpdater.jsm",
            });
            this.updater = new this.AppUpdater();
            Services.obs.addObserver(this, "appMenu-notifications");
            Services.obs.addObserver(this, "show-update-progress");
            addEventListener("uninit", this);
        }

        async observe(_sub, top, _data) {
            switch (top) {
                case "appMenu-notifications":
                case "show-update-progress":
                    await this.updater.checkForUpdates();
                    this.buildName = this.updater.update.name;
                    this.buildVersion = this.updater.update.displayVersion;
                    this.setAttributes(this.banner, this.attributes);
                    break;
            }
        }

        handleEvent(e) {
            switch (e.type) {
                case "uninit":
                    Services.obs.removeObserver(this, "appMenu-notifications");
                    Services.obs.removeObserver(this, "show-update-progress");
                    break;
            }
        }

        setAttributes(el, attrs) {
            for (var key in attrs) {
                el.setAttribute(key, attrs[key]);
            }
        }

        get banner() {
            return PanelUI._panelBannerItem;
        }

        get attributes() {
            return {
                "label-update-available": `Download update: ${this.buildName}`,
                "label-update-manual": `Download update: ${this.buildName}`,
                "label-update-downloading": `Downloading update: ${this.buildName}`,
                "label-update-restart": `Restart to install update: ${this.buildVersion}`,
                "label-update-unsupported": `Unable to update: system incompatible`,
            };
        }
    }

    function init() {
        window.gUpdateBanners = new UpdateBannerLabelProvider();
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
