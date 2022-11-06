// ==UserScript==
// @name           Window Drag Hotkey
// @version        1.1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Hold down the Alt and Shift keys and click & drag any part of
// a toolbar to drag the entire window. Normally you can only drag the window in
// empty spaces. Clicking and dragging a button, a tab, an input field, etc.
// will not drag the window. With this script, while you hold down the Alt and
// Shift keys, ANY element in a toolbar basically becomes a drag space. Alt and
// Shift were chosen because there aren't any Alt+Shift+Click functions, as far
// as I know. Upon releasing the keys, everything will go back to normal.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class WindowDragHotkey {
  constructor() {
    this.registerSheet();
    ["keydown", "keyup"].forEach(ev =>
      document.addEventListener(ev, this, true)
    );
  }
  handleEvent(e) {
    if (e.repeat) return;
    switch (e.type) {
      case "keydown":
        this.onDown(e);
        break;
      case "keyup":
        this.onUp();
        break;
      case "mouseout":
        this.onOut(e);
        break;
    }
  }
  onDown(e) {
    switch (e.key) {
      case "Alt":
        if (!e.shiftKey) return;
        break;
      case "Shift":
        if (!e.altKey) return;
        break;
      default:
        document.documentElement.removeAttribute("force-drag");
        return;
    }
    document.documentElement.setAttribute("force-drag", true);
    window.addEventListener("mouseout", this);
    e.preventDefault();
  }
  onUp() {
    document.documentElement.removeAttribute("force-drag");
  }
  onOut(e) {
    if (e.shiftKey && e.altKey) return;
    document.documentElement.removeAttribute("force-drag");
    window.removeEventListener("mouseout", this);
  }
  registerSheet() {
    let css = `:root[force-drag] toolbar *{-moz-window-dragging:drag!important;}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

if (gBrowserInit.delayedStartupFinished) {
  new WindowDragHotkey();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      new WindowDragHotkey();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
