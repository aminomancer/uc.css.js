// ==UserScript==
// @name           navbarToolbarButtonSlider.uc.js
// @homepage       https://github.com/aminomancer
// @description    Wrap all toolbar buttons after #urlbar-container in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. You can change "max-width" in outer.style.cssText to make the container wider or smaller, ideally by increments of 32. I use 352 because I want 11 icons to be visible. To scroll faster you can add a multiplier right before scrollByPixels is called, like scrollAmount = scrollAmount * 1.5 or something like that. Doesn't handle touch events yet since I don't have a touchpad to test it on. Let me know if you have any ideas though.
// @author         aminomancer
// ==/UserScript==

(() => {
    function startup() {
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
            cuiArray = async function () {
                /* get all the widgets in the nav-bar, filter out any nullish/falsy items, then call the big boy filter. if the global context is a private browsing window, then it will filter out any extension widgets that aren't allowed in private browsing. this is important because every item in the array needs to have a corresponding DOM node for us to remember the DOM order and place widgets where they belong. if we leave an item in the array that has no DOM node, then insertBefore will put the widget before undefined, which means put it at the very end, which isn't always what we want. most importantly this returns anew every time it's called so it can update during the invocation of pickUpOrphans but also during the execution. using async since it's fewer characters than "return new Promise..." */
                return CustomizableUI.getWidgetsInArea("nav-bar")
                    .filter(Boolean)
                    .filter(filterWidgets);
            },
            opener = function (mus) {
                /* mutation observer callback. we're listening for changes to the "open" attribute of children of inner (the inner container). when you click a toolbar button that has a popup, it opens the popup and sets the "open" attribute of the button to "true". if you were to scroll the slider container while the popup is open, the popup will move right along with its anchor, the button. this is a problem because some button popups are actually children of the button. meaning mousewheeling with the cursor over the popup would scroll the slider, not the popup. there are other ways to deal with this, but we don't want the slider to scroll at all when the popup is open. because firefox normally blocks scrolling when a menupopup is open. so let's just listen for button nodes having open="true" and set a property on the outer container accordingly. then we can use that prop to enable/disable scrolling. */
                for (let mu of mus) {
                    if (mu.type === "attributes") {
                        // if any button has open=true, set outer.open=true, else, outer.open=false.
                        kids.some((elem) => elem.open)
                            ? outer.open || (outer.open = true)
                            : !outer.open || (outer.open = false);
                    }
                }
            };

        const observer = new MutationObserver(opener),
            obsOps = {
                attributeFilter: ["open"],
                subtree: true,
            };

        // unwrap all the buttons when customization starts
        function cStart() {
            unwrapAll(kids, cNavBar);
        }

        // rewrap all when customization ends.
        async function cEnd() {
            let array = await convertToArray(widgets);
            wrapAll(array, inner);
        }

        // check for toolbar buttons being created or updated on a continuing basis.
        function domChange(aNode, aNextNode, aContainer, aWasRemoval) {
            // if the dom change was the removal of a toolbar button node, do nothing.
            if (aWasRemoval) return;
            /* first makes sure that "this" refers to the window where the node was created, otherwise this would run multiple times per-window if you have more than one window open. second makes sure that the node being mutated is actually in the nav-bar, since there are other widget areas. third makes sure we're not in customize mode, since that involves a lot of dom changes and we want to basically pause this whole feature during customize mode. if all are true then we call pickUpOrphans to wrap any widgets that aren't already wrapped. */
            if (
                aNode.ownerGlobal === this &&
                aContainer === cNavBar &&
                !CustomizationHandler.isCustomizing()
            ) {
                pickUpOrphans(aNode);
            }
        }

        function windowClosed(aWindow) {
            /* argument 2 of this expression detaches listener for window that got closed. but other windows still have listeners that hear about the closed window. if a window happens to be open to the "customize" page when the window closes, that window won't send an onCustomizeEnd event. so the slider containers in EVERY window would remain unwrapped after the window closes. so when a window closes, we need to check if the window that sent the closed event is in customization. if it is, then we need to call wrapAll in the windows that weren't closed. that's what the 3rd argument here is for. */
            aWindow === this
                ? this.CustomizableUI.removeListener(cuiListen)
                : aWindow.CustomizationHandler.isCustomizing() && wrapAll(domArray, inner);
        }

        // convert the buttons we want to wrap into an array. isn't entirely necessary but it's a performant way to prevent weird anomalies during startup that could show up otherwise.
        async function convertToArray(buttons) {
            domArray.length = 0;
            for (let i = 0; i < buttons.length; i++) {
                if (filterWidgets(buttons[i])) domArray.push(buttons[i]);
            }
            return domArray;
        }

        function filterWidgets(item) {
            // check if window is private and widget is disallowed in private browsing. if so, filter it out.
            if (
                item.showInPrivateBrowsing === false &&
                PrivateBrowsingUtils.isWindowPrivate(this)
            ) {
                return false;
            }
            // exclude system buttons and anything else you don't want to wrap in the slider container.
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

        function appendLoop(buttons, container) {
            for (let i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
                container.appendChild(buttons[i]);
            }
        }

        function wrapAll(buttons, container, first = false) {
            let parent = buttons[0].parentElement,
                previousSibling = buttons[0].previousSibling;
            appendLoop(buttons, container);
            // on first run put the inner container in the outer container
            if (first) outer.appendChild(container);
            /* previousSibling = the first button's original previousSibling. in this case the urlbar. so we're inserting the container before the urlbar's next sibling, i.e. moving it to the original position of the first button. this way the container wraps the buttons "in place," wherever they happen to be. though for this reason, all the buttons you intend to collect should be consecutive, obviously. */
            parent.insertBefore(outer, previousSibling.nextSibling);
        }

        function unwrapAll(buttons, container) {
            appendLoop(buttons, container);
            /* temporarily move the slider out of the way. we don't want to delete it since we only want to add listeners and observers once per window.
        the slider needs to be out of the customization target during customization, or else we get a tiny bug where dragging a widget ahead of the empty slider causes the widget to teleport to the end. */
            bin.appendChild(outer);
        }

        // pick up any nodes that belong in the slider but aren't in it.
        async function pickUpOrphans(aNode) {
            let array = await cuiArray();
            for (let i = 0; i < array.length; i++) {
                // check that the node which changed is in the customizable widgets list, since the ordering logic relies on the widgets list. we use forWindow(this) when selecting nodes from the widgets list, since each widget has an instance for every window it's visible in. with multiple windows open, array[0] will return an object with a property "instances" whose value is an array of objects, each of which has a node property referencing the DOM node we actually want. forWindow(this) is just a shortcut to get to the object corresponding to the context we're executing in.
                if (array[i].id === aNode?.id) {
                    /* if the node that changed is the last item in the array, meaning it's *supposed* to be the last in order, then we can't use insertBefore() since there's nothing meant to be after it. we can't only use after() either since it won't work for the first node. so we check for its intended position... */
                    i + 1 === array?.length
                        ? array[i - 1].forWindow(this).node.after(aNode) // and if it's the last item, we use the after() method to put it after the node corresponding to the previous widget.
                        : inner.insertBefore(aNode, array[i + 1].forWindow(this).node); // for all the other widgets we just insert their nodes before the node corresponding to the next widget.
                }
            }
        }

        // only called during window startup. it's just here to pick up nodes that might have been created after convertToArray and wrapAll finished executing.
        function cleanUp() {
            if (outer.nextElementSibling) pickUpOrphans(outer.nextElementSibling);
        }

        async function slowCleanUp() {
            let array = await convertToArray(widgets);
            if (array.length) {
                wrapAll(array, inner);
            }
            reOrder();
        }

        /* like pickUpOrphans, but moves ALL nodes rather than only nodes which triggered onWidgetAfterDOMChange. we only use this once, after delayed startup.
    its only job is to check that the order of DOM nodes in the slider container matches the order of widgets in CustomizableUI. and if not, reorder it so that it does match. */
        async function reOrder() {
            let array = await cuiArray();
            // for every valid item in the widgets list...
            for (let i = 0; i < array.length; i++) {
                /* if the NODE's next sibling does not match the next WIDGET's node, then we need to move the node to where it belongs. basically the DOM order is supposed to match the widget array's order.
            an instance of widget 1 has a property 'node', let's call it node 1. same for widget 2, call it node 2.
            node 1's next sibling should be equal to node 2. if node 1's next sibling is actually node 5, then the DOM is out of order relative to the array.
            so we check each widget's node's next sibling, and if it's not equal to the node of the next widget in the array, we insert the node before the next widget's node. */
                if (
                    array[i].forWindow(this).node.nextElementSibling !=
                    array[i + 1]?.forWindow(this).node
                ) {
                    /* if nextElementSibling returns null, then it's the last child of the slider. if that widget is the last in the array, then array[i+1] will return undefined. since null == undefined the if statement will still execute for the last widget.
                but the following expression says to insert the node before the next widget's node. since there is no next widget, we're telling the engine to insert the node before undefined. which always results in inserting the node at the end. so it ends up where it should be anyway.
                and this is faster than actually checking if it's the last node for every iteration of the loop. */
                    inner.insertBefore(
                        array[i].forWindow(this)?.node,
                        array[i + 1]?.forWindow(this).node
                    );
                }
            }
        }

        function setupScroll() {
            // element.children does not return an array, so doesn't have the some() method. i think adding the prototype method is faster and fewer characters than making a new function.
            kids.some = Array.prototype.some;
            // begin observing for changes to the "open" attribute of the slider's toolbar buttons.
            observer.observe(inner, obsOps);
            outer.className = "container";
            outer.id = "nav-bar-toolbarbutton-slider-container";
            // the crucial parts here are scroll-behavior: smooth, overflow: hidden. without this, smooth horizontal scrolling won't work.
            outer.style.cssText =
                "display: -moz-box; -moz-box-align: center; max-width: 352px; scrollbar-width: none; box-sizing: border-box; scroll-behavior: smooth; overflow: hidden";
            inner.className = "container";
            inner.id = "nav-bar-toolbarbutton-slider";
            inner.style.cssText = "display: flex; flex-flow: row; flex-direction: row";
            // these attributes aren't exactly necessary, just there for consistency in firefox and maybe future extension.
            outer.setAttribute("smoothscroll", "true");
            outer.setAttribute("clicktoscroll", "true");
            outer.setAttribute("overflowing", "true");
            outer.setAttribute("orient", "horizontal");
            outer.smoothScroll = true;
            outer._clickToScroll = true;
            outer._isScrolling = false;
            // these objects hold values used for scrolling
            outer._destination = 0;
            outer._direction = 0;
            outer._prevMouseScrolls = [null, null];

            // these are patterned after the arrowscrollbox functions.
            outer.scrollByPixels = function (aPixels, aInstant) {
                let scrollOptions = { behavior: aInstant ? "instant" : "auto" };
                scrollOptions["left"] = aPixels;
                this.scrollBy(scrollOptions);
            };

            // evaluate how much to scroll by in line deltaMode
            outer.lineScrollAmount = function () {
                return kids.length && this.scrollWidth / kids.length;
            };

            // these 2 are just here for future extension
            outer.on_Scroll = function () {
                if (this.open) return;
                this._isScrolling = true;
            };

            outer.on_Scrollend = function () {
                this._isScrolling = false;
                this._destination = 0;
                this._direction = 0;
            };

            // main wheel event callback
            outer.on_Wheel = function (event) {
                /* this is what the mutation observer was for. when a toolbar button in the slider has its popup open, we set outer.open = true.
        so if outer.open = true we don't want to scroll at all. in other words, if a popup for a button in the slider is open, don't do anything. */
                if (this.open) return;
                let doScroll = false,
                    instant,
                    scrollAmount = 0,
                    // check if the wheel event is mostly vertical (up/down) or mostly horizontal (left/right).
                    isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX),
                    /* if we're scrolling vertically, then use the deltaY as the general delta. if horizontal, then use deltaX instead.
            you can use this to invert the vertical scrolling direction. just change event.deltaY to -event.deltaY.
            the tabbrowser has this reversed, at least for english. but in this implementation, wheelDown scrolls right, and wheelUp scrolls left. */
                    delta = isVertical ? event.deltaY : event.deltaX;

                /* if we're using a trackpad or ball or something that can scroll horizontally and vertically at the same time, we need some extra logic.
        otherwise it can stutter like crazy. as you see in delta, we want to only use either the deltaY or the deltaX, never both.
        but if you're scrolling diagonally, that could change very quickly from X to Y to X and so on. so we want to only call scrollBy if the scroll input is consistent in one direction.
        that's what outer._prevMouseScrolls = [null, null] is for. we want to check that the last 2 scroll events were primarily vertical.
        if they were, then we'll enable scrolling and set the scroll amount. */
                if (this._prevMouseScrolls.every((prev) => prev == isVertical)) {
                    doScroll = true;
                    // check the delta mode to determine scrollAmount. depends on the device and settings. with a mousewheel it should usually use delta * lineScrollAmount
                    if (event.deltaMode == event.DOM_DELTA_PIXEL) {
                        scrollAmount = delta;
                        instant = true;
                    } else if (event.deltaMode == event.DOM_DELTA_PAGE) {
                        scrollAmount = delta * this.clientWidth;
                    } else {
                        scrollAmount = delta * this.lineScrollAmount();
                    }
                }

                /* we need to constantly update those 2 values in _prevMouseScrolls so that it won't scroll vertically for sudden axis changes.
        when an item gets added, it shoves the last item out of the array with shift(). so the array only ever has 2 values, the isVertical value of the latest 2 events.
        so if i move the wheel horizontally once, then vertically once, this will be [true, false].
        and it won't allow vertical scrolling, since the every() method above checks that every member of the array is equal to isVertical.
        in other words, the last 2 scroll events need to be in the same direction or the events won't scroll the container.
        if i move vertically once more, it will be [true, true] and THEN the above block will be allowed to set doScroll and scrollAmount.
        if i move horizontally now, then it'll be [false, true] and vertical scrolling will be disabled again. */
                if (this._prevMouseScrolls.length > 1) {
                    this._prevMouseScrolls.shift(); // shift the last member out, before...
                }
                this._prevMouseScrolls.push(isVertical); // adding the latest event's value to the array

                // provided we're allowed to scroll, then call scrollByPixels with the values previously returned.
                if (doScroll) {
                    let direction = scrollAmount < 0 ? -1 : 1,
                        startPos = this.scrollLeft;

                    /* since we're using smooth scrolling, we check if the event is being sent while a scroll animation is already "playing."
            this will avoid stuttering if scrolling quickly (or on a trackpad, methinks) */
                    if (!this._isScrolling || this._direction != direction) {
                        this._destination = startPos + scrollAmount;
                        this._direction = direction;
                    } else {
                        // We were already in the process of scrolling in this direction
                        this._destination = this._destination + scrollAmount;
                        scrollAmount = this._destination - startPos;
                    }
                    // finally do the actual scrolly thing
                    this.scrollByPixels(scrollAmount, instant);
                }

                event.stopPropagation();
                event.preventDefault();
            };

            outer.addEventListener("wheel", outer.on_Wheel);
            outer.addEventListener("scroll", outer.on_Scroll);
            outer.addEventListener("scrollend", outer.on_Scrollend);
        }

        // when you download a file in Firefox, a little gray arrow icon appears on the downloads toolbar button. this popup appears no matter where the downloads button is, as long as it's actually saved to a toolbar somewhere. it is anchored to the toolbar button itself, and for us the toolbar button's slider container is overflowing. so it's possible for the downloads button to be scrolled out of view, and still have the downloads animation appear. it will just be floating off over the urlbar or something, which looks pretty stupid. so we're overriding an internal function to give it some behavior it probably should have had anyway. now it will check that the toolbar button is actually scrolled into view relative to its parent before showing the popup. if the downloads button is scrolled out of view, then it'll just download the file without displaying the floating arrow.
        function overflowDownloadsAnimation() {
            DownloadsIndicatorView.showEventNotification = function showEventNotification(aType) {
                if (!this._initialized) {
                    return;
                }

                if (!DownloadsCommon.animateNotifications) {
                    return;
                }

                let el = DownloadsButton._placeholder;
                if (el?.parentNode.offsetLeft) {
                    if (
                        el.getBoundingClientRect().left - el.parentNode.offsetLeft <
                        -(el.clientWidth * 0.5)
                    )
                        return;
                }

                // enqueue this notification while the current one is being displayed
                if (this._currentNotificationType) {
                    // only queue up the notification if it is different to the current one
                    if (this._currentNotificationType != aType) {
                        this._nextNotificationType = aType;
                    }
                } else {
                    this._showNotification(aType);
                }
            };
        }

        async function init() {
            // wait for nodes to be filtered. making an array from the DOM seems to be faster than using CustomizableUI's widgets list.
            // idk how but i guess the CustomizableUI component loads stuff lazily...
            // and probably the browser starts rebuilding the widget area from some kind of cache before the component has fully loaded?
            // we use the widgets list very shortly afterwards in cleanUp() to verify and correct the DOM order though.
            // speed matters here because it lets the browser wrap all the buttons in the overflowed slider before they're rendered...
            // therefore we don't have to see like 30 toolbar buttons side-by-side for a split second before jarringly shrinking into just 11 buttons.
            // so it's just an aesthetic decision i guess.
            let array = await convertToArray(widgets);
            // first wrap call
            wrapAll(array, inner, true);
            setupScroll();
            cleanUp();
            overflowDownloadsAnimation();
        }

        init();
        CustomizableUI.addListener(cuiListen);
        setTimeout(slowCleanUp, 1000);
    }

    /* for this script we want to do everything as quickly as possible so there isn't a jarring transition during startup.
    if we waited too long, you'd see all the widgets on your toolbar for a moment, not overflowed but instead squeezing down the urlbar to make room.
    then when the script executed, you'd see them suddenly shrink into the slider box.
    so we wanna run this script as soon as humanly possible so that everything is already IN the box by the time firefox renders the first frame.
    but that's potentially too soon if you have a shit ton of extensions or extensions that load their buttons really slowly for some reason.
    if startup is slow for some reason, then this script could also be executing before CustomizableUI is even fully initialized.
    so we run the script immediately, but we schedule reOrder() and the CustomizableUI listener for when "delayed startup" is finished.
    i don't actually know if this observer actually waits for all extensions to load or something. i just know it waits a little bit.
    maybe there's another way to actually wait for all the extensions to load, lmk if you know~ */
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
