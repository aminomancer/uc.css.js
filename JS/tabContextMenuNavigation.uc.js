// ==UserScript==
// @name           Tab Context Menu Navigation
// @version        1.1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Add some new menuitems to the tab context menu for navigating tabs. Includes Back, Forward, Reload, and Bookmark. The new menuitems look just like the navigation group at the top of the content area context menu. So they're oriented horizontally and have icons instead of labels. But functionally, they're a bit different. If you click the "Reload" button, for example, instead of reloading the current tab it will reload the tab you right-clicked to open the context menu. If you had multiple tabs selected and you right-clicked one of them, it will reload all of them. If you click the "Back" button, it will navigate the context tab(s) back by one. So this gives you some capabilities not already available in Firefox. In particular, you can navigate back/forward in tabs without opening them, since it operates on the context tab rather than the active tab. You can also navigate back/forward in multiple tabs at once. This script was made by request. It's not recommended on macOS, since the context menu items and functions are significantly different. It should be technically compatible but it might look weird depending on your settings.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabContextMenuNavigation.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabContextMenuNavigation.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class TabContextMenuNavigation {
  static config = {
    l10n: {
      "Go Back (Single Tab)": "Navigate tab back one page",

      "Go Back (Multiselected)": "Navigate selected tabs back one page",

      "Go Back Access Key": "G",

      "Go Forward (Single Tab)": "Navigate tab forward one page",

      "Go Forward (Multiselected)": "Navigate selected tabs forward one page",

      "Go Forward Access Key": "F",

      "Reload (Single Tab)": "Reload tab",

      "Reload (Multiselected)": "Reload selected tabs",

      "Reload Access Key": "R",

      "Bookmark (Single Tab)": "Bookmark tab",

      "Bookmark (Multiselected)": "Bookmark selected tabs...",

      "Bookmark Access Key": "B",
    },
    // firefox doesn't have localized strings for these menuitems, since it
    // doesn't have any user-facing features like this where you can navigate
    // tabs that aren't currently active/selected. nor does it have any ability
    // to navigate multiple tabs at once. so you have to localize the tooltips
    // yourself to match your browser language.
  };
  create(doc, tag, props, isHTML = false) {
    let el = isHTML ? doc.createElement(tag) : doc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }
  constructor() {
    this.config = TabContextMenuNavigation.config;
    let { l10n } = this.config;
    document.documentElement.setAttribute(
      "operatingsystem",
      AppConstants.platform
    );
    this.loadStylesheet();
    // menuitem group
    this.contextNavigation = this.create(document, "menugroup", {
      id: "tab-context-navigation",
    });
    this.contextNavSeparator = this.create(document, "menuseparator", {
      id: "tab-context-sep-navigation",
    });
    this.tabContext.prepend(this.contextNavSeparator);
    this.tabContext.prepend(this.contextNavigation);
    // new menuitems
    this.contextBack = this.contextNavigation.appendChild(
      this.create(document, "menuitem", {
        id: "tab-context-back",
        class: "menuitem-iconic",
        tooltiptext: l10n["Go Back (Single Tab)"],
        accesskey: l10n["Go Back Access Key"],
        oncommand: `tabContextMenuNavigation.goBack()`,
      })
    );
    this.contextForward = this.contextNavigation.appendChild(
      this.create(document, "menuitem", {
        id: "tab-context-forward",
        class: "menuitem-iconic",
        tooltiptext: l10n["Go Forward (Single Tab)"],
        accesskey: l10n["Go Forward Access Key"],
        oncommand: `tabContextMenuNavigation.goForward()`,
      })
    );
    this.contextReload = this.contextNavigation.appendChild(
      this.create(document, "menuitem", {
        id: "tab-context-reload",
        class: "menuitem-iconic",
        tooltiptext: l10n["Reload (Single Tab)"],
        accesskey: l10n["Reload Access Key"],
        oncommand: `tabContextMenuNavigation.reload()`,
      })
    );
    this.contextBookmark = this.contextNavigation.appendChild(
      this.create(document, "menuitem", {
        id: "tab-context-bookmark",
        class: "menuitem-iconic",
        tooltiptext: l10n["Bookmark (Single Tab)"],
        accesskey: l10n["Bookmark Access Key"],
        oncommand: `tabContextMenuNavigation.bookmark()`,
      })
    );
    // remove the separator after "New Tab" menuitem,
    // since it'll look awkward with the menugroup above it.
    let newTab = this.tabContext.querySelector("#context_openANewTab");
    if (newTab.nextElementSibling.tagName === "menuseparator") {
      newTab.nextElementSibling.remove();
    }
    // set up listener to hide/disable menuitems
    this.tabContext.addEventListener("popupshowing", this);
  }
  handleEvent(e) {
    switch (e.type) {
      case "popupshowing":
        this.onPopupShowing(e);
        break;
    }
  }
  // we want to disable/enable the back & forward menuitems just like the
  // back/forward buttons in the navbar. we also want to change the tooltips for
  // all 4 menuitems based on whether more than 1 tab is selected.
  onPopupShowing(e) {
    if (e.target !== this.tabContext) return;
    let { l10n } = this.config;
    if (this.contextTab?.multiselected) {
      this.contextBack.disabled = !gBrowser.selectedTabs.some(
        tab => gBrowser.getBrowserForTab(tab).webNavigation.canGoBack
      );
      this.contextForward.disabled = !gBrowser.selectedTabs.some(
        tab => gBrowser.getBrowserForTab(tab).webNavigation.canGoForward
      );
      this.contextBack.setAttribute(
        "tooltiptext",
        l10n["Go Back (Multiselected)"]
      );
      this.contextForward.setAttribute(
        "tooltiptext",
        l10n["Go Forward (Multiselected)"]
      );
      this.contextReload.setAttribute(
        "tooltiptext",
        l10n["Reload (Multiselected)"]
      );
      this.contextBookmark.setAttribute(
        "tooltiptext",
        l10n["Bookmark (Multiselected)"]
      );
    } else {
      this.contextBack.disabled = !gBrowser.getBrowserForTab(this.contextTab)
        .webNavigation.canGoBack;
      this.contextForward.disabled = !gBrowser.getBrowserForTab(this.contextTab)
        .webNavigation.canGoForward;
      this.contextBack.setAttribute(
        "tooltiptext",
        l10n["Go Back (Single Tab)"]
      );
      this.contextForward.setAttribute(
        "tooltiptext",
        l10n["Go Forward (Single Tab)"]
      );
      this.contextReload.setAttribute(
        "tooltiptext",
        l10n["Reload (Single Tab)"]
      );
      this.contextBookmark.setAttribute(
        "tooltiptext",
        l10n["Bookmark (Single Tab)"]
      );
    }
  }
  goBack() {
    if (this.contextTab?.multiselected) {
      gBrowser.selectedTabs.forEach(tab => {
        let browser = gBrowser.getBrowserForTab(tab);
        if (browser.webNavigation.canGoBack) browser.goBack();
      });
    } else {
      gBrowser.getBrowserForTab(this.contextTab).goBack();
    }
  }
  goForward() {
    if (this.contextTab?.multiselected) {
      gBrowser.selectedTabs.forEach(tab => {
        let browser = gBrowser.getBrowserForTab(tab);
        if (browser.webNavigation.canGoForward) browser.goForward();
      });
    } else {
      gBrowser.getBrowserForTab(this.contextTab).goForward();
    }
  }
  reload() {
    if (this.contextTab?.multiselected) gBrowser.reloadMultiSelectedTabs();
    else gBrowser.reloadTab(this.contextTab);
  }
  bookmark() {
    PlacesUIUtils.showBookmarkPagesDialog(
      this.contextTab?.multiselected
        ? PlacesCommandHook.uniqueSelectedPages
        : PlacesCommandHook.getUniquePages([this.contextTab])
    );
  }
  loadStylesheet() {
    // we're gonna use a <style> element instead of the usual stylesheet
    // service, since this seems to be the only way to get media queries to work
    // in an author sheet without saving the stylesheet to disk somewhere and
    // loading it from a chrome:// url. this restricts us in some ways but it
    // doesn't matter since these elements only appear in one place.
    let style = document.createElement("style");
    style.textContent = `#tab-context-navigation>.menuitem-iconic>.menu-iconic-text,#tab-context-navigation>.menuitem-iconic>.menu-accel-container{display:none;}#tab-context-navigation>.menuitem-iconic{-moz-box-flex:1;-moz-box-pack:center;-moz-box-align:center;}#tab-context-navigation>.menuitem-iconic>.menu-iconic-left{appearance:none;}#tab-context-navigation>.menuitem-iconic>.menu-iconic-left>.menu-iconic-icon{width:1.25em;height:auto;margin:7px;-moz-context-properties:fill;fill:currentColor;}#tab-context-back{list-style-image:url("chrome://browser/skin/back.svg");}#tab-context-forward{list-style-image:url("chrome://browser/skin/forward.svg");}#tab-context-reload{list-style-image:url("chrome://global/skin/icons/reload.svg");}#tab-context-bookmark{list-style-image:url("chrome://browser/skin/bookmark-hollow.svg");}#tab-context-back:-moz-locale-dir(rtl),#tab-context-forward:-moz-locale-dir(rtl),#tab-context-reload:-moz-locale-dir(rtl){transform:scaleX(-1);}#contentAreaContextMenu[touchmode]>#tab-context-navigation>menuitem{padding-block:7px;}#tab-context-navigation{background-color:menu;padding-bottom:4px;}#tab-context-sep-navigation{margin-inline-start:-28px;margin-top:-4px;}@media (-moz-windows-non-native-menus){#tab-context-navigation:not([hidden]){background-color:inherit;padding:0 0 4px;display:flex;flex-direction:row;--menuitem-min-width:calc(2em + 16px);min-width:calc(4 * var(--menuitem-min-width))}#tab-context-navigation>.menuitem-iconic{flex:1 0 auto}#tab-context-navigation>.menuitem-iconic[_moz-menuactive="true"]{background-color:transparent}#tab-context-navigation>.menuitem-iconic>.menu-iconic-left{margin:0;padding:0}#tab-context-navigation>.menuitem-iconic>.menu-iconic-left>.menu-iconic-icon{width:var(--menuitem-min-width);height:32px;padding:8px 1em;margin:0}#tab-context-navigation>.menuitem-iconic[_moz-menuactive="true"]:not([disabled="true"])>.menu-iconic-left>.menu-iconic-icon{background-color:var(--menuitem-hover-background-color)}#tab-context-navigation>.menuitem-iconic[_moz-menuactive="true"][disabled="true"]>.menu-iconic-left>.menu-iconic-icon{background-color:var(--menuitem-disabled-hover-background-color)}#tab-context-navigation>.menuitem-iconic:first-child{-moz-box-pack:start}#tab-context-navigation>.menuitem-iconic:last-child{-moz-box-pack:end}#tab-context-navigation>.menuitem-iconic:last-child,#tab-context-navigation>.menuitem-iconic:first-child{flex-grow:0;width:calc(var(--menuitem-min-width) + calc(100% - 4 * var(--menuitem-min-width)) / 6)}#tab-context-sep-navigation{margin-top:0;margin-inline:0}}:root[operatingsystem="linux"] #tab-context-navigation>.menuitem-iconic>.menu-iconic-left{padding-inline-end:0!important;margin-inline-end:0!important;}#context_reloadTab,#context_reloadSelectedTabs,#context_bookmarkTab,#context_bookmarkSelectedTabs{display:none!important;}`;
    document.head.appendChild(style);
  }
  get tabContext() {
    return (
      this._tabContext ||
      (this._tabContext = document.getElementById("tabContextMenu"))
    );
  }
  get contextTab() {
    return TabContextMenu.contextTab;
  }
}

if (gBrowserInit.delayedStartupFinished) {
  window.tabContextMenuNavigation = new TabContextMenuNavigation();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.tabContextMenuNavigation = new TabContextMenuNavigation();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
