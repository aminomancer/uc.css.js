// ==UserScript==
// @name           Fix Titlebar Button Tooltips
// @version        1.2.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Since [bug 1718629][], Firefox has tried to make the titlebar buttons (window controls) function more like native controls. In doing so, it allows the OS to draw tooltips for these buttons. So it prevents itself from showing redundant tooltips. That means we can't style the titlebar buttons' tooltips, they don't obey preferences, they disappear after 5 seconds on Windows, and they don't appear in fullscreen mode. This is mainly for Windows users, and particularly Windows 10 users, which have less useful native tooltips. But if you use Windows 11 and still want to disable native tooltips, you can change disableSnapLayouts to true in the setting below.

[bug 1718629]: https://bugzilla.mozilla.org/show_bug.cgi?id=1718629
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fixTitlebarTooltips.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fixTitlebarTooltips.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  // This is a setting you can use to disable Windows 11's Snap Layouts popup
  // from appearing when you hover over the Maximize button. It has no effect on
  // other operating systems. By default, if you use this on Windows 11, it will
  // only show Firefox tooltips on the Close and Minimize buttons, in order to
  // allow Windows 11 to show a Snap Layouts popup on the Maximize/Restore
  // buttons. But if you don't care about Snap Layouts and you just want a
  // normal Firefox tooltip (a markup element, styled by CSS) that says
  // "Maximize" or "Restore Down", then you can change the setting below from
  // `false` to `true`.
  const disableSnapLayouts = false;

  if (
    disableSnapLayouts ||
    (AppConstants.platform === "win" &&
      ChromeUtils.importESModule(
        "resource://gre/modules/components-utils/WindowsVersionInfo.sys.mjs"
      ).WindowsVersionInfo.get()?.buildNumber < 22000)
  ) {
    document
      .querySelectorAll(".titlebar-buttonbox-container .titlebar-button")
      ?.forEach(button => {
        button.style.cssText += "-moz-default-appearance: none !important;";
      });
  }
})();
