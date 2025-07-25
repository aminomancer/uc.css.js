// ==UserScript==
// @name           Undo Recently Closed Tabs in Tab Context Menu
// @version        2.1.7
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Adds new menus to the context menu that appears when you right-click a tab (in the tab bar or in the [TreeStyleTab][] sidebar): one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them.

Also optionally adds a context menu to the history panel's subview pages for "Recently closed tabs" and "Recently closed windows" with various functions for interacting with the closed tabs and their session history. You can right-click a closed tab item to open the context menu, then click "Remove from List" to get rid of it.

You can click "Remove from History" to not only remove the closed tab item, but also forget all of the tab's history — that is, every page it navigated to. The same can be done with recently closed windows. From this menu you can also restore a tab in a new window or private window, bookmark a closed tab/window, and more.

This script also adds a new preference `userChrome.tabs.recentlyClosedTabs.middle-click-to-remove` which changes the behavior when you click a recently closed tab/window item in the history panel. Middle clicking a tab or window item will remove it from the list (just like one of the context menu items). Ctrl+clicking a tab item it will open it in a new tab (instead of restoring it in its former place), and Ctrl+Shift+clicking it will open it in a new window.

[TreeStyleTab]: https://addons.mozilla.org/firefox/addon/tree-style-tab/
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/recentlyClosedTabsContextMenu.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/recentlyClosedTabsContextMenu.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class UndoListInTabmenu {
  // user preferences. add these in about:config if you want them to persist
  // between script updates without having to reapply them.
  static config = {
    // set this to false if you don't want popup windows to be listed in
    // recently closed windows.
    "Include popup windows": Services.prefs.getBoolPref(
      "recentlyClosedTabsContextMenu.includePopupWindows",
      true
    ),

    /* in vanilla firefox there isn't any way to tell whether a closed tab was a
    container tab. you just have to restore it to find out. with this setting,
    you can show the container's color as a stripe on the edge of the tab's
    menuitem/button. */
    "Show container tab colors": {
      // show on items in built-in popup panels like the history toolbar
      // button's popup menu and the hamburger/app menu.
      inPopupPanels: Services.prefs.getBoolPref(
        "recentlyClosedTabsContextMenu.showContainerTabColors.inPopupPanels",
        true
      ),

      // show on items in the context menus made by this script, and in the
      // built-in history menu in the main titlebar menu bar. if both inMenupopups
      // and inPopupPanels are false, container colors won't show anywhere.
      inMenupopups: Services.prefs.getBoolPref(
        "recentlyClosedTabsContextMenu.showContainerTabColors.inMenupopups",
        true
      ),

      // restore window items can contain more than one tab with different
      // containers. so some users may want to disable container colors on
      // window items. I prefer showing the color because it will show the color
      // for the window's active tab — that's how it shows all other tab
      // information. it shows the favicon and title for the closed window's
      // active tab, since it's not practical to show info for every tab. so it
      // might as well show the active tab's container too.
      showForWindows: Services.prefs.getBoolPref(
        "recentlyClosedTabsContextMenu.showContainerTabColors.showForWindows",
        true
      ),
    },

    // you can set this to false if you don't want a context menu to open when
    // you right-click an item in one of the "recently closed tab/window"
    // panels. this won't affect the main context menus added by the script,
    // since you can't open a context menu from inside a context menu. this only
    // affects *panels*, e.g., the "recently closed tabs" subview that you can
    // open when you click the history toolbar button or the hamburger button.
    // if you have no idea what I'm talking about, an easy way to tell the
    // difference between a menu and a panel is to look at the background color
    // of the menu. with firefox's default built-in dark theme, menus have a
    // much darker gray background than panels.
    "Enable context menus in panels": true,

    // the user-facing strings. change these if your firefox language is not english.
    l10n: {
      // displayed next to popup windows in the recently closed windows list.
      // intended to help distinguish regular windows from popup windows, which
      // are often more transient and generated by websites' scripts. if you set
      // "Include popup windows" to false, this won't show up in the context
      // menus since they won't show popup windows at all. but it will still
      // show up in the recently closed windows list in the history panel. this
      // can't be localized automatically so for non-english languages you'll
      // have to write the label yourself. if you don't want popup windows to be
      // labeled at all, just change this to ""
      "Popup window label": "(popup)",

      // one of the letters in the "Recently Closed Tabs" menu label is
      // underlined. this is the menu's access key. pressing this key while the
      // context menu is open will automatically select the menu. in English
      // this key is "T" and in other languages it will usually be the first
      // letter of the last word. it handles right-to-left languages
      // appropriately. but it has no way of knowing whether the last word of
      // the label means "tabs" or "recently" or "closed"; it just expects a
      // grammatical structure similar to English. that is not a safe
      // assumption, but there's not much I can do about it without implementing
      // special behavior for every language, and I'm not exactly a linguist.
      // it's a lot easier for you to just choose your own access key if you
      // don't like the key it's automatically choosing for you. the key you
      // enter here does not have to actually be a letter that's present in the
      // label. if you put "Q" for example, it would still work. it would just
      // add (Q) to the end of the label instead of underlining a letter.
      // obviously you want to input a letter that actually exists on your
      // keyboard so you'll be able to use it. if you leave this preference
      // empty, the script will fall back to the automatic selection behavior.
      "Tabs access key": "",

      // just like the previous preference, but for the "Recently Closed
      // Windows" menu. in English this is "W" by default. if you use this or
      // the "New Tab" item's access key a lot you may want to change it, since
      // they both use "W" as their access key. when two menu items have the
      // same accesskey, pressing it will just cycle between the two without
      // activating either. this item was added after I wrote the script, and I
      // can't really change it because the access key is calculated
      // automatically, based on the first letter of the last word.
      "Windows access key": "",

      // these are for the context menu that opens when you right-click
      // a recently-closed item in a popup panel
      Restore: { label: "Restore", accesskey: "R" },

      "Restore in New Window": {
        label: "Restore in New Window",
        accesskey: "N",
      },

      "Restore in New Private Window": {
        label: "Restore in New Private Window",
        accesskey: "P",
      },

      "Remove from List": { label: "Remove from List", accesskey: "L" },

      "Remove from History": { label: "Remove from History", accesskey: "H" },

      "Bookmark Page": { label: "Bookmark Page", accesskey: "B" },
    },
  };
  constructor() {
    this.create = UC_API.Utils.createElement;
    this.config = UndoListInTabmenu.config;
    this.registerSheet();
    // set up context menu for TST, if it's installed. it'll set up even if TST
    // is disabled, since otherwise we'd have to listen for addon
    // disabling/enabling, and it's too much work to set up an addon manager
    // listener. but that doesn't matter, since if TST is disabled, its sidebar
    // will never be opened, and most of the setup is triggered by the sidebar
    // opening.
    this.attachSidebarListener();
    // set up the built-in tabs bar context menu.
    this.makePopups(document.getElementById("tabContextMenu"));
    // this context menu shows when you right-click an empty area in the tab strip.
    this.makePopups(document.getElementById("toolbar-context-menu"));
    this.modMethods();
  }
  // if the recently closed windows menu is empty, or it's only full of popups
  // and the user set "Include popup windows" to false, we should hide the menu.
  get shouldHideWindows() {
    let windowData = SessionStore.getClosedWindowData();
    return (
      !windowData.length ||
      (!this.config["Include popup windows"] &&
        windowData.every(w => w.isPopup))
    );
  }
  // get a fluent localization interface. we can't use data-l10n-id since that would
  // automatically remove the menus' accesskeys, and we want them to have accesskeys.
  get l10n() {
    if (!this._l10n) {
      this._l10n = new Localization(
        ["browser/menubar.ftl", "browser/recentlyClosed.ftl"],
        true
      );
    }
    return this._l10n;
  }
  // if TST is installed, listen for its sidebar opening
  async attachSidebarListener() {
    let TST = await AddonManager.getAddonByID("treestyletab@piro.sakura.ne.jp");
    if (TST) {
      window.SidebarController._switcherTarget.addEventListener(
        "SidebarShown",
        this
      );
    }
  }
  // when a TST sidebar is created, add context menus.
  // when context menu is opened, hide/show the menus.
  handleEvent(e) {
    let sidebarContext = document
      .getElementById("sidebar")
      ?.document?.getElementById("contentAreaContextMenu");
    switch (e.type) {
      case "SidebarShown":
        // if there's no content area context menu inside the sidebar document,
        // it means a native sidebar is open. (not an extension sidebar) we
        // don't need to remove the DOM nodes since firefox already deleted the
        // whole document. just delete the references so we don't get confused
        // when rebuilding them later.
        if (!sidebarContext) {
          delete this.sidebarContextUndoListPopup;
          delete this.sidebarUndoWindowPopup;
          break;
        }
        // make the popups and listen for the context menu showing. also set an
        // attribute to avoid duplicating everything if there's a repeat event
        // for whatever reason. the content area context menu actually sticks
        // around if you switch from one extension sidebar to another, but we
        // delete our menu items if the sidebar is switched to anything but TST.
        if (
          window.SidebarController.currentID ===
          "treestyletab_piro_sakura_ne_jp-sidebar-action"
        ) {
          if (sidebarContext.hasAttribute("undo-list-init")) break;
          sidebarContext.setAttribute("undo-list-init", true);
          sidebarContext.addEventListener("popupshowing", this);
          this.makeSidebarPopups(sidebarContext);
        } else {
          // destroy everything
          if (!sidebarContext.hasAttribute("undo-list-init")) break;
          sidebarContext.removeAttribute("undo-list-init", true);
          sidebarContext.removeEventListener("popupshowing", this);
          this.destroySidebarPopups();
        }
        break;
      case "popupshowing":
        // the sidebar context menu is showing, so we should hide/show the menus depending
        // on whether they're empty closed tab list is empty so should be hidden
        if (SessionStore.getClosedTabCountForWindow(window) == 0) {
          this.sidebarTabMenu.hidden = true;
          this.sidebarTabMenu.style.removeProperty("display");
        } else {
          this.sidebarTabMenu.hidden = false;
          this.sidebarTabMenu.style.display = "flex";
        }
        // closed window list is empty so should be hidden
        if (this.shouldHideWindows) {
          this.sidebarWindowMenu.hidden = true;
          this.sidebarWindowMenu.style.removeProperty("display");
        } else {
          this.sidebarWindowMenu.hidden = false;
          this.sidebarWindowMenu.style.display = "flex";
        }
        break;
    }
  }
  // return the localized label for "recently closed tabs"
  get closedTabsLabel() {
    return (
      this._closedTabsLabel ||
      (this._closedTabsLabel = this.l10n.formatMessagesSync([
        "menu-history-undo-menu",
      ])[0].attributes[0].value)
    );
  }
  // return the localized label for "recently closed windows"
  get closedWindowsLabel() {
    return (
      this._closedWindowsLabel ||
      (this._closedWindowsLabel = this.l10n.formatMessagesSync([
        "menu-history-undo-window-menu",
      ])[0].attributes[0].value)
    );
  }
  /**
   * create context menu items
   * @param {object} context (the context menu to add menus to)
   */
  makePopups(context) {
    let undoItem = context.querySelector(`[id*="undoCloseTab"]`);
    // Recently Closed Windows
    let windowMenu = this.create(document, "menu", {
      id: `${context.id}-historyUndoWindowMenu3`,
      class: "recently-closed-windows-menu",
      "data-l10n-id": "menu-history-undo-window-menu",
    });
    undoItem.after(windowMenu);
    let windowMenuPopup = windowMenu.appendChild(
      this.create(document, "menupopup")
    );
    windowMenuPopup.addEventListener("popupshowing", e =>
      this.populateSubmenu(e.target, "Window")
    );
    // Recently Closed Tabs
    let tabMenu = this.create(document, "menu", {
      id: `${context.id}-tabContextUndoList`,
      class: "recently-closed-tabs-menu",
      "data-l10n-id": "menu-history-undo-menu",
    });
    undoItem.after(tabMenu);
    let tabMenuPopup = tabMenu.appendChild(this.create(document, "menupopup"));
    tabMenuPopup.addEventListener("popupshowing", e =>
      this.populateSubmenu(e.target, "Tab")
    );
    // every time the context menu opens, handle access keys and enabling/disabling
    // of the menus. menus need to be hidden if there aren't any recently closed
    // tabs/windows in sessionstore, or else the menus will be awkwardly empty.
    context.addEventListener("popupshowing", e => {
      if (e.target !== context) return;
      // if you right-click an empty area in the tab strip, (e.g. if there
      // aren't enough tabs to overflow the strip) you get a different context
      // menu. this is the same context menu you get when you right-click a
      // toolbar button in the navbar. so we have to add separate menuitems to
      // this context menu. and since this context menu doesn't only relate to
      // tabs, we have to hide the new menuitems in other circumstances, like
      // when right-clicking a toolbar button.
      if (e.target.id === "toolbar-context-menu") {
        let toolbarItem = e.target.triggerNode;
        if (toolbarItem && toolbarItem.localName == "toolbarpaletteitem") {
          toolbarItem = toolbarItem.firstElementChild;
        } else if (toolbarItem && toolbarItem.localName != "toolbar") {
          while (toolbarItem && toolbarItem.parentElement) {
            let parent = toolbarItem.parentElement;
            if (
              (parent.classList &&
                parent.classList.contains("customization-target")) ||
              parent.getAttribute("overflowfortoolbar") || // Needs to work in the overflow list as well.
              parent.localName == "toolbarpaletteitem" ||
              parent.localName == "toolbar"
            ) {
              break;
            }
            toolbarItem = parent;
          }
        } else {
          toolbarItem = null;
        }
        if (toolbarItem.id !== "tabbrowser-tabs") {
          tabMenu.hidden = true;
          windowMenu.hidden = true;
          return;
        }
      }
      let winWords = windowMenu.label.split(" ");
      windowMenu.accessKey =
        this.config.l10n["Windows access key"] ||
        (RTL_UI
          ? windowMenu.label.substr(0, 1)
          : winWords[winWords.length - 1]?.substr(0, 1) || "W");

      let tabWords = tabMenu.label.split(" ");
      tabMenu.accessKey =
        this.config.l10n["Tabs access key"] ||
        (RTL_UI
          ? tabMenu.label.substr(0, 1)
          : tabWords[tabWords.length - 1]?.substr(0, 1) || "T");

      // closed tab list is empty so should be hidden
      tabMenu.hidden = !!(SessionStore.getClosedTabCountForWindow(window) == 0);
      // closed window list is empty so should be hidden
      windowMenu.hidden = !!window.undoTabMenu.shouldHideWindows;
    });
  }

  /**
   * create context menu items (for sidebar)
   * @param {object} context (the context menu to add menus to)
   */
  makeSidebarPopups(context) {
    let doc = context.ownerDocument;
    // Recently Closed Tabs
    let tabWords = this.closedTabsLabel.split(" ");
    this.sidebarTabMenu = this.create(doc, "menu", {
      id: "sidebarTabContextUndoList",
      label: this.closedTabsLabel,
      accesskey:
        this.config.l10n["Tabs access key"] ||
        (RTL_UI
          ? this.closedTabsLabel.substr(0, 1)
          : tabWords[tabWords.length - 1]?.substr(0, 1) || "T"),
    });
    context.appendChild(this.sidebarTabMenu);

    this.sidebarContextUndoListPopup = this.sidebarTabMenu.appendChild(
      this.create(doc, "menupopup")
    );
    this.sidebarContextUndoListPopup.addEventListener("popupshowing", e =>
      this.populateSidebarSubmenu(e.target, "Tab")
    );

    // Recently Closed Windows
    let winWords = this.closedWindowsLabel.split(" ");
    this.sidebarWindowMenu = this.create(doc, "menu", {
      id: "sidebarHistoryUndoWindowMenu3",
      label: this.closedWindowsLabel,
      accesskey:
        this.config.l10n["Windows access key"] ||
        (RTL_UI
          ? this.closedWindowsLabel.substr(0, 1)
          : winWords[winWords.length - 1]?.substr(0, 1) || "W"),
    });
    context.appendChild(this.sidebarWindowMenu);

    this.sidebarUndoWindowPopup = this.sidebarWindowMenu.appendChild(
      this.create(doc, "menupopup")
    );
    this.sidebarUndoWindowPopup.addEventListener("popupshowing", e =>
      this.populateSidebarSubmenu(e.target, "Window")
    );
  }

  // clean up all the sidebar context menu stuff we created
  destroySidebarPopups() {
    this.sidebarTabMenu.remove();
    this.sidebarWindowMenu.remove();
    delete this.sidebarTabMenu;
    delete this.sidebarWindowMenu;
  }

  /**
   * update submenu items
   * @param {object} popup (a menupopup DOM node to populate)
   * @param {string} type (the type of submenu being updated; "Tab" or "Window")
   */
  populateSubmenu(popup, type) {
    // remove existing menuitems
    while (popup.hasChildNodes()) popup.firstChild.remove();
    let fragment;

    // list is empty so should be hidden
    const itemsCount =
      SessionStore[`getClosed${type}Count${type === "Tab" ? "ForWindow" : ""}`](
        window
      );
    if (itemsCount === 0) {
      popup.parentNode.hidden = true;
      return;
    }
    popup.parentNode.hidden = false; // enable menu if it's not empty

    // make the list of menuitems
    fragment = RecentlyClosedTabsAndWindowsMenuUtils[`get${type}sFragment`](
      window,
      "menuitem",
      false,
      true
    );

    fragment.lastChild.accessKey = fragment.lastChild.label.substr(0, 1) || "R";
    popup.appendChild(fragment); // populate menu
  }

  /**
   * update sidebar submenu items
   * @param {object} popup (a menupopup DOM node to populate)
   * @param {string} type (the type of submenu being updated; "Tab" or "Window")
   */
  populateSidebarSubmenu(popup, type) {
    // remove existing menuitems
    while (popup.hasChildNodes()) popup.firstChild.remove();
    let fragment;

    // list is empty so should be hidden
    const itemsCount =
      SessionStore[`getClosed${type}Count${type === "Tab" ? "ForWindow" : ""}`](
        window
      );
    if (itemsCount === 0) {
      popup.parentNode.hidden = true;
      return;
    }
    popup.parentNode.hidden = false; // enable menu if it's not empty

    // make a temporary list of menuitems
    fragment = RecentlyClosedTabsAndWindowsMenuUtils[`get${type}sFragment`](
      window,
      "menuitem",
      false,
      true
    );

    // a bit of a sketchy hack... instead of inserting the fragment directly, we
    // need to create the elements *inside* the sidebar document or else they're
    // missing a bunch of class methods, like content optimizations. the only
    // way I could find to get them to render properly is to iterate over the
    // fragment, building a new tree as we go.
    Object.values(fragment.children).forEach(item => {
      let newItem = popup.ownerDocument.createXULElement(item.tagName);
      Object.values(item.attributes).forEach(attribute => {
        if (attribute.name === "key") return;
        newItem.setAttribute(attribute.name, attribute.value);
      });
      popup.appendChild(newItem);
    });

    popup.lastChild.accessKey = popup.lastChild.label.substr(0, 1) || "R";
  }
  modMethods() {
    if (RecentlyClosedTabsAndWindowsMenuUtils._ucjsModded) return;
    RecentlyClosedTabsAndWindowsMenuUtils._ucjsModded = true;

    const lazy = {};
    ChromeUtils.defineESModuleGetters(lazy, {
      PlacesUIUtils:
        "moz-src:///browser/components/places/PlacesUIUtils.sys.mjs",
      PrivateBrowsingUtils:
        "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
      SessionStore: "resource:///modules/sessionstore/SessionStore.sys.mjs",
      SessionWindowUI:
        "resource:///modules/sessionstore/SessionWindowUI.sys.mjs",
    });
    XPCOMUtils.defineLazyPreferenceGetter(
      lazy,
      "closedTabsFromClosedWindowsEnabled",
      "browser.sessionstore.closedTabsFromClosedWindows"
    );
    XPCOMUtils.defineLazyPreferenceGetter(
      lazy,
      "closedTabsFromAllWindowsEnabled",
      "browser.sessionstore.closedTabsFromAllWindows"
    );

    Object.defineProperty(RecentlyClosedTabsAndWindowsMenuUtils, "l10n", {
      configurable: true,
      enumerable: true,
      get: () => this.l10n,
    });
    RecentlyClosedTabsAndWindowsMenuUtils.setImage = function (
      aItem,
      aElement
    ) {
      let iconURL = aItem.image;
      if (/^https?:/.test(iconURL)) iconURL = `moz-anno:favicon:${iconURL}`;
      aElement.setAttribute("image", iconURL);
    };
    RecentlyClosedTabsAndWindowsMenuUtils.createEntry = function (
      aTagName,
      aIsWindowsFragment,
      aIndex,
      aClosedTab,
      aDocument,
      aMenuLabel,
      aFragment,
      forContext
    ) {
      let element = aDocument.createXULElement(aTagName);
      element.setAttribute("label", aMenuLabel);
      if (aClosedTab.image) {
        const iconURL = lazy.PlacesUIUtils.getImageURL(aClosedTab.image);
        element.setAttribute("image", iconURL);
      }
      element.setAttribute("value", aIndex);
      element.setAttribute(
        "restore-type",
        aIsWindowsFragment ? "window" : "tab"
      );
      if (aTagName == "menuitem") {
        element.setAttribute(
          "class",
          "menuitem-iconic bookmark-item menuitem-with-favicon"
        );
      } else if (aTagName == "toolbarbutton") {
        element.setAttribute(
          "class",
          "subviewbutton subviewbutton-iconic bookmark-item"
        );
      }
      element.classList.add("recently-closed-item");

      if (aIsWindowsFragment) {
        element.addEventListener("command", event =>
          event.target.ownerGlobal.undoCloseWindow(aIndex)
        );
      } else if (typeof aClosedTab.sourceClosedId == "number") {
        // sourceClosedId is used to look up the closed window to remove it when the tab is restored
        let { sourceClosedId } = aClosedTab;
        element.setAttribute("source-closed-id", sourceClosedId);
        element.setAttribute("value", aClosedTab.closedId);
        element.addEventListener(
          "command",
          event => {
            lazy.SessionStore.undoClosedTabFromClosedWindow(
              { sourceClosedId },
              aClosedTab.closedId
            );
            if (event.button === 1) {
              aDocument.ownerGlobal.gBrowser.moveTabToEnd();
            }
          },
          { once: true }
        );
      } else {
        // sourceWindowId is used to look up the closed tab entry to remove it when it is restored
        let { sourceWindowId } = aClosedTab;
        element.setAttribute("value", aIndex);
        element.setAttribute("source-window-id", sourceWindowId);
        element.addEventListener("command", event => {
          lazy.SessionWindowUI.undoCloseTab(
            event.target.ownerGlobal,
            aIndex,
            sourceWindowId
          );
          if (event.button === 1) {
            aDocument.ownerGlobal.gBrowser.moveTabToEnd();
          }
        });
      }

      let tabData = aIsWindowsFragment ? aClosedTab : aClosedTab.state;
      let activeIndex = (tabData.index || tabData.entries.length) - 1;
      if (activeIndex >= 0 && tabData.entries[activeIndex]) {
        element.setAttribute("targetURI", tabData.entries[activeIndex].url);
      }
      if (aTagName != "menuitem") {
        element.addEventListener("click", e =>
          aDocument.ownerGlobal.undoTabSubmenu[
            `on${aIsWindowsFragment ? "Window" : "Tab"}ItemClick`
          ](e)
        );
      }
      if (!forContext && aTagName != "menuitem") {
        element.setAttribute("tooltip", "bhTooltip");
        if (UndoListInTabmenu.config["Enable context menus in panels"]) {
          element.setAttribute("context", "recently-closed-menu");
        }
        if (aIndex == 0) {
          element.setAttribute(
            "key",
            `key_undoClose${aIsWindowsFragment ? "Window" : "Tab"}`
          );
        }
      }
      let identity =
        aDocument.ownerGlobal.ContextualIdentityService?.getPublicIdentityFromId(
          tabData.userContextId
        );
      if (identity && identity.color) {
        element.setAttribute("usercontextid", identity.userContextId);
        element.classList.add(`identity-color-${identity.color}`);
      }
      aFragment.appendChild(element);
    };
    RecentlyClosedTabsAndWindowsMenuUtils.createRestoreAllEntry = function (
      aDocument,
      aFragment,
      aIsWindowsFragment,
      aRestoreAllLabel,
      aTagName
    ) {
      let restoreAllElements = aDocument.createXULElement(aTagName);
      restoreAllElements.classList.add("restoreallitem");
      if (aTagName == "toolbarbutton") {
        restoreAllElements.classList.add(
          "subviewbutton",
          "panel-subview-footer-button"
        );
      }
      restoreAllElements.setAttribute(
        "label",
        this.l10n.formatValueSync(aRestoreAllLabel)
      );
      restoreAllElements.addEventListener(
        "command",
        aIsWindowsFragment
          ? this.onRestoreAllWindowsCommand
          : this.onRestoreAllTabsCommand
      );
      if (aTagName == "menuitem") {
        aFragment.appendChild(aDocument.createXULElement("menuseparator"));
      }
      aFragment.appendChild(restoreAllElements);
    };
    RecentlyClosedTabsAndWindowsMenuUtils.getWindowsFragment = function (
      aWindow,
      aTagName,
      aPrefixRestoreAll = false,
      forContext
    ) {
      let closedWindowData = lazy.SessionStore.getClosedWindowData();
      let doc = aWindow.document;
      let fragment = doc.createDocumentFragment();
      if (closedWindowData.length) {
        for (let i = 0; i < closedWindowData.length; i++) {
          const { selected, tabs, title, isPopup } = closedWindowData[i];
          const selectedTab = tabs[selected - 1];
          let menuLabel = this.l10n.formatValueSync(
            "recently-closed-undo-close-window-label",
            { tabCount: tabs.length - 1, winTitle: title }
          );
          if (UndoListInTabmenu.config.l10n["Popup window label"] && isPopup) {
            menuLabel = `${menuLabel} ${UndoListInTabmenu.config.l10n["Popup window label"]}`;
          }

          if (
            !isPopup ||
            UndoListInTabmenu.config["Include popup windows"] ||
            !forContext
          ) {
            this.createEntry(
              aTagName,
              true,
              i,
              selectedTab,
              doc,
              menuLabel,
              fragment,
              forContext
            );
          }
        }

        this.createRestoreAllEntry(
          doc,
          fragment,
          true,
          aTagName == "menuitem"
            ? "recently-closed-menu-reopen-all-windows"
            : "recently-closed-panel-reopen-all-windows",
          aTagName
        );
      }
      return fragment;
    };
    RecentlyClosedTabsAndWindowsMenuUtils.getTabsFragment = function (
      aWindow,
      aTagName,
      aPrefixRestoreAll = false,
      forContext
    ) {
      let doc = aWindow.document;
      const isPrivate = lazy.PrivateBrowsingUtils.isWindowPrivate(aWindow);
      let fragment = doc.createDocumentFragment();
      let isEmpty = true;
      if (
        lazy.SessionStore.getClosedTabCount({
          sourceWindow: aWindow,
          closedTabsFromClosedWindows: false,
        })
      ) {
        isEmpty = false;
        const browserWindows = lazy.closedTabsFromAllWindowsEnabled
          ? lazy.SessionStore.getWindows(aWindow)
          : [aWindow];
        for (const win of browserWindows) {
          let closedTabs = lazy.SessionStore.getClosedTabDataForWindow(win);
          for (let i = 0; i < closedTabs.length; i++) {
            this.createEntry(
              aTagName,
              false,
              i,
              closedTabs[i],
              doc,
              closedTabs[i].title,
              fragment,
              forContext
            );
          }
        }

        if (
          !isPrivate &&
          lazy.closedTabsFromClosedWindowsEnabled &&
          lazy.SessionStore.getClosedTabCountFromClosedWindows()
        ) {
          isEmpty = false;
          const closedTabs =
            lazy.SessionStore.getClosedTabDataFromClosedWindows();
          for (let i = 0; i < closedTabs.length; i++) {
            this.createEntry(
              aTagName,
              false,
              i,
              closedTabs[i],
              doc,
              closedTabs[i].title,
              fragment,
              forContext
            );
          }
        }

        if (!isEmpty) {
          this.createRestoreAllEntry(
            doc,
            fragment,
            false,
            aTagName == "menuitem"
              ? "recently-closed-menu-reopen-all-tabs"
              : "recently-closed-panel-reopen-all-tabs",
            aTagName
          );
        }
      }
      return fragment;
    };
  }
  registerSheet() {
    let tag;
    let { inPopupPanels, inMenupopups, showForWindows } =
      this.config["Show container tab colors"];
    if (inPopupPanels && inMenupopups) tag = "";
    else if (inPopupPanels) tag = "toolbarbutton";
    else if (inMenupopups) tag = "menuitem";
    else return;
    let restoreType = showForWindows ? "" : `[restore-type="tab"]`;
    const css = `${tag}.recently-closed-item[usercontextid]${restoreType} {
            background-image: linear-gradient(
                to right,
                var(--identity-tab-color, transparent) 0,
                var(--identity-tab-color, transparent) 3px,
                transparent 3px
            );
        }`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

class RecentlyClosedPanelContext {
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  constructor() {
    this.config = UndoListInTabmenu.config;
    let { l10n } = this.config;
    XPCOMUtils.defineLazyPreferenceGetter(
      this,
      "REMOVE_ON_MID_CLICK",
      "userChrome.tabs.recentlyClosedTabs.middle-click-to-remove",
      false
    );
    this.menupopup = document.querySelector("#mainPopupSet").appendChild(
      UC_API.Utils.createElement(document, "menupopup", {
        id: "recently-closed-menu",
      })
    );
    this.menupopup.addEventListener("command", this);
    this.menupopup.addEventListener("popupshowing", this);

    this.restore = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-restore",
        label: l10n.Restore.label,
        accesskey: l10n.Restore.accesskey,
      })
    );
    this.restoreInNewWindow = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-restore-in-new-window",
        label: l10n["Restore in New Window"].label,
        accesskey: l10n["Restore in New Window"].accesskey,
      })
    );
    this.restoreInNewPrivateWindow = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-restore-in-new-private-window",
        label: l10n["Restore in New Private Window"].label,
        accesskey: l10n["Restore in New Private Window"].accesskey,
      })
    );
    this.removalSeparator = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuseparator", {
        id: "recently-closed-removal-separator",
      })
    );
    this.removeFromList = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-remove-from-list",
        label: l10n["Remove from List"].label,
        accesskey: l10n["Remove from List"].accesskey,
      })
    );
    this.removeFromHistory = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-remove-from-history",
        label: l10n["Remove from History"].label,
        accesskey: l10n["Remove from History"].accesskey,
      })
    );
    this.placesSeparator = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuseparator", {
        id: "recently-closed-places-separator",
      })
    );
    this.bookmark = this.menupopup.appendChild(
      UC_API.Utils.createElement(document, "menuitem", {
        id: "recently-closed-bookmark",
        label: l10n["Bookmark Page"].label,
        accesskey: l10n["Bookmark Page"].accesskey,
      })
    );
    // firefox only updates the recently closed x panels when they're initially opened.
    // so if you close a tab while it's open, that tab won't be added to the panel.
    Services.obs.addObserver(this, "sessionstore-closed-objects-changed");
  }
  goBackOrHide(panelview, force = false) {
    if (!panelview.panelMultiView) return;
    let multiView = PanelMultiView.forNode(panelview.panelMultiView);
    if (force || !(multiView.openViews?.length > 1)) {
      multiView?.hidePopup();
    } else {
      multiView.goBack();
    }
  }
  updatePanel(panelview) {
    if (!panelview) return;
    if (panelview.id !== "PanelUI-history") {
      let text = panelview.querySelector(
        ".panel-header > h1 > span"
      ).textContent;
      panelview.dispatchEvent(
        new CustomEvent("ViewShowing", { bubbles: true })
      );
      PanelView.forNode(panelview).headerText = text;
    }
    PanelMultiView.getViewNode(document, "appMenuRecentlyClosedTabs").disabled =
      SessionStore.getClosedTabCountForWindow(window) == 0;
    PanelMultiView.getViewNode(
      document,
      "appMenuRecentlyClosedWindows"
    ).disabled = SessionStore.getClosedWindowCount() == 0;
  }
  handleEvent(e) {
    switch (e.type) {
      case "popupshowing":
        this.onPopupShowing();
        break;
      case "command":
        this.onCommand(e);
        break;
      default:
    }
  }
  async observe(subject, topic, data) {
    if (this.updateTimer || topic !== "sessionstore-closed-objects-changed") {
      return;
    }
    this.updateTimer = await this.sleep(15);
    this.updatePanel(
      document.querySelector(
        "panelview[visible]:is(#appMenu-library-recentlyClosedTabs, #appMenu-library-recentlyClosedWindows, #PanelUI-history)"
      )
    );
    delete this.updateTimer;
  }
  onPopupShowing() {
    let button = this.menupopup.triggerNode;
    this.restoreInNewWindow.hidden = this.restoreInNewPrivateWindow.hidden =
      button.getAttribute("restore-type") !== "tab";
    if (PrivateBrowsingUtils.isWindowPrivate(window)) {
      this.restoreInNewPrivateWindow.hidden = true;
    }
  }
  async onCommand(e) {
    let button = this.menupopup.triggerNode;
    let panelview = button.closest("panelview");
    switch (e.target) {
      case this.restore:
        this.onRestore(e, button);
        break;
      case this.restoreInNewWindow:
        this.onRestoreInNewWindow(button, panelview);
        break;
      case this.restoreInNewPrivateWindow:
        this.onRestoreInNewWindow(button, panelview, { private: true });
        break;
      case this.removeFromList:
        this.onRemoveFromList(button);
        break;
      case this.removeFromHistory:
        await this.onRemoveFromHistory(button);
        break;
      case this.bookmark:
        this.onBookmark(button, panelview);
        break;
      default:
        return;
    }
    this.updatePanel(panelview);
  }
  onRestore(e, button) {
    switch (button.getAttribute("restore-type")) {
      case "tab":
        this.onRestoreTab(e, button);
        break;
      case "window":
        undoCloseWindow(button.getAttribute("value"));
        break;
    }
    button.remove();
  }
  onRestoreTab(e, button) {
    window.SessionWindowUI.undoCloseTab(
      window,
      Number(button.getAttribute("value"))
    );
    undoCloseTab(Number(button.getAttribute("value")));
    if (e.button === 1) gBrowser.moveTabToEnd();
  }
  onRestoreInNewWindow(button, panelview, params = {}) {
    // open a new window
    if (PrivateBrowsingUtils.isWindowPrivate(window)) params.private = true;
    let newWin = OpenBrowserWindow(params);
    let value = button.getAttribute("value");
    let tabData = SessionStore.getClosedTabDataForWindow(window)[value];
    let { state } = tabData;
    let init = () => {
      let tabbrowser = newWin.gBrowser || newWin._gBrowser;
      let tab = tabbrowser.addTrustedTab(null, {
        pinned: state.pinned,
        userContextId: state.userContextId,
      });
      let firstTab = tabbrowser.selectedTab;
      tabbrowser.selectedTab = tab;
      tabbrowser.removeTab(firstTab, { animate: false, byMouse: false });
      // restore closed tab state into the new window's tab
      SessionStore.setTabState(tab, state);
      SessionStore.forgetClosedTab(window, value);
      this.goBackOrHide(panelview, true);
    };
    // wait until the new window's tabbrowser is initialized
    if (newWin.gBrowserInit?.delayedStartupFinished) {
      init();
    } else {
      let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == newWin) {
          Services.obs.removeObserver(delayedListener, topic);
          init();
        }
      };
      Services.obs.addObserver(
        delayedListener,
        "browser-delayed-startup-finished"
      );
    }
  }
  onRemoveFromList(button) {
    let value = button.getAttribute("value");
    switch (button.getAttribute("restore-type")) {
      case "tab":
        SessionStore.forgetClosedTab(window, value);
        break;
      case "window":
        SessionStore.forgetClosedWindow(value);
        break;
    }
    button.remove();
  }
  async onRemoveFromHistory(button) {
    let working;
    switch (button.getAttribute("restore-type")) {
      case "tab":
        working = await this.forgetClosedTab();
        break;
      case "window":
        working = await this.forgetClosedWindow();
        break;
    }
    if (working) button.remove();
  }
  onBookmark(button, panelview) {
    switch (button.getAttribute("restore-type")) {
      case "tab":
        this.bookmarkFromTab();
        break;
      case "window":
        this.bookmarkFromWindow();
        break;
    }
    this.goBackOrHide(panelview, true);
  }
  async forgetEntries(entries) {
    if (!entries.length) return;
    let URIs = new Set();
    entries.forEach(entry => entry.url && URIs.add(entry.url));
    if (URIs.size) await PlacesUtils.history.remove([...URIs]);
  }
  async forgetClosedTab() {
    let button = this.menupopup.triggerNode;
    let value = button.getAttribute("value");
    let tabData = SessionStore.getClosedTabDataForWindow(window)[value];
    if (!tabData) return false;
    await this.forgetEntries(tabData?.state.entries);
    SessionStore.forgetClosedTab(window, value);
    return true;
  }
  async forgetClosedWindow() {
    let button = this.menupopup.triggerNode;
    let value = button.getAttribute("value");
    let winData = SessionStore.getClosedWindowData()[value];
    if (!winData) return false;
    let { tabs } = winData;
    if (!tabs.length) return false;
    for (let tab of tabs) await this.forgetEntries(tab.entries);
    SessionStore.forgetClosedWindow(value);
    return true;
  }
  bookmarkFromTab() {
    let button = this.menupopup.triggerNode;
    let value = button.getAttribute("value");
    let tabData = SessionStore.getClosedTabDataForWindow(window)[value];
    let { state } = tabData;
    let activeEntry = state.entries[state.index - 1];
    PlacesUIUtils.showBookmarkPagesDialog(
      [{ uri: Services.io.newURI(activeEntry.url), title: activeEntry.title }],
      ["keyword", "location"],
      window.top
    );
  }
  bookmarkFromWindow() {
    let button = this.menupopup.triggerNode;
    let value = button.getAttribute("value");
    let winData = SessionStore.getClosedWindowData()[value];
    let { tabs } = winData;
    if (!tabs.length) return;
    let activeTab = tabs[winData.selected - 1];
    let activeEntry = activeTab.entries[activeTab.index - 1];
    PlacesUIUtils.showBookmarkPagesDialog(
      [{ uri: Services.io.newURI(activeEntry.url), title: activeEntry.title }],
      ["keyword", "location"],
      window.top
    );
  }
  onTabItemClick(e) {
    let target = e.currentTarget;
    if (this.REMOVE_ON_MID_CLICK) {
      switch (e.button) {
        case 0: {
          let { shiftKey } = e;
          let accelKey = e.getModifierState("Accel");
          if (accelKey) {
            if (shiftKey) {
              let panelview = target.closest("panelview");
              this.onRestoreInNewWindow(target, panelview);
              e.preventDefault();
            } else {
              break;
            }
          }
          return;
        }
        case 1:
          this.onRemoveFromList(target);
        // fall through
        default:
          return;
      }
    } else if (e.button != 1) {
      return;
    }
    window.SessionWindowUI.undoCloseTab(
      window,
      Number(target.getAttribute("value"))
    );
    gBrowser.moveTabToEnd();
    let ancestorPanel = target.closest("panel");
    if (ancestorPanel) ancestorPanel.hidePopup();
  }
  onWindowItemClick(e) {
    if (this.REMOVE_ON_MID_CLICK && e.button === 1) {
      this.onRemoveFromList(e.currentTarget);
    }
  }
}

// wait until the tab context menu exists
if (gBrowserInit.delayedStartupFinished) {
  window.undoTabMenu = new UndoListInTabmenu();
  if (UndoListInTabmenu.config["Enable context menus in panels"]) {
    window.undoTabSubmenu = new RecentlyClosedPanelContext();
  }
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.undoTabMenu = new UndoListInTabmenu();
      if (UndoListInTabmenu.config["Enable context menus in panels"]) {
        window.undoTabSubmenu = new RecentlyClosedPanelContext();
      }
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
