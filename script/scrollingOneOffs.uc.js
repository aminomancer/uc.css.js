(function () {
    // if you ever delete this, uncomment the overflow-x rules under .urlbarView .search-one-offs in uc7.css
    function init() {
        let oneOffs = gURLBar.view.oneOffSearchButtons,
            container = oneOffs.container,
            buttons = oneOffs.buttons,
            buttonsList = buttons.children;
        container.style.cssText =
            "display: -moz-box !important; -moz-box-align: center !important; max-width: 352px; scrollbar-width: none; box-sizing: border-box; scroll-behavior: smooth !important; overflow: hidden !important";
        container.setAttribute("smoothscroll", "true");
        container.setAttribute("clicktoscroll", "true");
        container.setAttribute("overflowing", "true");
        container.setAttribute("orient", "horizontal");
        container.smoothScroll = true;
        container._clickToScroll = true;
        container._isScrolling = false;
        container._destination = 0;
        container._direction = 0;
        container._prevMouseScrolls = [null, null];

        container.scrollByPixels = function (aPixels, aInstant) {
            let scrollOptions = { behavior: aInstant ? "instant" : "auto" };
            scrollOptions["left"] = aPixels;
            this.scrollBy(scrollOptions);
        };

        container.lineScrollAmount = function () {
            return buttonsList.length && this.scrollLeftMax / buttonsList.length;
        };

        container.on_Scroll = function (event) {
            this._isScrolling = true;
        };

        container.on_Scrollend = function (event) {
            this._isScrolling = false;
            this._destination = 0;
            this._direction = 0;
        };

        container.on_Wheel = function (event) {
            let doScroll = false;
            let instant;
            let scrollAmount = 0;
            let isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX);
            let delta = isVertical ? event.deltaY : event.deltaX;

            if (this._prevMouseScrolls.every((prev) => prev == isVertical)) {
                doScroll = true;
                if (event.deltaMode == event.DOM_DELTA_PIXEL) {
                    scrollAmount = delta;
                    instant = true;
                } else if (event.deltaMode == event.DOM_DELTA_PAGE) {
                    scrollAmount = delta * buttons.clientWidth;
                } else {
                    scrollAmount = delta * this.lineScrollAmount();
                }
            }

            if (this._prevMouseScrolls.length > 1) {
                this._prevMouseScrolls.shift();
            }
            this._prevMouseScrolls.push(isVertical);

            if (doScroll) {
                let direction = scrollAmount < 0 ? -1 : 1;
                let startPos = this.scrollLeft;

                if (!this._isScrolling || this._direction != direction) {
                    this._destination = startPos + scrollAmount;
                    this._direction = direction;
                } else {
                    // We were already in the process of scrolling in this direction
                    this._destination = this._destination + scrollAmount;
                    scrollAmount = this._destination - startPos;
                }
                this.scrollByPixels(scrollAmount, instant);
            }

            event.stopPropagation();
            event.preventDefault();
        };

        container.addEventListener("wheel", container.on_Wheel);
        container.addEventListener("scroll", container.on_Scroll);
        container.addEventListener("scrollend", container.on_Scrollend);
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
