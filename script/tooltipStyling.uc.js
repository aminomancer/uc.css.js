// ==UserScript==
// @name           tooltipStyling.uc.js
// @description    tooltipStyling
// @include        *
// ==/UserScript==
(() => {
    function init() {
        let css = `
@namespace url("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul");
tooltip[default][page] {
        -moz-default-appearance: none!important;
        display: -moz-popup;
        -moz-appearance: none!important;
        background-color: rgba(15, 17, 34, 1)!important;
        color: rgba(255, 255, 255, 1)!important;
        border: none!important;
        padding: 5px!important;
        font-family: FreeMono!important;
}
	`,
            sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            ),
            uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

        sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

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
