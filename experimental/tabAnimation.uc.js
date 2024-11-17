// ==UserScript==
// @name           Tab Animation Workaround
// @version        1.3.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    A tiny script required for duskFox. This doesn't have any visible effects, it's just a background support piece required to make the CSS theme work correctly. It cleans up transitions/animations on Firefox tabs. The first part involves making sure pinned tabs will be placed correctly. Without this script, we couldn't smoothly animate the width transition when pinning/unpinning tabs, because it would interfere with calculating the placement of tabs. The second part involves making sure that certain tab animations don't begin until the paint immediately after tabs are created/moved. Otherwise, they would start and stop within less than 1 frame.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabAnimation.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabAnimation.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  function init() {
    let movedTab;
    let dragOverCreateGroupTimer;

    gBrowser.tabContainer.setDragOverGroupColor = function (groupColorCode) {
      if (!groupColorCode) {
        this.style.removeProperty("--dragover-tab-group-color");
        this.style.removeProperty("--dragover-tab-group-color-invert");
        this.style.removeProperty("--dragover-tab-group-color-pale");
        return;
      }
      this.style.setProperty(
        "--dragover-tab-group-color",
        `var(--tab-group-color-${groupColorCode})`
      );
      this.style.setProperty(
        "--dragover-tab-group-color-invert",
        `var(--tab-group-color-${groupColorCode}-invert)`
      );
      this.style.setProperty(
        "--dragover-tab-group-color-pale",
        `var(--tab-group-color-${groupColorCode}-pale)`
      );
    };

    gBrowser.tabContainer.triggerDragOverCreateGroup = function (
      dragData,
      groupDropIndex
    ) {
      this.clearDragOverCreateGroupTimer();

      dragData.groupDropIndex = groupDropIndex;
      this.toggleAttribute("movingtab-createGroup", true);
      this.removeAttribute("movingtab-ungroup");
      this.allTabs[groupDropIndex].toggleAttribute(
        "dragover-createGroup",
        true
      );
      this.setDragOverGroupColor(dragData.tabGroupCreationColor);
    };

    gBrowser.tabContainer.clearDragOverCreateGroupTimer = function () {
      if (dragOverCreateGroupTimer) {
        clearTimeout(dragOverCreateGroupTimer);
        dragOverCreateGroupTimer = 0;
      }
    };

    if (gBrowser.tabContainer._animateTabMove.name === "_animateTabMove") {
      eval(
        `gBrowser.tabContainer._animateTabMove = function ${gBrowser.tabContainer._animateTabMove
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^_animateTabMove/, "_uc_animateTabMove")
          .replace(/this\.#rtlMode/g, `!this.verticalMode && RTL_UI`)
          .replace(
            /this\.#dragOverCreateGroupTimer/g,
            `dragOverCreateGroupTimer`
          )
          .replace(
            /this\.#setDragOverGroupColor/g,
            `this.setDragOverGroupColor`
          )
          .replace(
            /this\.#clearDragOverCreateGroupTimer/g,
            `this.clearDragOverCreateGroupTimer`
          )
          .replace(
            /this\.#triggerDragOverCreateGroup/g,
            `this.triggerDragOverCreateGroup`
          )
          .replace(
            /(gNavToolbox\.toggleAttribute\("movingtab", true\);)/,
            `$1;\n movedTab = draggedTab;\n draggedTab.toggleAttribute("justmoved", true);`
          )}`
      );
    }

    if (
      gBrowser.tabContainer._finishAnimateTabMove.name ===
      "_finishAnimateTabMove"
    ) {
      eval(
        `gBrowser.tabContainer._finishAnimateTabMove = function ${gBrowser.tabContainer._finishAnimateTabMove
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^_finishAnimateTabMove/, "_uc_finishAnimateTabMove")
          .replace(
            /this\.#setDragOverGroupColor/g,
            `this.setDragOverGroupColor`
          )
          .replace(
            /this\.#clearDragOverCreateGroupTimer/g,
            `this.clearDragOverCreateGroupTimer`
          )
          .replace(
            /(gNavToolbox\.removeAttribute\("movingtab"\);)/,
            `$1;\n setTimeout(() => {movedTab?.removeAttribute("justmoved"); movedTab = null;}, 1);`
          )}`
      );
    }
  }

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
