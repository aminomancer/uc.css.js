// ==UserScript==
// @name           All Tabs Menu Expansion Pack
// @version        2.1.4
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a
// big scrolling menu containing all the tabs. This script adds several new features to the "all
// tabs menu" to help it catch up to the functionality of the regular tabs bar.
// 1. Allows you to drag and drop tabs in the all tabs menu.
// 2. Adds an animated close button for every tab in this menu.
// 3. Allows you to multiselect tabs in the all tabs menu and close an unlimited number of tabs at
//    once without closing/blurring the popup.
// 4. Significantly improves the mute/unmute button by making it work like the mute button in the
//    tabs bar used to work.
//     - If you only have one tab selected, it mutes/unmutes that tab.
//     - If you have multiple tabs selected, it mutes/unmutes all of them.
//     - This also adds a tooltip to the mute button.
// 5. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But
//    for the regular tab bar, unloaded tabs gain an attribute `pending="true"` which you can use to
//    dim them. This way you know which tabs are already initialized and which will actually start
//    up when you click them. Pretty useful if you frequently have 100+ tabs like me.
//     - This script adds the same functionality to the all tabs menu, but does not add "pending"
//       styling to regular tabs since it's outside the scope of this project. To do it yourself
//       just add a rule like `.tabbrowser-tab .tab-content{opacity:.6;}`
//     - If you use [Unread Tab Mods](/script/unreadTabMods.uc.js), this integrates with it to make
//       unread tabs display with italic text.
// 6. Adds color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can
//    differentiate them from normal tabs.
// 7. Includes a preference `userChrome.tabs.all-tabs-menu.reverse-order` that lets you reverse the
//    order of the tabs so that newer tabs are displayed on top rather than on bottom.
// 8. Modifies the all tabs button's tooltip to display the number of tabs as well as the shortcut
//    to open the all tabs menu, Ctrl+Shift+Tab.
// 9. Allows the panel to display pinned tabs, and displays a pin icon on them.
// 10. Makes the sound icon show if the tab has blocked media or media in picture-in-picture, just
//     like regular tabs.
// 11. Adds an optional preference `userChrome.ctrlTab.skip-show-all-button` that lets you skip past
//     the "List All x Tabs" button when hitting Ctrl+Tab.
// 12. And a few other subtle improvements. All the relevant CSS for this is already included in and
//     loaded by the script. It's designed to look consistent with my theme as well as with the
//     latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in
//     here, or the end of uc-tabs-bar.css on my repo.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==
(function() {
  let prefSvc = Services.prefs;
  let reversePref = "userChrome.tabs.all-tabs-menu.reverse-order";
  let skipShowAllPref = "userChrome.ctrlTab.skip-show-all-button";
  const lazy = {};
  ChromeUtils.defineModuleGetter(
    lazy,
    "TabsPanel",
    "resource:///modules/TabsList.jsm"
  );

  /**
   * create a DOM node with given parameters
   * @param {object} aDoc (which doc to create the element in)
   * @param {string} tag (an HTML tag name, like "button" or "p")
   * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
   * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
   * @returns the created DOM node
   */
  function create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }

  function setAttributes(element, attrs) {
    for (let [name, value] of Object.entries(attrs)) {
      if (value) element.setAttribute(name, value);
      else element.removeAttribute(name);
    }
  }

  function findRow(el) {
    return el.classList.contains("all-tabs-item")
      ? el
      : el.closest(".all-tabs-item");
  }

  function l10nIfNeeded() {
    let lazies = document
      .getElementById("tabContextMenu")
      .querySelectorAll("[data-lazy-l10n-id]");
    if (lazies) {
      MozXULElement.insertFTLIfNeeded("browser/tabContextMenu.ftl");
      lazies.forEach(el => {
        el.setAttribute("data-l10n-id", el.getAttribute("data-lazy-l10n-id"));
        el.removeAttribute("data-lazy-l10n-id");
      });
    }
  }

  function reverseTabOrder() {
    let panel = lazy.TabsPanel.prototype;
    if (
      prefSvc.getBoolPref(reversePref) &&
      !lazy.TabsPanel.prototype.reversed
    ) {
      eval(
        `panel._populate = function ${panel._populate
          .toSource()
          .replace(
            /super\.\_populate\(event\)\;/,
            Object.getPrototypeOf(panel)
              ._populate.toSource()
              .replace(/^.*\n\s*/, "")
              .replace(/\n.*$/, "")
          )
          .replace(
            /appendChild/,
            `prepend`
          )}\n panel._addTab = function ${panel._addTab
          .toSource()
          .replace(
            /nextRow\.parentNode\.insertBefore\(newRow\, nextRow\)\;/,
            `nextRow.after(newRow)`
          )
          .replace(/this\.\_addElement/, `this.containerNode.prepend`)}`
      );
      lazy.TabsPanel.prototype.reversed = true;
    } else {
      delete panel._populate;
      delete panel._addTab;
      lazy.TabsPanel.prototype.reversed = false;
    }
  }

  // Adjust the PanelView class methods for each panelview instance to improve
  // key navigation and prevent focusing hidden elements.
  function modifyWalkers(tabsPanel) {
    let panelViewClass = PanelView.forNode(tabsPanel.view);
    if (
      !panelViewClass.moveSelection.toSource().startsWith("(function uc_ATMEP_")
    ) {
      panelViewClass.moveSelection = function uc_ATMEP_moveSelection(
        isDown,
        arrowKey = false
      ) {
        let walker = arrowKey
          ? this._arrowNavigableWalker
          : this._tabNavigableWalker;
        let oldSel = this.selectedElement;
        let newSel;
        if (oldSel) {
          walker.currentNode = oldSel;
          newSel = isDown ? walker.nextNode() : walker.previousNode();
        }
        // If we couldn't find something, select the first or last item:
        if (!newSel) {
          walker.currentNode = walker.root;
          newSel = isDown ? walker.firstChild() : walker.lastChild();
        }
        if (oldSel?.classList.contains("all-tabs-secondary-button")) {
          if (oldSel.parentElement === newSel?.parentElement) {
            walker.currentNode = newSel;
            newSel = isDown ? walker.nextNode() : walker.previousNode();
          }
        }
        this.selectedElement = newSel;
        return newSel;
      };
    }
    if (!panelViewClass.hasOwnProperty("moveSelectionHorizontal")) {
      panelViewClass.moveSelectionHorizontal = function uc_ATMEP_moveSelectionHorizontal(
        isNext
      ) {
        let walker = this._horizontalNavigableWalker;
        let oldSel = this.selectedElement;
        let newSel;
        if (oldSel) {
          walker.currentNode = oldSel;
          newSel = isNext ? walker.nextNode() : walker.previousNode();
        }
        // If we couldn't find something, select the first or last item:
        if (!newSel) {
          walker.currentNode = walker.root;
          newSel = isNext ? walker.firstChild() : walker.lastChild();
        }
        this.selectedElement = newSel;
        return newSel;
      };
    }
    if (!panelViewClass.hasOwnProperty("_horizontalNavigableWalker")) {
      Object.defineProperty(panelViewClass, "_horizontalNavigableWalker", {
        get() {
          if (!this.__horizontalNavigableWalker) {
            this.__horizontalNavigableWalker = this._makeNavigableTreeWalker(
              true,
              false
            );
          }
          return this.__horizontalNavigableWalker;
        },
      });
    }
    if (
      !panelViewClass._makeNavigableTreeWalker
        .toSource()
        .startsWith("(function uc_ATMEP_")
    ) {
      eval(
        `panelViewClass._makeNavigableTreeWalker = function ${panelViewClass._makeNavigableTreeWalker
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^_makeNavigableTreeWalker\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^(.)/, `uc_ATMEP_makeNavigableTreeWalker $1`)
          .replace(/\(arrowKey\)/, `(arrowKey, vertical = true)`)
          // .replace(/(node\.disabled)/, `$1 || node.hidden`)
          .replace(
            /(let bounds = this)/,
            `if (node.hidden) {\n        return NodeFilter.FILTER_SKIP;\n      }\n      $1`
          )
          .replace(
            /(\(!arrowKey && this\._isNavigableWithTabOnly\(node\)\)\n\s*\) \{)/,
            /* javascript */ `$1
        if (vertical && node.classList.contains("all-tabs-secondary-button")) return NodeFilter.FILTER_SKIP;`
          )}`
      );
    }
    if (
      !panelViewClass.keyNavigation.toSource().startsWith("(function uc_ATMEP_")
    ) {
      eval(
        `panelViewClass.keyNavigation = function ${panelViewClass.keyNavigation
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^keyNavigation\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^(.)/, `uc_ATMEP_keyNavigation $1`)
          .replace(
            /(if \(\n\s*\(!this\.window\.RTL_UI && keyCode == \"ArrowLeft\"\) \|\|)/,
            /* javascript */ `if (this.selectedElement && this.selectedElement.matches(".all-tabs-button, .all-tabs-secondary-button")) {
          let isNext = (this.window.RTL_UI && keyCode == "ArrowLeft") || (!this.window.RTL_UI && keyCode == "ArrowRight");
          let nextButton = this.moveSelectionHorizontal(isNext);
          Services.focus.setFocus(nextButton, Services.focus.FLAG_BYKEY);
          break;
        }
        $1`
          )}`
      );
      delete panelViewClass.__arrowNavigableWalker;
      delete panelViewClass.__tabNavigableWalker;
    }
  }

  function prefHandler(_sub, _top, _pref) {
    let multiview = gTabsPanel.allTabsPanel.panelMultiView;
    if (multiview) {
      multiview.addEventListener("PanelMultiViewHidden", reverseTabOrder, {
        once: true,
      });
    } else {
      reverseTabOrder();
    }
  }

  function init() {
    gTabsPanel.init();
    registerSheet();
    let tabsPanels = [
      gTabsPanel.allTabsPanel,
      gTabsPanel.hiddenAudioTabsPopup,
      gTabsPanel.hiddenTabsPopup,
    ];
    let vanillaTooltip = document.getElementById("tabbrowser-tab-tooltip");
    let tooltip = vanillaTooltip.cloneNode(true);
    vanillaTooltip.after(tooltip);
    tooltip.id = "all-tabs-tooltip";
    tooltip.setAttribute(
      "onpopupshowing",
      `gTabsPanel.createTabTooltip(event)`
    );
    tooltip.setAttribute("position", "after_end");
    gTabsPanel.createTabTooltip = function(e) {
      e.stopPropagation();
      let row = e.target.triggerNode?.closest(".all-tabs-item");
      let tab = row?.tab;
      if (!tab) {
        e.preventDefault();
        return;
      }
      let id, args;
      let align = true;
      let { linkedBrowser } = tab;
      const selectedTabs = gBrowser.selectedTabs;
      const contextTabInSelection = selectedTabs.includes(tab);
      const tabCount = contextTabInSelection ? selectedTabs.length : 1;
      if (row.querySelector("[close-button]").matches(":hover")) {
        id = "tabbrowser-close-tabs-tooltip";
        args = { tabCount };
        align = false;
      } else if (row.querySelector("[toggle-mute]").matches(":hover")) {
        args = { tabCount };
        if (contextTabInSelection) {
          id = linkedBrowser.audioMuted
            ? "tabbrowser-unmute-tab-audio-tooltip"
            : "tabbrowser-mute-tab-audio-tooltip";
          const keyElem = document.getElementById("key_toggleMute");
          args.shortcut = ShortcutUtils.prettifyShortcut(keyElem);
        } else if (tab.hasAttribute("activemedia-blocked")) {
          id = "tabbrowser-unblock-tab-audio-tooltip";
        } else {
          id = linkedBrowser.audioMuted
            ? "tabbrowser-unmute-tab-audio-background-tooltip"
            : "tabbrowser-mute-tab-audio-background-tooltip";
        }
        align = false;
      } else {
        id = "tabbrowser-tab-tooltip";
        args = { title: gBrowser.getTabTooltip(tab, true) };
      }
      if (align) {
        e.target.setAttribute("position", "after_start");
        e.target.moveToAnchor(row, "after_start");
      }
      let title = e.target.querySelector(".places-tooltip-title");
      let localized = {};
      if (id) {
        let [msg] = gBrowser.tabLocalization.formatMessagesSync([{ id, args }]);
        localized.value = msg.value;
        if (msg.attributes) {
          for (let attr of msg.attributes) localized[attr.name] = attr.value;
        }
      }
      title.textContent = localized.label ?? "";
      if (tab.getAttribute("customizemode") === "true") {
        e.target
          .querySelector(".places-tooltip-box")
          .setAttribute("desc-hidden", "true");
        return;
      }
      let url = e.target.querySelector(".places-tooltip-uri");
      url.value = linkedBrowser?.currentURI?.spec.replace(/^https:\/\//, "");
      e.target
        .querySelector(".places-tooltip-box")
        .removeAttribute("desc-hidden");
      // show a lock icon to show tab security/encryption
      let icon = e.target.querySelector("#places-tooltip-insecure-icon");
      let pending =
        tab.hasAttribute("pending") || !linkedBrowser.browsingContext;
      let docURI = pending
        ? linkedBrowser?.currentURI
        : linkedBrowser?.documentURI || linkedBrowser?.currentURI;
      if (docURI) {
        let homePage = new RegExp(
          `(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`,
          "i"
        ).test(docURI.spec);
        if (homePage) {
          icon.setAttribute("type", "home-page");
          icon.hidden = false;
          return;
        }
        switch (docURI.scheme) {
          case "file":
          case "resource":
          case "chrome":
            icon.setAttribute("type", "local-page");
            icon.hidden = false;
            return;
          case "about":
            let pathQueryRef = docURI?.pathQueryRef;
            if (
              pathQueryRef &&
              /^(neterror|certerror|httpsonlyerror)/.test(pathQueryRef)
            ) {
              icon.setAttribute("type", "error-page");
              icon.hidden = false;
              return;
            }
            if (docURI.filePath === "blocked") {
              icon.setAttribute("type", "blocked-page");
              icon.hidden = false;
              return;
            }
            icon.setAttribute("type", "about-page");
            icon.hidden = false;
            return;
          case "moz-extension":
            icon.setAttribute("type", "extension-page");
            icon.hidden = false;
            return;
        }
      }
      if (linkedBrowser.browsingContext) {
        let prog = Ci.nsIWebProgressListener;
        let state = linkedBrowser?.securityUI?.state;
        if (typeof state != "number" || state & prog.STATE_IS_SECURE) {
          icon.hidden = true;
          icon.setAttribute("type", "secure");
          return;
        }
        if (state & prog.STATE_IS_INSECURE) {
          icon.setAttribute("type", "insecure");
          icon.hidden = false;
          return;
        }
        if (state & prog.STATE_IS_BROKEN) {
          if (state & prog.STATE_LOADED_MIXED_ACTIVE_CONTENT) {
            icon.hidden = false;
            icon.setAttribute("type", "insecure");
          } else {
            icon.setAttribute("type", "mixed-passive");
            icon.hidden = false;
          }
          return;
        }
      }
      icon.hidden = true;
      icon.setAttribute("type", pending ? "pending" : "secure");
    };
    gTabsPanel.allTabsButton.setAttribute(
      "onmouseover",
      /* javascript */ `this.tooltipText=(gBrowser.tabs.length>1?PluralForm.get(gBrowser.tabs.length,gNavigatorBundle.getString("ctrlTab.listAllTabs.label")).replace("#1",gBrowser.tabs.length).toLocaleLowerCase().replace(RTL_UI?/.$/i:/^./i,(function(letter){return letter.toLocaleUpperCase()})).trim():this.label)+(Services.prefs.getBoolPref("browser.ctrlTab.sortByRecentlyUsed",false)?" ("+ShortcutUtils.prettifyShortcut(key_showAllTabs)+")":"");`
    );
    if (!("reversed" in lazy.TabsPanel.prototype)) reverseTabOrder();
    setupPIP();
    setupCtrlTab();

    tabsPanels.forEach(modifyWalkers);
    tabsPanels.forEach(setupTabsPanel);
  }

  function setupPIP() {
    let gNextWindowID = 0;
    let handleRequestSrc = PictureInPicture.handlePictureInPictureRequest.toSource();
    if (!handleRequestSrc.includes("_tabAttrModified")) {
      eval(
        `PictureInPicture.handlePictureInPictureRequest = async function ${handleRequestSrc
          .replace(/async handlePictureInPictureRequest/, "")
          .replace(/\sServices\.telemetry.*\s*.*\s*.*\s*.*/, "")
          .replace(/gCurrentPlayerCount.*/g, "")
          .replace(
            /(tab\.setAttribute\(\"pictureinpicture\".*)/,
            `$1 parentWin.gBrowser._tabAttrModified(tab, ["pictureinpicture"]);`
          )}`
      );
    }
    let clearIconSrc = PictureInPicture.clearPipTabIcon.toSource();
    if (!clearIconSrc.includes("_tabAttrModified")) {
      eval(
        `PictureInPicture.clearPipTabIcon = function ${clearIconSrc
          .replace(/WINDOW\_TYPE/, `"Toolkit:PictureInPicture"`)
          .replace(
            /(tab\.removeAttribute\(\"pictureinpicture\".*)/,
            `$1 gBrowser._tabAttrModified(tab, ["pictureinpicture"]);`
          )}`
      );
    }
  }

  function setupCtrlTab() {
    function excludeShowAll() {
      ctrlTab.showAllButton.setAttribute("tabindex", "-1");
      ctrlTab.previews = ctrlTab.previews.filter(
        b => b.id !== "ctrlTab-showAll"
      );
    }
    if (prefSvc.getBoolPref(skipShowAllPref, false)) excludeShowAll();
    prefSvc.addObserver(skipShowAllPref, (sub, top, pref) => {
      if (sub.getBoolPref(pref)) {
        excludeShowAll();
      } else {
        ctrlTab.showAllButton.removeAttribute("tabindex");
        delete ctrlTab.previews;
        ctrlTab.previews = [];
        let previewsContainer = document.getElementById("ctrlTab-previews");
        for (let i = 0; i < ctrlTab.maxTabPreviews; i++) {
          let preview = ctrlTab._makePreview();
          previewsContainer.appendChild(preview);
          ctrlTab.previews.push(preview);
        }
        ctrlTab.previews.push(ctrlTab.showAllButton);
      }
    });
  }

  function setupTabsPanel(tabsPanel) {
    tabsPanel.tabEvents = [
      "TabAttrModified",
      "TabClose",
      "TabMove",
      "TabHide",
      "TabShow",
      "TabPinned",
      "TabUnpinned",
      "TabSelect",
      "TabBrowserDiscarded",
    ];
    tabsPanel._setupListeners = function() {
      this.listenersRegistered = true;
      this.tabEvents.forEach(ev =>
        gBrowser.tabContainer.addEventListener(ev, this)
      );
      this.gBrowser.addEventListener("TabMultiSelect", this);
      this.panelMultiView.addEventListener("PanelMultiViewHidden", this);
    };
    tabsPanel._cleanupListeners = function() {
      this.tabEvents.forEach(ev =>
        gBrowser.tabContainer.removeEventListener(ev, this)
      );
      this.gBrowser.removeEventListener("TabMultiSelect", this);
      this.panelMultiView.removeEventListener("PanelMultiViewHidden", this);
      this.listenersRegistered = false;
    };
    tabsPanel._createRow = function(tab) {
      let { doc } = this;
      let row = create(doc, "toolbaritem", {
        class: "all-tabs-item",
        context: "tabContextMenu",
        tooltip: "all-tabs-tooltip",
        draggable: true,
      });
      if (this.className) row.classList.add(this.className);
      row.tab = tab;
      row.mOverSecondaryButton = false;
      row.addEventListener("command", this);
      row.addEventListener("mousedown", this);
      row.addEventListener("mouseup", this);
      row.addEventListener("click", this);
      row.addEventListener("mouseover", this);
      row.addEventListener("mouseout", this);
      this.tabToElement.set(tab, row);

      let button = row.appendChild(
        create(document, "toolbarbutton", {
          class: "all-tabs-button subviewbutton subviewbutton-iconic",
          flex: "1",
          crop: "right",
        })
      );
      button.tab = tab;

      let secondaryButton = row.appendChild(
        create(document, "toolbarbutton", {
          class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
          closemenu: "none",
          "toggle-mute": "true",
        })
      );
      secondaryButton.tab = tab;

      let closeButton = row.appendChild(
        create(document, "toolbarbutton", {
          class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
          "close-button": "true",
        })
      );
      closeButton.tab = tab;

      this._setRowAttributes(row, tab);
      return row;
    };
    tabsPanel._setRowAttributes = function(row, tab) {
      setAttributes(row, {
        selected: tab.selected,
        pinned: tab.pinned,
        pending: tab.getAttribute("pending"),
        multiselected: tab.getAttribute("multiselected"),
        notselectedsinceload: tab.getAttribute("notselectedsinceload"),
        "tab-hidden": tab.hidden,
      });
      if (tab.userContextId) {
        let idColor = ContextualIdentityService.getPublicIdentityFromId(
          tab.userContextId
        )?.color;
        row.className = idColor
          ? `all-tabs-item identity-color-${idColor}`
          : "all-tabs-item";
        row.setAttribute("usercontextid", tab.userContextId);
      } else {
        row.className = "all-tabs-item";
        row.removeAttribute("usercontextid");
      }

      let busy = tab.getAttribute("busy");
      setAttributes(row.querySelector(".all-tabs-button"), {
        busy,
        label: tab.label,
        image: !busy && tab.getAttribute("image"),
        iconloadingprincipal: tab.getAttribute("iconloadingprincipal"),
      });

      this._setImageAttributes(row, tab);

      let secondaryButton = row.querySelector(
        ".all-tabs-secondary-button[toggle-mute]"
      );
      setAttributes(secondaryButton, {
        muted: tab.muted,
        soundplaying: tab.soundPlaying,
        "activemedia-blocked": tab.activeMediaBlocked,
        pictureinpicture: tab.pictureinpicture,
        hidden: !(
          tab.muted ||
          tab.soundPlaying ||
          tab.activeMediaBlocked ||
          tab.pictureinpicture
        ),
      });
    };
    tabsPanel._moveTab = function(tab) {
      let item = this.tabToElement.get(tab);
      if (item) {
        this._removeItem(item, tab);
        this._addTab(tab);
        this.containerNode
          .querySelector(".all-tabs-item[selected]")
          .scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };
    tabsPanel.handleEvent = function(e) {
      let { tab } = e.target;
      switch (e.type) {
        case "ViewShowing":
          if (!this.listenersRegistered && e.target == this.view) {
            this.panelMultiView = this.view.panelMultiView;
            this._populate(e);
          }
          break;
        case "mousedown":
          this._onMouseDown(e, tab);
          break;
        case "mouseup":
          this._onMouseUp(e, tab);
          break;
        case "click":
          this._onClick(e, tab);
          break;
        case "command":
          this._onCommand(e, tab);
          break;
        case "mouseover":
          this._onMouseOver(e, tab);
          break;
        case "mouseout":
          this._onMouseOut(e);
          break;
        case "TabPinned":
        case "TabUnpinned":
        case "TabAttrModified":
        case "TabBrowserDiscarded":
          this._tabAttrModified(e.target);
          break;
        case "TabHide":
        case "TabShow":
          this._tabAttrModified(e.target);
          let item = this.tabToElement.get(e.target);
          if (item) {
            item.scrollIntoView({ block: "nearest", behavior: "smooth" });
          }
          break;
        case "TabClose":
          this._tabClose(e.target);
          break;
        case "TabMove":
          this._moveTab(e.target);
          break;
        case "dragstart":
          this._onDragStart(e, tab);
          break;
        case "dragleave":
          this._onDragLeave(e);
          break;
        case "dragover":
          this._onDragOver(e);
          break;
        case "dragend":
          this._onDragEnd(e);
          break;
        case "drop":
          this._onDrop(e);
          break;
        case "TabMultiSelect":
          this._onTabMultiSelect();
          break;
        case "TabSelect":
          if (this.listenersRegistered) {
            let item = this.tabToElement.get(e.target);
            if (item) {
              item.scrollIntoView({ block: "nearest", behavior: "smooth" });
            }
          }
          break;
        case "PanelMultiViewHidden":
          if (e.target == this.panelMultiView) {
            this._cleanup();
            this.panelMultiView = null;
          }
          break;
      }
    };
    tabsPanel._onMouseDown = function(e, tab) {
      if (e.button !== 0) return;
      if (tab.hidden) {
        if (tab.getAttribute("pending") || tab.getAttribute("busy")) {
          tab.noCanvas = true;
        } else {
          delete tab.noCanvas;
        }
        return;
      }
      let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
      if (e.shiftKey) {
        const lastSelectedTab = this.gBrowser.lastMultiSelectedTab;
        if (!accelKey) {
          this.gBrowser.selectedTab = lastSelectedTab;
          this.gBrowser.clearMultiSelectedTabs();
        }
        this.gBrowser.addRangeToMultiSelectedTabs(lastSelectedTab, tab);
      } else if (accelKey) {
        if (tab.multiselected) {
          this.gBrowser.removeFromMultiSelectedTabs(tab);
        } else if (tab != this.gBrowser.selectedTab) {
          this.gBrowser.addToMultiSelectedTabs(tab);
          this.gBrowser.lastMultiSelectedTab = tab;
        }
      } else {
        if (!tab.selected && tab.multiselected) {
          this.gBrowser.lockClearMultiSelectionOnce();
        }
        if (
          !e.shiftKey &&
          !accelKey &&
          !e.target.classList.contains("all-tabs-secondary-button") &&
          tab !== this.gBrowser.selectedTab
        ) {
          if (tab.getAttribute("pending") || tab.getAttribute("busy")) {
            tab.noCanvas = true;
          } else {
            delete tab.noCanvas;
          }
          if (this.gBrowser.selectedTab != tab) this.gBrowser.selectedTab = tab;
          else this.gBrowser.tabContainer._handleTabSelect();
        }
      }
      if (e.target.closest(".all-tabs-item")?.mOverSecondaryButton) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    tabsPanel._onMouseUp = function(e, tab) {
      if (e.button === 2) return;
      if (e.button === 1) {
        this.gBrowser.removeTab(tab, {
          animate: true,
          byMouse: false,
        });
        return;
      }
      if (e.target.classList.contains("all-tabs-secondary-button")) return;
      if (tab.hidden) return this._onCommand(e, tab);
      if (
        e.shiftKey ||
        (AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey)
      ) {
        return;
      }
      delete tab.noCanvas;
      this.gBrowser.unlockClearMultiSelection();
      this.gBrowser.clearMultiSelectedTabs();
      PanelMultiView.hidePopup(
        PanelMultiView.forNode(this.view.panelMultiView)._panel
      );
    };
    tabsPanel._onClick = function(e, tab) {
      if (e.button === 0) {
        if (
          e.target.classList.contains("all-tabs-secondary-button") &&
          !e.shiftKey &&
          !(AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey)
        ) {
          return;
        }
        e.preventDefault();
      }
    };
    tabsPanel._onCommand = function(e, tab) {
      if (e.target.hasAttribute("activemedia-blocked")) {
        if (tab.multiselected) {
          this.gBrowser.resumeDelayedMediaOnMultiSelectedTabs(tab);
        } else {
          tab.resumeDelayedMedia();
        }
        return;
      }
      if (e.target.hasAttribute("toggle-mute")) {
        if (tab.multiselected) {
          this.gBrowser.toggleMuteAudioOnMultiSelectedTabs(tab);
        } else {
          tab.toggleMuteAudio();
        }
        return;
      }
      if (e.target.hasAttribute("close-button")) {
        if (tab.multiselected) this.gBrowser.removeMultiSelectedTabs();
        else this.gBrowser.removeTab(tab, { animate: true });
        return;
      }
      if (!gSharedTabWarning.willShowSharedTabWarning(tab)) {
        if (tab !== this.gBrowser.selectedTab) this._selectTab(tab);
      }
      delete tab.noCanvas;
    };
    tabsPanel._onDragStart = function(e, tab) {
      let row = e.target;
      if (!tab || this.gBrowser.tabContainer._isCustomizing) return;
      let selectedTabs = this.gBrowser.selectedTabs;
      let otherSelectedTabs = selectedTabs.filter(
        selectedTab => selectedTab != tab
      );
      let dataTransferOrderedTabs = [tab].concat(otherSelectedTabs);
      let dt = e.dataTransfer;
      for (let i = 0; i < dataTransferOrderedTabs.length; i++) {
        let dtTab = dataTransferOrderedTabs[i];
        dt.mozSetDataAt("all-tabs-item", dtTab, i);
      }
      dt.mozCursor = "default";
      dt.addElement(row);
      // if multiselected tabs aren't adjacent, make them adjacent
      if (tab.multiselected) {
        function newIndex(aTab, index) {
          if (aTab.pinned) {
            return Math.min(index, this.gBrowser._numPinnedTabs - 1);
          }
          return Math.max(index, this.gBrowser._numPinnedTabs);
        }
        let tabIndex = selectedTabs.indexOf(tab);
        let draggedTabPos = tab._tPos;
        // tabs to the left of the dragged tab
        let insertAtPos = draggedTabPos - 1;
        for (let i = tabIndex - 1; i > -1; i--) {
          insertAtPos = newIndex(selectedTabs[i], insertAtPos);
          if (
            insertAtPos &&
            !selectedTabs[i].nextElementSibling.multiselected
          ) {
            this.gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
          }
        }
        // tabs to the right
        insertAtPos = draggedTabPos + 1;
        for (let i = tabIndex + 1; i < selectedTabs.length; i++) {
          insertAtPos = newIndex(selectedTabs[i], insertAtPos);
          if (
            insertAtPos &&
            !selectedTabs[i].previousElementSibling.multiselected
          ) {
            this.gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
          }
        }
      }
      // tab preview
      if (
        !tab.noCanvas &&
        (AppConstants.platform == "win" || AppConstants.platform == "macosx")
      ) {
        delete tab.noCanvas;
        let scale = window.devicePixelRatio;
        let canvas = this._dndCanvas;
        if (!canvas) {
          this._dndCanvas = canvas = document.createElementNS(
            "http://www.w3.org/1999/xhtml",
            "canvas"
          );
          canvas.style.width = "100%";
          canvas.style.height = "100%";
          canvas.mozOpaque = true;
        }
        canvas.width = 160 * scale;
        canvas.height = 90 * scale;
        let toDrag = canvas;
        let dragImageOffset = -16;
        let browser = tab.linkedBrowser;
        if (gMultiProcessBrowser) {
          let context = canvas.getContext("2d");
          context.fillStyle = getComputedStyle(this.view).getPropertyValue(
            "background-color"
          );
          context.fillRect(0, 0, canvas.width, canvas.height);

          let captureListener = () =>
            dt.updateDragImage(canvas, dragImageOffset, dragImageOffset);
          PageThumbs.captureToCanvas(browser, canvas).then(captureListener);
        } else {
          PageThumbs.captureToCanvas(browser, canvas);
          dragImageOffset = dragImageOffset * scale;
        }
        dt.setDragImage(toDrag, dragImageOffset, dragImageOffset);
      }
      tab._dragData = {
        movingTabs: (tab.multiselected
          ? this.gBrowser.selectedTabs
          : [tab]
        ).filter(this.filterFn),
      };
      e.stopPropagation();
    };
    // set the drop target style with an attribute, "dragpos", which is either
    // "after" or "before"
    tabsPanel._onDragOver = function(e) {
      let row = findRow(e.target);
      let dt = e.dataTransfer;
      if (
        !dt.types.includes("all-tabs-item") ||
        !row ||
        row.tab.multiselected
      ) {
        dt.mozCursor = "auto";
        return;
      }
      dt.mozCursor = "default";
      let draggedTab = dt.mozGetDataAt("all-tabs-item", 0);
      if (row.tab === draggedTab) return;
      if (row.tab.pinned !== draggedTab.pinned) return;
      // whether a tab will be placed before or after the drop target depends on
      // 1) whether the drop target is above or below the dragged tab, and 2)
      // whether the order of the tab list is reversed.
      function getPosition() {
        return prefSvc.getBoolPref(reversePref)
          ? row.tab._tPos < draggedTab._tPos
          : row.tab._tPos > draggedTab._tPos;
      }
      let position = getPosition() ? "after" : "before";
      row.setAttribute("dragpos", position);
      e.preventDefault();
    };
    // remove the drop target style.
    tabsPanel._onDragLeave = function(e) {
      let row = findRow(e.target);
      let dt = e.dataTransfer;
      dt.mozCursor = "auto";
      if (!dt.types.includes("all-tabs-item") || !row) return;
      this.containerNode
        .querySelectorAll("[dragpos]")
        .forEach(item => item.removeAttribute("dragpos"));
    };
    // move the tab(s)
    tabsPanel._onDrop = function(e) {
      let row = findRow(e.target);
      let dt = e.dataTransfer;
      let tabBar = this.gBrowser.tabContainer;

      if (!dt.types.includes("all-tabs-item") || !row) return;

      let draggedTab = dt.mozGetDataAt("all-tabs-item", 0);
      let movingTabs = draggedTab._dragData.movingTabs;

      if (
        !movingTabs ||
        dt.mozUserCancelled ||
        dt.dropEffect === "none" ||
        tabBar._isCustomizing
      ) {
        delete draggedTab._dragData;
        return;
      }

      tabBar._finishGroupSelectedTabs(draggedTab);

      if (draggedTab) {
        let newIndex = row.tab._tPos;
        const dir = newIndex < movingTabs[0]._tPos;
        movingTabs.forEach(tab => {
          if (tab.pinned !== row.tab.pinned) return;
          this.gBrowser.moveTabTo(
            dt.dropEffect == "copy" ? this.gBrowser.duplicateTab(tab) : tab,
            dir ? newIndex++ : newIndex
          );
        });
      }
      row.removeAttribute("dragpos");
      e.stopPropagation();
    };
    // clean up remaining crap
    tabsPanel._onDragEnd = function(e) {
      let draggedTab = e.dataTransfer.mozGetDataAt("all-tabs-item", 0);
      delete draggedTab._dragData;
      delete draggedTab.noCanvas;
      for (let row of this.rows) row.removeAttribute("dragpos");
    };
    tabsPanel._onTabMultiSelect = function() {
      for (let item of this.rows) {
        item.toggleAttribute("multiselected", !!item.tab.multiselected);
      }
    };
    tabsPanel._onMouseOver = function(e, tab) {
      let row = e.target.closest(".all-tabs-item");
      SessionStore.speculativeConnectOnTabHover(tab);
      if (e.target.classList.contains("all-tabs-secondary-button")) {
        row.mOverSecondaryButton = true;
      }
      if (e.target.hasAttribute("close-button")) {
        tab = gBrowser._findTabToBlurTo(tab);
      }
      gBrowser.warmupTab(tab);
    };
    tabsPanel._onMouseOut = function(e) {
      let row = e.target.closest(".all-tabs-item");
      if (e.target.classList.contains("all-tabs-secondary-button")) {
        row.mOverSecondaryButton = false;
      }
    };
    tabsPanel.view.addEventListener("ViewShowing", l10nIfNeeded, {
      once: true,
    });
    ["dragstart", "dragleave", "dragover", "drop", "dragend"].forEach(ev =>
      tabsPanel.containerNode.addEventListener(ev, tabsPanel)
    );
  }

  function registerSheet() {
    const css = /* css */ `
.panel-subview-body > .all-tabs-item {
    border-radius: var(--arrowpanel-menuitem-border-radius);
    box-shadow: none;
    -moz-box-align: center;
    padding-inline-end: 2px;
    overflow: clip;
    position: relative;
}
.panel-subview-body > .all-tabs-item .all-tabs-button:not([disabled], [open]):focus {
    background: none;
}
.panel-subview-body
    > .all-tabs-item:is([selected], [multiselected], [usercontextid]:is(:hover, [_moz-menuactive]))
    .all-tabs-button {
    background-image: linear-gradient(
        to right,
        var(--main-stripe-color) 0,
        var(--main-stripe-color) 4px,
        transparent 4px
    ) !important;
}
.panel-subview-body > .all-tabs-item[selected] {
    font-weight: normal;
    background-color: var(--arrowpanel-dimmed-further) !important;
    --main-stripe-color: var(--panel-item-active-bgcolor);
}
.panel-subview-body > .all-tabs-item .all-tabs-button {
    min-height: revert;
}
.panel-subview-body > .all-tabs-item[usercontextid]:not([multiselected]) {
    --main-stripe-color: var(--identity-tab-color);
}
.panel-subview-body > .all-tabs-item[multiselected] {
    --main-stripe-color: var(--multiselected-color, var(--toolbarbutton-icon-fill-attention));
}
.panel-subview-body
    > .all-tabs-item:not([selected]):is(:hover, :focus-within, [_moz-menuactive], [multiselected]) {
    background-color: var(--arrowpanel-dimmed) !important;
}
.panel-subview-body > .all-tabs-item[multiselected]:not([selected]):is(:hover, [_moz-menuactive]) {
    background-color: var(--arrowpanel-dimmed-further) !important;
}
.panel-subview-body
    > .all-tabs-item[pending]:not([selected]):is(:hover, :focus-within, [_moz-menuactive], [multiselected]) {
    background-color: var(
        --arrowpanel-faint,
        color-mix(in srgb, var(--arrowpanel-dimmed) 60%, transparent)
    ) !important;
}
.panel-subview-body
    > .all-tabs-item[pending][multiselected]:not([selected]):is(:hover, [_moz-menuactive]) {
    background-color: var(--arrowpanel-dimmed) !important;
}
.panel-subview-body > .all-tabs-item[pending] > .all-tabs-button {
    opacity: 0.6;
}
:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload]:not([pending]) > .all-tabs-button,
:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload][pending] > .all-tabs-button[busy] {
    font-style: italic;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button {
    width: 18px;
    height: 18px;
    border-radius: var(--tab-button-border-radius, 2px);
    color: inherit;
    background-color: transparent !important;
    opacity: 0.7;
    min-height: revert;
    min-width: revert;
    padding: 0;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button > .toolbarbutton-icon {
    min-width: 18px;
    min-height: 18px;
    fill: inherit;
    fill-opacity: inherit;
    -moz-context-properties: inherit;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button > label:empty {
    display: none;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button:is(:hover, :focus):not([disabled]),
.panel-subview-body
    > .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button]:is(:hover, :focus):not([disabled]) {
    background-color: var(--arrowpanel-dimmed) !important;
    opacity: 1;
    color: inherit;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button:hover:active:not([disabled]),
.panel-subview-body
    > .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button]:hover:active:not([disabled]) {
    background-color: var(--arrowpanel-dimmed-further) !important;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[toggle-mute] {
    list-style-image: none !important;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 18 18"><path fill="context-fill" d="M3.52,5.367c-1.332,0-2.422,1.09-2.422,2.422v2.422c0,1.332,1.09,2.422,2.422,2.422h1.516l4.102,3.633 V1.735L5.035,5.367H3.52z M12.059,9c0-0.727-0.484-1.211-1.211-1.211v2.422C11.574,10.211,12.059,9.727,12.059,9z M14.48,9 c0-1.695-1.211-3.148-2.785-3.512l-0.363,1.09C12.422,6.82,13.27,7.789,13.27,9c0,1.211-0.848,2.18-1.938,2.422l0.484,1.09 C13.27,12.148,14.48,10.695,14.48,9z M12.543,3.188l-0.484,1.09C14.238,4.883,15.691,6.82,15.691,9c0,2.18-1.453,4.117-3.512,4.601 l0.484,1.09c2.422-0.605,4.238-2.906,4.238-5.691C16.902,6.215,15.086,3.914,12.543,3.188z"/></svg>') !important;
    background-size: 14px !important;
    background-repeat: no-repeat !important;
    background-position: center !important;
    padding: 0 !important;
    margin-inline-end: 8.5px;
    margin-inline-start: -27px;
    transition: 0.25s cubic-bezier(0.07, 0.78, 0.21, 0.95) transform,
        0.2s cubic-bezier(0.07, 0.74, 0.24, 0.95) margin, 0.075s linear opacity;
    display: block !important;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[toggle-mute][hidden] {
    transform: translateX(14px);
    opacity: 0;
}
.panel-subview-body
    > .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[toggle-mute] {
    transform: translateX(48px);
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[soundplaying] {
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[muted] {
    list-style-image: none !important;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 18 18"><path fill="context-fill" d="M3.52,5.367c-1.332,0-2.422,1.09-2.422,2.422v2.422c0,1.332,1.09,2.422,2.422,2.422h1.516l4.102,3.633V1.735L5.035,5.367H3.52z"/><path fill="context-fill" fill-rule="evenodd" d="M12.155,12.066l-1.138-1.138l4.872-4.872l1.138,1.138 L12.155,12.066z"/><path fill="context-fill" fill-rule="evenodd" d="M10.998,7.204l1.138-1.138l4.872,4.872l-1.138,1.138L10.998,7.204z"/></svg>') !important;
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[activemedia-blocked] {
    list-style-image: none !important;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12"><path fill="context-fill" d="M2.128.13A.968.968 0 0 0 .676.964v10.068a.968.968 0 0 0 1.452.838l8.712-5.034a.968.968 0 0 0 0-1.676L2.128.13z"/></svg>') !important;
    background-size: 10px !important;
    background-position: 4.5px center !important;
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
.panel-subview-body
    > .all-tabs-item:not(:hover, :focus-within)
    .all-tabs-secondary-button[pictureinpicture] {
    list-style-image: none !important;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.8 512"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M568.9 0h-512C25.6 0 0 25 0 56.3v398.8C0 486.4 25.6 512 56.9 512h512c31.3 0 56.9-25.6 56.9-56.9V56.3C625.8 25 600.2 0 568.9 0zm-512 425.7V86c0-16.5 13.5-30 30-30h452c16.5 0 30 13.5 30 30v339.6c0 16.5-13.5 30-30 30h-452c-16.5.1-30-13.4-30-29.9zM482 227.6H314.4c-16.5 0-30 13.5-30 30v110.7c0 16.5 13.5 30 30 30H482c16.5 0 30-13.5 30-30V257.6c0-16.5-13.5-30-30-30z"/></svg>') !important;
    border-radius: 0 !important;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[pictureinpicture] {
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
.panel-subview-body > .all-tabs-item .all-tabs-secondary-button[close-button] {
    fill-opacity: 0;
    transform: translateX(14px);
    opacity: 0;
    margin-inline-start: -27px;
    transition: 0.25s cubic-bezier(0.07, 0.78, 0.21, 0.95) transform,
        0.2s cubic-bezier(0.07, 0.74, 0.24, 0.95) margin, 0.075s linear opacity;
    display: block;
    -moz-context-properties: fill, fill-opacity, stroke;
    fill: currentColor;
    fill-opacity: 0;
    border-radius: var(--tab-button-border-radius, 2px);
    list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect fill='context-fill' fill-opacity='context-fill-opacity' width='20' height='20' rx='2' ry='2'/><path fill='context-fill' fill-opacity='context-stroke-opacity' d='M11.06 10l3.47-3.47a.75.75 0 00-1.06-1.06L10 8.94 6.53 5.47a.75.75 0 10-1.06 1.06L8.94 10l-3.47 3.47a.75.75 0 101.06 1.06L10 11.06l3.47 3.47a.75.75 0 001.06-1.06z'/></svg>");
}
.panel-subview-body
    > .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button] {
    transform: none;
    opacity: 0.7;
    margin-inline-start: -2px;
}
.panel-subview-body > .all-tabs-item[dragpos] {
    background-color: color-mix(
        in srgb,
        transparent 30%,
        var(--arrowpanel-faint, color-mix(in srgb, var(--arrowpanel-dimmed) 60%, transparent))
    );
}
.panel-subview-body > .all-tabs-item[dragpos]::before {
    content: "";
    position: absolute;
    pointer-events: none;
    height: 0;
    z-index: 1000;
    width: 100%;
    border-image: linear-gradient(
        to right,
        transparent,
        var(--panel-item-active-bgcolor) 1%,
        var(--panel-item-active-bgcolor) 25%,
        transparent 90%
    );
    border-image-slice: 1;
    opacity: 1;
}
.panel-subview-body > .all-tabs-item[dragpos="before"]::before {
    inset-block-start: 0;
    border-top: 1px solid var(--panel-item-active-bgcolor);
}
.panel-subview-body > .all-tabs-item[dragpos="after"]::before {
    inset-block-end: 0;
    border-bottom: 1px solid var(--panel-item-active-bgcolor);
}
.panel-subview-body
    > .all-tabs-item[pinned]
    > .all-tabs-button.subviewbutton
    > .toolbarbutton-text {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M14.707 13.293L11.414 10l2.293-2.293a1 1 0 0 0 0-1.414A4.384 4.384 0 0 0 10.586 5h-.172A2.415 2.415 0 0 1 8 2.586V2a1 1 0 0 0-1.707-.707l-5 5A1 1 0 0 0 2 8h.586A2.415 2.415 0 0 1 5 10.414v.169a4.036 4.036 0 0 0 1.337 3.166 1 1 0 0 0 1.37-.042L10 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414zm-7.578-1.837A2.684 2.684 0 0 1 7 10.583v-.169a4.386 4.386 0 0 0-1.292-3.121 4.414 4.414 0 0 0-1.572-1.015l2.143-2.142a4.4 4.4 0 0 0 1.013 1.571A4.384 4.384 0 0 0 10.414 7h.172a2.4 2.4 0 0 1 .848.152z"/></svg>')
        no-repeat 6px/11px;
    padding-inline-start: 20px;
    -moz-context-properties: fill, fill-opacity;
    fill: currentColor;
}
#places-tooltip-insecure-icon {
    -moz-context-properties: fill;
    fill: currentColor;
    width: 1em;
    height: 1em;
    margin-inline-start: 0;
    margin-inline-end: .2em;
    min-width: 1em !important;
}
#places-tooltip-insecure-icon[hidden] {
    display: none;
}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }

  if (!prefSvc.prefHasUserValue(reversePref)) {
    prefSvc.setBoolPref(reversePref, false);
  }
  prefSvc.addObserver(reversePref, prefHandler);

  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
