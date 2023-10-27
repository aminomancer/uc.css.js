// ==UserScript==
// @name           Tab Animation Workaround
// @version        1.2.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    A tiny script required for duskFox. This doesn't have any visible effects, it's just a background support piece required to make the CSS theme work correctly. It cleans up transitions/animations on Firefox tabs. The first part involves making sure pinned tabs will be placed correctly. Without this script, we couldn't smoothly animate the width transition when pinning/unpinning tabs, because it would interfere with calculating the placement of tabs. The second part involves making sure that certain tab animations don't begin until the paint immediately after tabs are created/moved. Otherwise, they would start and stop within less than 1 frame.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabAnimation.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabAnimation.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  let movedTab;

  if (gBrowser.tabContainer._animateTabMove.name === "_animateTabMove") {
    eval(
      `gBrowser.tabContainer._animateTabMove = function ${gBrowser.tabContainer._animateTabMove
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^_animateTabMove/, "_uc_animateTabMove")
        .replace(
          /(gNavToolbox\.toggleAttribute\("movingtab", true\);)/,
          `$1;\n movedTab = draggedTab;\n draggedTab.toggleAttribute("justmoved", true);`
        )}`
    );
  }

  if (
    gBrowser.tabContainer._finishAnimateTabMove.name === "_finishAnimateTabMove"
  ) {
    eval(
      `gBrowser.tabContainer._finishAnimateTabMove = function ${gBrowser.tabContainer._finishAnimateTabMove
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^_finishAnimateTabMove/, "_uc_finishAnimateTabMove")
        .replace(
          /(gNavToolbox\.removeAttribute\("movingtab"\);)/,
          `$1;\n setTimeout(() => {movedTab?.removeAttribute("justmoved"); movedTab = null;}, 1);`
        )}`
    );
  }

  if (
    gBrowser.tabContainer._positionPinnedTabs.name === "_positionPinnedTabs"
  ) {
    eval(
      `gBrowser.tabContainer._positionPinnedTabs = function ${gBrowser.tabContainer._positionPinnedTabs
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^_positionPinnedTabs/, "_uc_positionPinnedTabs")
        .replace(
          /pinnedTabWidth: tabs\[0\]\.getBoundingClientRect\(\)\.width/,
          `pinnedTabWidth: parseInt(getComputedStyle(this).getPropertyValue("--pinned-tab-width") || 36)`
        )}`
    );
  }
})();
