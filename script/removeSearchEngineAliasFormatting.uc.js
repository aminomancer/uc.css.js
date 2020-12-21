setTimeout(() => {
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
}, 1000);
