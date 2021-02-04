(() => {
    function init() {
        var css = `
#statuspanel-label {
    background-image: url("texture/noise-512x512.png") !important;
    background-color: var(--urlbarView-bgcolor) !important;
    backdrop-filter: blur(22px) !important;
}

@-moz-document url("chrome://global/content/alerts/alert.xhtml") {
    #alertBox {
        background-color: rgba(18, 18, 18, 0.97) !important;
        background-image: url("texture/noise-512x512.png") !important;
        backdrop-filter: blur(22px) !important;
    }
}

#fullscreen-warning {
    background-image: url("texture/noise-512x512.png") !important;
    background-color: var(--urlbarView-bgcolor) !important;
    backdrop-filter: blur(22px) !important;
}
	`,
            sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            ),
            uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

        sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
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
