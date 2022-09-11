// ==UserScript==
// @name           Restore Arrowpanel Arrows
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Necessary for use with restorePreProtonArrowpanels.uc.js.
// See the script's readme section for info.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

"use strict";

// This is loaded into all XUL windows. Wrap in a block to prevent
// leaking to window scope.
{
  class MozPanel extends MozElements.MozElementMixin(XULPopupElement) {
    static get inheritedAttributes() {
      return {
        ".panel-arrowcontent": "align,dir,orient,pack",
      };
    }

    static get markup() {
      return `<vbox class="panel-arrowcontainer" flex="1">
                <box class="panel-arrowbox" part="arrowbox">
                  <image class="panel-arrow" part="arrow" />
                </box>
                <html:slot part="content" />
              </vbox>`;
    }

    constructor() {
      super();

      this._prevFocus = 0;
      this._fadeTimer = null;

      this.attachShadow({ mode: "open" });

      this.addEventListener("popupshowing", this);
      this.addEventListener("popupshown", this);
      this.addEventListener("popuphiding", this);
      this.addEventListener("popuphidden", this);
      this.addEventListener("popuppositioned", this);
    }

    connectedCallback() {
      // Create shadow DOM lazily if a panel is hidden. It helps to reduce
      // cycles on startup.
      if (!this.hidden) {
        this.ensureInitialized();
      }

      if (this.isArrowPanel) {
        if (!this.hasAttribute("flip")) {
          this.setAttribute("flip", "both");
        }
        if (!this.hasAttribute("side")) {
          this.setAttribute("side", "top");
        }
        this.setAttribute(
          "position",
          this.getAttribute("position")
            ?.replace(/^bottom(right|left)/, "bottomcenter")
            .replace(/^top(left|right)/, "$1center") || "bottomcenter topleft"
        );
        if (!this.hasAttribute("consumeoutsideclicks")) {
          this.setAttribute("consumeoutsideclicks", "false");
        }
      }
    }

    ensureInitialized() {
      // As an optimization, we don't slot contents if the panel is [hidden] in
      // connectedCallback this means we can avoid running this code at startup
      // and only need to do it when a panel is about to be shown.  We then
      // override the `hidden` setter and `removeAttribute` and call this
      // function if the node is about to be shown.
      if (this.shadowRoot.firstChild) {
        return;
      }

      this.shadowRoot.appendChild(this.constructor.fragment);
      if (this.hasAttribute("neverhidden")) {
        this.panelContent.style.display = "";
      }
    }

    get panelContent() {
      return this.shadowRoot.querySelector("[part=content]");
    }

    get hidden() {
      return super.hidden;
    }

    set hidden(v) {
      if (!v) {
        this.ensureInitialized();
      }
      super.hidden = v;
    }

    removeAttribute(name) {
      if (name == "hidden") {
        this.ensureInitialized();
      }
      super.removeAttribute(name);
    }

    get isArrowPanel() {
      return this.getAttribute("type") == "arrow";
    }

    _setSideAttribute(event) {
      if (!this.isArrowPanel) {
        return;
      }

      let container = this.shadowRoot.querySelector(".panel-arrowcontainer");
      let arrowbox = this.shadowRoot.querySelector(".panel-arrowbox");
      let arrow = this.shadowRoot.querySelector(".panel-arrow");
      if (arrow) {
        arrow.hidden = !this.anchorNode;
        this.shadowRoot
          .querySelector(".panel-arrowbox")
          ?.style.removeProperty("transform");
      }

      let position = event.alignmentPosition;
      let offset = event.alignmentOffset;

      if (position.indexOf("start_") == 0 || position.indexOf("end_") == 0) {
        container.setAttribute("orient", "horizontal");
        arrowbox.setAttribute("orient", "vertical");
        if (position.indexOf("_after") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(0, " + -offset + "px)";

        // The assigned side stays the same regardless of direction.
        let isRTL = window.getComputedStyle(this).direction == "rtl";

        if (position.indexOf("start_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", isRTL ? "left" : "right");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", isRTL ? "right" : "left");
        }
      } else if (
        position.indexOf("before_") == 0 ||
        position.indexOf("after_") == 0
      ) {
        container.removeAttribute("orient");
        arrowbox.removeAttribute("orient");
        if (position.indexOf("_end") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(" + -offset + "px, 0)";

        if (position.indexOf("before_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", "bottom");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", "top");
        }
      }
    }

    on_popupshowing(event) {
      if (event.target == this) {
        this.panelContent.style.display = "";
      }
      if (this.isArrowPanel && event.target == this) {
        if (this.anchorNode) {
          let anchorRoot =
            this.anchorNode.closest("toolbarbutton, .anchor-root") ||
            this.anchorNode;
          anchorRoot.setAttribute("open", "true");
        }

        let arrow = this.shadowRoot.querySelector(".panel-arrow");
        if (arrow) {
          arrow.hidden = !this.anchorNode;
          this.shadowRoot
            .querySelector(".panel-arrowbox")
            ?.style.removeProperty("transform");
        }

        if (this.getAttribute("animate") != "false") {
          this.setAttribute("animate", "open");
          // the animating attribute prevents user interaction during transition
          // it is removed when popupshown fires
          this.setAttribute("animating", "true");
        }

        // set fading
        let fade = this.getAttribute("fade");
        let fadeDelay = 0;
        if (fade == "fast") {
          fadeDelay = 1;
        } else if (fade == "slow") {
          fadeDelay = 4000;
        }

        if (fadeDelay != 0) {
          this._fadeTimer = setTimeout(
            () => this.hidePopup(true),
            fadeDelay,
            this
          );
        }
      }

      // Capture the previous focus before has a chance to get set inside the panel
      try {
        this._prevFocus = Cu.getWeakReference(
          document.commandDispatcher.focusedElement
        );
        if (!this._prevFocus.get()) {
          this._prevFocus = Cu.getWeakReference(document.activeElement);
          return;
        }
      } catch (ex) {
        this._prevFocus = Cu.getWeakReference(document.activeElement);
      }
    }

    on_popupshown(event) {
      if (this.isArrowPanel && event.target == this) {
        this.removeAttribute("animating");
        this.setAttribute("panelopen", "true");
      }

      // Fire event for accessibility APIs
      let alertEvent = document.createEvent("Events");
      alertEvent.initEvent("AlertActive", true, true);
      this.dispatchEvent(alertEvent);
    }

    on_popuphiding(event) {
      if (this.isArrowPanel && event.target == this) {
        let animate = this.getAttribute("animate") != "false";

        if (this._fadeTimer) {
          clearTimeout(this._fadeTimer);
          if (animate) {
            this.setAttribute("animate", "fade");
          }
        } else if (animate) {
          this.setAttribute("animate", "cancel");
        }

        if (this.anchorNode) {
          let anchorRoot =
            this.anchorNode.closest("toolbarbutton, .anchor-root") ||
            this.anchorNode;
          anchorRoot.removeAttribute("open");
        }
      }

      try {
        this._currentFocus = document.commandDispatcher.focusedElement;
      } catch (e) {
        this._currentFocus = document.activeElement;
      }
    }

    on_popuphidden(event) {
      if (event.target == this && !this.hasAttribute("neverhidden")) {
        this.panelContent.style.setProperty("display", "none", "important");
      }
      if (this.isArrowPanel && event.target == this) {
        this.removeAttribute("panelopen");
        if (this.getAttribute("animate") != "false") {
          this.removeAttribute("animate");
        }
      }

      function doFocus() {
        // Focus was set on an element inside this panel,
        // so we need to move it back to where it was previously.
        // Elements can use refocused-by-panel to change their focus behaviour
        // when re-focused by a panel hiding.
        prevFocus.setAttribute("refocused-by-panel", true);
        try {
          let fm = Services.focus;
          fm.setFocus(prevFocus, fm.FLAG_NOSCROLL);
        } catch (e) {
          prevFocus.focus();
        }
        prevFocus.removeAttribute("refocused-by-panel");
      }
      let currentFocus = this._currentFocus;
      let prevFocus = this._prevFocus ? this._prevFocus.get() : null;
      this._currentFocus = null;
      this._prevFocus = null;

      // Avoid changing focus if focus changed while we hide the popup
      // (This can happen e.g. if the popup is hiding as a result of a
      // click/keypress that focused something)
      let nowFocus;
      try {
        nowFocus = document.commandDispatcher.focusedElement;
      } catch (e) {
        nowFocus = document.activeElement;
      }
      if (nowFocus && nowFocus != currentFocus) {
        return;
      }

      if (prevFocus && this.getAttribute("norestorefocus") != "true") {
        // Try to restore focus
        try {
          if (document.commandDispatcher.focusedWindow != window) {
            // Focus has already been set to a window outside of this panel
            return;
          }
        } catch (ex) {}

        if (!currentFocus) {
          doFocus();
          return;
        }
        while (currentFocus) {
          if (currentFocus == this) {
            doFocus();
            return;
          }
          currentFocus = currentFocus.parentNode;
        }
      }
    }

    on_popuppositioned(event) {
      if (event.target == this) {
        this._setSideAttribute(event);
      }
    }
  }

  customElements.define("panel", MozPanel);
}
