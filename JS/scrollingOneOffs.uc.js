// ==UserScript==
// @name           Scrolling Search One-offs
// @version        1.3.3
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
This is for my own personal stylesheet, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. The script allows the search one-offs box to be scrolled with mousewheel up/down.

It also adds a minor improvement to the one-offs in the searchbar results popup: if the one-offs are overflowing and you switch to a search engine that is overflown off the popup, it will automatically scroll to the selected one-off button, just like the urlbar one-offs does with [oneClickOneOffSearchButtons.uc.js][].

[oneClickOneOffSearchButtons.uc.js]: https://github.com/aminomancer/uc.css.js/blob/master/JS/oneClickOneOffSearchButtons.uc.js
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/scrollingOneOffs.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/scrollingOneOffs.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
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
      border =
        parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    return width + margin + padding + border;
  }
  function setUpScroll(oneOffs, mask = false) {
    let container = oneOffs.buttons.parentElement;
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

    container.scrollByPixels = function(aPixels, aInstant) {
      let scrollOptions = { behavior: aInstant ? "instant" : "auto" };
      scrollOptions.left = aPixels;
      this.scrollBy(scrollOptions);
    };
    container.lineScrollAmount = function() {
      return buttonsList.length
        ? Math.round(buttons.scrollWidth * 0.1) / 0.1 / buttonsList.length
        : 30;
    };
    container.on_Scroll = function(_e) {
      this._isScrolling = true;
    };
    container.on_Scrollend = function(_e) {
      this._isScrolling = false;
      this._destination = 0;
      this._direction = 0;
    };
    container.on_Wheel = function(e) {
      let doScroll = false;
      let instant;
      let scrollAmount = 0;
      let isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      let delta = isVertical ? e.deltaY : e.deltaX;
      if (this._prevMouseScrolls.every(prev => prev == isVertical)) {
        doScroll = true;
        switch (e.deltaMode) {
          case e.DOM_DELTA_PIXEL:
            scrollAmount = delta;
            instant = true;
            break;
          case e.DOM_DELTA_PAGE:
            scrollAmount = delta * buttons.clientWidth;
            break;
          default:
            scrollAmount = delta * this.lineScrollAmount();
        }
      }
      if (this._prevMouseScrolls.length > 1) this._prevMouseScrolls.shift();
      this._prevMouseScrolls.push(isVertical);
      if (doScroll) {
        let direction = scrollAmount < 0 ? -1 : 1;
        let startPos = this.scrollLeft;
        if (!this._isScrolling || this._direction != direction) {
          this._destination = startPos + scrollAmount;
          this._direction = direction;
        } else {
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
    container.style.paddingInline = `4px`;
    container.style.clipPath = `inset(0 4px 0 4px)`;
    oneOffs.scrollToButton = function(el) {
      if (!el) el = buttons.firstElementChild;
      let slider = container;
      if (!slider) return;
      let buttonX = rectX(el) - rectX(slider.firstElementChild);
      let buttonWidth = parseWidth(el);
      let midpoint = slider.clientWidth / 2;
      slider.scrollTo({
        left: buttonX + buttonWidth / 2 - midpoint,
        behavior: "auto",
      });
    };
    oneOffs.on_SelectedOneOffButtonChanged = function() {
      oneOffs.scrollToButton(oneOffs.selectedButton);
    };
    oneOffs.addEventListener(
      "SelectedOneOffButtonChanged",
      oneOffs.on_SelectedOneOffButtonChanged
    );
  }

  function init() {
    setTimeout(() => {
      setUpScroll(gURLBar.view.oneOffSearchButtons, true);
    }, 100);
    document
      .getElementById("PopupSearchAutoComplete")
      .addEventListener(
        "popupshowing",
        e =>
          setUpScroll(
            document.getElementById("PopupSearchAutoComplete").oneOffButtons
          ),
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
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
