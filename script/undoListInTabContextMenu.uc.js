// ==UserScript==
// @name           Undo Recently Closed Tabs in Tab Context Menu
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds new menus to the context menu that appears when you right-click a tab: one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them. An updated script that does basically the same thing as UndoListInTabmenuToo by Alice0775, and is largely derived from it. The original broke around version 86 or 87 I think.
// @compatibility  Firefox 87+
// ==/UserScript==

const UndoListInTabmenu = {
    /**
     * memoize session store, maybe handle some earlier versions
     */
    get ss() {
        if (!this._ss)
            try {
                this._ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(Ci.nsISessionStore);
            } catch (e) {
                this._ss = SessionStore;
            }
        return this._ss;
    },

    /**
     * startup
     */
    init() {
        this.makePopup(document.getElementById("tabContextMenu"));
    },

    /**
     * create context menu items
     * @param {object} context (the context menu to add menus to)
     */
    makePopup(context) {
        // Recently Closed Windows
        let windowMenu = document.createXULElement("menu");
        windowMenu.setAttribute("id", "historyUndoWindowMenu3");
        windowMenu.setAttribute("data-l10n-id", "menu-history-undo-window-menu"); // localized "Recently Closed Windows"
        context.appendChild(windowMenu);

        this.historyUndoWindowPopup3 = windowMenu.appendChild(
            document.createXULElement("menupopup")
        );
        this.historyUndoWindowPopup3.setAttribute(
            "onpopupshowing",
            `UndoListInTabmenu.populateSubmenu(this, "Window");`
        );

        // Recently Closed Tabs
        let tabMenu = document.createXULElement("menu");
        tabMenu.setAttribute("id", "tabContextUndoList");
        tabMenu.setAttribute("data-l10n-id", "menu-history-undo-menu"); // localized "Recently Closed Tabs"
        context.appendChild(tabMenu);

        this.tabContextUndoListPopup = tabMenu.appendChild(document.createXULElement("menupopup"));
        this.tabContextUndoListPopup.setAttribute(
            "onpopupshowing",
            `UndoListInTabmenu.populateSubmenu(this, "Tab");`
        );

        context.addEventListener(
            "popupshowing",
            function (_e) {
                let winWords = windowMenu.label.split(" ");
                windowMenu.accessKey = RTL_UI
                    ? windowMenu.label.substr(0, 1)
                    : winWords[winWords.length - 1]?.substr(0, 1) || "W";

                let tabWords = tabMenu.label.split(" ");
                tabMenu.accessKey = RTL_UI
                    ? tabMenu.label.substr(0, 1)
                    : tabWords[tabWords.length - 1]?.substr(0, 1) || "T";

                // closed tab list is empty so should be disabled
                if (UndoListInTabmenu.ss.getClosedTabCount(window) == 0)
                    tabMenu.setAttribute("disabled", true);
                else tabMenu.removeAttribute("disabled");

                // closed window list is empty so should be disabled
                if (UndoListInTabmenu.ss.getClosedWindowCount() == 0)
                    windowMenu.setAttribute("disabled", true);
                else windowMenu.removeAttribute("disabled");
            },
            false
        );
    },

    /**
     * update submenu items
     * @param {object} popup (a menupopup DOM node to populate)
     * @param {string} type (the type of submenu being updated; "Tab" or "Window")
     */
    populateSubmenu(popup, type) {
        while (popup.hasChildNodes()) popup.removeChild(popup.firstChild); // remove existing menuitems
        let fragment;

        // list is empty so should be disabled
        if (this.ss[`getClosed${type}Count`](window) == 0) {
            popup.parentNode.setAttribute("disabled", true);
            return;
        } else popup.parentNode.removeAttribute("disabled"); // enable menu if it's not empty

        // make the list of menuitems
        fragment = RecentlyClosedTabsAndWindowsMenuUtils[`get${type}sFragment`](
            window,
            "menuitem",
            false,
            `menu-history-reopen-all-${type.toLowerCase()}s`
        );

        fragment.lastChild.accessKey = fragment.lastChild.label.substr(0, 1) || "R";
        popup.appendChild(fragment); // populate menu
        popup.firstChild._inheritedElements[".menu-iconic-accel"].value = "";
    },
};

// wait until the tab context menu exists
if (gBrowserInit.delayedStartupFinished) {
    UndoListInTabmenu.init();
} else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            UndoListInTabmenu.init();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
