// ==UserScript==
// @name           Backspace Panel Navigation
// @version        1.1.3
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    Press backspace to navigate back/forward in popup panels.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/backspacePanelNav.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/backspacePanelNav.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  function init() {
    const pc = Object.getPrototypeOf(PanelView.forNode(PanelUI.mainView));
    eval(
      `pc.keyNavigation = function ${pc.keyNavigation
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^keyNavigation\s*/, "")
        .replace(/^function\s*/, "")
        .replace(
          /(case \"ArrowLeft\"\:)/,
          `case "Backspace":
        if (tabOnly() || isContextMenuOpen()) {
          break;
        }
        stop();
        if (PanelMultiView.forNode(this.node.panelMultiView).openViews.length > 1) {
          this.node.panelMultiView.goBack();
        } else {
          PanelMultiView.forNode(this.node.panelMultiView)?._panel.hidePopup(true);
        }
        break;
        $1`
        )}`
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
