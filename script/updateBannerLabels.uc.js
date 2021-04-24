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
            this.attach();
        }

        get banner() {
            return PanelUI._panelBannerItem;
        }

        get notification() {
            return this.banner?.notification;
        }

        get attributes() {
            if (this.notification)
                switch (this.notification.id) {
                    case "update-available":
                    case "update-manual":
                        return {
                            label: "Download update: ",
                            version: this.buildName,
                        };
                    case "update-downloading":
                        return {
                            label: "Downloading update: ",
                            version: this.buildName,
                        };
                    case "update-restart":
                        return {
                            label: "Restart to install update: ",
                            version: this.buildVersion,
                        };
                    case "update-unsupported":
                        return {
                            label: "Unable to update: ",
                            version: "system incompatible",
                        };
                }
            return false;
        }

        async observe(_sub, _top, _data) {
            await this.updater.checkForUpdates();
            this.handleLabel();
            break;
        }

        handleEvent(e) {
            switch (e.type) {
                case "uninit":
                    this.detach(e);
                    break;
                case "ViewShowing":
                    this.handleLabel();
                    break;
            }
        }

        handleLabel() {
            if (!this.notification?.id.startsWith("update")) return;
            if (!this.labelContainer) this.createTextNode();
            if (this.updater.update) {
                this.buildName = this.updater.update.name;
                this.buildVersion = this.updater.update.displayVersion;
                this.setText();
            }
        }

        createTextNode() {
            this.labelContainer = document.createXULElement("hbox");
            this.banner._textNode.after(this.labelContainer);
            this.banner._textNode.remove();

            this.updateLabel = document.createElement("strong");
            this.versionLabel = document.createElement("span");
            this.labelContainer.appendChild(this.updateLabel);
            this.updateLabel.after(this.versionLabel);

            this.labelContainer.className = "toolbarbutton-text";
            this.labelContainer.setAttribute("crop", "right");
            this.labelContainer.setAttribute("flex", 1);
            this.updateLabel.id = "appMenu-proton-update-banner-label";
            this.versionLabel.id = "appMenu-proton-update-banner-version";
            this.banner.style.fontWeight = "normal";
            this.updateLabel.style.fontWeight = 600;
        }

        setText() {
            let attr = this.attributes;
            if (!attr) return;
            this.updateLabel.textContent = attr.label;
            this.versionLabel.textContent = attr.version;
        }

        attach() {
            Services.obs.addObserver(this, "appMenu-notifications");
            Services.obs.addObserver(this, "show-update-progress");
            PanelMultiView.getViewNode(document, "appMenu-protonMainView").addEventListener(
                "ViewShowing",
                this
            );
            addEventListener("uninit", this);
        }

        detach(e) {
            if (e.target === window) {
                Services.obs.removeObserver(this, "appMenu-notifications");
                Services.obs.removeObserver(this, "show-update-progress");
            }
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
