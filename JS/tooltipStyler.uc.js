// ==UserScript==
// @name           Tooltip Styler
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Allows you to style a tooltip in the chrome window based on
// which node triggered it. duskFox uses this to make certain tooltips gray
// instead of indigo, since we have gray system pages. If you want to use this
// for custom purposes, you'll need to edit the script and add CSS to your AGENT
// sheet like tooltip[backdrop-color"red"] {...}
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  if (!window.tooltipStylerWatching) {
    window.addEventListener("popupshowing", e => {
      let tooltip = e.originalTarget;
      let node = tooltip.triggerNode;
      if (!["tooltip", "menupopup"].includes(tooltip.localName)) return;
      if (!node) {
        tooltip.removeAttribute("backdrop-color");
        return;
      }
      let inCC = !!node.closest("#customization-container");
      if (
        inCC &&
        node.localName === "toolbarpaletteitem" &&
        ((tooltip.localName === "tooltip" && tooltip.hasAttribute("default")) ||
          tooltip.id === "customizationPanelItemContextMenu")
      ) {
        tooltip.setAttribute("backdrop-color", "gray");
        return;
      }
      tooltip.removeAttribute("backdrop-color");
    });
    window.tooltipStylerWatching = true;
  }
})();
