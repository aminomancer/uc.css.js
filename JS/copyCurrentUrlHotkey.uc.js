// ==UserScript==
// @name           Copy Current URL Hotkey
// @version        1.2.5
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    Adds a new hotkey (Ctrl+Alt+C by default) that copies whatever is in the urlbar, even when it's not in focus.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/copyCurrentUrlHotkey.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/copyCurrentUrlHotkey.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class CopyCurrentURL {
  // Add these in about:config instead of modifying the script, if you want the
  // settings to persist between script restarts.
  config = {
    // if you have customHintProvider.uc.js, copying will open a confirmation
    // hint anchored to the urlbar.
    "show confirmation hint": Services.prefs.getBoolPref(
      "copyCurrentUrl.showConfirmationHint",
      true
    ),

    shortcut: {
      // shortcut key, combined with modifiers.
      key: Services.prefs.getStringPref("copyCurrentUrl.shortcut.key", "C"),

      // ctrl + alt or cmd + alt (use accel, it's cross-platform. it can be
      // changed in about:config with ui.key.accelKey. if you leave the "" quotes
      // empty, no modifier will be used. that means the hotkey will just be "C"
      // which is a bad idea — only do that if your "key" value is something
      // obscure like a function key, since this key will be active at all times
      // and in almost all contexts.
      modifiers: Services.prefs.getStringPref(
        "copyCurrentUrl.shortcut.modifiers",
        "accel alt"
      ),

      // no need to change this.
      id: "key_copyCurrentUrl",
    },
  };

  constructor() {
    XPCOMUtils.defineLazyServiceGetter(
      this,
      "ClipboardHelper",
      "@mozilla.org/widget/clipboardhelper;1",
      "nsIClipboardHelper"
    );
    this.hotkey = _ucUtils.registerHotkey(this.config.shortcut, win => {
      if (win === window) {
        let val;
        try {
          let uri = win.gURLBar.makeURIReadable(win.gBrowser.currentURI);
          if (uri.schemeIs("javascript") || uri.schemeIs("data")) {
            val = win.gURLBar._lastValidURLStr || win.gURLBar.value;
          } else {
            val = uri.displaySpec;
          }
          if (val === "about:blank") {
            return;
          }
          if (win.UrlbarPrefs.get("decodeURLsOnCopy")) {
            val = decodeURI(val);
          }
          if (!val) {
            return;
          }
        } catch (error) {
          return;
        }
        this.ClipboardHelper.copyStringToClipboard(val, this.clipboard);
        if (this.config["show confirmation hint"]) {
          if (win.gURLBar.getAttribute("pageproxystate") == "valid") {
            win.CustomHint?.show(win.gURLBar.inputField, "Copied", {
              position: "after_start",
              x: 16,
            });
          } else {
            win.CustomHint?.show(
              win.gIdentityHandler._identityIconBox,
              "Copied",
              { position: "bottomcenter topleft", y: 8 }
            );
          }
        }
      }
    });
  }

  get clipboard() {
    return Services.clipboard.isClipboardTypeSupported(
      Services.clipboard.kSelectionClipboard
    )
      ? Services.clipboard.kSelectionClipboard
      : Services.clipboard.kGlobalClipboard;
  }
}

window.copyCurrentUrl = new CopyCurrentURL();
