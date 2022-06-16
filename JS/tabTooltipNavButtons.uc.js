// ==UserScript==
// @name           Tab Tooltip Navigation Buttons
// @version        1.2.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script turns the tab tooltip into a mini navigation popup
// with back, forward, and reload buttons. It still shows the tab's title and URL,
// and also shows its favicon. So it's similar to the vanilla tooltip, except it's
// interactive. When you hover a tab for 500 milliseconds (the actual delay depends
// on ui.tooltipDelay when opening, and
// userChrome.tabs.tabTooltipNavButtons.hover-out-delay when closing, both of which
// you can set in about:config) the navigation popup will open attached to that
// tab. Clicking the back button will navigate *that tab* back one step, rather
// than only navigating the currently active tab. So this means you can navigate
// background tabs. The buttons work very much like the back, forward, and reload
// buttons on your toolbar. So a regular left click will go back or forward or
// reload, while a middle click or ctrl+click will duplicate the tab while going
// back or forward or reloading. A shift click will duplicate the tab in a new
// window instead. Basically all the same features that are present in the built-in
// toolbar buttons. The key difference (aside from navigating the hovered tab
// rather than the active tab) is that the buttons can navigate multiple tabs at
// once. If you multiselect tabs, e.g., by shift or ctrl+clicking them, and then
// hover one of the multiselected tabs, all the buttons in the popup will navigate
// all the multiselected tabs at once. So if you right-click a tab and click
// "Select all Tabs" in the context menu, then hover a tab and click the reload
// button in the popup, it will reload every tab you have open. If you have tabs
// multiselected but you hover one of the non-selected tabs, then the popup will
// only affect the hovered tab, not the multiselected tabs.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class TabTooltipNav {
  static config = {
    // if you only want the popup to open while you have a modifier key pressed,
    // type it here. accepted values are "ctrl", "shift", "alt", "meta", and
    // "accel". combinations are not accepted. if you want a modifier key, the
    // value must be surrounded by quotes. don't delete the comma after the
    // value. if you don't want a modifier key, change this to false — with no
    // quotes. but don't delete the comma.
    "Modifier key": false,

    // if you want the normal tooltip to show when hovering a tab without the
    // modifier key, set this to true. if you want no tooltip to show at all
    // unless the modifier key is pressed, set this to false. it will have no
    // effect if "Modifier key" is not set to one of the valid string values
    // listed above.
    "Show vanilla tooltip if modifier is not pressed": true,

    // When you right click one of the back or forward buttons, it opens a
    // little context menu that shows up to 15 items in that tab's history. when
    // you mouse over them, the popup's tooltip will be temporarily updated to
    // show that history item's title, URL, and favicon. this is similar to how
    // the built-in back/forward buttons' menu works, where hovering a menuitem
    // causes the URL to display in the status bar at the bottom of the screen.
    // if you don't need this behavior or find it annoying, set this pref to
    // false.
    "Update tooltip when hovering in the history menu": true,

    l10n: {
      "Go Back (Single Tab)": "Navigate tab back one page",

      "Go Back (Multiselected)": "Navigate selected tabs back one page",

      "Go Forward (Single Tab)": "Navigate tab forward one page",

      "Go Forward (Multiselected)": "Navigate selected tabs forward one page",

      "Reload (Single Tab)": "Reload tab",

      "Reload (Multiselected)": "Reload selected tabs",
    },
    // firefox doesn't have localized strings for these menuitems, since it
    // doesn't have any user-facing features like this where you can navigate
    // tabs that aren't currently active/selected. nor does it have any ability
    // to navigate multiple tabs at once. so you have to localize the tooltips
    // yourself to match your browser language.
  };
  /**
   * create a DOM node with given parameters
   * @param {object} aDoc (which document to create the element in)
   * @param {string} tag (an HTML tag name, like "button" or "p")
   * @param {object} props (an object containing attribute name/value pairs,
   *                       e.g. class: ".bookmark-item")
   * @param {boolean} isHTML (if true, create an HTML element. if omitted or false,
   *                         create a XUL element. generally avoid HTML when modding
   *                         the UI, most UI elements are actually XUL elements.)
   * @returns the created DOM node
   */
  create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) {
      el.setAttribute(prop, props[prop]);
    }
    return el;
  }
  /**
   * set a list of attributes on a DOM node
   * @param {object} element (a DOM node)
   * @param {object} attrs (an object containing properties where the key is the
   *                       attribute name and the value is the attribute value)
   */
  setAttributes(element, attrs) {
    for (let [name, value] of Object.entries(attrs))
      if (value) element.setAttribute(name, value);
      else element.removeAttribute(name);
  }
  // if there are multiple tabs selected and the trigger tab (the hovered one)
  // is one of them, return the full array of selected tabs. if the trigger tab
  // is not one of them, or if only one tab is selected, return an array
  // containing just the trigger tab.
  get tabs() {
    if (!this.triggerTab) return [];
    if (this.triggerTab.multiselected) return gBrowser.selectedTabs;
    else return [this.triggerTab];
  }
  get navPopup() {
    return this._navPopup || (this._navPopup = document.querySelector("#tab-nav-popup"));
  }
  get tabBackForwardMenu() {
    return (
      this._tabBackForwardMenu ||
      (this._tabBackForwardMenu = document.querySelector("#tabBackForwardMenu"))
    );
  }
  get tooltipBox() {
    return (
      this._tooltipBox || (this._tooltipBox = this.navPopup.querySelector("#tab-nav-tooltip-box"))
    );
  }
  get backButton() {
    return this._backButton || (this._backButton = this.navPopup.querySelector("#tab-nav-back"));
  }
  get forwardButton() {
    return (
      this._forwardButton || (this._forwardButton = this.navPopup.querySelector("#tab-nav-forward"))
    );
  }
  get reloadButton() {
    return (
      this._reloadButton || (this._reloadButton = this.navPopup.querySelector("#tab-nav-reload"))
    );
  }
  get favicon() {
    return (
      this._favicon || (this._favicon = this.navPopup.querySelector("#tab-nav-tooltip-favicon"))
    );
  }
  set knownWidth(val) {
    if (val) {
      this.navPopup.style.setProperty("--tab-nav-known-width", val + "px");
      this._knownWidth = val;
    } else {
      this.navPopup.style.removeProperty("--tab-nav-known-width");
      this._knownWidth = 0;
    }
  }
  get knownWidth() {
    return this._knownWidth;
  }
  constructor() {
    this.config = TabTooltipNav.config;
    let l10n = this.config.l10n;
    XPCOMUtils.defineLazyPreferenceGetter(this, "popupDelay", "ui.tooltipDelay", 500, null, val =>
      Math.max(val - 180, 0)
    );
    XPCOMUtils.defineLazyPreferenceGetter(
      this,
      "hideDelay",
      "userChrome.tabs.tabTooltipNavButtons.hover-out-delay",
      500,
      null,
      val => Math.max(val - 180, 0)
    );
    this.registerSheet();
    this.markup = /* html */ `<panel
  id="tab-nav-popup"
  class="panel-no-padding"
  type="arrow"
  role="group"
  noautofocus="true"
  aria-labelledby="tab-nav-tooltip-label"
  onpopupshowing="tabNavButtons.onPopupShowing(event);"
  onpopupshown="tabNavButtons.onPopupShown(event);"
  onpopuphidden="tabNavButtons.onPopupHidden(event);"
  onmouseleave="tabNavButtons.onMouseleave(event);"
  consumeoutsideclicks="never">
  <hbox id="tab-nav-popup-body" class="panel-subview-body">
    <toolbarbutton
      id="tab-nav-back"
      class="toolbarbutton-1"
      tooltiptext='${l10n["Go Back (Single Tab)"]}'
      oncommand="tabNavButtons.goBack(event)"
      onclick="checkForMiddleClick(this, event);"
      context="tabBackForwardMenu"/>
    <toolbarbutton
      id="tab-nav-forward"
      class="toolbarbutton-1"
      tooltiptext='${l10n["Go Forward (Single Tab)"]}'
      oncommand="tabNavButtons.goForward(event)"
      onclick="checkForMiddleClick(this, event);"
      context="tabBackForwardMenu"/>
    <toolbarbutton
      id="tab-nav-reload"
      class="toolbarbutton-1"
      tooltiptext='${l10n["Reload (Single Tab)"]}'
      oncommand="tabNavButtons.reloadOrDuplicate(event)"
      onclick="checkForMiddleClick(this, event);"/>
    <separator id="tab-nav-separator" orient="vertical"/>
    <hbox id="tab-nav-tooltip-box" align="center">
      <box id="tab-nav-favicon-box">
        <image id="tab-nav-tooltip-favicon"></image>
      </box>
      <vbox id="tab-nav-tooltip-textbox" class="places-tooltip-box" flex="1">
        <description id="tab-nav-tooltip-label" class="tooltip-label places-tooltip-title"/>
        <hbox id="tab-nav-tooltip-uri-box">
          <description
            id="tab-nav-tooltip-uri"
            crop="center"
            class="tooltip-label places-tooltip-uri uri-element"/>
        </hbox>
      </vbox>
    </hbox>
  </hbox>
</panel>
<menupopup
  id="tabBackForwardMenu"
  onpopupshowing="return tabNavButtons.fillHistoryMenu(event.target);"
  onpopuphidden="tabNavButtons.onContextHidden();"
  oncommand="tabNavButtons.gotoHistoryIndex(event); event.stopPropagation();"/>`;
    window.mainPopupSet.appendChild(MozXULElement.parseXULToFragment(this.markup));
    this.navPopup.removeAttribute("position");
    this.navPopup.removeAttribute("side");
    this.navPopup.removeAttribute("flip");
    if (
      this.config["Show vanilla tooltip if modifier is not pressed"] &&
      /ctrl|alt|shift|meta|accel/.test(this.config["Modifier key"])
    )
      document.querySelector("#tabbrowser-tab-tooltip").addEventListener("popupshowing", this);
    else gBrowser.tabContainer.removeAttribute("tooltip");
    [
      "TabClose",
      "TabMove",
      "TabSelect",
      "TabAttrModified",
      "mousemove",
      "mouseleave",
      "mousedown",
    ].forEach(ev => gBrowser.tabContainer.addEventListener(ev, this));
    gBrowser.tabContainer.arrowScrollbox.addEventListener("scroll", this);
    gBrowser.addTabsProgressListener(this);
  }
  handleEvent(e) {
    switch (e.type) {
      case "mousemove":
        requestAnimationFrame(() => requestAnimationFrame(() => this.onMousemove(e)));
        break;
      case "mouseleave":
        requestAnimationFrame(() => requestAnimationFrame(() => this.onMouseleave(e)));
        break;
      case "TabClose":
      case "TabMove":
      case "TabSelect":
      case "scroll":
      case "mousedown":
        this.interrupt();
        break;
      case "TabAttrModified":
        this.onTabAttrModified(e);
        break;
      case "popupshowing":
        this.onTooltipShowing(e);
        break;
      default:
    }
  }
  // when the popup initially shows, set the labels, tooltips, and button states
  onPopupShowing() {
    this.isOpen = true;
    let l10n = this.config.l10n;
    let { multiselected } = this.triggerTab;
    let tabs = this.tabs;
    this.updateButtonsState(tabs);
    this.handleTooltip();
    this.backButton.tooltipText = multiselected
      ? l10n["Go Back (Multiselected)"]
      : l10n["Go Back (Single Tab)"];
    this.forwardButton.tooltipText = multiselected
      ? l10n["Go Forward (Multiselected)"]
      : l10n["Go Forward (Single Tab)"];
    this.reloadButton.tooltipText = multiselected
      ? l10n["Reload (Multiselected)"]
      : l10n["Reload (Single Tab)"];
  }
  onPopupShown(e) {
    this.isOpen = true;
    this.captureKnownWidth();
    this.clearTimers();
  }
  onPopupHidden(e) {
    this.isOpen = false;
    this.knownWidth = null;
    this.clearTimers();
  }
  // called when the context menu is closed for whatever reason. we
  // need to hide the whole nav popup if the context menu closes and
  // the mouse is now outside the valid bounds.
  onContextHidden(e) {
    this.menuOpen = false;
    this.onMouseleave();
  }
  clearTimers() {
    clearTimeout(this.openTimer);
    clearTimeout(this.closeTimer);
    this.openTimer = null;
    this.closeTimer = null;
  }
  // main trigger for opening the nav popup
  onMousemove(e) {
    this.clearTimers();
    if (this.menuOpen) return;
    let tab = e.target.closest("tab");
    if (this.isOpen || this.openTimer || this.closeTimer) {
      if (this.triggerTab === tab) return this.handleTooltip();
      else if (tab) return this.movePopup(e, tab) || this.onMouseleave();
      else return this.onMouseleave();
    }
    this.triggerTab = tab;
    if (tab) this.openTimer = setTimeout(() => this.openPopup(e), this.popupDelay);
  }
  // main trigger for closing it
  onMouseleave() {
    this.clearTimers();
    if (this.menuOpen) return;
    if (this.navPopup.matches(":hover") || this.triggerTab?.matches(":hover")) return;
    this.closeTimer = setTimeout(() => this.closePopup(), this.popupDelay);
  }
  // on navigation, update back/forward buttons and update the tooltip if the
  // navigation involved the trigger tab or multiselected tabs (provided the
  // trigger tab is also multiselected)
  onLocationChange(browser, progress) {
    if (!progress.isTopLevel || !(this.isOpen || this.openTimer) || !this.triggerTab) return;
    let tab = gBrowser.getTabForBrowser(browser);
    let { tabs } = this;
    if (tabs.indexOf(tab) > -1) this.updateButtonsState(tabs);
    if (tab === this.triggerTab) this.handleTooltip();
  }
  // update the nav popup tooltip if attributes of the trigger tab changed.
  onTabAttrModified(e) {
    if (e.target === this.triggerTab) this.handleTooltip();
  }
  // if the native tab tooltip is about to show, either suppress it
  // or allow it and prevent the nav popup from opening.
  onTooltipShowing(e) {
    if ((this.isOpen || this.openTimer) && !this.closeTimer) return e.preventDefault();
    this.interrupt();
  }
  // close all popups and bail out of any scheduled popup actions.
  interrupt() {
    this.clearTimers();
    this.tabBackForwardMenu.hidePopup();
    this.closePopup();
  }
  openPopup(e) {
    if (this.isOpen || !this.modifierPressed(e)) return this.clearTimers();
    if (gBrowser.tabContainer.hasAttribute("movingtab")) {
      this.clearTimers();
      return this.closePopup();
    }
    if (this.triggerTab.matches(":hover"))
      this.navPopup.openPopup(this.triggerTab, {
        position: "after_start",
        triggerEvent: e,
      });
  }
  movePopup(e, tab) {
    if (!this.modifierPressed(e)) return this.onMouseleave();
    if (gBrowser.tabContainer.hasAttribute("movingtab")) {
      this.clearTimers();
      this.closePopup();
      return true;
    }
    if (gBrowser.tabContainer.matches(":hover")) {
      if (this.triggerTab) this.triggerTab.removeAttribute("open");
      this.triggerTab = tab;
      this.knownWidth = null;
      this.onPopupShowing();
      this.navPopup.moveToAnchor(this.triggerTab, "after_start");
      this.triggerTab.setAttribute("open", true);
      return true;
    }
    return false;
  }
  closePopup() {
    this.navPopup.hidePopup(true);
    if (this.triggerTab) this.triggerTab.removeAttribute("open");
    this.triggerTab = null;
  }
  // return true if the user's configured modifier key is pressed in the passed
  // event. return true if the user has the modifier key setting disabled.
  modifierPressed(e) {
    switch (this.config["Modifier key"]) {
      case undefined:
      case null:
      case false:
      case 0:
        return true;
      case "ctrl":
        return e.getModifierState("Control");
      case "shift":
        return e.getModifierState("Shift");
      case "alt":
        return e.getModifierState("Alt");
      case "meta":
        return e.getModifierState("Meta");
      case "accel":
        return e.getModifierState("Accel");
      default:
        return true;
    }
  }
  goBack(e) {
    if (!this.triggerTab) return;
    let { tabs } = this;
    let where = whereToOpenLink(e, false, true);
    if (where == "current")
      tabs.forEach(tab => {
        let browser = gBrowser.getBrowserForTab(tab);
        if (browser.webNavigation?.canGoBack) browser.goBack();
      });
    else this.duplicateTabsIn(tabs, where, -1);
  }
  goForward(e) {
    if (!this.triggerTab) return;
    let { tabs } = this;
    let where = whereToOpenLink(e, false, true);
    if (where == "current")
      tabs.forEach(tab => {
        let browser = gBrowser.getBrowserForTab(tab);
        if (browser.webNavigation?.canGoForward) browser.goForward();
      });
    else this.duplicateTabsIn(tabs, where, 1);
  }
  // used by the back/forward context menu items. navigates a given browser's history
  gotoHistoryIndex(e) {
    e = getRootEvent(e);
    let index = e.target.getAttribute("index");
    if (!index) return false;
    let where = whereToOpenLink(e);
    if (where == "current") {
      try {
        this.triggerTab.linkedBrowser.gotoIndex(index);
      } catch (ex) {
        return false;
      }
      return true;
    }
    let historyindex = e.target.getAttribute("historyindex");
    duplicateTabIn(this.triggerTab, where, Number(historyindex));
    return true;
  }
  // called when pressing the reload button. depending on modifier keys pressed,
  // either reload the tab in place or reload it in a new tab or window.
  reloadOrDuplicate(e) {
    e = getRootEvent(e);
    let { tabs } = this;
    let accelKeyPressed = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
    let backgroundTabModifier = e.button == 1 || accelKeyPressed;
    if (e.shiftKey && !backgroundTabModifier) {
      this.browserReloadWithFlags(
        tabs,
        Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_PROXY | Ci.nsIWebNavigation.LOAD_FLAGS_BYPASS_CACHE
      );
      return;
    }
    let where = whereToOpenLink(e, false, true);
    if (where == "current") this.browserReloadWithFlags(tabs, Ci.nsIWebNavigation.LOAD_FLAGS_NONE);
    else this.duplicateTabsIn(tabs, where);
  }
  // this performs the same functions as above but does so after duplicating
  // the tab as a new tab or in a new window
  duplicateTabsIn(tabs, where, i) {
    tabs.forEach(tab => duplicateTabIn(tab, where, i));
  }
  // for a given set of tabs, reload their linked browsers with the passed
  // (binary) flags. we only use the bypass proxy & cache flags.
  // this is the same as when you press ctrl+shift+R.
  browserReloadWithFlags(tabs, flags) {
    let unchangedRemoteness = [];
    tabs.forEach(tab => {
      let browser = tab.linkedBrowser;
      let url = browser.currentURI.spec;
      let principal = tab.linkedBrowser.contentPrincipal;
      if (gBrowser.updateBrowserRemotenessByURL(browser, url)) {
        if (tab.linkedPanel) loadBrowserURI(browser, url, principal);
        else {
          tab.addEventListener("SSTabRestoring", () => loadBrowserURI(browser, url, principal), {
            once: true,
          });
          gBrowser._insertBrowser(tab);
        }
      } else unchangedRemoteness.push(tab);
    });
    if (!unchangedRemoteness.length) return;
    for (let tab of unchangedRemoteness) {
      SitePermissions.clearTemporaryBlockPermissions(tab.linkedBrowser);
      delete tab.linkedBrowser.authPromptAbuseCounter;
    }
    gIdentityHandler.hidePopup();
    gPermissionPanel.hidePopup();
    let handlingUserInput = document.hasValidTransientUserGestureActivation;
    for (let tab of unchangedRemoteness) {
      if (tab.linkedPanel) sendReloadMessage(tab);
      else {
        tab.addEventListener("SSTabRestoring", () => sendReloadMessage(tab), {
          once: true,
        });
        gBrowser._insertBrowser(tab);
      }
    }
    function loadBrowserURI(browser, url, principal) {
      browser.loadURI(url, {
        flags,
        triggeringPrincipal: principal,
      });
    }
    function sendReloadMessage(tab) {
      tab.linkedBrowser.sendMessageToActor(
        "Browser:Reload",
        { flags, handlingUserInput },
        "BrowserTab"
      );
    }
  }
  // enable/disable the back and forward buttons according to
  // whether the selected tabs can go back/forward
  updateButtonsState(tabs = this.tabs) {
    this.backButton.disabled = !tabs.some(
      tab => gBrowser.getBrowserForTab(tab).webNavigation?.canGoBack
    );
    this.forwardButton.disabled = !tabs.some(
      tab => gBrowser.getBrowserForTab(tab).webNavigation?.canGoForward
    );
  }
  // set the tooltip (tab title and url) in the nav popup to match the trigger tab
  handleTooltip() {
    let tab = this.triggerTab;
    if (!tab) return;
    let stringWithShortcut = (stringId, keyElemId, pluralCount) => {
      let keyElem = document.getElementById(keyElemId);
      let shortcut = ShortcutUtils.prettifyShortcut(keyElem);
      return PluralForm.get(pluralCount, gTabBrowserBundle.GetStringFromName(stringId))
        .replace("%S", shortcut)
        .replace("#1", pluralCount);
    };
    let label;
    const selectedTabs = gBrowser.selectedTabs;
    const contextTabInSelection = selectedTabs.includes(tab);
    const affectedTabsLength = contextTabInSelection ? selectedTabs.length : 1;
    this.setFavicon(tab);
    if (tab.mOverCloseButton) {
      let shortcut = ShortcutUtils.prettifyShortcut(key_close);
      label = PluralForm.get(
        affectedTabsLength,
        gTabBrowserBundle.GetStringFromName("tabs.closeTabs.tooltip")
      ).replace("#1", affectedTabsLength);
      if (contextTabInSelection && shortcut) {
        if (label.includes("%S")) label = label.replace("%S", shortcut);
        else label = label + " (" + shortcut + ")";
      }
    } else if (tab._overPlayingIcon) {
      let stringID;
      if (contextTabInSelection) {
        stringID = tab.linkedBrowser.audioMuted
          ? "tabs.unmuteAudio2.tooltip"
          : "tabs.muteAudio2.tooltip";
        label = stringWithShortcut(stringID, "key_toggleMute", affectedTabsLength);
      } else {
        if (tab.hasAttribute("activemedia-blocked")) {
          stringID = "tabs.unblockAudio2.tooltip";
        } else {
          stringID = tab.linkedBrowser.audioMuted
            ? "tabs.unmuteAudio2.background.tooltip"
            : "tabs.muteAudio2.background.tooltip";
        }
        label = PluralForm.get(
          affectedTabsLength,
          gTabBrowserBundle.GetStringFromName(stringID)
        ).replace("#1", affectedTabsLength);
      }
    } else label = gBrowser.getTabTooltip(tab);
    let title = this.navPopup.querySelector(".places-tooltip-title");
    title.value = label;
    let url = this.navPopup.querySelector(".places-tooltip-uri");
    url.value = tab.linkedBrowser?.currentURI?.spec.replace(/^https:\/\//, "");
    if (this.knownWidth) this.captureKnownWidth();
  }
  // sets the main favicon in the nav popup to match the trigger tab
  setFavicon(tab) {
    let busy = tab.getAttribute("busy");
    let progress = tab.getAttribute("progress");
    let { favicon } = this;
    this.setAttributes(favicon, {
      busy,
      progress,
      src: !busy && tab.getAttribute("image"),
      iconloadingprincipal: tab.getAttribute("iconloadingprincipal"),
    });
    if (busy) favicon.classList.add("tab-throbber-tabslist");
    else favicon.classList.remove("tab-throbber-tabslist");
  }
  // if the text in the popup becomes longer, it will make the popup smaller.
  // when the popup is anchored to the left, in LTR layout mode this doesn't
  // matter, because the popup will just extend to the right and the buttons on
  // the left will remain in place. but when the popup is anchored to the right,
  // (e.g., a long tab title when the tab is to the right of the screen) a change
  // in dimensions will extend/retract from the left side. that means if your
  // mouse is on the back button and you click it, and the new page has a shorter
  // title, your mouse will fall outside the bounds of the popup and the popup
  // will hide. to prevent this, we cache the popup's width while it's anchored
  // to the right (or anchored to the left in RTL mode) to allow it to grow but
  // never shrink while it's open. its "known width" will reset when it closes,
  // but while it remains open, it will never get smaller. this is similar to how
  // firefox's panel dimensions are sticky, persisting even when you switch to a
  // smaller subview, so buttons don't move around in a jerky way.
  captureKnownWidth() {
    let rect = windowUtils.getBoundsWithoutFlushing(this.tooltipBox);
    if (!rect) return;
    if (this.knownWidth && this.knownWidth > rect.width) return;
    this.knownWidth = rect.width;
  }
  // called when the back/forward context menu is open.
  // fills it with navigation history entries.
  fillHistoryMenu(menupopup) {
    // if this setting is enabled, set up a listener for selection of items in
    // the context menu. this way when an item is "hovered" in the context menu,
    // its title, url, and favicon can be temporarily shown in the main nav
    // popup, functioning like a tooltip or status bar.
    if (
      !menupopup.hasStatusListener &&
      this.config["Update tooltip when hovering in the history menu"]
    ) {
      menupopup.addEventListener("DOMMenuItemActive", e => {
        if (e.target.hasAttribute("checked")) this.handleTooltip();
        else {
          let uri = e.target.getAttribute("uri");
          let title = this.navPopup.querySelector(".places-tooltip-title");
          let urlLabel = this.navPopup.querySelector(".places-tooltip-uri");
          let { favicon } = this;
          title.value = e.target.getAttribute("label");
          urlLabel.value = uri.replace(/^https:\/\//, "");
          this.setAttributes(favicon, {
            busy: false,
            progress: false,
            src: `page-icon:${uri}`,
          });
          favicon.classList.remove("tab-throbber-tabslist");
          if (this.knownWidth) this.captureKnownWidth();
        }
      });
      menupopup.addEventListener("DOMMenuItemInactive", () => this.handleTooltip());
      menupopup.hasStatusListener = true;
    }

    let children = menupopup.children;
    for (let i = children.length - 1; i >= 0; --i)
      if (children[i].hasAttribute("index")) menupopup.removeChild(children[i]);

    const MAX_HISTORY_MENU_ITEMS = 15;
    const tooltipBack = gNavigatorBundle.getString("tabHistory.goBack");
    const tooltipCurrent = gNavigatorBundle.getString("tabHistory.current");
    const tooltipForward = gNavigatorBundle.getString("tabHistory.goForward");

    let updateSessionHistory = (sessionHistory, initial, ssInParent) => {
      let count = ssInParent ? sessionHistory.count : sessionHistory.entries.length;
      if (!initial) {
        if (count <= 1) {
          menupopup.hidePopup();
          return;
        } else if (menupopup.id != "tabBackForwardMenu" && !menupopup.parentNode.open) {
          menupopup.parentNode.open = true;
          this.menuOpen = true;
          return;
        }
      }
      let { index } = sessionHistory;
      let half_length = Math.floor(MAX_HISTORY_MENU_ITEMS / 2);
      let start = Math.max(index - half_length, 0);
      let end = Math.min(start == 0 ? MAX_HISTORY_MENU_ITEMS : index + half_length + 1, count);
      if (end == count) start = Math.max(count - MAX_HISTORY_MENU_ITEMS, 0);
      let existingIndex = 0;
      for (let j = end - 1; j >= start; j--) {
        let entry = ssInParent ? sessionHistory.getEntryAtIndex(j) : sessionHistory.entries[j];
        if (
          BrowserUtils.navigationRequireUserInteraction &&
          entry.hasUserInteraction === false &&
          j != end - 1 &&
          j != start
        )
          continue;
        let uri = ssInParent ? entry.URI.spec : entry.url;
        let item =
          existingIndex < children.length
            ? children[existingIndex]
            : document.createXULElement("menuitem");
        item.setAttribute("uri", uri);
        item.setAttribute("label", entry.title || uri);
        item.setAttribute("index", j);
        item.setAttribute("historyindex", j - index);
        if (j != index) item.style.listStyleImage = `url(page-icon:${uri})`;
        if (j < index) {
          item.className = "unified-nav-back menuitem-iconic menuitem-with-favicon";
          item.setAttribute("tooltiptext", tooltipBack);
        } else if (j == index) {
          item.setAttribute("type", "radio");
          item.setAttribute("checked", "true");
          item.className = "unified-nav-current";
          item.setAttribute("tooltiptext", tooltipCurrent);
        } else {
          item.className = "unified-nav-forward menuitem-iconic menuitem-with-favicon";
          item.setAttribute("tooltiptext", tooltipForward);
        }
        if (!item.parentNode) menupopup.appendChild(item);
        existingIndex++;
      }
      if (!initial) {
        let existingLength = children.length;
        while (existingIndex < existingLength) {
          menupopup.removeChild(menupopup.lastElementChild);
          existingIndex++;
        }
      }
    };
    if (this.triggerTab.multiselected) return false;
    let { browsingContext } = this.triggerTab.linkedBrowser;
    if (!browsingContext) return false;
    let { sessionHistory } = browsingContext;
    if (sessionHistory?.count) {
      if (sessionHistory.count <= 1) return false;
      updateSessionHistory(sessionHistory, true, true);
    } else {
      sessionHistory = SessionStore.getSessionHistory(this.triggerTab, updateSessionHistory);
      updateSessionHistory(sessionHistory, true, false);
    }
    this.menuOpen = true;
    return true;
  }
  registerSheet() {
    let css = /* css */ `#tab-nav-popup {
  margin: 0;
  --arrowpanel-padding: 0;
  --panel-border-radius: var(--tooltip-border-radius, var(--arrowpanel-border-radius));
}
#tab-nav-popup-body {
  padding: var(--tab-nav-popup-padding, 2px 4px);
}
#tab-nav-popup .toolbarbutton-1 {
  appearance: none;
  margin: 0;
  padding: 0 var(--toolbarbutton-outer-padding);
  -moz-box-pack: center;
  background: none !important;
  outline: none !important;
}
#tab-nav-popup .toolbarbutton-1 > .toolbarbutton-icon {
  width: calc(2 * var(--toolbarbutton-inner-padding) + 16px);
  height: calc(2 * var(--toolbarbutton-inner-padding) + 16px);
  padding: var(--toolbarbutton-inner-padding);
  border-radius: var(--toolbarbutton-border-radius);
}
#tab-nav-popup
  .toolbarbutton-1:not([disabled="true"], [checked], [open], :active):hover
  > .toolbarbutton-icon {
  background-color: var(--toolbarbutton-hover-background);
  color: inherit;
}
#tab-nav-popup
  .toolbarbutton-1:not([disabled="true"]):is([open], [checked], :hover:active)
  > .toolbarbutton-icon {
  background-color: var(--toolbarbutton-active-background);
  color: inherit;
}
#tab-nav-popup .toolbarbutton-1:-moz-focusring > .toolbarbutton-icon {
  color: inherit;
  outline: var(--toolbarbutton-focus-outline);
  outline-offset: calc(var(--focus-outline-width) * -1);
}
:root[uidensity="compact"] #tab-nav-popup .toolbarbutton-1:-moz-focusring > .toolbarbutton-icon {
  outline-offset: calc(var(--focus-outline-width) * -1 - 1px);
}
#tab-nav-separator {
  border-left: 1px solid var(--panel-separator-color);
  width: 0;
  margin-block: 3px;
  margin-inline: 4px 6px;
}
#tab-nav-tooltip-box {
  min-width: var(--tab-nav-known-width, revert);
}
#tab-nav-tooltip-textbox {
  padding-block: 4px;
  border: 0;
}
#tab-nav-tooltip-favicon {
  list-style-image: url("chrome://global/skin/icons/defaultFavicon.svg");
  width: 16px;
  height: 16px;
  margin-inline: 2px;
  -moz-context-properties: fill;
  fill: currentColor;
}
#tab-nav-back {
  list-style-image: url("chrome://browser/skin/back.svg");
}
#tab-nav-forward {
  list-style-image: url("chrome://browser/skin/forward.svg");
}
#tab-nav-reload {
  list-style-image: url("chrome://global/skin/icons/reload.svg");
}
#tab-nav-back:-moz-locale-dir(rtl) > .toolbarbutton-icon,
#tab-nav-forward:-moz-locale-dir(rtl) > .toolbarbutton-icon,
#tab-nav-reload:-moz-locale-dir(rtl) > .toolbarbutton-icon {
  scale: -1 1;
}
.tabbrowser-tab[open] > .tab-stack > .tab-background:not([selected="true"], [multiselected]) {
  background-color: color-mix(in srgb, currentColor 11%, transparent);
}
#tab-nav-popup[side]::part(arrowbox) {
  display: none;
}
#tab-nav-popup[type="arrow"]::part(content) {
  margin: 0;
}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    // avoid loading duplicate sheets on subsequent window launches.
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

if (gBrowserInit.delayedStartupFinished) window.tabNavButtons = new TabTooltipNav();
else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.tabNavButtons = new TabTooltipNav();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
