// ==UserScript==
// @name           Urlbar Mods
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the urlbar. Currently this only restores the context menu that used to appear when right-clicking a search engine one-off button in the urlbar results panel. The context menu was disabled recently. It's actually disabled by default, so this script will do nothing unless you change the "false" on line 12 to "true" before running the script. I'll continue to add to this script as I think of more urlbar mods that are too small to deserve their own dedicated script.
// ==/UserScript==


(function () {
    class UrlbarMods {
        static config = {
            "restore one-offs context menu": false, // recently the context menu for the search engine one-off buttons in the urlbar results panel has been disabled. but the context menu for the one-off buttons in the searchbar is still enabled. I'm not sure why they did this, and it's a really minor thing, but it's not like right-clicking the buttons does anything else, (at least on windows) so you may want to restore the context menu.
        };
        constructor() {
            if (UrlbarMods.config["restore one-offs context menu"])
                this.restoreOneOffsContextMenu();
        }
        get urlbarOneOffs() {
            return this._urlbarOneOffs || (this._urlbarOneOffs = gURLBar.view.oneOffSearchButtons);
        }
        restoreOneOffsContextMenu() {
            const urlbarOneOffsProto = Object.getPrototypeOf(this.urlbarOneOffs);
            const oneOffsBase = Object.getPrototypeOf(urlbarOneOffsProto);
            this.urlbarOneOffs._on_contextmenu = oneOffsBase._on_contextmenu;
        }
    }

    if (gBrowserInit.delayedStartupFinished) new UrlbarMods();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new UrlbarMods();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
