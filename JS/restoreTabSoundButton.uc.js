// ==UserScript==
// @name           Restore pre-Proton Tab Sound Button
// @version        2.3.5
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Proton makes really big changes to tabs, in particular
// removing the tab sound button in favor of the overlay button and a whole row
// of text. This script keeps the new tab tooltip enabled by the pref
// "browser.proton.places-tooltip.enabled" but allows it to work with the old
// .tab-icon-sound. So you get the nice parts of the proton tab changes without
// the second row of text about the audio playing. Instead it will show the
// mute/unmute tooltip inside the normal tab tooltip. It also changes the
// tooltip a bit so that it's always anchored to the tab rather than floating
// around tethered to the exact mouse position. This makes it easier to modify
// the tooltip appearance without the tooltip getting in your way. It also lets
// the insecure tooltip icon show other security states, like mixed passive
// content or error page. This way the tooltip icon should usually match the
// identity icon for the tab you're hovering. This script *requires* that you
// either 1) use my theme, complete with chrome.manifest and the resources
// folder, or 2) download resources/script-override/tabMods.uc.js and put it in
// the same location in your chrome folder, then edit your utils/chrome.manifest
// file to add the following line (without the "//"):
// override chrome://browser/content/tabbrowser-tab.js ../resources/tabMods.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(async function() {
  let css = /* css */ `.tab-icon-sound-label,
  .tab-secondary-label {
    display: none;
  }
  .tab-icon-sound:not([soundplaying], [muted], [activemedia-blocked], [pictureinpicture]),
  .tab-icon-sound[pinned] {
    display: none;
  }
  .tab-icon-overlay {
    display: none;
  }
  #places-tooltip-insecure-icon {
    -moz-context-properties: fill;
    fill: currentColor;
    width: 1em;
    height: 1em;
    margin-inline-start: 0;
    margin-inline-end: 0.2em;
    min-width: 1em !important;
  }
  #places-tooltip-insecure-icon[hidden] {
    display: none;
  }`;
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
  if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  /* necessary DOM:
    <tooltip id="tabbrowser-tab-tooltip"
            class="places-tooltip"
            onpopupshowing="gBrowser.createTooltip(event);"
            onpopuphiding="this.removeAttribute('position')">
      <vbox class="places-tooltip-box" flex="1">
        <description class="tooltip-label places-tooltip-title" />
        <hbox>
          <image id="places-tooltip-insecure-icon"></image>
          <description crop="center"
                      class="tooltip-label places-tooltip-uri uri-element" />
        </hbox>
      </vbox>
    </tooltip>
   */
  /**
   * for a given tab on which the tooltip is anchored, set the tooltip icon
   * accordingly. for a secure tab, use the lock icon. for an insecure tab, use
   * the insecure icon. for a chrome UI tab, use the firefox icon. for an
   * extension tab, use the extension icon. and so on... see uc-misc.css for
   * details. search for #places-tooltip-insecure-icon
   * @param {object} icon (the tooltip icon's DOM node)
   * @param {object} tab (the tab's DOM node)
   */
  function setIdentityIcon(icon, tab) {
    let { linkedBrowser } = tab;
    let pending = tab.hasAttribute("pending") || !linkedBrowser.browsingContext;
    let docURI = pending
      ? linkedBrowser?.currentURI
      : linkedBrowser?.documentURI || linkedBrowser?.currentURI;
    if (docURI) {
      let homePage = new RegExp(`(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`, "i").test(
        docURI.spec
      );
      // if the page is the user's homepage or new tab page, reflect that in the icon.
      if (homePage) {
        icon.setAttribute("type", "home-page");
        icon.hidden = false;
        return;
      }
      switch (docURI.scheme) {
        // local URL schemes
        case "file":
        case "resource":
        case "chrome":
          icon.setAttribute("type", "local-page");
          icon.hidden = false;
          return;
        // about: pages
        case "about":
          let pathQueryRef = docURI?.pathQueryRef;
          if (pathQueryRef && /^(neterror|certerror|httpsonlyerror)/.test(pathQueryRef)) {
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
        // extension pages (except the new tab page)
        case "moz-extension":
          icon.setAttribute("type", "extension-page");
          icon.hidden = false;
          return;
      }
    }
    if (linkedBrowser.browsingContext) {
      // web progress listener has some bit flags we can use to decide which
      // security icon to show.
      let prog = Ci.nsIWebProgressListener;
      let state = linkedBrowser?.securityUI?.state;
      // if state is secure or state doesn't exist, the rest below can't apply,
      // so bail out immediately.
      if (typeof state != "number" || state & prog.STATE_IS_SECURE) {
        icon.hidden = true;
        icon.setAttribute("type", "secure");
        return;
      }
      // if state is insecure, that means the actual scheme is insecure. there
      // are other cases besides remote transfer protocols, but they were
      // covered in the logic above. by this point the only options are remote,
      // so we use the fully insecure icon here. if there is mixed content but
      // the scheme is secure then this will be false
      if (state & prog.STATE_IS_INSECURE) {
        icon.setAttribute("type", "insecure");
        icon.hidden = false;
        return;
      }
      // broken state means the scheme is secure but something's wrong with the
      // connection e.g. mixed content
      if (state & prog.STATE_IS_BROKEN) {
        // loaded mixed active content means the page is effectively as insecure
        // as if the page itself was loaded by http. therefore we'll use the
        // fully insecure icon for this case, even though state is not
        // technically insecure.
        if (state & prog.STATE_LOADED_MIXED_ACTIVE_CONTENT) {
          icon.hidden = false;
          icon.setAttribute("type", "insecure");
        } else {
          // any other case when state is broken means some kind of state where
          // the warning lock icon is shown. it doesn't only include mixed
          // passive/display content, e.g. it could also be the weak cipher
          // state, but the same icon is shown regardless. so we'll use the same
          // attribute that shows the warning lock (rather than insecure lock)
          icon.setAttribute("type", "mixed-passive");
          icon.hidden = false;
        }
        return;
      }
    }
    // we probably should have returned by now, but just in case, set the icon
    // to the default secure state.
    icon.hidden = true;
    icon.setAttribute("type", pending ? "pending" : "secure");
  }
  gBrowser.createTooltip = function(e) {
    e.stopPropagation();
    let tab = e.target.triggerNode ? e.target.triggerNode.closest("tab") : null;
    if (!tab) {
      e.preventDefault();
      return;
    }
    let stringWithShortcut = (stringId, keyElemId, pluralCount) => {
      let keyElem = document.getElementById(keyElemId);
      let shortcut = ShortcutUtils.prettifyShortcut(keyElem);
      return PluralForm.get(pluralCount, gTabBrowserBundle.GetStringFromName(stringId))
        .replace("%S", shortcut)
        .replace("#1", pluralCount);
    };
    let tabRect = windowUtils.getBoundsWithoutFlushing(tab);
    let align = true;
    let label;
    const selectedTabs = this.selectedTabs;
    const contextTabInSelection = selectedTabs.includes(tab);
    const affectedTabsLength = contextTabInSelection ? selectedTabs.length : 1;
    if (tab.mOverCloseButton) {
      let rect = windowUtils.getBoundsWithoutFlushing(tab.closeButton);
      let shortcut = ShortcutUtils.prettifyShortcut(document.getelementById("key_close"));
      label = PluralForm.get(
        affectedTabsLength,
        gTabBrowserBundle.GetStringFromName("tabs.closeTabs.tooltip")
      ).replace("#1", affectedTabsLength);
      if (contextTabInSelection && shortcut) {
        if (label.includes("%S")) label = label.replace("%S", shortcut);
        else label = label + " (" + shortcut + ")";
      }
      align = rect.right - tabRect.left < 250;
    } else if (tab._overPlayingIcon) {
      let icon = tab.soundPlayingIcon || tab.overlayIcon;
      let rect = windowUtils.getBoundsWithoutFlushing(icon);
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
      align = rect.right - tabRect.left < 250;
    } else {
      label = this.getTabTooltip(tab);
    }
    if (align) {
      e.target.setAttribute("position", "after_start");
      e.target.moveToAnchor(tab, "after_start");
    }
    let title = e.target.querySelector(".places-tooltip-title");
    title.textContent = label;
    if (tab.getAttribute("customizemode") === "true") {
      e.target.querySelector(".places-tooltip-box").setAttribute("desc-hidden", "true");
    } else {
      let url = e.target.querySelector(".places-tooltip-uri");
      url.value = tab.linkedBrowser?.currentURI?.spec.replace(/^https:\/\//, "");
      setIdentityIcon(e.target.querySelector("#places-tooltip-insecure-icon"), tab);
      e.target.querySelector(".places-tooltip-box").removeAttribute("desc-hidden");
    }
  };
})();
