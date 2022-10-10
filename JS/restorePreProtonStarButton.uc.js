// ==UserScript==
// @name           Restore pre-Proton Star Button
// @version        1.3.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    The bookmark page action button used to have a pretty cool
// starburst animation. That's been removed but it's not too difficult to
// restore. This version of the script requires fx-autoconfig,
// userChrome.au.css, and the resources folder from my repo. If you don't want
// to use all that stuff, grab the standalone version instead. FYI not to state
// the obvious but this script will have no effect if your browser/OS has
// prefers-reduced-motion enabled.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  // delete these two lines if you don't want the confirmation hint to show when you bookmark a page.
  Services.prefs.setIntPref("browser.bookmarks.editDialog.confirmationHintShowCount", 0);
  Services.prefs.lockPref("browser.bookmarks.editDialog.confirmationHintShowCount");

  function init() {
    const starAnimBox = document.createXULElement("hbox");
    const starAnimImg = document.createXULElement("image");
    starAnimBox.id = "star-button-animatable-box";
    starAnimImg.id = "star-button-animatable-image";
    starAnimImg.setAttribute("role", "presentation");
    starAnimBox.appendChild(starAnimImg);
    BookmarkingUI.star.after(starAnimBox);
    BookmarkingUI.starAnimBox = starAnimBox;
    BookmarkingUI.starAnimImg = starAnimImg;

    BookmarkingUI.onStarCommand = function onStarCommand(aEvent) {
      // Ignore non-left clicks on the star, or if we are updating its state.
      if (!this._pendingUpdate && (aEvent.type != "click" || aEvent.button == 0)) {
        if (!(this._itemGuids.size > 0)) {
          BrowserUIUtils.setToolbarButtonHeightProperty(this.star);
          document.getElementById("star-button-animatable-box").addEventListener(
            "animationend",
            _e => {
              this.star.removeAttribute("animate");
            },
            { once: true }
          );
          this.star.setAttribute("animate", "true");
        }
        PlacesCommandHook.bookmarkPage();
      }
    };

    BookmarkingUI.handleEvent = function BUI_handleEvent(aEvent) {
      switch (aEvent.type) {
        case "mouseover":
          this.star.setAttribute("preloadanimations", "true");
          break;
        case "ViewShowing":
          this.onPanelMenuViewShowing(aEvent);
          break;
        case "ViewHiding":
          this.onPanelMenuViewHiding(aEvent);
          break;
      }
    };

    BookmarkingUI.uninit = function BUI_uninit() {
      this.updateBookmarkPageMenuItem(true);
      CustomizableUI.removeListener(this);
      this.star.removeEventListener("mouseover", this);
      this._uninitView();
      if (this._hasBookmarksObserver) {
        PlacesUtils.observers.removeListener(
          ["bookmark-added", "bookmark-removed", "bookmark-moved", "bookmark-url-changed"],
          this.handlePlacesEvents
        );
      }
      if (this._pendingUpdate) delete this._pendingUpdate;
    };

    BookmarkingUI._updateStar = function BUI__updateStar() {
      let starred = this._itemGuids.size > 0;
      if (!starred) this.star.removeAttribute("animate");
      for (let element of [
        this.star,
        document.getElementById("context-bookmarkpage"),
        PanelMultiView.getViewNode(document, "panelMenuBookmarkThisPage"),
        document.getElementById("pageAction-panel-bookmark"),
      ]) {
        if (!element) continue;
        if (starred) element.setAttribute("starred", "true");
        else element.removeAttribute("starred");
      }
      if (!this.starBox) {
        this.updateBookmarkPageMenuItem(true);
        return;
      }
      let shortcut = document.getElementById(this.BOOKMARK_BUTTON_SHORTCUT);
      let l10nArgs = {
        shortcut: ShortcutUtils.prettifyShortcut(shortcut),
      };
      document.l10n.setAttributes(
        this.starBox,
        starred ? "urlbar-star-edit-bookmark" : "urlbar-star-add-bookmark",
        l10nArgs
      );
      this.updateBookmarkPageMenuItem();
      Services.obs.notifyObservers(
        null,
        "bookmark-icon-updated",
        starred ? "starred" : "unstarred"
      );
    };

    BookmarkingUI.starBox.addEventListener("mouseover", BookmarkingUI, {
      once: true,
    });
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
