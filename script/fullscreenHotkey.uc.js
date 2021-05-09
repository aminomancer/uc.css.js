// ==UserScript==
// @name           Fullscreen Hotkey
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    All this does is remap the fullscreen shortcut from F11 to Ctrl+E, since I already use F11 for other stuff.
// ==/UserScript==

(() => {
    function init() {
        let fullScreenKey = document.getElementById(nodeToShortcutMap["fullscreen-button"]);
        fullScreenKey.removeAttribute("keycode");
        fullScreenKey.setAttribute("key", "E");
        fullScreenKey.setAttribute("modifiers", "accel");
        document.getElementById("key_search2").setAttribute("modifiers", "accel,shift");
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
