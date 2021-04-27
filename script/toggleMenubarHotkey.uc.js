// ==UserScript==
// @name           Toggle Menubar Hotkey
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Press alt+M to toggle the menubar.
// ==/UserScript==

(function () {
    _ucUtils.registerHotkey(
        {
            id: "key_toggleMenubar",
            modifiers: "alt",
            key: "M",
        },
        (win, hotkey) => {
            if (win === window)
                Services.obs.notifyObservers(
                    null,
                    "browser-set-toolbar-visibility",
                    JSON.stringify([
                        CustomizableUI.AREA_MENUBAR,
                        AutoHideMenubar._node.getAttribute("inactive"),
                    ])
                );
            console.log(hotkey);
        }
    );
})();
