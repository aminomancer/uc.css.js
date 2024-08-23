// ==UserScript==
// @name           Context Menu Mods
// @version        1.0.6
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Add some new items to the main content area context menu.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/contextMenuMods.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/contextMenuMods.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @include        chrome://browser/content/webext-panels.xhtml
// ==/UserScript==

class ContextMenuMods {
  config = {
    // Set to true to replace the "Search Google for <selection>" context menu
    // item with a submenu that allows you to search for the selection with any
    // of your installed search engines.
    "Replace search menuitem with submenu": Services.prefs.getBoolPref(
      "contextMenuMods.searchSubMenu",
      true
    ),

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

  engines = [];

  constructor() {
    this._searchMenuitem();
  }

  maybeInit() {
    if (!this._initialized && "nsContextMenu" in window) {
      this._initialized = true;
      delete this.contextMenu.addEventListener;
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
      `data:text/css;charset=UTF=8,${encodeURIComponent(sheet)}`
    );
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }

  _searchMenuitem() {
    if (!this.config["Replace search menuitem with submenu"]) return;

    this.contextMenu = document.getElementById("contentAreaContextMenu");

    this.contextMenu.addEventListener = new Proxy(
      this.contextMenu.addEventListener,
      {
        apply: (target, thisArg, args) => {
          let [type, callback] = args;
          if (type === "popupshowing" && callback instanceof Function) {
            args[1] = event => {
              this.maybeInit();
              Reflect.apply(callback, thisArg, [event]);
            };
          }
          return Reflect.apply(target, thisArg, args);
        },
      }
    );

    let enginesLocked = false;

    const _updateEngines = async () => {
      if (enginesLocked) return;
      enginesLocked = true;
      this.engines.length = 0;
      await Services.search.promiseInitialized;
      let engineObjects = await Services.search.getVisibleEngines();
      await Promise.all(
        engineObjects.map(async engine => {
          if (engine.hideOneOffButton) return null;
          return this.engines.push({
            id: engine.id,
            name: engine.name,
            iconURL: await engine.getIconURL(16),
          });
        })
      );
      enginesLocked = false;
    };

    const onEngineModified = (_subject, topic) => {
      if (topic == "browser-search-engine-modified") {
        _updateEngines();
      }
    };

    const onStartup = () => {
      _updateEngines();
      Services.obs.addObserver(
        onEngineModified,
        "browser-search-engine-modified"
      );
      window.addEventListener("unload", () =>
        Services.obs.removeObserver(
          onEngineModified,
          "browser-search-engine-modified"
        )
      );
    };

    if (gBrowserInit.delayedStartupFinished) {
      onStartup();
    } else {
      const delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
          Services.obs.removeObserver(delayedListener, topic);
          onStartup();
        }
      };
      Services.obs.addObserver(
        delayedListener,
        "browser-delayed-startup-finished"
      );
    }

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
    const { config } = this;

    const getEngines = () => this.engines;

    if (
      !Object.prototype.hasOwnProperty.call(
        nsContextMenu.prototype,
        "createSearchMenu"
      )
    ) {
      nsContextMenu.prototype.createSearchMenu = function createSearchMenu(
        event
      ) {
        while (event.target.hasChildNodes()) {
          event.target.firstChild.remove();
        }

        let { document } = this.window;
        let fragment = document.createDocumentFragment();
        for (let engine of getEngines()) {
          let item = document.createXULElement("menuitem");
          item.classList.add("menuitem-iconic", "searchmenuitem");
          item.setAttribute("engine-id", engine.id);
          item.setAttribute("label", engine.name);
          if (engine.iconURL) {
            item.style.setProperty("--engine-icon", `url('${engine.iconURL}')`);
          }
          fragment.appendChild(item);
        }
        event.target.appendChild(fragment);
      };
    }

    if (
      nsContextMenu.prototype.showAndFormatSearchContextItem.name ===
      "showAndFormatSearchContextItem"
    ) {
      const lazy = {};
      ChromeUtils.defineESModuleGetters(lazy, {
        PrivateBrowsingUtils:
          "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
      });
      nsContextMenu.prototype.showAndFormatSearchContextItem =
        function aminoShowAndFormatSearchContextItem() {
          let { document } = this.window;
          let menuItem = document.getElementById("context-searchselect");
          let menuItemPrivate = document.getElementById(
            "context-searchselect-private"
          );
          if (!Services.search.isInitialized) {
            menuItem.hidden = true;
            menuItemPrivate.hidden = true;
            return;
          }
          const docIsPrivate = lazy.PrivateBrowsingUtils.isBrowserPrivate(
            this.browser
          );
          const privatePref =
            "browser.search.separatePrivateDefault.ui.enabled";
          let showSearchSelect =
            !this.inAboutDevtoolsToolbox &&
            (this.isTextSelected || this.onLink) &&
            !this.onImage;
          // Don't show the private search item when we're already in a private
          // browsing window.
          let showPrivateSearchSelect =
            showSearchSelect &&
            !docIsPrivate &&
            Services.prefs.getBoolPref(privatePref);

          menuItem.hidden = !showSearchSelect;
          menuItemPrivate.hidden = !showPrivateSearchSelect;
          let frameSeparator = document.getElementById("frame-sep");

          // Add a divider between "Search X for Y" and "This Frame", and between "Search X for Y" and "Check Spelling",
          // but no divider in other cases.
          frameSeparator.toggleAttribute(
            "ensureHidden",
            !showSearchSelect && this.inFrame
          );
          // If we're not showing the menu items, we can skip formatting the labels.
          if (!showSearchSelect) {
            return;
          }

          let selectedText = this.isTextSelected
            ? this.selectedText
            : this.linkTextStr;

          // Store searchTerms in context menu item so we know what to search onclick
          menuItem.searchTerms = menuItemPrivate.searchTerms = selectedText;
          menuItem.principal = menuItemPrivate.principal = this.principal;
          menuItem.csp = menuItemPrivate.csp = this.csp;

          // Copied to alert.js' prefillAlertInfo().
          // If the JS character after our truncation point is a trail surrogate,
          // include it in the truncated string to avoid splitting a surrogate pair.
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
            menuItemPrivate.accessKey =
              config.l10n.searchMenuPrivate.menuAccesskey;
          }
        };
    }
  }

  search(searchTerms, usePrivate, principal, csp, event) {
    let engineId = event.target.getAttribute("engine-id");
    let engine = Services.search.getEngineById(engineId);

    event = BrowserUtils.getRootEvent(event);
    let where = BrowserUtils.whereToOpenLink(event);
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
