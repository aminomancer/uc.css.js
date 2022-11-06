// ==UserScript==
// @name           Scroll Urlbar with Mousewheel
// @version        1.0.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Implements vertical scrolling and smooth scrolling inside the
// urlbar's input field. That might sound weird, but the urlbar doesn't
// naturally have any special scrolling logic, so scrolling it with a mouse
// wheel can be a real bitch, and scrolling it horizontally with a trackpad
// would feel really janky. This makes all scrolling in the urlbar smooth, and
// lets you scroll it horizontally with mousewheel up/down, since it can't be
// scrolled vertically anyway.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  function init() {
    gURLBar.inputField.smoothScroll = Services.prefs.getBoolPref(
      "toolkit.scrollbox.smoothScroll",
      true
    );
    gURLBar.inputField._isScrolling = false;
    gURLBar.inputField.afterScroll = null;
    gURLBar.inputField._destination = 0;
    gURLBar.inputField._direction = 0;
    gURLBar.inputField._prevMouseScrolls = [null, null];
    gURLBar.inputField._overflowing =
      gURLBar.inputField.scrollWidth > gURLBar.inputField.clientWidth;

    gURLBar.inputField.lineScrollAmount = function() {
      return (this.scrollWidth / this.value.length) * 5;
    };

    gURLBar.inputField.on_Overflow = function(event) {
      if (event.detail === 0) return;
      this._overflowing = true;
    };

    gURLBar.inputField.on_Underflow = function(event) {
      if (event.detail === 0) return;
      this._overflowing = false;
    };

    gURLBar.inputField.on_Wheel = function(event) {
      if (!this._overflowing) return;
      let doScroll = false,
        instant,
        scrollAmount = 0,
        isVertical = Math.abs(event.deltaY) > Math.abs(event.deltaX),
        delta = isVertical ? event.deltaY : event.deltaX;

      if (this._prevMouseScrolls.every(prev => prev == isVertical)) {
        doScroll = true;
        if (event.deltaMode == event.DOM_DELTA_PIXEL) {
          scrollAmount = delta;
          instant = true;
        } else if (event.deltaMode == event.DOM_DELTA_PAGE) {
          scrollAmount = delta * this.clientWidth;
        } else {
          scrollAmount = delta * 32;
        }
      }

      if (this._prevMouseScrolls.length > 1) {
        this._prevMouseScrolls.shift();
      }
      this._prevMouseScrolls.push(isVertical);

      if (doScroll) {
        let direction = scrollAmount < 0 ? -1 : 1,
          startPos = this.scrollLeft;

        if (!this._isScrolling || this._direction != direction) {
          this._destination = startPos + scrollAmount;
          this._direction = direction;
        } else {
          this._destination = this._destination + scrollAmount;
          scrollAmount = this._destination - startPos;
        }
        this.scrollBy({
          behavior:
            (instant && "instant") || this.smoothScroll ? "smooth" : "auto",
          left: scrollAmount,
        });

        this._isScrolling = true;
        window.clearTimeout(this.afterScroll);
        this.afterScroll = window.setTimeout(function() {
          this._isScrolling = false;
        }, 66);
      }

      event.stopPropagation();
      event.preventDefault();
    };

    gURLBar.inputField.addEventListener("wheel", gURLBar.inputField.on_Wheel);
    gURLBar.inputField.addEventListener(
      "overflow",
      gURLBar.inputField.on_Overflow
    );
    gURLBar.inputField.addEventListener(
      "underflow",
      gURLBar.inputField.on_Underflow
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
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
