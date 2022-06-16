// ==UserScript==
// @name           Tracking Protection Middle Click Toggle
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Middle click the tracking protection icon in the urlbar to
// enable/disable tracking protection on the active tab. A minor change, but it's
// faster than left-clicking to open the panel, then clicking the actual toggle switch.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  const config = {
    // if true, play a scale burst animation on the tracking icon when
    // middle-clicking it. prefers-reduced-motion must not be enabled. set to
    // false to disable animation.
    "enable icon animation": true,
  };
  function init() {
    gProtectionsHandler.handleProtectionsButtonEvent = function (event) {
      event.stopPropagation();
      let box = gProtectionsHandler.iconBox;
      switch (event.type) {
        case "click":
          switch (event.button) {
            case 1:
              gProtectionsHandler.onTPSwitchCommand();
              if (config["enable icon animation"]) {
                box.addEventListener("animationend", () => box.removeAttribute("animate"), {
                  once: true,
                });
                box.setAttribute("animate", "true");
              }
            // fall through
            case 2:
              return;
          }
          break;
        case "keypress":
          if (event.charCode != KeyEvent.DOM_VK_SPACE && event.keyCode != KeyEvent.DOM_VK_RETURN)
            return;
          break;
      }
      this.showProtectionsPopup({ event });
    };
  }
  if (config["enable icon animation"]) {
    let styleSvc = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let css = /* css */ `@media (prefers-reduced-motion: no-preference) {
  #tracking-protection-icon-box[animate] #tracking-protection-icon {
    animation-name: uc-scale-pulse;
    animation-duration: 200ms;
    animation-iteration-count: 1;
    animation-timing-function: ease-in-out;
    transform-style: flat;
    backface-visibility: hidden;
  }
  #tracking-protection-icon-box[animate] {
    overflow: visible;
  }
}
@keyframes uc-scale-pulse {
  from {
    transform: scale(1);
  }
  40% {
    transform: scale(0.8);
  }
  to {
    transform: scale(1);
  }
}`;
    let styleURI = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    if (!styleSvc.sheetRegistered(styleURI, styleSvc.AUTHOR_SHEET))
      styleSvc.loadAndRegisterSheet(styleURI, styleSvc.AUTHOR_SHEET);
  }
  if (gBrowserInit.delayedStartupFinished) init();
  else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();
