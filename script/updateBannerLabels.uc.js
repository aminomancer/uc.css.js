// ==UserScript==
// @name           Update Banner Labels with Version Number
// @homepage       https://github.com/aminomancer
// @description    This script simply changes the update banners in the hamburger button app menu to show the version number (for the available update, not for the currently installed version), and to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download update: Nightly 90.0a1" for example.
// @author         aminomancer
// ==/UserScript==

(function () {
    // wait for {param} milliseconds in async function
    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // a class that manages the update banner
    class UpdateBannerLabelProvider {
        constructor() {
            // hook up interfaces and services
            XPCOMUtils.defineLazyModuleGetters(this, {
                AppUpdater: "resource:///modules/AppUpdater.jsm",
            });
            this.updater = new this.AppUpdater();
            // calls the label-setting function when an update check has resolved
            this._appUpdateListener = (status, ...args) => {
                this.onUpdateStatus(status, ...args);
            };
            // attach observers of update-related notifications
            this.manageListeners();
        }

        // DOM node for appmenu panel's update banner
        get banner() {
            return PanelUI._panelBannerItem;
        }

        // object, contains details of the active notification
        get notification() {
            return this.banner?.notification;
        }

        // return an object with the correct label prefix and update version
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

        // on receiving update notifications, retrieve the staged update's version name and number
        async observe(_sub, _top, _data) {
            this.updater.checkForUpdates();
        }

        // event listener (currently just for window closing)
        handleEvent(e) {
            if (e.target === window) this.manageListeners("remove");
        }

        // method to call when an update check finishes (sets the label)
        onUpdateStatus(status, ...args) {
            this.handleLabel();
        }

        // create text nodes if necessary, memoize the update build, set the label text
        handleLabel() {
            if (!this.notification?.id.startsWith("update")) return;
            if (!this.labelContainer) this.createTextNodes();
            if (this.updater.update) {
                this.buildName = this.updater.update.name;
                this.buildVersion = this.updater.update.displayVersion;
                this.setText();
            }
        }

        // replace the single label node with an hbox with 2 nodes so we can make only half the label bold.
        createTextNodes() {
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

        // set the label's text values according to the staged update's parameters
        setText() {
            let attr = this.attributes;
            if (!attr) return;
            this.updateLabel.textContent = attr.label;
            this.versionLabel.textContent = attr.version;
        }

        // attach or detach observers (update check listener; notification request listeners; window close listener)
        manageListeners(mode = "add") {
            this.updater[`${mode}Listener`](this._appUpdateListener);
            Services.obs[`${mode}Observer`](this, "appMenu-notifications");
            Services.obs[`${mode}Observer`](this, "show-update-progress");
            window[`${mode}EventListener`]("uninit", this);
        }
    }

    // startup
    async function init() {
        window.gUpdateBanners = new UpdateBannerLabelProvider(); // globalize the provider (for debugging and connection to other scripts if necessary)
        await sleep(1000); // wait a second just in case of unrelated errors on startup (probably not necessary if you don't use nightly, but shouldn't matter as firefox doesn't check for updates immediately after startup unless you open the about dialog)
        // override the built-in method that sets the banner label
        PanelUI._showBannerItem = function _showBannerItem(notification) {
            if (!this._panelBannerItem) {
                this._panelBannerItem = this.mainView.querySelector(".panel-banner-item");
            }
            let knownNotification = this._panelBannerItem.getAttribute("label-" + notification.id);
            // Ignore items we don't know about.
            if (!knownNotification) return;

            this._panelBannerItem.setAttribute("notificationid", notification.id);
            this._panelBannerItem.notification = notification;
            this._panelBannerItem.hidden = false;
            this._panelBannerItem.setAttribute("label", label); // temporary label
            gUpdateBanners.handleLabel();
        };
    }

    // wait until PanelUI is initialized since we have to override it
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
