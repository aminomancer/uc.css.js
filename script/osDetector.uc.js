// ==UserScript==
// @name           OS Detector
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Set an attribute "operatingsystem" on the root element of the chrome window, equal to "win" "linux" or "macosx" so we can more reliably add OS-specific CSS. Firefox doesn't already have something like this because it has OS-specific stylesheets and a build system that creates diverging stylesheets based on Python environment variables or something. But all we have is JavaScript and CSS, so this is the best way to make the theme compatible with other operating systems.
// ==/UserScript==

(function () {
    document.documentElement.setAttribute("operatingsystem", AppConstants.platform);
})();
