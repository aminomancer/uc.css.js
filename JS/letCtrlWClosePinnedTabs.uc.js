// ==UserScript==
// @name           Let Ctrl+W Close Pinned Tabs
// @version        1.0.2
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    The filename should say it all, this just removes the behavior that prevents you from closing pinned tabs with the Ctrl+W/⌘+W shortcut. Since my theme makes pinned tabs really small, I also added a preference to hide the close button on pinned tabs.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/letCtrlWClosePinnedTabs.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/letCtrlWClosePinnedTabs.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  function init() {
    window.AminoCloseTabOrWindow = function AminoCloseTabOrWindow(event) {
      // If we're not a browser window, just close the window.
      if (window.location.href != AppConstants.BROWSER_CHROME_URL) {
        closeWindow(true);
        return;
      }

      // In a multi-select context, close all selected tabs
      if (gBrowser.multiSelectedTabsCount) {
        gBrowser.removeMultiSelectedTabs();
        return;
      }

      // If the current tab is the last one, this will close the window.
      gBrowser.removeCurrentTab({ animate: true });
    };

    let cmdClose = document.getElementById("cmd_close");
    cmdClose.setAttribute("oncommand", "AminoCloseTabOrWindow(event);");
    cmdClose.replaceWith(cmdClose.cloneNode());
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
