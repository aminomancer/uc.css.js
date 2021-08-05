// ==UserScript==
// @name           Scrolling Search One-offs
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    This is for my own personal stylesheet, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. The script allows the search one-offs box to be scrolled with mousewheel up/down. It also adds a minor improvement to the one-offs in the searchbar results popup: if the one-offs are overflowing and you switch to a search engine that is overflown off the popup, it will automatically scroll to the selected one-off button, just like the urlbar one-offs does with oneClickOneOffSearchButtons.uc.js.
// ==/UserScript==

(() => {
    function rectX(el) {
        return el.getBoundingClientRect().x;
    }

    function parseWidth(el) {
        let style = window.getComputedStyle(el),
            width = el.clientWidth,
            margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight),
            padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
            border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
        return width + margin + padding + border;
    }

    function setUpScroll(oneOffs, mask = false) {
        let isSearchBar = oneOffs.container.parentElement.id === "PopupSearchAutoComplete";
        let container = isSearchBar ? oneOffs.buttons.parentElement : oneOffs.container;
        let buttons = oneOffs.buttons;
        let buttonsList = buttons.children;
        container.maskDisabled = !mask;
        oneOffs.canScroll = true;
        container.style.cssText =
            "display: -moz-box !important; -moz-box-align: center !important; scrollbar-width: none; box-sizing: border-box; scroll-behavior: smooth !important; overflow: hidden !important";
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
        container.cachedScroll;
        container.frames = [
            {
                maskPositionX: "0px",
                maskSize: "100%",
                maskImage:
                    "linear-gradient(to right, transparent 10px, rgb(0, 0, 0) 30px, rgb(0, 0, 0) 100%)",
            },
            {
                maskPositionX: "-30px",
                maskSize: "1000%",
                maskImage: "none",
            },
        ];

        container.scrollByPixels = function (aPixels, aInstant) {
            let scrollOptions = { behavior: aInstant ? "instant" : "auto" };
            scrollOptions["left"] = aPixels;
            this.scrollBy(scrollOptions);
        };

        container.lineScrollAmount = function () {
            return buttonsList.length
                ? Math.round(buttons.scrollWidth * 0.1) / 0.1 / buttonsList.length
                : 30;
        };

        container.maskAnim = function () {
            if (this.cachedScroll === this.scrollLeft) {
                return (this.cachedScroll = this.scrollLeft);
            }
            this.cachedScroll = this.scrollLeft;
            if (this.scrollLeft === 0 || this.scrollLeft === this.scrollLeftMax) {
                if (this.getAttribute("scrolledtostart")) return;
                this.animation = this.animate(this.frames, {
                    id: "mask_bwd",
                    direction: "normal",
                    duration: 200,
                    iterations: 1,
                    easing: "ease-in-out",
                });
            } else {
                if (this.getAttribute("scrolledtostart"))
                    this.animation = this.animate(this.frames, {
                        id: "mask_fwd",
                        direction: "reverse",
                        duration: 200,
                        iterations: 1,
                        easing: "ease-in-out",
                    });
            }
        };

        container.scrolledToStart = function () {
            if (this.maskDisabled) return;
            if (this.scrollLeft === 0 || this.scrollLeft === this.scrollLeftMax) {
                this.maskAnim();
                this.setAttribute("scrolledtostart", true);
            } else {
                this.maskAnim();
                this.removeAttribute("scrolledtostart");
            }
        };

        container.on_Scroll = function (_e) {
            this._isScrolling = true;
            this.scrolledToStart();
        };

        container.on_Scrollend = function (_e) {
            this._isScrolling = false;
            this._destination = 0;
            this._direction = 0;
            this.scrolledToStart();
        };

        container.on_Wheel = function (e) {
            let doScroll = false;
            let instant;
            let scrollAmount = 0;
            let isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            let delta = isVertical ? e.deltaY : e.deltaX;

            if (this._prevMouseScrolls.every((prev) => prev == isVertical)) {
                doScroll = true;
                if (e.deltaMode == e.DOM_DELTA_PIXEL) {
                    scrollAmount = delta;
                    instant = true;
                } else if (e.deltaMode == e.DOM_DELTA_PAGE) {
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

            e.stopPropagation();
            e.preventDefault();
        };

        container.addEventListener("wheel", container.on_Wheel);
        container.addEventListener("scroll", container.on_Scroll);
        container.addEventListener("scrollend", container.on_Scrollend);
        container.scrolledToStart();

        if (isSearchBar) {
            container.style.paddingInline = `4px`;
            container.style.clipPath = `inset(0 4px 0 4px)`;
            oneOffs.scrollToButton = function (el) {
                if (!el) el = buttons.firstElementChild;
                let slider = el.parentElement;
                let buttonX = rectX(el) - rectX(slider);
                let buttonWidth = parseWidth(el);
                let midpoint = slider.parentElement.clientWidth / 2;
                slider.parentElement.scrollTo({
                    left: buttonX + buttonWidth / 2 - midpoint,
                    behavior: "auto",
                });
            };
            oneOffs.on_SelectedOneOffButtonChanged = function (_e) {
                oneOffs.scrollToButton(oneOffs.selectedButton);
            };
            oneOffs.addEventListener(
                "SelectedOneOffButtonChanged",
                oneOffs.on_SelectedOneOffButtonChanged,
                false
            );
        }
    }

    function init() {
        setUpScroll(gURLBar.view.oneOffSearchButtons, true);
        document
            .getElementById("PopupSearchAutoComplete")
            .addEventListener(
                "popupshowing",
                (e) =>
                    setUpScroll(document.getElementById("PopupSearchAutoComplete").oneOffButtons),
                { once: true }
            );
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
