// ==UserScript==
// @name           Remove Search Engine Alias Formatting
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Depending on your settings you might have noticed that typing
// a search engine alias (e.g. "goo" for Google) causes some special formatting
// to be applied to the text you input in the url bar. This is a trainwreck
// because the formatting is applied using the selection controller, not via
// CSS, meaning you can't change it in your stylesheets. It's blue by default,
// and certainly doesn't match my personal theme very well. This script just
// prevents the formatting from ever happening at all.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  function startup() {
    function init() {
      if (!gURLBar.valueFormatter._formatSearchAlias) return;
      gURLBar.valueFormatter._formatSearchAlias = () => false;
      gURLBar.removeEventListener("focus", init);
    }

    gURLBar.addEventListener("focus", init);
  }

  if (gBrowserInit.delayedStartupFinished) {
    startup();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        startup();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
