// ==UserScript==
// @name           Copy Current URL Hotkey
// @version        1.2.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new hotkey (Ctrl+Alt+C by default) that copies
//                 whatever is in the urlbar, even when it's not in focus.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class CopyCurrentURL {
  config = {
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
    XPCOMUtils.defineLazyServiceGetter(
      this,
      "ClipboardHelper",
      "@mozilla.org/widget/clipboardhelper;1",
      "nsIClipboardHelper"
    );
    this.hotkey = _ucUtils.registerHotkey(this.config.shortcut, win => {
      if (win === window) {
        let val = win.gURLBar._lastValidURLStr || win.gURLBar.value;
        if (!val) return;
        this.ClipboardHelper.copyStringToClipboard(val, this.clipboard);
        if (this.config["copy confirmation hint"]) {
          win.CustomHint?.show(win.gURLBar.inputField, "Copied", {
            position: "after_start",
            x: 16,
          });
        }
      }
    });
    if (this.config["context menu shortcut hint"]) this.shortcutHint();
  }
  get clipboard() {
    return Services.clipboard.supportsSelectionClipboard()
      ? Services.clipboard.kSelectionClipboard
      : Services.clipboard.kGlobalClipboard;
  }
  handleEvent() {
    let menuitem = gURLBar.inputField?.parentElement?.menupopup?.querySelector(`[cmd="cmd_copy"]`);
    if (menuitem) {
      if (!this.hintApplied && menuitem.hasAttribute("key")) {
        gURLBar.removeEventListener("contextmenu", this);
        return;
      }
      if (gURLBar.selectionStart != 0 || gURLBar.selectionEnd != gURLBar.inputField.textLength) {
        menuitem.setAttribute("key", this.config.shortcut.id);
      } else {
        menuitem.removeAttribute("key");
      }
      this.hintApplied = true;
    }
  }
  shortcutHint() {
    if (gBrowserInit.delayedStartupFinished) {
      gURLBar.addEventListener("contextmenu", this);
    } else {
      let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
          Services.obs.removeObserver(delayedListener, topic);
          gURLBar.addEventListener("contextmenu", this);
        }
      };
      Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
  }
}

window.copyCurrentUrl = new CopyCurrentURL();
