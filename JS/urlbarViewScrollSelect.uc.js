// ==UserScript==
// @name           Scroll Urlbar Results with Mousewheel
// @version        1.0.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Lets you navigate the results/suggestions in the urlbar with the mousewheel, (or trackpad scroll) and execute the active/selected result by right clicking anywhere in the urlbar panel. Makes one-hand operation easier.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/urlbarViewScrollSelect.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/urlbarViewScrollSelect.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  let count = 0;
  let timer;

  /**
   * wheel callback
   * @param {object} e (wheel event)
   */
  function wheelSelect(e) {
    if (gURLBar.view.isOpen) {
      let dY = Math.abs(e.deltaY);
      let dX = Math.abs(e.deltaX);
      // check that the scroll input is mostly vertical. it's nearly impossible
      // to send ONLY vertical or horizontal inputs on a trackpad, so we just
      // use the dominant axis. if deltaX is bigger than deltaY then it's
      // considered a horizontal scroll and it has no effect.
      if (dY > dX) {
        e.stopPropagation();
        e.preventDefault();
        if (dY % 1 === 0) {
          // actual mousewheel events should be integers, so we can just scroll
          // one row per notch of the mousewheel.
          gURLBar.view.selectBy(1, { reverse: e.deltaY < 0 });
        } else {
          // trackpad events will usually be decimals e.g. 0.333. since we can
          // only scroll by one row at a time, there's no way to make the
          // feedback proportional to the input. trackpads send lots of events
          // with small delta values, while mousewheels send one event per
          // "notch" with a delta value equal to the one set in your mouse
          // settings. (at least on windows) my solution is to throttle the
          // function for trackpad inputs. when scrolling finishes, set a 300ms
          // timer that will nearly "empty" the throttle. that way the first
          // event in a "new scroll" isn't throttled, the only events that get
          // throttled are those in a fast, consecutive stream of wheel events.
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            count = 0.1;
          }, 300);
          // once the throttle reaches zero, scroll one row and "refill" the throttle.
          if (count <= 0) {
            gURLBar.view.selectBy(1, { reverse: e.deltaY < 0 });
            count = 6;
            return;
          }
          // reduce the throttle by an amount equal to the absolute value of
          // deltaY. this is important because the rate at which scrolling on a
          // trackpad sends wheel events doesn't seem to be correlated with the
          // speed you move your fingers across the trackpad. so without this,
          // you'd scroll through the rows at a constant speed, whether you're
          // moving your fingers slowly or quickly. instead of making the speed
          // proportional to the number of events per unit time, we make it
          // proportional to the total deltaY. when you move your fingers
          // slowly, you might send 5 events that only have deltaY of 0.33, but
          // when you move your fingers over the same distance at a much faster
          // speed, you'd still send 5 events but they'd have deltaY between of
          // up to 20. by subtracting deltaY from the count, the number of
          // events required before calling selectBy will be proportional to the
          // deltaY of those events. a really fast scroll will be equivalent to
          // count = 6 - 20 => -14, so the very next event will call selectBy.
          // really slow scrolling will take much longer to count down to 0 from
          // 6 since their deltaY is often less than 1.
          count = count - dY;
        }
      }
    }
  }

  /**
   * right click callback
   * @param {object} e (mouseup event)
   */
  function rightClick(e) {
    if (gURLBar.view.isOpen && e.button === 2) {
      e.preventDefault();
      // this method is how the urlbar handles pressing "enter" when a row is
      // selected. if the row is a regular URL, it visits that URL. if the row
      // is a search, it executes that search. if the row is a "switch to tab"
      // item, then it switches to that tab, and so on.
      gURLBar.handleNavigation({ e });
    }
  }

  function init() {
    gURLBar.view._rows.addEventListener("wheel", wheelSelect);
    gURLBar.view._rows.addEventListener("mouseup", rightClick);
  }

  // wait until gURLBar is initialized to attach event listeners
  if (gBrowserInit.delayedStartupFinished) {
    setTimeout(init, 1000);
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        setTimeout(init, 1000);
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
