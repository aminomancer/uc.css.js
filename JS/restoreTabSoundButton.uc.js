// ==UserScript==
// @name           Restore pre-Proton Tab Sound Button
// @version        2.4.1
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Proton makes really big changes to tabs, in particular removing the tab sound button in favor of the overlay button and a whole row of text. This script creates a more advanced tab tooltip. Instead of showing the mute/unmute tooltip inside a row of text in the tab itself, it will show this information in the normal tab tooltip.

It also changes the tooltip a bit so that it's always anchored to the tab rather than floating around tethered to the exact mouse position. This makes it easier to modify the tooltip appearance without the tooltip getting in your way. It also lets the insecure tooltip icon show other security states, like mixed passive content or error page. This way the tooltip icon should usually match the identity icon for the tab you're hovering.

This script _requires_ that you either 1) use my theme, complete with [chrome.manifest][] and the resources folder, or 2) download [tabMods.uc.js][] and put it in your `chrome/resources/script-override/` folder, then edit your [chrome.manifest][] file to add the following line:

```
override chrome://browser/content/tabbrowser/tab.js ../resources/tabMods.uc.js
```

[chrome.manifest]: https://github.com/aminomancer/uc.css.js/blob/master/utils/chrome.manifest
[tabMods.uc.js]: https://github.com/aminomancer/uc.css.js/blob/master/resources/script-override/tabMods.uc.js
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/restoreTabSoundButton.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/restoreTabSoundButton.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(async function () {
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
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );
  let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
  if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
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
      let homePage = new RegExp(
        `(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`,
        "i"
      ).test(docURI.spec);
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
        case "about": {
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
        }
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
  gBrowser.createTooltip = function (event) {
    event.stopPropagation();
    let tab = event.target.triggerNode?.closest("tab");
    if (!tab) {
      event.preventDefault();
      return;
    }

    const tooltip = event.target;
    tooltip.removeAttribute("data-l10n-id");

    let tabRect = windowUtils.getBoundsWithoutFlushing(tab);
    let id, args, raw;
    let align = true;
    let { linkedBrowser } = tab;
    const contextTabInSelection = this.selectedTabs.includes(tab);
    const tabCount = contextTabInSelection ? this.selectedTabs.length : 1;
    if (tab.mOverCloseButton) {
      let rect = windowUtils.getBoundsWithoutFlushing(tab.closeButton);
      id = "tabbrowser-close-tabs-tooltip";
      args = { tabCount };
      align = rect.right - tabRect.left < 250;
    } else if (tab._overPlayingIcon) {
      let icon = tab.soundPlayingIcon || tab.overlayIcon;
      let rect = windowUtils.getBoundsWithoutFlushing(icon);
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
      align = rect.right - tabRect.left < 250;
    } else {
      raw = this.getTabTooltip(tab, true);
    }
    if (align) {
      tooltip.setAttribute("position", "after_start");
      tooltip.moveToAnchor(tab, "after_start");
    }
    let title = tooltip.querySelector(".places-tooltip-title");
    let localized = {};
    if (raw) {
      localized.label = raw;
    } else if (id) {
      let [msg] = this.tabLocalization.formatMessagesSync([{ id, args }]);
      localized.value = msg.value;
      if (msg.attributes) {
        for (let attr of msg.attributes) localized[attr.name] = attr.value;
      }
    }
    title.textContent = localized.label ?? "";
    if (tab.getAttribute("customizemode") === "true") {
      tooltip
        .querySelector(".places-tooltip-box")
        .setAttribute("desc-hidden", "true");
      return;
    }
    let url = tooltip.querySelector(".places-tooltip-uri");
    url.value = linkedBrowser?.currentURI?.spec.replace(/^https:\/\//, "");
    setIdentityIcon(
      tooltip.querySelector("#places-tooltip-insecure-icon"),
      tab
    );
    tooltip.querySelector(".places-tooltip-box").removeAttribute("desc-hidden");
  };
})();
