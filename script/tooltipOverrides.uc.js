// ==UserScript==
// @name           tooltipStyling.uc.js
// @description    tooltipStyling
// ==/UserScript==
(() => {
    function init() {
        document
            .getElementById("fullscreen-button")
            .setAttribute("tooltiptext", "Display the window in full screen (Ctrl+E)");
        document.getElementById("fullscreen-button").removeAttribute("tooltip");
        document
            .getElementById("sidebar-button")
            .setAttribute("tooltiptext", "Show sidebars (Ctrl+B)");
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
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
