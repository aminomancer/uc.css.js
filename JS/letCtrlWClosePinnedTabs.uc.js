// ==UserScript==
// @name           Let Ctrl+W Close Pinned Tabs
// @version        1.0.3
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    The filename should say it all, this just removes the behavior that prevents you from closing pinned tabs with the Ctrl+W/⌘+W shortcut. Since my theme makes pinned tabs really small, I also added a preference to hide the close button on pinned tabs.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/letCtrlWClosePinnedTabs.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/letCtrlWClosePinnedTabs.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  function init() {
    if (BrowserCommands.closeTabOrWindow.name === "closeTabOrWindow") {
      eval(
        `BrowserCommands.closeTabOrWindow = function ${BrowserCommands.closeTabOrWindow
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function[^\S\r\n]*/, "")
          .replace(/^closeTabOrWindow[^\S\r\n]*/, "")
          .replace(/^(.)/, `AminoCloseTabOrWindow$1`)
          .replace(/gBrowser.selectedTab.pinned/, "false")}`
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
