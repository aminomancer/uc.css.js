// ==UserScript==
// @name           Tooltip Styler
// @version        1.1.6
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Allows you to style a tooltip in the chrome window based on which node triggered it. [duskFox](https://github.com/aminomancer/uc.css.js) uses this to make certain tooltips and popups gray instead of indigo, since we have gray system pages. If you want to use this for custom purposes, you'll need to edit the script and add CSS to your _agent_ sheet like `tooltip[backdrop-color"red"] {...}`
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tooltipStyler.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tooltipStyler.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  if (!window.tooltipStylerWatching) {
    let sidebarBox = document.getElementById("sidebar-box");
    if (sidebarBox) {
      sidebarBox.toggleAttribute("content-style", true);
    } else {
      window.SidebarController.promiseInitialized.then(() =>
        window.SidebarController._box.toggleAttribute("content-style", true)
      );
    }
    function colorForSidebar(id) {
      switch (id) {
        case "viewBookmarksSidebar":
        case "viewHistorySidebar":
        case "viewTabsSidebar":
        case "_3c078156-979c-498b-8990-85f7987dd929_-sidebar-action":
          return false;
        default:
          return "gray";
      }
    }
    if (XULBrowserWindow.showTooltip.name === "showTooltip") {
      eval(
        `XULBrowserWindow.showTooltip = function ${XULBrowserWindow.showTooltip
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function[^\S\r\n]*/, "")
          .replace(/^showTooltip[^\S\r\n]*/, "")
          .replace(/^(.)/, `uc_showTooltip$1`)
          .replace(
            /(elt\.label = tooltip;)/,
            `$1
            elt.triggeringBrowser = _browser;`
          )}`
      );
    }
    if (XULBrowserWindow.hideTooltip.name === "hideTooltip") {
      eval(
        `XULBrowserWindow.hideTooltip = function ${XULBrowserWindow.hideTooltip
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function[^\S\r\n]*/, "")
          .replace(/^hideTooltip[^\S\r\n]*/, "")
          .replace(/^(.)/, `uc_hideTooltip$1`)
          .replace(
            /(elt\.hidePopup\(\);)/,
            `$1
            delete elt.triggeringBrowser;`
          )}`
      );
    }
    window.addEventListener("popupshowing", e => {
      let popup = e.originalTarget;
      let color;
      let { id, localName, triggeringBrowser } = popup;
      switch (localName) {
        case "tooltip":
        case "menupopup": {
          let anchor = popup.triggerNode ?? popup.anchorNode;
          if (
            triggeringBrowser?.ownerGlobal.docShell?.chromeEventHandler ===
              window.SidebarController.browser || // tooltip for sidebar content
            id === "sidebarMenu-popup" || // sidebar switcher popup
            anchor?.closest("#sidebar-header") // tooltip for sidebar header
          ) {
            color = colorForSidebar(window.SidebarController.currentID);
          } else if (
            triggeringBrowser?.classList.contains(
              "webextension-popup-browser"
            ) &&
            document
              .getElementById("customizationui-widget-panel")
              ?.contains(triggeringBrowser) &&
            !window
              .getComputedStyle(triggeringBrowser)
              .getPropertyValue("--chrome-style-tooltips")
          ) {
            // tooltip for extension popups (see uc-extensions.css for how to
            // cancel this for a specific popup)
            color = "gray";
          } else if (
            triggeringBrowser?.matches(
              "#browser #tabbrowser-tabbox .browserStack browser"
            )
          ) {
            // tooltip for general browser content
            color = "gray";
          } else if (
            anchor?.closest("#customization-container") &&
            anchor?.localName === "toolbarpaletteitem"
          ) {
            if (id === "customizationPanelItemContextMenu") {
              color = "gray";
            }
            if (localName === "tooltip" && popup.hasAttribute("default")) {
              color = "gray";
            }
          }
          break;
        }
        default:
          return;
      }
      if (color) {
        popup.setAttribute("backdrop-color", color);
      } else {
        popup.removeAttribute("backdrop-color");
      }
    });
    window.tooltipStylerWatching = true;
  }
})();
