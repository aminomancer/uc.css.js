// ==UserScript==
// @name           Update Notification Slayer
// @version        1.2.2
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification).
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/updateNotificationSlayer.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/updateNotificationSlayer.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(async function () {
  class AppMenuNotification {
    constructor(id, mainAction, secondaryAction, options = {}) {
      this.id = id;
      this.mainAction = mainAction;
      this.secondaryAction = secondaryAction;
      this.options = options;
      this.dismissed = this.options.dismissed || false;
    }
  }

  async function init() {
    const lazy = {};
    ChromeUtils.defineModuleGetter(
      lazy,
      "AppMenuNotifications",
      "resource://gre/modules/AppMenuNotifications.jsm"
    );
    PanelUI.updateNotifications = function (notificationsChanged) {
      let notifications = this._notifications;
      if (!notifications || !notifications.length) {
        if (notificationsChanged) {
          this._clearAllNotifications();
          this._hidePopup();
        }
        return;
      }

      if (
        (window.fullScreen && FullScreen.navToolboxHidden) ||
        document.fullscreenElement ||
        this._shouldSuppress()
      ) {
        this._hidePopup();
        return;
      }

      let doorhangers = notifications.filter(
        n => !n.dismissed && !n.options.badgeOnly
      );

      if (this.panel.state == "showing" || this.panel.state == "open") {
        // If the menu is already showing, then we need to dismiss all notifications
        // since we don't want their doorhangers competing for attention
        doorhangers.forEach(n => {
          n.dismissed = true;
          if (n.options.onDismissed) {
            n.options.onDismissed(window);
          }
        });
        this._hidePopup();
        if (!notifications[0].options.badgeOnly) {
          this._showBannerItem(notifications[0]);
        }
      } else if (doorhangers.length) {
        // Only show the doorhanger if the window is focused and not fullscreen
        if (
          (window.fullScreen && this.autoHideToolbarInFullScreen) ||
          Services.focus.activeWindow !== window ||
          doorhangers[0].id.startsWith("update")
        ) {
          this._hidePopup();
          this._showBadge(doorhangers[0]);
          this._showBannerItem(doorhangers[0]);
          if (doorhangers[0].id.startsWith("update")) {
            lazy.AppMenuNotifications.dismissNotification(doorhangers[0].id);
            doorhangers[0].dismissed = true;
          }
        } else {
          this._clearBadge();
          this._showNotificationPanel(doorhangers[0]);
        }
      } else {
        this._hidePopup();
        this._showBadge(notifications[0]);
        this._showBannerItem(notifications[0]);
      }
    };

    lazy.AppMenuNotifications.showNotification = function showNotification(
      id,
      mainAction,
      secondaryAction,
      options = {}
    ) {
      let newOptions = options;
      if (id.startsWith("update")) {
        newOptions.dismissed = true;
      }
      let notification = new AppMenuNotification(
        id,
        mainAction,
        secondaryAction,
        newOptions
      );
      let existingIndex = this._notifications.findIndex(n => n.id == id);
      if (existingIndex != -1) {
        this._notifications.splice(existingIndex, 1);
      }

      // We don't want to clobber doorhanger notifications just to show a badge,
      // so don't dismiss any of them and the badge will show once the
      // doorhanger gets resolved.
      if (!newOptions.badgeOnly && !newOptions.dismissed) {
        this._notifications.forEach(n => {
          n.dismissed = true;
        });
      }

      // Since notifications are generally somewhat pressing, the ideal case is
      // that we never have two notifications at once. However, in the event
      // that we do, it's more likely that the older notification has been
      // sitting around for a bit, and so we don't want to hide the new
      // notification behind it. Thus, we want our notifications to behave like
      // a stack instead of a queue.
      this._notifications.unshift(notification);

      this._lazyInit();
      this._updateNotifications();
      return notification;
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
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
