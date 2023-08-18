// ==UserScript==
// @name           Misc. Mods
// @version        2.1.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Various tiny mods not worth making separate scripts for. Read the comments inside the script for details.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/miscMods.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/miscMods.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  // Add these prefs in about:config if you want your settings to persist
  // between script updates without having to manually reapply them.
  let config = {
    // by default the bookmarks toolbar unhides itself when you use the edit bookmark panel and
    // select the bookmarks toolbar as the bookmark's folder. this is super annoying so I'm
    // completely turning it off.
    "Disable bookmarks toolbar auto show": Services.prefs.getBoolPref(
      "miscMods.disableBookmarksToolbarAutoShow",
      true
    ),

    // on macOS the arrow keyboard shortcuts (cmd+shift+pgup) "wrap" relative to the tab bar, so
    // moving the final tab right will move it to the beginning of the tab bar. for some reason
    // this is turned off on linux and windows. I'm turning it on.
    "Moving tabs with arrow keys can wrap": Services.prefs.getBoolPref(
      "miscMods.movingTabsWithArrowKeysCanWrap",
      true
    ),

    // for some reason, when you open the downloads panel it automatically focuses the first
    // element, which is the footer if you don't have any downloads. this is inconsistent with
    // other panels, and a little annoying imo. it's not a big deal but one of firefox's biggest
    // problems compared to other browsers is a general lack of consistency. so I think removing
    // this whole behavior would probably be wise, but for now I'll just stop it from focusing
    // the *footer*, but still allow it to focus the first download item if there are any.
    "Stop downloads panel auto-focusing the footer button":
      Services.prefs.getBoolPref(
        "miscMods.stopDownloadsPanelAutoFocusingTheFooterButton",
        true
      ),

    // when you use the "move tab" hotkeys, e.g. Ctrl + Shift + PageUp, it only moves the active
    // tab, even if you have multiple tabs selected. this is inconsistent with the keyboard
    // shortcuts "move tab to end" or "move tab to start" and of course, inconsistent with the
    // drag & drop behavior. this will change the hotkeys so they move all selected tabs.
    "Move all selected tabs with hotkeys": Services.prefs.getBoolPref(
      "miscMods.moveAllSelectedTabsWithHotkeys",
      true
    ),

    // with browser.proton.places-tooltip.enabled, the bookmarks/history/tabs tooltip is
    // improved and normally it gets anchored to the element that popped up the tooltip, i.e.
    // the element you hovered. but for some reason menupopups are an exception. it does this on
    // all relevant elements, including bookmarks in panels, just not on bookmarks menu popups.
    // but I tested it and it works fine on menupopups so I'm removing the exception. there also
    // isn't any anchoring inside sidebars, because the bookmarks/history items in the sidebar
    // aren't actual DOM elements. there's just one node, the tree, and the individual items are
    // drawn inside it. so they're kind of like virtual nodes. we can't anchor to them the
    // normal way since they're not elements, but we can get their screen coordinates and
    // constrain the tooltip popup within those coordinates. so this will implement the proton
    // places tooltip behavior everywhere, rather than it being restricted to panels and the tab bar.
    "Anchor bookmarks menu tooltip to bookmark": Services.prefs.getBoolPref(
      "miscMods.anchorBookmarksMenuTooltipToBookmark",
      true
    ),

    // by default, when you hit ctrl+tab it waits 200ms before opening the panel. if you replace
    // the 200 with another number, it will wait that long in milliseconds instead.
    "Reduce ctrl+tab delay": Services.prefs.getIntPref(
      "miscMods.reduceCtrlTabDelay",
      200
    ),

    // By default, Shift+Ctrl+Tab will open the all-tabs panel. But if you hit
    // Ctrl+Tab to open the ctrlTab panel, then Shift+Ctrl+Tab will cycle
    // backwards through recently used tabs. To make this more consistent with
    // OS-level Alt/Cmd+Tab, this setting disables the all-tabs panel shortcut.
    "Use Shift+Ctrl+Tab to switch": Services.prefs.getBoolPref(
      "miscMods.useShiftCtrlTabToSwitch",
      true
    ),

    // normally, firefox only animates the stop/reload button when it's in the main customizable
    // navbar. if you enter customize mode and move the button to the tabs toolbar, menu bar, or
    // personal/bookmarks toolbar, the animated transition between the stop icon to the reload
    // icon disappears. the icon just instantly changes. I suspect this is done in order to
    // avoid potential problems with density modes, but it doesn't seem necessary. as long as
    // you provide some CSS it works fine:
    // #stop-reload-button {position: relative;}
    // #stop-reload-button > :is(#reload-button, #stop-button) > .toolbarbutton-animatable-box {display: block;}
    // :is(#reload-button, #stop-button) > .toolbarbutton-icon {padding: var(--toolbarbutton-inner-padding) !important;}
    "Allow stop/reload button to animate in other toolbars":
      Services.prefs.getBoolPref(
        "miscMods.allowStopReloadButtonToAnimateInOtherToolbars",
        true
      ),

    // When you open a private window, it shows a little private browsing icon in the top of the
    // navbar, next to the window control buttons. It doesn't have a tooltip for some reason, so
    // if you don't already recognize the private browsing icon, you won't know what it means.
    // This simply gives it a localized tooltip like "You're in a Private Window" in English.
    // The exact string is drawn from Firefox's fluent files, so it depends on your language.
    "Give the private browsing indicator a tooltip": Services.prefs.getBoolPref(
      "miscMods.giveThePrivateBrowsingIndicatorATooltip",
      true
    ),

    // The location where your bookmarks are saved by default is defined in the preference
    // browser.bookmarks.defaultLocation. This pref is updated every time you manually change a
    // bookmark's folder in the urlbar star button's edit bookmark panel. So if you want to save
    // to toolbar by default, but you just added a bookmark to a different folder with the
    // panel, that different folder now becomes your default location. So the next time you go
    // to add a bookmark, instead of saving it to your toolbar it'll save it to the most recent
    // folder you chose in the edit bookmark panel. This can be kind of annoying if you have a
    // main bookmarks folder and a bunch of smaller subfolders. So I added this option to
    // eliminate this updating behavior. This will stop Firefox from automatically updating the
    // preference every time you use the edit bookmark panel. Once you install the script there
    // will be a new checkbox in the edit bookmark panel, once you expand the "location"
    // section. If you uncheck this checkbox, Firefox will stop updating the default bookmark
    // location. So whatever the default location is set to at the time you uncheck the checkbox
    // will permanently remain your default location. You can still change the default location
    // by modifying the preference directly or by temporarily checking that checkbox. It just
    // means the default location will only automatically change when the checkbox is checked.
    "Preserve your default bookmarks folder": Services.prefs.getBoolPref(
      "miscMods.preserveYourDefaultBookmarksFolder",
      true
    ),

    // By default, the private browsing indicator is just an inert <hbox> that sits next to the
    // window control buttons. Hovering it reveals a tooltip, but that's it. Without any hover
    // styles it seems kind of out of place. But giving something hover styles when it has no
    // actual function seems like a bad idea. So instead of doing nothing, clicking the
    // indicator will open a support page with info about private browsing. Better than nothing,
    // and I didn't want to make it a redundant "new private window" button.
    "Turn private browsing indicator into button": Services.prefs.getBoolPref(
      "miscMods.turnPrivateBrowsingIndicatorIntoButton",
      true
    ),

    // By default, the permissions popup anchors to the center of the permissions box. But this
    // box can have anywhere from 1 to 20 icons visible at one time. So the permission winds up
    // appearing like it's just floating in space rather than anchored to something in
    // particular. This mod will change the method so that it anchors to the permission granted
    // icon instead. That's the first icon in the box. So it will appear left-aligned rather
    // than center aligned.
    "Anchor permissions popup to granted permission icon":
      Services.prefs.getBoolPref(
        "miscMods.anchorPermissionsPopupToGrantedPermissionIcon",
        true
      ),

    // By default, when you're in DOM fullscreen (e.g. you clicked the
    // fullscreen button in a web video player like YouTube's) and you open
    // the permissions popup somehow, Firefox exits fullscreen before
    // opening the popup. This was done to prevent a weird flickering bug.
    // But in my testing it doesn't seem to be necessary, at least when
    // duskFox is installed. So this tiny mod just removes that behavior so
    // that it opens as normal in fullscreen.
    "Don't exit DOM fullscreen when opening permissions popup":
      Services.prefs.getBoolPref(
        "miscMods.dontExitDOMFullscreenWhenOpeningPermissionsPopup",
        true
      ),

    // When you click and drag a tab, Firefox displays a small thumbnail preview of the tab's
    // content next to your mouse cursor (provided you have `nglayout.enable_drag_images` set to
    // true). This preview has a white background, so it will display as a 160x90px white
    // rectangle until the thumbnail loads. If you use "dark mode" a lot, this will pretty
    // consistently result in an unsightly white flash every time you click and drag a tab.
    // Unfortunately the white color is set at the Canvas level so can't be overridden with CSS.
    // But with JavaScript we can change the method that sets the background color. Instead of
    // using a fixed color value, this setting calculates the effective value of a CSS variable,
    // --in-content-bg-dark. This variable is already set by duskFox so you don't need to set it
    // yourself if you use my CSS theme. If you don't, then make sure you add
    // `:root{--in-content-bg-dark: #000}` to your userChrome.css, or it will fall back to white.
    "Customize tab drag preview background color": Services.prefs.getBoolPref(
      "miscMods.customizeTabDragPreviewBackgroundColor",
      true
    ),

    // Normally when a page is loading, Firefox will display network information
    // in the bottom left of the browser content area. When the mouse cursor is
    // hovering over a link, this is also where the link URL is shown. This
    // setting disables the page network status but keeps the mouseover link
    // URL. duskFox used to do this with CSS, but it doesn't behave well with
    // the fade transitions to do it that way. So now it's done with JavaScript.
    "Disable loading status for status panel": Services.prefs.getBoolPref(
      "miscMods.disableLoadingStatusForStatusPanel",
      true
    ),

    // With duskFox installed, we indicate container tabs by adding a colored
    // stripe at the bottom of the tab. But we also add a purple stripe at the
    // bottom of multiselected tabs, which overrides the container tab stripe.
    // So when you multiselect a container tab, you can't tell it's a container
    // tab until you deselect it. This mod will additionally add a CSS property
    // that carries the container's icon in addition to its color. That's the
    // same icon that shows in the urlbar on container tabs. Firefox's built-in
    // styles don't use this for tabs, but duskFox does. Here's the style I use
    // to show these icons in tabs in duskFox:
    // .tabbrowser-tab.identity-icon-on-multiselect[usercontextid][multiselected="true"]
    //   .tab-content::after {
    //   content: "";
    //   display: flex;
    //   height: 12px;
    //   width: 12px;
    //   margin-inline: 3px;
    //   background: var(--identity-icon) center/contain no-repeat;
    //   fill: var(--identity-icon-color);
    //   -moz-context-properties: fill;
    // }
    // This is a pretty opinionated change and it doesn't do anything without
    // duskFox or the above CSS, so it's disabled by default.
    "Show container icons on multiselected tabs": Services.prefs.getBoolPref(
      "miscMods.showContainerIconsOnMultiselectedTabs",
      false
    ),
  };
  class UCMiscMods {
    constructor() {
      if (config["Disable bookmarks toolbar auto show"]) {
        gEditItemOverlay._autoshowBookmarksToolbar = function () {};
      }
      if (config["Moving tabs with arrow keys can wrap"]) {
        gBrowser.arrowKeysShouldWrap = true;
      }
      if (config["Stop downloads panel auto-focusing the footer button"]) {
        this.stopDownloadsPanelFocus();
      }
      if (config["Move all selected tabs with hotkeys"]) {
        this.moveTabKeysMoveSelectedTabs();
      }
      if (config["Anchor bookmarks menu tooltip to bookmark"]) {
        this.anchorBookmarksTooltip();
      }
      this.modCtrlTabMethods();
      if (config["Allow stop/reload button to animate in other toolbars"]) {
        this.stopReloadAnimations();
      }
      if (config["Give the private browsing indicator a tooltip"]) {
        this.addPrivateBrowsingTooltip();
      }
      if (config["Preserve your default bookmarks folder"]) {
        this.makeDefaultBookmarkFolderPermanent();
      }
      if (config["Turn private browsing indicator into button"]) {
        this.privateBrowsingIndicatorButton();
      }
      if (config["Don't exit DOM fullscreen when opening permissions popup"]) {
        this.permsPopupInFullscreen();
      }
      if (config["Customize tab drag preview background color"]) {
        this.tabDragPreview();
      }
      if (config["Show container icons on multiselected tabs"]) {
        this.containerIconsOnMultiselectedTabs();
      }
      if (config["Disable loading status for status panel"]) {
        this.disableLoadingStatus();
      }
      this.randomTinyStuff();
    }
    stopDownloadsPanelFocus() {
      eval(
        `DownloadsPanel._focusPanel = function ${DownloadsPanel._focusPanel
          .toSource()
          .replace(/DownloadsFooter\.focus\(\)\;/, ``)}`
      );
    }
    moveTabKeysMoveSelectedTabs() {
      gBrowser.moveTabsBackward = function () {
        let tabs = this.selectedTab.multiselected
          ? this.selectedTabs
          : [this.selectedTab];
        let previousTab = this.tabContainer.findNextTab(tabs[0], {
          direction: -1,
          filter: tab => !tab.hidden,
        });
        for (let tab of tabs) {
          if (previousTab) {
            this.moveTabTo(tab, previousTab._tPos);
          } else if (
            this.arrowKeysShouldWrap &&
            tab._tPos < this.browsers.length - 1
          ) {
            this.moveTabTo(tab, this.browsers.length - 1);
          }
        }
      };
      gBrowser.moveTabsForward = function () {
        let tabs = this.selectedTab.multiselected
          ? this.selectedTabs
          : [this.selectedTab];
        let nextTab = this.tabContainer.findNextTab(tabs[tabs.length - 1], {
          direction: 1,
          filter: tab => !tab.hidden,
        });
        for (let i = tabs.length - 1; i >= 0; i--) {
          let tab = tabs[i];
          if (nextTab) {
            this.moveTabTo(tab, nextTab._tPos);
          } else if (this.arrowKeysShouldWrap && tab._tPos > 0) {
            this.moveTabTo(tab, 0);
          }
        }
      };
      eval(
        `gBrowser._handleKeyDownEvent = function ${gBrowser._handleKeyDownEvent
          .toSource()
          .replace(/moveTabBackward/, `moveTabsBackward`)
          .replace(/moveTabForward/, `moveTabsForward`)}`
      );
    }
    anchorBookmarksTooltip() {
      BookmarksEventHandler.fillInBHTooltip = function (aDocument, aEvent) {
        var node;
        var cropped = false;
        var targetURI;
        let tooltip = aEvent.target;
        if (tooltip.triggerNode.localName == "treechildren") {
          var tree = tooltip.triggerNode.parentNode;
          var cell = tree.getCellAt(aEvent.clientX, aEvent.clientY);
          if (cell.row == -1) return false;
          node = tree.view.nodeForTreeIndex(cell.row);
          cropped = tree.isCellCropped(cell.row, cell.col);
          // get coordinates for the cell in a tree.
          var cellCoords = tree.getCoordsForCellItem(
            cell.row,
            cell.col,
            "cell"
          );
        } else {
          var tooltipNode = tooltip.triggerNode;
          if (tooltipNode._placesNode) node = tooltipNode._placesNode;
          else targetURI = tooltipNode.getAttribute("targetURI");
        }
        if (!node && !targetURI) return false;
        var title = node ? node.title : tooltipNode.label;
        var url;
        if (targetURI || PlacesUtils.nodeIsURI(node)) {
          url = targetURI || node.uri;
        }
        if (!cropped && !url) return false;
        aEvent.target.setAttribute("position", "after_start");
        if (tooltipNode) {
          aEvent.target.moveToAnchor(tooltipNode, "after_start");
        } else if (tree && cellCoords) {
          // anchor the tooltip to the tree cell
          aEvent.target.moveTo(
            cellCoords.left + tree.screenX,
            cellCoords.bottom + tree.screenY
          );
        }
        let tooltipTitle = aEvent.target.querySelector(".places-tooltip-title");
        tooltipTitle.hidden = !title || title == url;
        if (!tooltipTitle.hidden) tooltipTitle.textContent = title;
        let tooltipUrl = aEvent.target.querySelector(".places-tooltip-uri");
        tooltipUrl.hidden = !url;
        if (!tooltipUrl.hidden) tooltipUrl.value = url;
        return true;
      };
    }
    modCtrlTabMethods() {
      const delay = config["Reduce ctrl+tab delay"];
      const shiftCtrlTabBehavior = config["Use Shift+Ctrl+Tab to switch"];
      ctrlTab.onKeyDown = function (event) {
        let action = ShortcutUtils.getSystemActionForEvent(event);
        if (action != ShortcutUtils.CYCLE_TABS) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (this.isOpen) {
          this.advanceFocus(!event.shiftKey);
          return;
        }

        Services.els.addSystemEventListener(document, "keyup", this, false);

        let tabs = gBrowser.visibleTabs;
        if (tabs.length > 2) {
          let reverse = event.shiftKey && shiftCtrlTabBehavior;
          this.open(!reverse);
        } else if (tabs.length == 2) {
          let index = tabs[0].selected ? 1 : 0;
          gBrowser.selectedTab = tabs[index];
        }
      };
      ctrlTab.open = function (forward = true) {
        if (this.isOpen) return;
        this.canvasWidth = Math.ceil(
          (screen.availWidth * 0.85) / this.maxTabPreviews
        );
        this.canvasHeight = Math.round(
          this.canvasWidth * tabPreviews.aspectRatio
        );
        this.updatePreviews();

        let selectedIndex = 0;
        do {
          selectedIndex += forward ? 1 : -1;
          if (selectedIndex < 0) {
            selectedIndex = this.previews.length - 1;
          } else if (selectedIndex >= this.previews.length) {
            selectedIndex = 0;
          }
        } while (this.previews[selectedIndex].hidden);
        this._selectedIndex = selectedIndex;

        if (this.selected._tab) {
          gBrowser.warmupTab(this.selected._tab);
        }
        this._timer = setTimeout(() => {
          this._timer = null;
          this._openPanel();
        }, delay);
      };
    }
    stopReloadAnimations() {
      eval(
        `CombinedStopReload.switchToStop = function ${CombinedStopReload.switchToStop
          .toSource()
          .replace(/switchToStop/, "")
          .replace(/#nav-bar-customization-target/, `.customization-target`)}`
      );
      eval(
        `CombinedStopReload.switchToReload = function ${CombinedStopReload.switchToReload
          .toSource()
          .replace(/switchToReload/, "")
          .replace(/#nav-bar-customization-target/, `.customization-target`)}`
      );
    }
    async addPrivateBrowsingTooltip() {
      this.privateL10n = await new Localization(
        ["browser/aboutPrivateBrowsing.ftl"],
        true
      );
      let l10nId = PrivateBrowsingUtils.isWindowPrivate(window)
        ? "about-private-browsing-info-title"
        : "about-private-browsing-not-private";
      document.querySelector(".private-browsing-indicator").tooltipText =
        await this.privateL10n.formatValue([l10nId]);
    }
    makeDefaultBookmarkFolderPermanent() {
      let { panel } = StarUI;
      let checkbox = panel
        .querySelector("#editBMPanel_newFolderBox")
        .appendChild(
          _ucUtils.createElement(document, "checkbox", {
            id: "editBookmarkPanel_persistLastLocation",
            label: "Remember last location",
            accesskey: "R",
            tooltiptext:
              "Update the default bookmark folder when you change it. If unchecked, the folder chosen when this was checked will remain the default folder indefinitely.",
            oncommand: `Services.prefs.setBoolPref("userChrome.bookmarks.editDialog.persistLastLocation", this.checked)`,
          })
        );
      panel.addEventListener("popupshowing", e => {
        if (e.target !== panel) return;
        let pref = Services.prefs.getBoolPref(
          "userChrome.bookmarks.editDialog.persistLastLocation",
          true
        );
        checkbox.checked = pref;
      });
      eval(
        `StarUI._storeRecentlyUsedFolder = async function ${StarUI._storeRecentlyUsedFolder
          .toSource()
          .replace(/^async \_storeRecentlyUsedFolder/, "")
          .replace(
            /if \(didChangeFolder\)/,
            `if (didChangeFolder && Services.prefs.getBoolPref("userChrome.bookmarks.editDialog.persistLastLocation", true))`
          )}`
      );
    }
    privateBrowsingIndicatorButton() {
      let indicator = document.querySelector(".private-browsing-indicator");
      let tooltiptext = indicator.getAttribute("tooltiptext");
      let markup = `<button class="private-browsing-indicator" aria-live="polite"
                tooltiptext="${tooltiptext}" style="appearance:none;min-width:revert"
                oncommand="openHelpLink('private-browsing-myths')" />`;
      indicator.replaceWith(MozXULElement.parseXULToFragment(markup));
    }
    permsPopupInFullscreen() {
      gPermissionPanel._initializePopup();
      eval(
        `gPermissionPanel.handleIdentityButtonEvent = function ${gPermissionPanel.handleIdentityButtonEvent
          .toSource()
          .replace(/handleIdentityButtonEvent/, "")
          .replace(/document\.fullscreen/, `false`)}`
      );
    }
    tabDragPreview() {
      let { tabContainer } = gBrowser;
      if (tabContainer.hasOwnProperty("on_dragstart")) return;
      eval(
        `tabContainer.on_dragstart = function ${tabContainer.on_dragstart
          .toSource()
          .replace(/on_dragstart/, "")
          .replace(
            /\"white\"/,
            `getComputedStyle(this).getPropertyValue("--in-content-bg-dark").trim() || "white"`
          )}`
      );
    }
    containerIconsOnMultiselectedTabs() {
      const lazy = {};
      XPCOMUtils.defineLazyModuleGetters(lazy, {
        ContextualIdentityService:
          "resource://gre/modules/ContextualIdentityService.jsm",
      });
      if (lazy.ContextualIdentityService.hasOwnProperty("setTabStyle")) return;
      lazy.ContextualIdentityService.setTabStyle = function (tab) {
        if (!tab.hasAttribute("usercontextid")) {
          return;
        }

        let userContextId = tab.getAttribute("usercontextid");
        let identity = this.getPublicIdentityFromId(userContextId);

        let colorPrefix = "identity-color-";
        let iconPrefix = "identity-icon-";
        /* Remove the existing container color highlight if it exists */
        for (let className of tab.classList) {
          if (
            className.startsWith(colorPrefix) ||
            className.startsWith(iconPrefix)
          ) {
            tab.classList.remove(className);
          }
        }
        if (identity) {
          if (identity.color) {
            tab.classList.add(colorPrefix + identity.color);
          }
          if (identity.icon) {
            tab.classList.add(iconPrefix + identity.icon);
            tab.classList.add(`${iconPrefix}on-multiselect`);
          }
        }
      };
    }
    disableLoadingStatus() {
      if (StatusPanel.update.name !== "uc_update") {
        eval(
          `StatusPanel.update = function ${StatusPanel.update
            .toSource()
            .replace(/^update/, "uc_update")
            .replace(
              /\s*if \(XULBrowserWindow\.busyUI\) {\n\s*types\.push\(\"status\"\);\n\s*}\n\s*types\.push\(\"defaultStatus\"\);/,
              ""
            )}`
        );
      }
    }
    randomTinyStuff() {
      // give the tracking protection popup's info button a tooltip
      let etpPanel = document
        .getElementById("template-protections-popup")
        ?.content.querySelector("#protections-popup");
      let setEtpPopupInfoTooltip = e => {
        let infoButton = e.target.querySelector(
          "#protections-popup-info-button"
        );
        let ariaLabel = infoButton.getAttribute("aria-label");
        if (ariaLabel) {
          infoButton.removeAttribute("data-l10n-id");
          infoButton.setAttribute("tooltiptext", ariaLabel);
        } else if (infoButton.getAttribute("data-l10n-id")) {
          return document.l10n.translateElements([infoButton]);
        }
        etpPanel.removeEventListener("popupshowing", setEtpPopupInfoTooltip);
      };
      if (etpPanel) {
        etpPanel.addEventListener("popupshowing", setEtpPopupInfoTooltip);
      }

      // add an "engine" attribute to the searchbar autocomplete popup, so we can replace the
      // engine icon with CSS without needing to use the (random) icon URL as a selector. this
      // way, my replacing the built-in Google engine's icon with a nicer-looking one will
      // work for everyone. otherwise we'd have problems since the URL is randomly generated
      // for everyone. my selector wouldn't work for you. but here, we can make it universal:
      // #PopupSearchAutoComplete[engine="Google"] .searchbar-engine-image
      // see uc-urlbar.css for the implementation in duskFox.
      let searchbarPopup = document.getElementById("PopupSearchAutoComplete");
      eval(
        `searchbarPopup.updateHeader = async function ${searchbarPopup.updateHeader
          .toSource()
          .replace(/async updateHeader/, "")
          .replace(
            /(let uri = engine.iconURI;)/,
            `engine.name ? this.setAttribute("engine", engine.name) : this.removeAttribute("engine");\n      $1`
          )}`
      );

      // Add a separator between "Enhanced Tracking Protection is ON for this
      // site" and "Site not working?" for aesthetic reasons.
      ChromeUtils.defineLazyGetter(
        gProtectionsHandler,
        "_protectionsPopupTPSwitchSeparator",
        function () {
          let footer = this._protectionsPopupTPSwitchBreakageLink.parentElement;
          let separator = document.createElement("toolbarseparator");
          separator.id = "protections-popup-tp-switch-separator";
          separator.hidden = true;
          footer.before(separator);
          return separator;
        }
      );
      if (
        gProtectionsHandler.toggleBreakageLink.name !== "uc_toggleBreakageLink"
      ) {
        eval(
          `gProtectionsHandler.toggleBreakageLink = function uc_toggleBreakageLink ${gProtectionsHandler.toggleBreakageLink
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^function\s*/, "")
            .replace(/^toggleBreakageLink\s*/, "")
            .replace(
              /}$/,
              `\n    this._protectionsPopupTPSwitchSeparator.hidden =\n      this._protectionsPopupTPSwitchBreakageLink.hidden &&\n      this._protectionsPopupTPSwitchBreakageFixedLink.hidden;\n  }`
            )}`
        );
      }
    }
  }

  if (gBrowserInit.delayedStartupFinished) {
    new UCMiscMods();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        new UCMiscMods();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
