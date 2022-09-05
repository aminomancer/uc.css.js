// ==UserScript==
// @name           Hide Tracking Protection Icon on Custom New Tab Page
// @version        1.3.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    By default, Firefox hides the tracking protection while 1)
// the current tab is open to the default new tab page; or 2) the user is typing
// into the url bar. Hiding the icon while the user is typing is unnecessary,
// since although "pageproxystate" has changed, the content principal is still
// the same and clicking the tracking protection icon to open the popup still
// works. Opening the popup while pageproxystate is invalid still loads the
// tracking details and options for the current content URI. But hiding the icon
// on the new tab page is necessary, because the tracking protection icon is
// hidden on about:blank. If you use an extension to set a custom new tab page,
// you will see the tracking protection icon briefly disappear when opening a
// new tab, before reappearing as the custom new tab page loads. That is because
// about:blank loads before the custom new tab page loads. So the icon is hidden
// and unhidden in the span of a hundred milliseconds or so. This looks very
// ugly, so my stylesheet has always prevented the tracking protection icon from
// being hidden on any page, including about:blank. That way at least it doesn't
// disappear. But this isn't a great solution, because there are a number of
// pages for which the tracking protection icon does nothing. The protection
// handler can't handle internal pages, for example. Previously I just disabled
// pointer events on the icon when it was supposed to be hidden. But I think
// this script is a better solution. If this script is not installed, my theme
// will default to those older methods I just mentioned. But if the script is
// installed, it will restore the built-in behavior of hiding the tracking
// protection icon on internal pages, only it will also hide the icon on the
// user's custom new tab page. The icon will still be visible if you're on a
// valid webpage, (anything but about, chrome, and resource URIs) even if you
// begin typing in the urlbar.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  class HideOnNTP {
    // duskFox has a preference,
    // userChrome.urlbar.hide-bookmarks-button-on-system-pages
    // which hides the urlbar's star button in certain conditions when the
    // tracking protection icon is hidden. that means on the new tab page or on
    // about:blank, there is no star button taking up space in the urlbar, since
    // these pages are unlikely to ever be bookmarked. however, ctrl + D can
    // still open the edit bookmark panel. when this happens, it can't be
    // anchored to the star button since the star button is hidden. so it is
    // anchored to the identity icon instead. this looks kinda silly though
    // because it's not meant to be anchored so far to the left of the star
    // button. so instead if this pref is enabled, we'll try to anchor it to the
    // bookmarks menu button or the library button, if they exist on the user's
    // toolbar.
    _getAnchor(panel) {
      if (this.hideBookmarks) {
        for (let id of ["star-button-box", "bookmarks-menu-button", "libary-button"]) {
          let node = document.getElementById(id);
          if (node && !node.hidden) {
            let bounds = window.windowUtils.getBoundsWithoutFlushing(node);
            if (bounds.height > 0 && bounds.width > 0) {
              // add an attribute to the panel if it's going to be anchored to a
              // toolbar button. duskFox CSS uses this to line it up better with
              // a toolbar button. normally a panel is positioned -7px
              // vertically from its anchor. but a panel anchored to a toolbar
              // button is anchored -12px from its anchor. the reasons for this
              // are just related to how the buttons are flexed in their container.
              node.classList.contains("toolbarbutton-1")
                ? panel.setAttribute("on-toolbar-button", true)
                : panel.removeAttribute("on-toolbar-button");
              return node;
            }
          }
        }
      }
      panel.removeAttribute("on-toolbar-button");
      return BookmarkingUI.anchor;
    }
    constructor() {
      const lazy = {};
      ChromeUtils.defineModuleGetter(
        lazy,
        "ContentBlockingAllowList",
        "resource://gre/modules/ContentBlockingAllowList.jsm"
      );
      XPCOMUtils.defineLazyPreferenceGetter(
        this,
        "hideBookmarks",
        "userChrome.urlbar.hide-bookmarks-button-on-system-pages",
        false
      );
      eval(
        `StarUI.showEditBookmarkPopup = async function ` +
          StarUI.showEditBookmarkPopup
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/async showEditBookmarkPopup/, "")
            .replace(/async function\s*/, "")
            .replace(
              /BookmarkingUI\.anchor/,
              `hideOnNTP?._getAnchor(this.panel) || BookmarkingUI.anchor`
            )
      );
      // the main part of this script. hide the tracking protection icon on new tab page.
      gProtectionsHandler.onLocationChange = function onLocationChange() {
        let currentURL = gBrowser.currentURI.spec;
        let isInitial = isInitialPage(gBrowser.currentURI);
        if (this._showToastAfterRefresh) {
          this._showToastAfterRefresh = false;
          if (
            this._previousURI == currentURL &&
            this._previousOuterWindowID == gBrowser.selectedBrowser.outerWindowID
          ) {
            this.showProtectionsPopup({ toast: true });
          }
        }
        this.hadShieldState = false;
        if (currentURL.startsWith("view-source:")) {
          this._trackingProtectionIconContainer.setAttribute("view-source", true);
        } else {
          this._trackingProtectionIconContainer.removeAttribute("view-source");
        }
        // make the identity box unfocusable on new tab page
        if (gIdentityHandler._identityIconBox) {
          gIdentityHandler._identityIconBox.disabled = isInitial;
        }
        // hide the TP icon on new tab page
        if (!lazy.ContentBlockingAllowList.canHandle(gBrowser.selectedBrowser) || isInitial) {
          this._trackingProtectionIconContainer.hidden = true;
          return;
        }
        this._trackingProtectionIconContainer.hidden = false;
        this.hasException = lazy.ContentBlockingAllowList.includes(gBrowser.selectedBrowser);
        if (this._protectionsPopup) {
          this._protectionsPopup.toggleAttribute("hasException", this.hasException);
        }
        this.iconBox.toggleAttribute("hasException", this.hasException);
        this.fingerprintersHistogramAdd("pageLoad");
        this.cryptominersHistogramAdd("pageLoad");
        this.shieldHistogramAdd(0);
      };
    }
  }
  function init() {
    window.hideOnNTP = new HideOnNTP();
  }
  document.documentElement.setAttribute("hide-tp-icon-on-ntp", true);
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
