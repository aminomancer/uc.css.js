// ==UserScript==
// @name           Pin Tab Hotkey
// @version        1.1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Press Ctrl+Alt+P (or Cmd+Alt+P on macOS) to pin/unpin selected tab(s).
//                 Configure by changing modifiers and key values below.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

_ucUtils.registerHotkey(
  {
    // one or more of: alt, shift, ctrl, meta, accel. separated by space, enclosed by quotes.
    modifiers: "accel alt",
    // one of: A-Z, - (hyphen), or F1-F12. enclosed by quotes.
    key: "P",
    // key ID. don't change this.
    id: "key_togglePinTab",
  },
  win => {
    if (win === window) {
      gBrowser.selectedTab.pinned
        ? gBrowser.unpinMultiSelectedTabs()
        : gBrowser.pinMultiSelectedTabs();
    }
  }
);
