// ==UserScript==
// @name           Update Banner Labels with Version Number
// @homepage       https://github.com/aminomancer
// @description    This script simply changes the update banners in the hamburger button app menu to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download update" for example.
// @author         aminomancer
// ==/UserScript==

(function () {
    class UpdateBannerLabelProvider {
        constructor() {
            PanelUI.panel.addEventListener("popupshowing", this);
            this.setAttributes(this.banner, this.attributes);
        }

        handleEvent(_e) {
            this.setAttributes(this.banner, this.attributes);
        }

        setAttributes(el, attrs) {
            for (var key in attrs) {
                el.setAttribute(key, attrs[key]);
            }
        }

        get banner() {
            return PanelUI._panelBannerItem;
        }

        get appName() {
            if (!this._appName) {
                this._appName = gBrandBundle.GetStringFromName("brandShorterName");
                let words = this._appName.split(" ");
                if (words.length > 1) this._appName = "Firefox";
            }
            return this._appName;
        }

        get attributes() {
            return {
                "label-update-available": `Download ${this.appName} update`,
                "label-update-manual": `Download ${this.appName} update`,
                "label-update-downloading": `Downloading ${this.appName} update`,
                "label-update-restart": `Restart to update ${this.appName}`,
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
