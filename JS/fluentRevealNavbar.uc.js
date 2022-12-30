// ==UserScript==
// @name           Fluent Reveal Navbar Buttons
// @version        1.2.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a visual effect to navbar buttons similar to the spotlight gradient effect on Windows 10's start menu tiles. When hovering over or near a button, a subtle radial gradient is applied to every button in the vicinity the mouse. This is compatible with Fluent Reveal Tabs.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/fluentRevealNavbar.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  class FluentRevealEffect {
    // user configuration
    static options = {
      // if true, show the effect on bookmarks on the toolbar
      includeBookmarks: true,

      // the color of the gradient. default is sort of a faint baby blue. you may prefer just white, e.g. hsla(0, 0%, 100%, 0.05)
      lightColor: "hsla(224, 100%, 80%, 0.15)",

      // how wide the radial gradient is.
      gradientSize: 50,

      // whether to show an additional light burst when clicking an element. (not recommended)
      clickEffect: false,
    };

    // instantiate the handler for a given window
    constructor() {
      this._options = FluentRevealEffect.options;
      this.applyEffect(window);
      document.documentElement.setAttribute("fluent-reveal-hover", true);
      if (this._options.clickEffect) {
        document.documentElement.setAttribute("fluent-reveal-click", true);
      }
    }

    // get all the toolbar buttons in the navbar, in iterable form
    get toolbarButtons() {
      let buttons = Array.from(
        gNavToolbox.querySelectorAll(".toolbarbutton-1")
      );
      if (this._options.includeBookmarks) {
        buttons = buttons.concat(
          Array.from(this.placesToolbarItems.querySelectorAll(".bookmark-item"))
        );
      }
      return buttons;
    }

    get placesToolbarItems() {
      return (
        this._placesToolbarItems ||
        (this._placesToolbarItems = document.getElementById(
          "PlacesToolbarItems"
        ))
      );
    }

    /**
     * main event handler. handles all the mouse behavior.
     * @param {object} e (event)
     */
    handleEvent(e) {
      requestAnimationFrame(time => {
        switch (e.type) {
          case "scroll":
          case "mousemove":
            if (this._options.clickEffect && this._options.is_pressed) {
              this.generateEffectsForAll(e, true);
            } else {
              this.generateEffectsForAll(e);
            }
            break;

          case "mousedown":
            this._options.is_pressed = true;
            this.generateEffectsForAll(e, true);
            break;

          case "mouseup":
            this._options.is_pressed = false;
            this.generateEffectsForAll(e);
            break;
        }
      });
    }

    /**
     * main entry point for applying all the script behavior to an element.
     * @param {object} el (a DOM node to apply the effect to)
     * @param {object} options (an object containing options similar to the
     *                         static options at the top of the script)
     */
    applyEffect(el, options = this._options) {
      let { clickEffect } =
        options.clickEffect === undefined ? this._options : options;
      let { gradientSize } =
        options.gradientSize === undefined ? this._options : options;
      let { lightColor } =
        options.lightColor === undefined ? this._options : options;

      Object.assign(this._options, {
        clickEffect,
        lightColor,
        gradientSize,
        is_pressed: false,
      });

      el.addEventListener("mousemove", this);
      el.addEventListener("mouseleave", this);
      el.addEventListener("scroll", this, true);

      // only set up the click effect if the option is enabled and the element
      // doesn't already have a click effect.
      if (clickEffect) {
        el.addEventListener("mousedown", this);
        el.addEventListener("mouseup", this);
      }
    }

    /**
     * called individually on each toolbar button. finds the element inside the
     * toolbar button that's supposed to have a background color (they're not
     * all the same, some are just the icons, some are badge stacks, and some
     * widgets have multiple buttons too) and generates a gradient for it, since
     * gradient coordinates need to be relative to the top left corner of the
     * element the gradient is displayed on.
     * @param {object} el (a toolbar button node)
     * @param {object} e (the event that triggered the painting)
     * @param {boolean} click (whether the left mouse button is down)
     */
    generateToolbarButtonEffect(el, e, click = false) {
      let { gradientSize, lightColor } = this._options;
      let isBookmark =
        el.id === "PlacesChevron" || el.classList.contains("bookmark-item");
      let area = isBookmark
        ? el
        : el.querySelector(".toolbarbutton-badge-stack") ||
          el.querySelector(".toolbarbutton-icon");
      let areaStyle = getComputedStyle(area);
      if (
        areaStyle.display == "none" ||
        areaStyle.visibility == "hidden" ||
        areaStyle.visibility == "collapse"
      ) {
        if (isBookmark) return this.clearEffect(area);
        area = el.querySelector(".toolbarbutton-text");
      }

      if (el.disabled || areaStyle.pointerEvents == "none") {
        return this.clearEffect(area);
      }

      let x =
        (e.pageX || MousePosTracker._x) -
        this.getOffset(area).left -
        window.scrollX;
      let y =
        (e.pageY || MousePosTracker._y) -
        this.getOffset(area).top -
        window.scrollY;

      let cssLightEffect = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0)), radial-gradient(circle ${70}px at ${x}px ${y}px, rgba(255,255,255,0), ${lightColor}, rgba(255,255,255,0), rgba(255,255,255,0))`;

      this.drawEffect(
        area,
        x,
        y,
        lightColor,
        gradientSize,
        click ? cssLightEffect : null
      );
    }

    /**
     * iterate over all the toolbar buttons in the navbar, generating a separate gradient for each.
     * @param {object} e (the event that invoked this)
     * @param {boolean} click (whether the left mouse button is down)
     */
    generateEffectsForAll(e, click = false) {
      this.toolbarButtons.forEach(button =>
        this.generateToolbarButtonEffect(button, e, click)
      );
    }

    /**
     * used to calculate the x and y coordinates used in drawing the gradient
     * @param {object} el (a DOM node)
     * @returns {object} (an object containing top and left coordinates)
     */
    getOffset(el) {
      return {
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
      };
    }

    /**
     * finally draw the specified effect on a given element, that is, give the
     * element an inline background-image property
     * @param {object} el (a DOM node)
     * @param {integer} x (x coordinate for gradient center)
     * @param {integer} y (y coordinate for gradient center)
     * @param {string} lightColor (any color value accepted by CSS, e.g. "#FFF",
     *                            "rgba(125, 125, 125, 0.5)", or
     *                            "hsla(50, 0%, 100%, 0.2)")
     * @param {integer} gradientSize (how many pixels wide the gradient should be)
     * @param {string} cssLightEffect (technically, any background-image value accepted
     *                                by CSS, but should be a radial-gradient()
     *                                function, surrounded by quotes)
     */
    drawEffect(el, x, y, lightColor, gradientSize, cssLightEffect = null) {
      let lightBg;

      if (cssLightEffect === null) {
        lightBg = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0))`;
      } else {
        lightBg = cssLightEffect;
      }

      el.style.backgroundImage = lightBg;
    }

    /**
     * invoked when the script tries to paint a disabled or otherwise
     * unclickable button. (e.g. in the toolbar customization menu)
     * @param {object} el (a DOM node)
     */
    clearEffect(el) {
      this._options.is_pressed = false;
      el.style.removeProperty("background-image");
    }
  }

  function init() {
    // instantiate the class on a global property to share the methods
    // with other scripts if desired.
    window.fluentRevealNavbar = new FluentRevealEffect();
  }

  // wait for the chrome window to finish starting up, since we need to
  // reference gNavToolbox as soon as any mouse events are detected
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
