// ==UserScript==
// @name           urlbarViewScrollSelect.uc.js
// @homepage       https://github.com/aminomancer
// @description    Lets you navigate the results/suggestions in the urlbar with the mousewheel, (or trackpad scroll) and execute the active/selected result by right clicking anywhere in the urlbar panel. Makes one-hand operation easier.
// @author         aminomancer
// ==/UserScript==

(() => {
    let count = 0,
        timer;

    /**
     * wheel callback
     * @param {object} e (wheel event)
     */
    let wheelSelect = function (e) {
        if (gURLBar.view.isOpen) {
            let dY = Math.abs(e.deltaY),
                dX = Math.abs(e.deltaX);
            // check that the scroll input is mostly vertical. it's nearly impossible to send ONLY vertical or horizontal inputs on a trackpad, so we just use the dominant axis. if deltaX is bigger than deltaY then it's considered a horizontal scroll and it has no effect.
            if (dY > dX) {
                e.stopPropagation();
                e.preventDefault();
                if (dY % 1 === 0) {
                    // actual mousewheel events should be integers, so we can just scroll one row per notch of the mousewheel.
                    gURLBar.view.selectBy(1, { reverse: e.deltaY > 0 ? false : true });
                } else {
                    // trackpad events will usually be decimals e.g. 0.333. since we can only scroll by one row at a time, there's no way to make the feedback proportional to the input. trackpads send lots of events with small delta values, while mousewheels send one event per "notch" with a delta value equal to the one set in your mouse settings. (at least on windows) my solution is to throttle the function for trackpad inputs. when scrolling finishes, set a 300ms timer that will nearly "empty" the throttle. that way the first event in a "new scroll" isn't throttled, the only events that get throttled are those in a fast, consecutive stream of wheel events.
                    window.clearTimeout(timer);
                    timer = window.setTimeout(() => {
                        count = 0.1;
                    }, 300);
                    // once the throttle reaches zero, scroll one row and "refill" the throttle.
                    if (count <= 0) {
                        gURLBar.view.selectBy(1, { reverse: e.deltaY > 0 ? false : true });
                        count = 6;
                        return;
                    }
                    // reduce the throttle by an amount equal to the absolute value of deltaY.
                    count = count - dY;
                }
            }
        }
    };

    /**
     * right click callback
     * @param {object} e (mouseup event)
     */
    let rightClick = function (e) {
        if (gURLBar.view.isOpen && e.button === 2) {
            e.preventDefault();
            gURLBar.handleNavigation({ e });
        }
    };

    function init() {
        gURLBar.view.panel.addEventListener("wheel", wheelSelect, false);
        gURLBar.view.panel.addEventListener("mouseup", rightClick, false);
    }

    // wait until gURLBar is initialized to attach event listeners
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
