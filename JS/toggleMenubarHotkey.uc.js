// ==UserScript==
// @name           Toggle Menubar Hotkey
// @version        1.1.5
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    Adds a hotkey (Alt+M by default) that toggles the menubar on and off. Unlike just pressing the Alt key, this keeps it open permanently until closed again by the hotkey, toolbar context menu, or customize menu. Requires [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) — other script loaders will not work with this script.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/toggleMenubarHotkey.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/toggleMenubarHotkey.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  const options = {
    // one or more of: alt, shift, ctrl, meta, accel. separated by space, enclosed by quotes.
    modifiers: "alt",
    // one of: A-Z, - (hyphen), or F1-F12. enclosed by quotes.
    key: "M",
    // key ID. don't change this.
    id: "key_toggleMenubar",
  };
  let hotkeyRegistered = _ucUtils.registerHotkey(options, (win, key) => {
    if (win === window) {
      Services.obs.notifyObservers(
        null,
        "browser-set-toolbar-visibility",
        JSON.stringify([
          CustomizableUI.AREA_MENUBAR,
          AutoHideMenubar._node.getAttribute("inactive"),
        ])
      );
    }
  });

  function init() {
    if (!hotkeyRegistered) return;
    document.getElementById("toolbar-menubar").setAttribute("key", options.id);
    if (
      ToolbarContextMenu.onViewToolbarsPopupShowing.name ===
      "onViewToolbarsPopupShowing"
    ) {
      const lazy = {};
      ChromeUtils.defineESModuleGetters(lazy, {
        CustomizableUI: "resource:///modules/CustomizableUI.sys.mjs",
        SessionStore: "resource:///modules/sessionstore/SessionStore.sys.mjs",
      });

      eval(
        `ToolbarContextMenu.onViewToolbarsPopupShowing = function uc_onViewToolbarsPopupShowing ${ToolbarContextMenu.onViewToolbarsPopupShowing
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^onViewToolbarsPopupShowing/, "")
          .replace(
            /if \(popup\.id != \"toolbar-context-menu\"\)/,
            `if (toolbar.hasAttribute("key"))`
          )}`
      );
    }
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
