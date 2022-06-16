// ==UserScript==
// @name           Copy Current URL Hotkey
// @version        1.1.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new hotkey (Ctrl+Alt+C by default) that copies
//                 whatever is in the urlbar, even when it's not in focus.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class CopyCurrentURL {
  static config = {
    // if you have customHintProvider.uc.js, copying will open a confirmation
    // hint anchored to the urlbar.
    "copy confirmation hint": true,

    // when you right-click the urlbar, the context menu has a "copy" command.
    // set this to "true" to show a "Ctrl+Alt+C" hint next to this command, like
    // firefox does with many other commands. the hint text will reflect the
    // actual hotkey. so on macOS it will show "Cmd+Alt+C" and if you modify the
    // modifiers below, it will show your modifiers instead. this setting isn't
    // enabled by default because 1) unlike our custom hotkey, this command
    // actually only copies the selection, not the full input content. so it's
    // disabled if nothing is highlighted. and 2) the context menu is very thin
    // due to the short names of the commands. adding "Ctrl+Alt+C" makes it kind
    // of cramped. but it's easy to forget that hotkeys exist if they're not
    // visually displayed anywhere, so you may want to enable this feature.
    "context menu shortcut hint": true,

    shortcut: {
      // shortcut key, combined with modifiers.
      key: "C",

      // ctrl + alt or cmd + alt (use accel, it's cross-platform. it can be
      // changed in about:config with ui.key.accelKey. if you leave the "" quotes
      // empty, no modifier will be used. that means the hotkey will just be "C"
      // which is a bad idea — only do that if your "key" value is something
      // obscure like a function key, since this key will be active at all times
      // and in almost all contexts.
      modifiers: "accel alt",

      // no need to change this.
      id: "key_copyCurrentUrl",
    },
  };
  constructor() {
    this.showHint = !!CopyCurrentURL.config["copy confirmation hint"];
    this.hotkey = _ucUtils.registerHotkey(CopyCurrentURL.config.shortcut, (win, key) => {
      if (win === window && gURLBar.value) {
        this.clipboardHelper.copyString(gURLBar.value);
        this.showHint &&
          win.CustomHint?.show(gURLBar.inputField, "Copied", {
            position: "after_start",
            x: 16,
          });
      }
    });
    if (CopyCurrentURL.config["context menu shortcut hint"]) this.shortcutHint();
  }
  get clipboardHelper() {
    return (
      this._clipboardHelper ||
      (this._clipboardHelper = Cc["@mozilla.org/widget/clipboardhelper;1"].getService(
        Ci.nsIClipboardHelper
      ))
    );
  }
  handleEvent(_e) {
    const menuitem = gURLBar
      .querySelector("moz-input-box")
      ?.menupopup?.querySelector(`[cmd="cmd_copy"]`);
    if (menuitem) {
      menuitem.setAttribute("key", CopyCurrentURL.config.shortcut.id);
      gURLBar.removeEventListener("contextmenu", this);
    }
  }
  setupHint() {
    gURLBar.addEventListener("contextmenu", this);
  }
  shortcutHint() {
    if (gBrowserInit.delayedStartupFinished) this.setupHint();
    else {
      let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
          Services.obs.removeObserver(delayedListener, topic);
          this.setupHint();
        }
      };
      Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
  }
}

window.copyCurrentUrl = new CopyCurrentURL();
