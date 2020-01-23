(function () {
    setTimeout(() => {
        const wOverflow = document.getElementById('widget-overflow');
        try {
            var root = document.getElementById('widget-overflow').shadowRoot;

            function widgetOverflowOpened() {
                if (root) {
                    document.getElementById('widget-overflow').shadowRoot.children[2].classList.add("widget-overflow-arrowcontainer");
                    document.getElementById('widget-overflow').shadowRoot.children[2].children[0].classList.add("widget-overflow-arrowbox");
                    console.log("arrowbox updated!");
                }
            };

            if (root) {
                document.getElementById('widget-overflow').shadowRoot.children[2].classList.add("widget-overflow-arrowcontainer");
                document.getElementById('widget-overflow').shadowRoot.children[2].children[0].classList.add("widget-overflow-arrowbox");
            };
        } catch (e) {};

        wOverflow.addEventListener("popupshowing", widgetOverflowOpened, false);
    }, 10000);
})();