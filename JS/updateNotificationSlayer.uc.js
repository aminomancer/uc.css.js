// ==UserScript==
// @name           Update Notification Slayer
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Prevent "update available" notification popups, instead just
// create a badge (like the one that ordinarily appears once you dismiss the
// notification). This simple script is maybe a little overbearing, but
// worthwhile for me. By default, Firefox downloads and installs updates for
// you, and then prompts you to restart. If you turn this behavior off, it will
// instead give you updates to let you know that an update is available, and
// then prompt you to download and install it, and then prompt you to restart.
// If you use Nightly this can be pretty annoying. You don't necessarily want to
// restart twice a day and reload all your tabs, but you'll get constant popups
// telling you to download an update. At least that's why I wanted to change
// this. I don't know if this bug still exists, but a while back if you
// downloaded or installed an update, but didn't restart yet, the browser
// toolbox would refuse to open. For that reason I disabled auto download too. I
// still want to know when an update is available, I just don't always want to
// download it immediately, nor do I want an annoying popup twice a day that I
// need to manually close. imo Firefox should have a pref to set the
// "update-available" notification to badge-only, rather than always opening a
// doorhanger popup. Anyway, you can hide these popups with CSS, but then you
// can't see or interact with them, meaning you can't actually dismiss them. And
// the badge that appears on the AppMenu hamburger button won't appear until the
// doorhanger is dismissed. So if you hide the popups with CSS, you lose the
// badges too, and then you will never know when an update is available unless
// you click the AppMenu button to open the main menu panel. This only works
// because the invisible popup is automatically closed (dismissed) when the main
// menu panel opens. But it won't ever disappear on its own otherwise. So
// setting "display:none" on the popup isn't a good solution. My previous
// solution was to listen for the popup being created and then rapidly dismiss
// it. But this is a little sloppy. Instead I just decided to modify the
// internal function that opens the notification popup in the first place. I
// wanted to be cautious about this since you need to figure out what might
// depend on the integrity of that function. But I checked the source code for
// anything that might care and decided that it's safe. When an update
// notification is sent, the method PanelUI._updateNotifications is called. My
// script changes this function so that when it's called, if the notification to
// be displayed is an "update-available" notification, then it will show the
// badge instead of the popup. I wanted to be careful about this since unlike my
// other scripts, this isn't just adding functionality to another layer on top
// of the browser, this is directly overwriting the code of a function in the
// global execution context. (in memory, not the file in the source code) But
// after reviewing the source code and testing, it works fine and I haven't
// noticed any problems. It simply adds a single condition to a check that
// already existed. By default, this method already shows the badge instead of
// the popup if we're in fullscreen mode or if the window is not focused. We're
// just adding to that expression to also return true if the topmost
// notification is "update-available" so it makes sense that nothing crazy
// happened. This is better than the previous method because the popup never
// opens to begin with. There isn't some tiny period of time where the popup is
// rendered for 2 or 3 frames and then closed. Instead it just doesn't open in
// the first place, because it's been displayed as a badge instead of a
// doorhanger. So I still know when an update is available, due to the badge,
// but I don't have to close a popup interface.
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

      let doorhangers = notifications.filter(n => !n.dismissed && !n.options.badgeOnly);

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
            AppMenuNotifications.dismissNotification(doorhangers[0].id);
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

    AppMenuNotifications.showNotification = function showNotification(
      id,
      mainAction,
      secondaryAction,
      options = {}
    ) {
      let newOptions = options;
      if (id.startsWith("update")) {
        newOptions.dismissed = true;
      }
      let notification = new AppMenuNotification(id, mainAction, secondaryAction, newOptions);
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
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();
