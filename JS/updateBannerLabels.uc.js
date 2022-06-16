// ==UserScript==
// @name           Concise Update Banner Labels
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    This script simply changes the update banners in the hamburger
// button app menu to make the strings a bit more concise. Instead of "Update available
// — download now" it will show "Download Nightly update" for example.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  // wait for {param} milliseconds in async function
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  class UpdateBannerLabelProvider {
    constructor() {}

    get appName() {
      if (!this._appName) {
        this._appName = gBrandBundle.GetStringFromName("brandShorterName");
        let words = this._appName.split(" ");
        if (words.length > 1) this._appName = "Firefox";
      }
      return this._appName;
    }

    get attributes() {
      return (
        this._attributes ||
        (this._attributes = {
          "update-available": `Download ${this.appName} update`,
          "update-manual": `Download ${this.appName} update`,
          "update-downloading": `Downloading ${this.appName} update`,
          "update-restart": `Restart to update ${this.appName}`,
          "update-unsupported": `Unable to update: system incompatible`,
        })
      );
    }
  }

  async function init() {
    window.gUpdateBanners = new UpdateBannerLabelProvider();
    PanelUI._initialized || PanelUI.init(shouldSuppressPopupNotifications);
    PanelUI._showBannerItem = function _showBannerItem(notification) {
      if (!this._panelBannerItem) {
        this._panelBannerItem = this.mainView.querySelector(".panel-banner-item");
      }

      let label = gUpdateBanners.attributes[notification.id];
      if (!label) return; // Ignore items we don't know about.

      this._panelBannerItem.setAttribute("notificationid", notification.id);
      this._panelBannerItem.setAttribute("label", label);
      this._panelBannerItem.hidden = false;
      this._panelBannerItem.notification = notification;
    };
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
