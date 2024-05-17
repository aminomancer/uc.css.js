// ==UserScript==
// @name           Custom Hint Provider
// @version        1.2.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
A utility script for other scripts to take advantage of. Sets up a global object (on the chrome window) for showing confirmation hints with custom messages. The built-in confirmation hint component can only show a few messages built into the browser's localization system. It only accepts l10n IDs, so if your script wants to show a custom message with some specific string, it won't work. This works just like the built-in confirmation hint, and uses the built-in confirmation hint element, but it accepts an arbitrary string as a parameter. So you can open a confirmation hint with _any_ message, e.g.

```js
CustomHint.show(anchorNode, "This is my custom message", {
  hideArrow: true,
  hideCheck: true,
  description: "Awesome.",
  duration: 3000,
});
```
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/customHintProvider.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/customHintProvider.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

window.CustomHint = {
  ...window.ConfirmationHint,

  /**
   * Shows a transient, non-interactive confirmation hint anchored to an
   * element, usually used in response to a user action to reaffirm that it was
   * successful and potentially provide extra context.
   *
   * @param {Element} anchor The anchor for the panel. A value of null will
   *   anchor to the viewpoint (see options.x below)
   * @param {string} message The text to be shown.
   * @param {object} [options] Object with optional extra properties:
   * @param {string} [options.description] If provided, show a more detailed
   *   description/subtitle with the passed text.
   * @param {boolean} [options.hideArrow] Optionally hide the arrow.
   * @param {boolean} [options.hideCheck] Optionally hide the checkmark.
   * @param {number} [options.duration] How long the hint should stick around,
   *   in milliseconds. Default is 1500 — 1.5 seconds. Pass -1 to make the hint
   *   stay open until the user clicks out of it, presses Escape, etc.
   * @param {DOMEvent} [options.event] The event that triggered the feedback.
   * @param {string} [options.position] One of a number of strings representing
   *   how the anchor point of the popup is aligned relative to the anchor point
   *   of the anchor node. Possible values for position are:
   *     before_start, before_end, after_start, after_end, start_before,
   *     start_after, end_before, end_after, overlap, after_pointer
   *   For example, `after_start` means the anchor node's bottom left corner
   *   will be aligned with the popup node's top left corner. `overlap` means
   *   their top left corners will be lined up exactly, so they will overlap.
   * @param {number} [options.x] Horizontal offset in pixels, relative to the
   *   anchor. If no anchor is provided, relative to the viewport.
   * @param {number} [options.y] Vertical offset in pixels, relative to the
   *   anchor. Negative values may also be used to move to the left and upwards
   *   respectively. Unanchored popups may be created by supplying null as the
   *   anchor node. An unanchored popup appears at the position specified by x
   *   and y, relative to the viewport of the document containing the popup
   *   node. (ignoring the anchor parameter)
   */
  show(anchor, message, options = {}) {
    let { description, hideArrow, hideCheck, duration, event, position, x, y } =
      options;
    this._reset();

    this._message.removeAttribute("data-l10n-id");
    this._message.textContent = message;

    if (description) {
      this._description.removeAttribute("data-l10n-id");
      this._description.textContent = description;
      this._description.hidden = false;
      this._panel.classList.add("with-description");
    } else {
      this._description.hidden = true;
      this._panel.classList.remove("with-description");
    }

    if (hideArrow) {
      this._panel.setAttribute("hidearrow", "true");
    }

    if (hideCheck) {
      this._animationBox.setAttribute("hidden", "true");
      this._panel.setAttribute("data-message-id", "hideCheckHint");
    } else {
      this._animationBox.removeAttribute("hidden");
      this._panel.setAttribute("data-message-id", "checkmarkHint");
    }

    const DURATION = duration || 1500;
    this._panel.addEventListener(
      "popupshown",
      () => {
        this._animationBox.setAttribute("animate", "true");
        this._timerID =
          DURATION > 0
            ? setTimeout(() => this._panel.hidePopup(true), DURATION + 120)
            : 1;
      },
      { once: true }
    );

    this._panel.addEventListener(
      "popuphidden",
      () => {
        // reset the timerId in case our timeout wasn't the cause of the popup being hidden
        this._reset();
      },
      { once: true }
    );

    this._panel.openPopup(null, { position, triggerEvent: event });
    this._panel.moveToAnchor(anchor, position, x, y);
  },

  _reset() {
    if (this._timerID) {
      clearTimeout(this._timerID);
      this._timerID = null;
      this._animationBox.removeAttribute("hidden");
    }
    if (this.__panel) {
      this._panel.removeAttribute("hidearrow");
      this._animationBox.removeAttribute("animate");
      this._panel.removeAttribute("data-message-id");
      this._panel.hidePopup();
    }
  },

  _ensurePanel() {
    if (!this.__panel) {
      // hook into the built-in confirmation hint element
      let wrapper = document.getElementById("confirmation-hint-wrapper");
      wrapper?.replaceWith(wrapper.content);
      this.__panel = ConfirmationHint.__panel =
        document.getElementById("confirmation-hint");
    }
  },
};

(function () {
  function init() {
    ConfirmationHint.show = function show(anchor, messageId, options = {}) {
      this._reset();

      MozXULElement.insertFTLIfNeeded("toolkit/branding/brandings.ftl");
      MozXULElement.insertFTLIfNeeded("browser/confirmationHints.ftl");
      document.l10n.setAttributes(this._message, messageId, options.l10nArgs);

      if (options.descriptionId) {
        document.l10n.setAttributes(this._description, options.descriptionId);
        this._description.hidden = false;
        this._panel.classList.add("with-description");
      } else {
        this._description.hidden = true;
        this._panel.classList.remove("with-description");
      }

      if (options.hideArrow) {
        this._panel.setAttribute("hidearrow", "true");
      }

      this._panel.setAttribute("data-message-id", messageId);

      const DURATION = options.showDescription ? 4000 : 1500;
      this._panel.addEventListener(
        "popupshown",
        () => {
          this._animationBox.setAttribute("animate", "true");
          this._timerID = setTimeout(() => {
            this._panel.hidePopup(true);
          }, DURATION + 120);
        },
        { once: true }
      );

      this._panel.addEventListener(
        "popuphidden",
        () => {
          this._reset();
        },
        { once: true }
      );

      let { position, x, y } = options;
      this._panel.openPopup(null, { position, triggerEvent: options.event });
      this._panel.moveToAnchor(anchor, position, x, y);
    };

    ConfirmationHint._reset = function _reset() {
      if (this._timerID) {
        clearTimeout(this._timerID);
        this._timerID = null;
      }
      if (this.__panel) {
        this._panel.removeAttribute("hidearrow");
        this._animationBox.removeAttribute("animate");
        this._panel.removeAttribute("data-message-id");
      }
    };
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
