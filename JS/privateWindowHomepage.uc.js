// ==UserScript==
// @name           Private Window Homepage
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    By default, private windows are opened to
// about:privatebrowsing, regardless of your homepage or new tab page
// preferences. Once the window is opened, opening a new tab goes to your new
// tab page, and pressing the home button goes to your actual home page. But the
// first tab of a private window is always opened to about:privatebrowsing. This
// behavior is coded right into OpenBrowserWindow() but we can change it. This
// script simply removes the part of the function that manually sets the URL to
// about:privatebrowsing. So private windows will now behave like ordinary
// windows in this (and only this) respect.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  function init() {
    window.og_OpenBrowserWindow = OpenBrowserWindow;
    eval(
      `OpenBrowserWindow = ` +
        OpenBrowserWindow.toSource().replace(
          /\N*\s*if \(\!PrivateBrowsingUtils\.permanentPrivateBrowsing\) {\s*.*\s*defaultArgs \= \"about\:privatebrowsing\"\;\s*\}/gm,
          ``
        )
    );
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
