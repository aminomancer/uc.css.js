(() => {
    function init() {
        var tbox = document.getElementById("tabbrowser-arrowscrollbox");
        tbox.shadowRoot
            .getElementById("scrollbutton-up")
            .classList.add("tabbrowser-scroll-arrow-hide");
        tbox.shadowRoot
            .getElementById("scrollbutton-down")
            .classList.add("tabbrowser-scroll-arrow-hide");
        tbox.shadowRoot
            .querySelector('spacer[part="overflow-start-indicator"]')
            .classList.add("tabbrowser-scroll-start-indicator");
        tbox.shadowRoot
            .querySelector('spacer[part="overflow-end-indicator"]')
            .classList.add("tabbrowser-scroll-end-indicator");
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
