// ==UserScript==
// @name           Eyedropper Button
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a toolbar button that implements the color picker without launching the devtools. Similar to the menu item in the "More Tools" and "Tools > Browser Tools" menus, only this one can be placed directly on your toolbar. Also adds a customizable hotkey to do the same — by default, it's Ctrl+Shift+Y (or Cmd+Shift+Y on macOS)
// ==/UserScript==

class EyedropperButton {
    static shortcut = {
        key: "Y", // shortcut key, combined with modifiers.
        modifiers: "accel shift", // ctrl + shift or cmd + shift (use accel instead of ctrl, it's cross-platform. it can be changed in about:config with ui.key.accelKey. if you leave the "" quotes empty, no modifier will be used. that means the hotkey will just be "Y" which may be a bad idea — only do that if your "key" value is something obscure like a function key, since this key will be active at all times and in almost all contexts.
        id: "key_eyedropper",
    };
    constructor() {
        this.makeBundles();
        this.makeHotkey();
        Services.obs.addObserver(this, "uc-eyedropper-started");
        if (gBrowserInit.delayedStartupFinished) this.afterLazyStartup();
        else Services.obs.addObserver(this, "browser-delayed-startup-finished");
    }
    makeBundles() {
        this.menuBundle = Services.strings.createBundle(
            "chrome://devtools/locale/menus.properties"
        );
        this.inspectorBundle = Services.strings.createBundle(
            "chrome://devtools/locale/inspector.properties"
        );
    }
    getString(name, where) {
        return this[`${where}Bundle`].GetStringFromName(name);
    }
    // "Eyedropper"
    get labelString() {
        return (
            this._labelString || (this._labelString = this.getString("eyedropper.label", "menu"))
        );
    }
    // "Grab a color from the page"
    get tooltipString() {
        return (
            this._tooltipString ||
            (this._tooltipString = this.getString("inspector.eyedropper.label", "inspector"))
        );
    }
    // "Ctrl+Shift+Y"
    get shortcutString() {
        return (
            this._shortcutString ||
            (this._shortcutString = this.hotkey
                ? ` (${ShortcutUtils.prettifyShortcut(this.keyEl)})`
                : "")
        );
    }
    // "Grab a color from the page (%S)"
    get tooltipWithShortcut() {
        return (
            this._tooltipWithShortcut ||
            (this._tooltipWithShortcut = this.tooltipString + this.shortcutString)
        );
    }
    get devToolsMenu() {
        return (
            this._devToolsMenu ||
            (this._devToolsMenu = document.getElementById("menuWebDeveloperPopup"))
        );
    }
    get mainMenuItem() {
        return (
            this._mainMenuItem ||
            (this._mainMenuItem = document.getElementById("menu_eyedropper") || null)
        );
    }
    get keyEl() {
        return this._keyEl || (this._keyEl = window[EyedropperButton.shortcut.id]);
    }
    makeHotkey() {
        this.hotkey = _ucUtils.registerHotkey(EyedropperButton.shortcut, (win, key) => {
            Services.obs.notifyObservers(win, "uc-eyedropper-started");
        });
    }
    makeWidget() {
        if (CustomizableUI.getPlacementOfWidget("eyedropper-button", true)) return;
        CustomizableUI.createWidget({
            id: "eyedropper-button",
            type: "button",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            label: this.labelString,
            tooltiptext: this.tooltipWithShortcut,
            localized: false,
            onCommand: (e) => {
                Services.obs.notifyObservers(e.view, "uc-eyedropper-started");
            },
            onCreated: (aNode) => {
                aNode.style.listStyleImage = `url(chrome://devtools/skin/images/command-eyedropper.svg)`;
            },
        });
    }
    setShortcutLabel() {
        this.mainMenuItem.setAttribute("key", EyedropperButton.shortcut.id);
        this.mainMenuItem.removeAttribute("type");
    }
    afterLazyStartup() {
        Services.obs.notifyObservers(
            PanelMultiView.getViewNode(document, "appmenu-developer-tools-view"),
            "web-developer-tools-view-showing"
        );
        this.makeWidget();
        if (this.mainMenuItem) {
            this.setShortcutLabel();
        } else {
            this.observer = new MutationObserver(() => {
                if (this.devToolsMenu.querySelector("#menu_eyedropper")) {
                    this.setShortcutLabel();
                    this.observer.disconnect();
                    delete this.observer;
                }
            });
            this.observer.observe(this.devToolsMenu, { childList: true });
        }
    }
    observe(sub, top) {
        if (sub === window)
            switch (top) {
                case "uc-eyedropper-started":
                    this.mainMenuItem.click();
                    break;
                case "browser-delayed-startup-finished":
                    Services.obs.removeObserver(this, top);
                    this.afterLazyStartup();
                    break;
            }
    }
}

if (/^chrome:\/\/browser\/content\/browser.(xul||xhtml)$/i.test(location)) new EyedropperButton();
