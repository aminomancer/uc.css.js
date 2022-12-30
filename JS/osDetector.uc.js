// ==UserScript==
// @name           OS Detector
// @version        1.3.4
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Set an attribute `operatingsystem` on the root element of the chrome window, whose value is one of `win | linux | macosx` so we can more reliably add OS-specific CSS. This isn't necessary for anything in duskFox anymore, since the `-moz-platform` media query has been added. But you may need this for stylesheets that aren't allowed to use the `-moz-platform` media query, or something like that. So I'll leave it up for now.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/osDetector.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/osDetector.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        *
// ==/UserScript==

(function() {
  try {
    const { AppConstants } = ChromeUtils.importESModule(
      "resource://gre/modules/AppConstants.sys.mjs"
    );
    if (AppConstants) {
      document.documentElement.setAttribute(
        "operatingsystem",
        AppConstants.platform
      );
    }
  } catch (error) {}
})();
