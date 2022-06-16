// ==UserScript==
// @name           Toggle Menubar Hotkey
// @version        1.1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Press alt+M to toggle the menubar.
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
    if (win === window)
      Services.obs.notifyObservers(
        null,
        "browser-set-toolbar-visibility",
        JSON.stringify([
          CustomizableUI.AREA_MENUBAR,
          AutoHideMenubar._node.getAttribute("inactive"),
        ])
      );
  });

  function init() {
    if (!hotkeyRegistered) return;
    document.getElementById("toolbar-menubar").setAttribute("key", options.id);
    let src = onViewToolbarsPopupShowing.toSource();
    if (src.startsWith("function"))
      eval(
        `window.onViewToolbarsPopupShowing = function uc_onViewToolbarsPopupShowing ` +
          src
            .replace(/^function onViewToolbarsPopupShowing/, "")
            .replace(
              /if \(popup\.id != \"toolbar-context-menu\"\)/,
              `if (toolbar.hasAttribute("key"))`
            )
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
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();
