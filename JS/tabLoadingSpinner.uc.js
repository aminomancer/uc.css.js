// ==UserScript==
// @name           Tab Loading Spinner Animation
// @version        1.0.1
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Required for duskFox's custom loading spinner animation. This isn't strictly necessary, since the spinner is implemented in CSS, but duskFox restricts the use of the spinner to conditions laid out by this script. This is done in order to allow the loading throbber icon to smoothly fade in and out without harming performance. Without this, the spinner would potentially reduce framerate and, for at least one user, would cause problems during startup. So if you don't install this script, you'll end up with Firefox's vanilla loading throbber icon rather than duskFox's spinner icon.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabLoadingSpinner.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabLoadingSpinner.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  document.documentElement.setAttribute("uc-loading-spinner", "true");
  function init() {
    gBrowser.tabContainer.addEventListener("TabAttrModified", e => {
      let { changed } = e.detail;
      if (
        !(changed && (changed.includes("busy") || changed.includes("progress")))
      ) {
        return;
      }
      let tab = e.target;
      let throbber = tab.querySelector(".tab-throbber");
      if (tab.getAttribute("busy") == "true") {
        throbber.setAttribute("throbber-loaded", "true");
      } else {
        setTimeout(
          tab.querySelector(".tab-throbber").removeAttribute("throbber-loaded"),
          850
        );
      }
    });
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
