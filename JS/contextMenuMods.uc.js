// ==UserScript==
// @name           Context Menu Mods
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Add some new items to the main content area context menu.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @include        chrome://browser/content/webext-panels.xhtml
// ==/UserScript==

class ContextMenuMods {
  config = {
    // Set to true to replace the "Search Google for <selection>" context menu
    // item with a submenu that allows you to search for the selection with any
    // of your installed search engines.
    "Replace search menuitem with submenu": true,

    l10n: {
      // These are used for the main search menu label.
      searchMenu: {
        menuLabel: `Search for “%S”`, // %S is replaced with the selected text
        menuAccesskey: "S", // Defines the alt shortcut key for the menu item
      },
      // Used for the search menu label when the document is private.
      searchMenuPrivate: {
        menuLabel: "Search in a Private Window",
        menuAccesskey: "h",
      },
    },
  };

  _initialized = false;

  constructor() {
    this.contextMenu = document.getElementById("contentAreaContextMenu");
    this.originalCallback = this.contextMenu.getAttribute("onpopupshowing");
    this.contextMenu.setAttribute(
      "onpopupshowing",
      this.originalCallback.replace(
        /(gContextMenu = new nsContextMenu)/,
        "ucContextMenuMods.init();   $1"
      )
    );
    this._searchMenuitem();
  }

  init() {
    if (!this._initialized && "nsContextMenu" in window) {
      this._initialized = true;
      this.contextMenu.setAttribute("onpopupshowing", this.originalCallback);
      this._registerSheet();
      this._searchMenuItemInit();
    }
  }

  _registerSheet() {
    let sheet = /* css */ `
      .menuitem-iconic.searchmenuitem {
        list-style-image: var(
          --engine-icon,
          url("chrome://global/skin/icons/search-glass.svg")
        );
        -moz-context-properties: fill;
        fill: currentColor;
      }
    `;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(
      "data:text/css;charset=UTF=8," + encodeURIComponent(sheet)
    );
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }

  _searchMenuitem() {
    if (!this.config["Replace search menuitem with submenu"]) return;

    let originalMenu = this.contextMenu.querySelector("#context-searchselect");
    let originalMenuPrivate = this.contextMenu.querySelector(
      "#context-searchselect-private"
    );
    let menus = MozXULElement.parseXULToFragment(/* html */ `
      <menu
        id="context-searchselect"
        oncommand="ucContextMenuMods.search(this.searchTerms, this.usePrivate, this.principal, this.csp, event);"
        onpopupshowing="return gContextMenu.createSearchMenu(event);"
      >
        <menupopup />
      </menu>
      <menu
        id="context-searchselect-private"
        oncommand="ucContextMenuMods.search(this.searchTerms, true, this.principal, this.csp, event);"
        onpopupshowing="return gContextMenu.createSearchMenu(event);"
      >
        <menupopup />
      </menu>
    `);
    originalMenu.after(menus);
    originalMenu.remove();
    originalMenuPrivate.remove();
  }

  _searchMenuItemInit() {
    let { config } = this;

    if (!config["Replace search menuitem with submenu"]) return;

    let getSearchEngines = () =>
      Services.search.wrappedJSObject?._cachedSortedEngines?.filter(
        engine => !engine.hidden
      );

    if (Services.search.isInitialized && !getSearchEngines()) {
      Services.search.getVisibleEngines(); // Update the engines once.
    }

    nsContextMenu.prototype.createSearchMenu = function(event) {
      while (event.target.hasChildNodes()) {
        event.target.firstChild.remove();
      }

      let docfrag = document.createDocumentFragment();
      for (let engine of getSearchEngines()) {
        let item = document.createXULElement("menuitem");
        item.classList.add("menuitem-iconic", "searchmenuitem");
        item.setAttribute("engine-id", engine.id);
        item.setAttribute("label", engine.name);
        let iconURL = engine.getIconURLBySize(16, 16);
        if (iconURL) {
          item.style.setProperty("--engine-icon", `url("${iconURL}")`);
        }
        docfrag.appendChild(item);
      }
      event.target.appendChild(docfrag);
    };

    nsContextMenu.prototype.showAndFormatSearchContextItem = function() {
      let menuItem = document.getElementById("context-searchselect");
      let menuItemPrivate = document.getElementById(
        "context-searchselect-private"
      );
      if (!Services.search.isInitialized) {
        menuItem.hidden = true;
        menuItemPrivate.hidden = true;
        return;
      }
      const docIsPrivate = PrivateBrowsingUtils.isBrowserPrivate(this.browser);
      const privatePref = "browser.search.separatePrivateDefault.ui.enabled";
      let showSearchSelect =
        !this.inAboutDevtoolsToolbox &&
        (this.isTextSelected || this.onLink) &&
        !this.onImage;
      let showPrivateSearchSelect =
        showSearchSelect &&
        !docIsPrivate &&
        Services.prefs.getBoolPref(privatePref);

      menuItem.hidden = !showSearchSelect;
      menuItemPrivate.hidden = !showPrivateSearchSelect;
      let frameSeparator = document.getElementById("frame-sep");

      frameSeparator.toggleAttribute(
        "ensureHidden",
        !showSearchSelect && this.inFrame
      );
      if (!showSearchSelect) return;

      let selectedText = this.isTextSelected
        ? this.textSelected
        : this.linkTextStr;

      menuItem.searchTerms = menuItemPrivate.searchTerms = selectedText;
      menuItem.principal = menuItemPrivate.principal = this.principal;
      menuItem.csp = menuItemPrivate.csp = this.csp;

      if (selectedText.length > 15) {
        let truncLength = 15;
        let truncChar = selectedText[15].charCodeAt(0);
        if (truncChar >= 0xdc00 && truncChar <= 0xdfff) {
          truncLength++;
        }
        selectedText = selectedText.substr(0, truncLength) + this.ellipsis;
      }

      menuItem.usePrivate = docIsPrivate;
      let menuLabel = config.l10n.searchMenu.menuLabel.replace(
        "%S",
        selectedText
      );
      menuItem.label = menuLabel;
      menuItem.accessKey = config.l10n.searchMenu.menuAccesskey;

      if (showPrivateSearchSelect) {
        menuItemPrivate.label = config.l10n.searchMenuPrivate.menuLabel;
        menuItemPrivate.accessKey = config.l10n.searchMenuPrivate.menuAccesskey;
      }
    };
  }

  search(searchTerms, usePrivate, principal, csp, event) {
    let engineId = event.target.getAttribute("engine-id");
    let engine = Services.search.getEngineById(engineId);

    event = getRootEvent(event);
    let where = whereToOpenLink(event);
    if (where == "current") where = "tab";
    if (usePrivate && !PrivateBrowsingUtils.isWindowPrivate(window)) {
      where = "window";
    }
    let inBackground = Services.prefs.getBoolPref(
      "browser.search.context.loadInBackground"
    );
    if (event.button == 1 || event.ctrlKey) {
      inBackground = !inBackground;
    }

    BrowserSearch._loadSearch(
      searchTerms,
      where,
      usePrivate,
      "contextmenu",
      Services.scriptSecurityManager.createNullPrincipal(
        principal.originAttributes
      ),
      csp,
      inBackground,
      engine
    );
  }
}

window.ucContextMenuMods = new ContextMenuMods();
