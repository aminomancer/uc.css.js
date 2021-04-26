// ==UserScript==
// @name           Update Banner Labels with Version Number
// @homepage       https://github.com/aminomancer
// @description    This script simply changes the update banners in the hamburger button app menu to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download update" for example.
// @author         aminomancer
// ==/UserScript==

(function () {
    class UpdateBannerLabelProvider {
        constructor() {
            Services.obs.addObserver(this, "appMenu-notifications");
            Services.obs.addObserver(this, "show-update-progress");
            addEventListener("uninit", this);
        }

        async observe(_sub, top, _data) {
            switch (top) {
                case "appMenu-notifications":
                case "show-update-progress":
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
                "label-update-available": `Download update`,
                "label-update-manual": `Download update`,
                "label-update-downloading": `Downloading update`,
                "label-update-restart": `Restart to install update`,
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
