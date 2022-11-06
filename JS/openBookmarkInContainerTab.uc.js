// ==UserScript==
// @name           Open Bookmark in Container Tab (context menu)
// @version        1.2.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new menu to context menus prompted by right-clicking
// bookmarks, history entries, etc. that allows you to open them in a container
// tab. This does basically the same thing as the similarly-named addon by Rob
// Wu, just by a different method. By doing this with an autoconfig script, we
// can make the menu appear in a logical order towards the top of the context
// menu rather than at the very bottom, where context menu items from addons
// always go. Since Bug 1754805, the main menu created by this script is
// obsolete — the "Open in New Container Tab" menu opened on bookmarks and
// history items. So as of version 1.2, that menu has been removed since it
// would be redundant. However, this still adds a menu item to open all
// bookmarks in a container. Bug 1754805 also doesn't add these menu items to
// the synced tabs sidebar context menu, whereas this script does.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @include        chrome://browser/content/places/bookmarksSidebar.xhtml
// @include        chrome://browser/content/places/historySidebar.xhtml
// @include        chrome://browser/content/places/places.xhtml
// ==/UserScript==

class OpenPlacesInContainerTabMenu {
  static config = {
    l10n: {
      // Appears when right-clicking a container/folder in bookmarks or history.
      openAll: `Open All in Container Tabs`,
      // All of the menu items use a predefined access key. Access keys are
      // underlined in the menu item's label, and pressing them on your keyboard
      // automatically selects the menu item. They serve as hotkeys while the
      // context menu is open. The default access key is "c" for the english
      // "Container." This collides with the "Copy" menu item, so if you leave
      // this set to "c" the script will change the Copy access key to "y" so
      // they don't collide. It won't do that if you change this variable
      // though. If the chosen access key is not present in the menu item's
      // label, instead of being underlined in the label, it will be shown after
      // the label in parentheses, e.g. "Open All in Container Tabs (G)"
      accessKey: `i`,
    },
  };
  constructor() {
    let { l10n } = OpenPlacesInContainerTabMenu.config;
    let popups = [];
    this.loadSheet();

    if (l10n.accessKey === `c`) this.placesMenuCopy.accessKey = `y`;

    this.placesMenuOpenAllInContainer = this.create(document, "menu", {
      id: "placesContext_openContainer:container",
      label: l10n.openAll,
      accesskey: l10n.accessKey,
      disabled: true,
      hidden: true,
    });
    this.placesMenuOpenContainer?.after(this.placesMenuOpenAllInContainer);
    let openAllPopup = this.placesMenuOpenAllInContainer.appendChild(
      document.createXULElement("menupopup")
    );
    openAllPopup.addEventListener("command", e =>
      this.openSelectedInContainer(e, openAllPopup)
    );
    popups.push(openAllPopup);

    this.placesMenuOpenAllLinksInContainer = this.create(document, "menu", {
      id: "placesContext_openLinks:container",
      label: l10n.openAll,
      accesskey: l10n.accessKey,
      disabled: true,
      hidden: true,
    });
    this.placesMenuOpenAllLinks.after(this.placesMenuOpenAllLinksInContainer);
    let openAllLinksPopup = this.placesMenuOpenAllLinksInContainer.appendChild(
      document.createXULElement("menupopup")
    );
    openAllLinksPopup.addEventListener("command", e =>
      this.openSelectedInContainer(e, openAllLinksPopup)
    );
    popups.push(openAllLinksPopup);

    this.placesContextMenu.addEventListener("popupshowing", this);

    if (location.href === `chrome://browser/content/browser.xhtml`) {
      if (l10n.accessKey === `c`) this.syncedMenuCopy.accessKey = `y`;

      this.syncedMenuOpenAllInContainer = this.create(document, "menu", {
        id: "syncedTabsOpenAllInContainer",
        label: l10n.openAll,
        accesskey: l10n.accessKey,
        disabled: true,
        hidden: true,
      });
      this.syncedMenuOpenAll.after(this.syncedMenuOpenAllInContainer);
      let syncedOpenAllPopup = this.syncedMenuOpenAllInContainer.appendChild(
        document.createXULElement("menupopup")
      );
      syncedOpenAllPopup.addEventListener("command", e =>
        this.openAllSyncedFromDevice(e, syncedOpenAllPopup)
      );
      popups.push(syncedOpenAllPopup);

      this.syncedContextMenu.addEventListener("popupshowing", this);
      this.syncedFilterContextMenu.addEventListener("popupshowing", this, {
        once: true,
      });
    }
    popups.forEach(popup =>
      popup.addEventListener("popupshowing", e =>
        createUserContextMenu(e, {
          isContextMenu: true,
          showDefaultTab: true,
        })
      )
    );
  }
  get placesContextMenu() {
    return (
      this._placesContextMenu ||
      (this._placesContextMenu = document.getElementById("placesContext"))
    );
  }
  get syncedContextMenu() {
    return (
      this._syncedContextMenu ||
      (this._syncedContextMenu = document.getElementById(
        "SyncedTabsSidebarContext"
      ))
    );
  }
  get syncedFilterContextMenu() {
    return (
      this._syncedFilterContextMenu ||
      (this._syncedFilterContextMenu = document.getElementById(
        "SyncedTabsSidebarTabsFilterContext"
      ))
    );
  }
  get syncedTabsStore() {
    return document.getElementById("sidebar")?.syncedTabsDeckComponent
      ._syncedTabsListStore;
  }
  get selectedSyncedRow() {
    return this.syncedTabsStore.data[this.syncedTabsStore._selectedRow[0]];
  }
  get selectedSyncedTab() {
    return this.selectedSyncedRow.tabs?.[this.syncedTabsStore._selectedRow[1]];
  }
  get placesMenuOpenContainer() {
    return (
      this._placesMenuOpenContainer ||
      (this._placesMenuOpenContainer = document.getElementById(
        "placesContext_openContainer:tabs"
      ))
    );
  }
  get placesMenuOpenBookmarkContainer() {
    return (
      this._placesMenuOpenBookmarkContainer ||
      (this._placesMenuOpenBookmarkContainer = document.getElementById(
        "placesContext_openBookmarkContainer:tabs"
      ))
    );
  }
  get placesMenuOpenBookmarkLinks() {
    return (
      this._placesMenuOpenBookmarkLinks ||
      (this._placesMenuOpenBookmarkLinks = document.getElementById(
        "placesContext_openBookmarkLinks:tabs"
      ))
    );
  }
  get placesMenuOpenAllLinks() {
    return (
      this._placesMenuOpenAllLinks ||
      (this._placesMenuOpenAllLinks = document.getElementById(
        "placesContext_openLinks:tabs"
      ))
    );
  }
  get placesMenuOpenNewTab() {
    return (
      this._placesMenuOpenNewTab ||
      (this._placesMenuOpenNewTab = document.getElementById(
        "placesContext_open:newtab"
      ))
    );
  }
  get placesMenuCopy() {
    return (
      this._placesMenuCopy ||
      (this._placesMenuCopy = document.getElementById("placesContext_copy"))
    );
  }
  get syncedMenuOpenAll() {
    return (
      this._syncedMenuOpenAll ||
      (this._syncedMenuOpenAll = this.syncedContextMenu.querySelector(
        "#syncedTabsOpenAllInTabs"
      ))
    );
  }
  get syncedMenuCopy() {
    return (
      this._syncedMenuCopy ||
      (this._syncedMenuCopy = this.syncedContextMenu.querySelector(
        "#syncedTabsCopySelected"
      ))
    );
  }
  create(doc, tag, props, isHTML = false) {
    let el = isHTML ? doc.createElement(tag) : doc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }
  getActivePlacesView(popup) {
    if (!popup.triggerNode) return false;
    return PlacesUIUtils.getViewForNode(popup.triggerNode);
  }
  handleEvent(e) {
    switch (e.target) {
      case this.placesContextMenu:
        this.onPlacesContextMenuShowing(e);
        break;
      case this.syncedContextMenu:
        this.onSyncedContextMenuShowing(e);
        break;
      case this.syncedFilterContextMenu:
        // fix a bug
        MozXULElement.insertFTLIfNeeded("browser/syncedTabs.ftl");
        e.target.querySelectorAll("[data-lazy-l10n-id]").forEach(el => {
          el.setAttribute("data-l10n-id", el.getAttribute("data-lazy-l10n-id"));
          el.removeAttribute("data-lazy-l10n-id");
        });
        break;
    }
  }
  onPlacesContextMenuShowing(_e) {
    this.placesMenuOpenAllInContainer.disabled =
      this.placesMenuOpenContainer?.disabled &&
      this.placesMenuOpenBookmarkContainer?.disabled &&
      this.placesMenuOpenBookmarkLinks?.disabled;
    this.placesMenuOpenAllInContainer.hidden =
      this.placesMenuOpenContainer?.hidden &&
      this.placesMenuOpenBookmarkContainer?.hidden &&
      this.placesMenuOpenBookmarkLinks?.hidden;
    this.placesMenuOpenAllLinksInContainer.disabled = this.placesMenuOpenAllLinks?.disabled;
    this.placesMenuOpenAllLinksInContainer.hidden = this.placesMenuOpenAllLinks?.hidden;
  }
  onSyncedContextMenuShowing(_e) {
    this.syncedContextMenuInited = true;
    this.syncedMenuOpenAllInContainer.disabled = this.syncedMenuOpenAll?.disabled;
    this.syncedMenuOpenAllInContainer.hidden = this.syncedMenuOpenAll?.hidden;
  }
  openLinkInContainer(e, popup, item) {
    let win = window.gBrowser ? window : BrowserWindowTracker.getTopWindow();
    if (!win) return;
    let { gBrowser, Services } = win;
    let urls = [];
    if (!item) {
      let view = this.getActivePlacesView(popup);
      if (!view) return;
      item = view.selectedNode;
    }
    if (item instanceof Array) {
      item.forEach(node => {
        let url = typeof node === "object" ? node.url || node.uri : node;
        urls.push(url);
      });
    } else {
      urls = [typeof item === "object" ? item.url || item.uri : item];
    }
    gBrowser.loadTabs(urls, {
      userContextId: parseInt(e.target.getAttribute("data-usercontextid")),
      inBackground: Services.prefs.getBoolPref(
        "browser.tabs.loadBookmarksInBackground"
      ),
      replace: false,
      triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
    });
  }
  openSelectedInContainer(e, popup) {
    let view = this.getActivePlacesView(popup);
    if (!view) return;
    let folder = view.selectedNode || view.selectedNodes || view.result.root;
    let items = [];
    if (PlacesUtils.nodeIsContainer(folder)) {
      let root = PlacesUtils.getContainerNodeWithOptions(folder, false, true);
      let result = root.parentResult;
      let wasOpen = root.containerOpen;
      let didSuppressNotifications = false;
      if (!wasOpen) {
        didSuppressNotifications = result.suppressNotifications;
        if (!didSuppressNotifications) result.suppressNotifications = true;
        root.containerOpen = true;
      }
      for (let i = 0; i < root.childCount; ++i) {
        let child = root.getChild(i);
        if (PlacesUtils.nodeIsURI(child)) items.push({ url: child.uri });
      }
      if (!wasOpen) {
        root.containerOpen = false;
        if (!didSuppressNotifications) result.suppressNotifications = false;
      }
    } else {
      items = folder;
    }
    this.openLinkInContainer(e, popup, items);
  }
  openAllSyncedFromDevice(e, popup) {
    if (!this.syncedContextMenuInited) return;
    if (popup.triggerNode?.closest(".tabs-container")) {
      this.openLinkInContainer(e, popup, this.selectedSyncedRow.tabs);
    }
  }
  loadSheet() {
    const css = `.identity-color-blue{--identity-tab-color:#37adff;--identity-icon-color:#37adff;}.identity-color-turquoise{--identity-tab-color:#00c79a;--identity-icon-color:#00c79a;}.identity-color-green{--identity-tab-color:#51cd00;--identity-icon-color:#51cd00;}.identity-color-yellow{--identity-tab-color:#ffcb00;--identity-icon-color:#ffcb00;}.identity-color-orange{--identity-tab-color:#ff9f00;--identity-icon-color:#ff9f00;}.identity-color-red{--identity-tab-color:#ff613d;--identity-icon-color:#ff613d;}.identity-color-pink{--identity-tab-color:#ff4bda;--identity-icon-color:#ff4bda;}.identity-color-purple{--identity-tab-color:#af51f5;--identity-icon-color:#af51f5;}.identity-color-toolbar{--identity-tab-color:var(--lwt-toolbar-field-color,FieldText);--identity-icon-color:var(--lwt-toolbar-field-color,FieldText);}.identity-icon-fence{--identity-icon:url("resource://usercontext-content/fence.svg");}.identity-icon-fingerprint{--identity-icon:url("resource://usercontext-content/fingerprint.svg");}.identity-icon-briefcase{--identity-icon:url("resource://usercontext-content/briefcase.svg");}.identity-icon-dollar{--identity-icon:url("resource://usercontext-content/dollar.svg");}.identity-icon-cart{--identity-icon:url("resource://usercontext-content/cart.svg");}.identity-icon-circle{--identity-icon:url("resource://usercontext-content/circle.svg");}.identity-icon-vacation{--identity-icon:url("resource://usercontext-content/vacation.svg");}.identity-icon-gift{--identity-icon:url("resource://usercontext-content/gift.svg");}.identity-icon-food{--identity-icon:url("resource://usercontext-content/food.svg");}.identity-icon-fruit{--identity-icon:url("resource://usercontext-content/fruit.svg");}.identity-icon-pet{--identity-icon:url("resource://usercontext-content/pet.svg");}.identity-icon-tree{--identity-icon:url("resource://usercontext-content/tree.svg");}.identity-icon-chill{--identity-icon:url("resource://usercontext-content/chill.svg");}.menuitem-iconic[data-usercontextid]{list-style-image:var(--identity-icon);-moz-context-properties:fill;fill:var(--identity-icon-color);}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = Services.io.newURI(
      "data:text/css;charset=UTF=8," + encodeURIComponent(css)
    );
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

if (
  location.href !== `chrome://browser/content/browser.xhtml` ||
  gBrowserInit.delayedStartupFinished
) {
  new OpenPlacesInContainerTabMenu();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      new OpenPlacesInContainerTabMenu();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
