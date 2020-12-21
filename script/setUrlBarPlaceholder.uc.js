function initialize() {
    let observer = new MutationObserver(updatePlaceholder),
        options = {
            childList: true,
            subtree: true,
        };

    var pref = "browser.urlbar.placeholderName" + (PrivateBrowsingUtils.isWindowPrivate(window) ? ".private" : ""),
        engineName = Services.prefs.getStringPref(pref, "");

    gURLBar.inputField.placeholder = `Search ${engineName}`;
    observer.observe(gURLBar._searchModeIndicatorTitle, options);

    function updatePlaceholder(mutations) {
        for (let mutation of mutations) {
            if (gURLBar.view.oneOffSearchButtons.input.searchMode) {
                return;
            }
            setTimeout(() => {
                gURLBar.inputField.placeholder = `Search ${engineName}`;
            }, 1);
        }
    }
}

if (gBrowserInit.delayedStartupFinished) {
    this.initialize();
} else {
    let delayedStartupFinished = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedStartupFinished, topic);
            this.initialize();
        }
    };
    Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
}
