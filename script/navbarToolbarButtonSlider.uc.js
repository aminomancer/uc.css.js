// ==UserScript==
// @name           navbarToolbarButtonSlider.uc.js
// @homepage       https://github.com/aminomancer
// @description    Wrap all toolbar buttons after #urlbar-container in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. You can change "max-width" in outer.style.cssText to make the container wider or smaller, ideally by increments of 32. I use 352 because I want 11 icons to be visible. To scroll faster you can add a multiplier right before scrollByPixels is called, like scrollAmount = scrollAmount * 1.5 or something like that. Doesn't handle touch events yet since I don't have a touchpad to test it on. Let me know if you have any ideas though.
// @author         aminomancer
// ==/UserScript==

(function () {
    let outer = document.createElement("div"),
        inner = document.createElement("div"),
        kids = inner.children,
        cNavBar = document.getElementById("nav-bar-customization-target"),
        bin = document.getElementById("mainPopupSet"),
        widgets = cNavBar.children,
        domArray = [],
        cuiListen = {
            onCustomizeStart: cStart.bind(this),
            onCustomizeEnd: cEnd.bind(this),
            onWidgetAfterDOMChange: domChange.bind(this),
            onWindowClosed: windowClosed.bind(this),
        },
        cuiArray = function () {
            return CustomizableUI.getWidgetsInArea("nav-bar").filter(Boolean).filter(filterWidgets);
        },
        opener = function (mus) {
            for (let mu of mus) {
                if (mu.type === "attributes") {
                    kids.some((elem) => elem.open) ? outer.open || (outer.open = true) : !outer.open || (outer.open = false);
                }
            }
        };

    const observer = new MutationObserver(opener),
        obsOps = {
            attributeFilter: ["open"],
            subtree: true,
        };

    function cStart() {
        unwrapAll(kids, cNavBar);
    }

    async function cEnd() {
        await convertToArray(widgets);
        rewrapAll(domArray);
    }

    function domChange(aNode, aNextNode, aContainer, aWasRemoval) {
        if (aWasRemoval) return;
        if (aNode.ownerGlobal == this && aContainer == cNavBar && CustomizationHandler.isCustomizing() == false) {
            pickUpOrphans(aNode);
        }
    }

    function windowClosed(aWindow) {
        aWindow == this ? this.CustomizableUI.removeListener(cuiListen) : aWindow.CustomizationHandler.isCustomizing() && rewrapAll(domArray);
    }

    function convertToArray(buttons) {
        return new Promise((resolve) => {
            domArray.length = 0;
            for (let i = 0; i < buttons.length; i++) {
                if (filterWidgets(buttons[i])) domArray.push(buttons[i]);
            }
            resolve("resolved");
        });
    }

    function filterWidgets(item) {
        if (item.showInPrivateBrowsing === false && PrivateBrowsingUtils.isWindowPrivate(this)) {
            return false;
        }
        switch (item.id) {
            case "wrapper-back-button":
            case "back-button":
            case "wrapper-forward-button":
            case "forward-button":
            case "wrapper-stop-reload-button":
            case "stop-reload-button":
            case "wrapper-urlbar-container":
            case "urlbar-container":
            case "wrapper-search-container":
            case "search-container":
            case "nav-bar-toolbarbutton-slider-container":
                return false;
            default:
                return true;
        }
    }

    function wrapAll(buttons, container) {
        let parent = buttons[0].parentElement;
        let previousSibling = buttons[0].previousSibling;
        for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
            container.appendChild(buttons[i]);
        }
        outer.appendChild(container);
        parent.insertBefore(outer, previousSibling.nextSibling);
    }

    function unwrapAll(buttons, container) {
        for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
            container.appendChild(buttons[i]);
        }
        bin.appendChild(outer);
    }

    function rewrapAll(buttons) {
        let parent = buttons[0].parentElement;
        let previousSibling = buttons[0].previousSibling;
        for (var i = 0; buttons.length - i; inner.firstChild === buttons[0] && i++) {
            inner.appendChild(buttons[i]);
        }
        parent.insertBefore(outer, previousSibling.nextSibling);
    }

    function pickUpOrphans(aNode) {
        let array = cuiArray();
        for (let i = 0; i < array.length; i++) {
            if (array[i].id == aNode?.id) {
                let win = array[i]?.instances.findIndex((item) => item.node?.ownerGlobal === this) || 0;
                if (i + 1 === array?.length) {
                    array[i - 1].instances[win].node.after(aNode);
                } else {
                    inner.insertBefore(aNode, array[i + 1].instances[win].node);
                }
            }
        }
    }

    function cleanUp() {
        if (outer.nextElementSibling) pickUpOrphans(outer.nextElementSibling);
    }

    function reOrder() {
        let array = cuiArray();
        for (let i = 0; i < array.length; i++) {
            let win = array[i]?.instances.findIndex((instance) => instance.node?.ownerGlobal === this);
            if (array[i].instances[win]?.node.nextElementSibling != array[i + 1]?.instances[win].node) {
                inner.insertBefore(array[i].instances[win]?.node, array[i + 1]?.instances[win].node);
            }
        }
    }

    async function init() {
        await convertToArray(widgets);
        wrapAll(domArray, inner);
        cleanUp();
    }

    init();
    kids.some = Array.prototype.some;
    observer.observe(inner, obsOps);
    outer.className = "container";
    outer.id = "nav-bar-toolbarbutton-slider-container";
    outer.style.cssText =
        "display: -moz-box; -moz-box-align: center; max-width: 352px; scrollbar-width: none; box-sizing: border-box; scroll-behavior: smooth; overflow: hidden";
    inner.className = "container";
    inner.id = "nav-bar-toolbarbutton-slider";
    inner.style.cssText = "display: flex; flex-flow: row; flex-direction: row";
    outer.setAttribute("smoothscroll", "true");
    outer.setAttribute("clicktoscroll", "true");
    outer.setAttribute("overflowing", "true");
    outer.setAttribute("orient", "horizontal");
    outer.smoothScroll = true;
    outer._clickToScroll = true;
    outer._isScrolling = false;
    outer._destination = 0;
    outer._direction = 0;
    outer._prevMouseScrolls = [null, null];

    outer.scrollByPixels = function (aPixels, aInstant) {
        let scrollOptions = { behavior: aInstant ? "instant" : "auto" };
        scrollOptions["left"] = aPixels;
        this.scrollBy(scrollOptions);
    };

    outer.lineScrollAmount = function () {
        let elements = kids;
        return elements.length && this.scrollWidth / elements.length;
    };

    outer.on_Scroll = function (event) {
        if (this.open) return;
        this._isScrolling = true;
    };

    outer.on_Scrollend = function (event) {
        this._isScrolling = false;
        this._destination = 0;
        this._direction = 0;
    };

    outer.on_Wheel = function (event) {
        if (this.open) return;
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
                scrollAmount = delta * this.clientWidth;
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

    outer.addEventListener("wheel", outer.on_Wheel);
    outer.addEventListener("scroll", outer.on_Scroll);
    outer.addEventListener("scrollend", outer.on_Scrollend);
    if (gBrowserInit.delayedStartupFinished) {
        CustomizableUI.addListener(cuiListen);
        reOrder();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                CustomizableUI.addListener(cuiListen);
                reOrder();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
