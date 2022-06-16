// ==UserScript==
// @name           Auto-hide Navbar Support
// @version        1.2.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    In fullscreen, the navbar hides automatically when you're not
// using it. But it doesn't have a very smooth animation, and there are certain
// situations where the navbar should be visible but isn't. This sets up its own
// logic to allow CSS transitions to cover the animation, and allows you to show
// the navbar only when hovering/focusing the navbar, or when a popup is opened
// that is anchored to something on the navbar, e.g. an extension popup. Also
// allows hiding the bookmarks toolbar under the same circumstances, fullscreen
// or not. You can use this for any toolbar, whether in fullscreen or not.
// duskFox just uses it for the bookmarks/personal toolbar, as well as for the
// navbar while in fullscreen, but your CSS can use it under any circumstances
// with popup-status="true". My preferred CSS transitions are in the stylesheets
// on my repo (see uc-fullscreen.css) but you can also do your own thing with
// selectors like box[popup-status="true"] > #navigator-toolbox > whatever
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class AutoHideHandler {
  constructor() {
    let autohidePref = "browser.fullscreen.autohide";
    this.observe(Services.prefs, "nsPref:read", autohidePref);
    Services.prefs.addObserver(autohidePref, this);
    for (let ev of ["popupshowing", "popuphiding"]) {
      this.mainPopupSet.addEventListener(ev, this, true);
      gNavToolbox.addEventListener(ev, this, true);
    }
    // onViewOpen and onViewClose
    gURLBar.controller.addQueryListener(this);
    for (let topic of ["urlbar-focus", "urlbar-blur"]) {
      Services.obs.addObserver(this, topic);
    }
  }
  get navBlock() {
    return this._navBlock || (this._navBlock = gNavToolbox.parentElement);
  }
  get mainPopupSet() {
    return this._mainPopupSet || (this._mainPopupSet = document.getElementById("mainPopupSet"));
  }
  get backButton() {
    return this._backButton || (this._backButton = document.getElementById("back-button"));
  }
  get fwdButton() {
    return this._fwdButton || (this._fwdButton = document.getElementById("forward-button"));
  }
  getPref(root, pref, def) {
    switch (root.getPrefType(pref)) {
      case root.PREF_BOOL:
        return root.getBoolPref(pref, def);
      case root.PREF_INT:
        return root.getIntPref(pref, def);
      case root.PREF_STRING:
        return root.getStringPref(pref, def);
      default:
        return null;
    }
  }
  observe(sub, topic, data) {
    switch (topic) {
      case "urlbar-focus":
      case "urlbar-blur":
        this._onUrlbarViewEvent();
        break;
      case "nsPref:changed":
      case "nsPref:read":
        this._onPrefChanged(sub, data);
        break;
      default:
    }
  }
  _onPrefChanged(sub, pref) {
    switch (pref) {
      case "browser.fullscreen.autohide":
        let value = this.getPref(sub, pref, true);
        if (value) document.documentElement.setAttribute("fullscreen-autohide", value);
        else document.documentElement.removeAttribute("fullscreen-autohide");
        break;
      default:
    }
  }
  handleEvent(event) {
    let targ = event.originalTarget;
    if (targ.tagName === "tooltip") return;
    switch (targ.id) {
      case "contentAreaContextMenu":
      case "sidebarMenu-popup":
      case "ctrlTab-panel":
      case "SyncedTabsSidebarContext":
      case "SyncedTabsSidebarTabsFilterContext":
      case "urlbar-scheme":
      case "urlbar-input":
      case "urlbar-label-box":
      case "urlbar-search-mode-indicator":
      case "pageActionContextMenu":
      case "confirmation-hint":
        return;
      case "backForwardMenu":
        if (this.backButton.disabled && this.fwdButton.disabled) return;
      case "":
        if (targ.hasAttribute("menu-api")) return;
    }
    if (targ.getAttribute("nopreventnavboxhide")) return;
    let popNode = targ.triggerNode;
    if (
      targ.className === "urlbarView" ||
      (event.target.parentElement.tagName === "menu" && !targ.closest("menubar"))
    )
      return;
    switch (event.type) {
      case "popupshowing":
        this.navBlock.setAttribute("popup-status", true);
        break;
      case "popuphiding":
        if (popNode?.closest("panel") || popNode?.closest("menupopup")) return;
        let panel = targ.closest("panel");
        if (targ !== panel && panel?.getAttribute("panelopen")) return;
        this.navBlock.removeAttribute("popup-status");
        break;
    }
  }
  onViewOpen() {
    this._onUrlbarViewEvent();
  }
  onViewClose() {
    this._onUrlbarViewEvent();
  }
  _onUrlbarViewEvent() {
    if (gURLBar.view.isOpen || gURLBar.focused) this.navBlock.setAttribute("urlbar-status", true);
    else this.navBlock.removeAttribute("urlbar-status");
  }
}

if (gBrowserInit.delayedStartupFinished) {
  window.navbarAutoHide = new AutoHideHandler();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.navbarAutoHide = new AutoHideHandler();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
