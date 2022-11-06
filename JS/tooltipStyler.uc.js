// ==UserScript==
// @name           Tooltip Styler
// @version        1.1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Allows you to style a tooltip in the chrome window based on
// which node triggered it. duskFox uses this to make certain tooltips and
// popups gray instead of indigo, since we have gray system pages. If you want
// to use this for custom purposes, you'll need to edit the script and add CSS
// to your AGENT sheet like tooltip[backdrop-color"red"] {...}
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  if (!window.tooltipStylerWatching) {
    let sidebarBox = document.getElementById("sidebar-box");
    if (sidebarBox) {
      sidebarBox.setAttribute("content-style", "true");
    } else {
      SidebarUI.promiseInitialized.then(() =>
        SidebarUI._box.setAttribute("content-style", "true")
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
    window.addEventListener("popupshowing", e => {
      let tooltip = e.originalTarget;
      let color;
      switch (tooltip.localName) {
        case "panel":
          if (tooltip.id === "sidebarMenu-popup") {
            color = colorForSidebar(SidebarUI.currentID);
          } else {
            return;
          }
          break;
        case "tooltip":
        case "menupopup":
          let node = tooltip.triggerNode;
          if (node?.closest("#sidebar-header")) {
            color = colorForSidebar(SidebarUI.currentID);
          } else if (
            node?.closest("#customization-container") &&
            node?.localName === "toolbarpaletteitem"
          ) {
            if (tooltip.id === "customizationPanelItemContextMenu") {
              color = "gray";
            }
            if (
              tooltip.localName === "tooltip" &&
              tooltip.hasAttribute("default")
            ) {
              color = "gray";
            }
          }
          break;
        default:
          return;
      }
      if (color) tooltip.setAttribute("backdrop-color", color);
      else tooltip.removeAttribute("backdrop-color");
    });
    window.tooltipStylerWatching = true;
  }
})();
