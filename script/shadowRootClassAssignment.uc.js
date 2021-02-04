(() => {
    function init() {
        var protButton = document.getElementById("tracking-protection-icon-container");

        function protPopupOpened() {
            try {
                var protArrow = document
                    .getElementById("protections-popup")
                    .shadowRoot.querySelector(".panel-arrow");
                protArrow.id = "protections-popup-panel-arrow";
            } catch (e) {}
        }

        protButton.addEventListener("click", protPopupOpened, { once: true });
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
