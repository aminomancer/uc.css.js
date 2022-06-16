// ==UserScript==
// @name           Fullscreen Hotkey
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    All this does is remap the fullscreen shortcut from F11 to
//                 Ctrl+E, since I already use F11 for other stuff.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

SessionStore.promiseInitialized.then(() => {
  let fullScreenKey = document.getElementById(nodeToShortcutMap["fullscreen-button"]);
  fullScreenKey.removeAttribute("keycode");
  fullScreenKey.setAttribute("key", "E");
  fullScreenKey.setAttribute("modifiers", "accel");
  document.getElementById("key_search2").setAttribute("modifiers", "accel,shift");
});
