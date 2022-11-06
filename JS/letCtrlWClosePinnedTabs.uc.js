// ==UserScript==
// @name           Let Ctrl+W Close Pinned Tabs
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    The filename should say it all, this just removes the
// "feature" that prevents you from closing pinned tabs with the Ctrl+W/Cmd+W
// shortcut. I guess this is meant to be consistent with the fact that the close
// button is hidden on pinned tabs by default, but it doesn't really make sense
// because it's a lot harder to accidentally press Ctrl+W than it is to
// accidentally click the close button. Firefox still lets you close tabs by
// middle-clicking them, which is arguably easier to do unintentionally than to
// press Ctrl+W. Since my theme makes pinned tabs really small, I also added a
// preference to hide the close button on pinned tabs. But I never find myself
// accidentally closing tabs with Ctrl+W so I'm disabling this little obstacle.
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

    document
      .getElementById("cmd_close")
      .setAttribute("oncommand", "AminoCloseTabOrWindow(event);");
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
