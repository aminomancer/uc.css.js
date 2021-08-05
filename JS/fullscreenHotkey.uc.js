// ==UserScript==
// @name           Fullscreen Hotkey
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    All this does is remap the fullscreen shortcut from F11 to Ctrl+E, since I already use F11 for other stuff.
// ==/UserScript==

SessionStore.promiseInitialized.then(() => {
    let fullScreenKey = document.getElementById(nodeToShortcutMap["fullscreen-button"]);
    fullScreenKey.removeAttribute("keycode");
    fullScreenKey.setAttribute("key", "E");
    fullScreenKey.setAttribute("modifiers", "accel");
    document.getElementById("key_search2").setAttribute("modifiers", "accel,shift");
});
