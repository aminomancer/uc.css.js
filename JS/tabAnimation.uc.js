// ==UserScript==
// @name           Tab Animation Workaround
// @version        1.1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    A tiny script required for duskFox. This doesn't have any
// visible effects, it's just a background support piece required to make the
// CSS theme work correctly. It cleans up transitions/animations on Firefox
// tabs. The first part involves making sure pinned tabs will be placed
// correctly. Without this script, we couldn't smoothly animate the width
// transition when pinning/unpinning tabs, because it would interfere with
// calculating the placement of tabs. The second part involves making sure that
// certain tab animations don't begin until the paint immediately after tabs are
// created/moved. Otherwise, they would start and stop within less than 1 frame.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  new MutationObserver(function(rec) {
    for (let mu of rec) {
      if (mu.target.getAttribute("movingtab")) {
        gBrowser.selectedTab.setAttribute("justmoved", "true");
      } else {
        setTimeout(() => gBrowser.selectedTab.removeAttribute("justmoved"), 1);
      }
    }
  }).observe(document.getElementById("tabbrowser-tabs"), {
    attributeFilter: ["movingtab"],
  });

  if (
    gBrowser.tabContainer._positionPinnedTabs.name === "_positionPinnedTabs"
  ) {
    eval(
      `gBrowser.tabContainer._positionPinnedTabs = function ` +
        gBrowser.tabContainer._positionPinnedTabs
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^_positionPinnedTabs/, "_uc_positionPinnedTabs")
          .replace(
            /tabs\[0\]\.getBoundingClientRect\(\)\.width/,
            `parseInt(getComputedStyle(this).getPropertyValue("--pinned-tab-width") || 36)`
          )
    );
  }
})();
