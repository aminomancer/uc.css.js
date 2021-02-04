(() => {
    function startup() {
        function init() {
            if (!gURLBar.valueFormatter._formatSearchAlias) {
                return;
            }
            gURLBar.valueFormatter._formatSearchAlias = function () {
                try {
                } catch (e) {}
            };
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
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
