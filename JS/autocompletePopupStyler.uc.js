// ==UserScript==
// @name           Autocomplete Popup Styler
// @version        1.0.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This mini-script adds an attribute to #PopupAutoComplete when
// it's opened on a panel in the chrome UI, rather than opened on an input field
// in the content area. The reason for this is that my style gives panels and
// menupopups the same background color. So without this, if the autocomplete
// popup opened on a panel (for example the password update notification popup)
// it would end up blending in with the panel which doesn't look great. When it
// opens inside the content area, we want it to keep its normal background
// color, var(--arrowpanel-background). But when it opens in a panel, we want to
// give it a brighter background color, var(--autocomplete-background). This is
// implemented in uc-popups.css by this rule:
// panel#PopupAutoComplete[type="autocomplete-richlistbox"][anchored-on-panel] {
//   background-color: var(--autocomplete-background) !important;
// }
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  class AutocompletePopupStyler {
    constructor() {
      this.autocomplete.addEventListener("popupshowing", this);
    }
    handleEvent(_e) {
      this.autocomplete.toggleAttribute("anchored-on-panel", this.sameBG);
    }
    get sameBG() {
      if (!this.autocomplete.anchorNode) return false;
      return (
        getComputedStyle(this.panelShadowContent).backgroundColor ===
        getComputedStyle(this.autocomplete).backgroundColor
      );
    }
    get autocomplete() {
      return (
        this._autocomplete || (this._autocomplete = document.getElementById("PopupAutoComplete"))
      );
    }
    get panelShadowContent() {
      return this.autocomplete.anchorNode
        ?.closest("panel")
        .shadowRoot.querySelector(`[part="content"]`);
    }
  }

  if (gBrowserInit.delayedStartupFinished) {
    new AutocompletePopupStyler();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        new AutocompletePopupStyler();
      }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();
