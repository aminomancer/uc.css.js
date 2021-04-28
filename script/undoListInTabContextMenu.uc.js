// ==UserScript==
// @name           Undo Recently Closed Tabs in Tab Context Menu
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds new menus to the context menu that appears when you right-click a tab (in the tab bar or in the TreeStyleTabs sidebar): one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them. An updated script that does basically the same thing as UndoListInTabmenuToo by Alice0775, but for current versions of Firefox and with TST support. The original broke around version 86 or 87 I think.
// @compatibility  Firefox 87+
// ==/UserScript==

(function () {
    class UndoListInTabmenu {
        constructor() {
            this.generateStrings(); // add localization strings manually, for the sidebar browser.
            this.attachSidebarListener(); // set up context menu for TST, if it's installed. it'll set up even if TST is disabled, since otherwise we'd have to listen for addon disabling/enabling, and it's too much work to set up an addon manager listener. but that doesn't matter, since if TST is disabled, its sidebar will never be opened, and most of the setup is triggered by the sidebar opening.
            this.makePopups(document.getElementById("tabContextMenu")); // set up the built-in tabs bar context menu.
        }

        // generate a string interface, since fluent links seem to return errors inside browsers. or maybe there's something else I need to do to make that work. it almost works, but handling localization directly with javascript works fine too.
        async generateStrings() {
            this.strings = await new Localization(["browser/menubar.ftl"], true);
        }

        // if TST is installed, listen for its sidebar opening
        async attachSidebarListener() {
            let TST = await AddonManager.getAddonByID("treestyletab@piro.sakura.ne.jp");
            if (TST) SidebarUI._switcherTarget.addEventListener("SidebarShown", this);
        }

        //  memoize session store, maybe handle some earlier versions
        get ss() {
            if (!this._ss)
                try {
                    this._ss = Cc["@mozilla.org/browser/sessionstore;1"].getService(
                        Ci.nsISessionStore
                    );
                } catch (e) {
                    this._ss = SessionStore;
                }
            return this._ss;
        }

        /**
         * when a TST sidebar is created, add context menus. when context menu is opened, hide/show the menus and set the access key.
         * @param {object} e (event)
         */
        handleEvent(e) {
            let sidebarContext = sidebar?.document?.getElementById("contentAreaContextMenu");
            switch (e.type) {
                case "SidebarShown":
                    // if there's no content area context menu inside the sidebar document, it means a native sidebar is open. (not an extension sidebar) we don't need to remove the DOM nodes since firefox already deleted the whole document. just delete the references so we don't get confused when rebuilding them later.
                    if (!sidebarContext) {
                        delete this.sidebarContextUndoListPopup;
                        delete this.sidebarUndoWindowPopup;
                        break;
                    }
                    // make the popups and listen for the context menu showing. also set an attribute to avoid duplicating everything if there's a repeat event for whatever reason. the content area context menu actually sticks around if you switch from one extension sidebar to another, but we delete our menu items if the sidebar is switched to anything but TST.
                    if (SidebarUI.currentID === "treestyletab_piro_sakura_ne_jp-sidebar-action") {
                        if (sidebarContext.hasAttribute("undo-list-init")) break;
                        sidebarContext.setAttribute("undo-list-init", true);
                        sidebarContext.addEventListener("popupshowing", this, false);
                        this.makeSidebarPopups(sidebarContext);
                    } else {
                        // destroy everything
                        if (!sidebarContext.hasAttribute("undo-list-init")) break;
                        sidebarContext.removeAttribute("undo-list-init", true);
                        sidebarContext.removeEventListener("popupshowing", this, false);
                        this.destroySidebarPopups();
                    }
                    break;
                case "popupshowing":
                    // the sidebar context menu is showing, so we should hide/show the menus depending on whether they're empty
                    // closed tab list is empty so should be hidden
                    if (this.ss.getClosedTabCount(window) == 0) {
                        this.sidebarTabMenu.setAttribute("hidden", true);
                        this.sidebarTabMenu.style.removeProperty("display");
                    } else {
                        this.sidebarTabMenu.removeAttribute("hidden");
                        this.sidebarTabMenu.style.display = "-moz-box";
                    }
                    // closed window list is empty so should be hidden
                    if (this.ss.getClosedWindowCount() == 0) {
                        this.sidebarWindowMenu.setAttribute("hidden", true);
                        this.sidebarWindowMenu.style.removeProperty("display");
                    } else {
                        this.sidebarWindowMenu.removeAttribute("hidden");
                        this.sidebarWindowMenu.style.display = "-moz-box";
                    }
                    break;
            }
        }

        // return the localized label for "recently closed tabs"
        get closedTabsLabel() {
            return (
                this._closedTabsLabel ||
                (this._closedTabsLabel = this.strings.formatMessagesSync([
                    "menu-history-undo-menu",
                ])[0].attributes[0].value)
            );
        }

        // return the localized label for "recently closed windows"
        get closedWindowsLabel() {
            return (
                this._closedWindowsLabel ||
                (this._closedWindowsLabel = this.strings.formatMessagesSync([
                    "menu-history-undo-window-menu",
                ])[0].attributes[0].value)
            );
        }

        /**
         * create context menu items
         * @param {object} context (the context menu to add menus to)
         */
        makePopups(context) {
            // Recently Closed Tabs
            let tabMenu = document.createXULElement("menu");
            tabMenu.setAttribute("id", "tabContextUndoList");
            tabMenu.setAttribute("data-l10n-id", "menu-history-undo-menu"); // localized "Recently Closed Tabs"
            context.appendChild(tabMenu);

            this.tabContextUndoListPopup = tabMenu.appendChild(
                document.createXULElement("menupopup")
            );
            this.tabContextUndoListPopup.setAttribute(
                "onpopupshowing",
                `undoListInTabmenu.populateSubmenu(this, "Tab");`
            );

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
                `undoListInTabmenu.populateSubmenu(this, "Window");`
            );

            // every time the context menu opens, handle access keys and enabling/disabling of the menus. menus need to be hidden if there aren't any recently closed tabs/windows in sessionstore, or else the menus will be awkwardly empty.
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

                    // closed tab list is empty so should be hidden
                    if (undoListInTabmenu.ss.getClosedTabCount(window) == 0)
                        tabMenu.setAttribute("hidden", true);
                    else tabMenu.removeAttribute("hidden");

                    // closed window list is empty so should be hidden
                    if (undoListInTabmenu.ss.getClosedWindowCount() == 0)
                        windowMenu.setAttribute("hidden", true);
                    else windowMenu.removeAttribute("hidden");
                },
                false
            );
        }

        /**
         * create context menu items (for sidebar)
         * @param {object} context (the context menu to add menus to)
         */
        makeSidebarPopups(context) {
            let doc = context.ownerDocument;
            // Recently Closed Tabs
            this.sidebarTabMenu = doc.createXULElement("menu");
            this.sidebarTabMenu.setAttribute("id", "sidebarTabContextUndoList");
            this.sidebarTabMenu.setAttribute("label", this.closedTabsLabel); // localized "Recently Closed Tabs"
            let tabWords = this.closedTabsLabel.split(" ");
            this.sidebarTabMenu.accessKey = RTL_UI
                ? this.closedTabsLabel.substr(0, 1)
                : tabWords[tabWords.length - 1]?.substr(0, 1) || "T";
            context.appendChild(this.sidebarTabMenu);

            this.sidebarContextUndoListPopup = this.sidebarTabMenu.appendChild(
                doc.createXULElement("menupopup")
            );
            this.sidebarContextUndoListPopup.setAttribute(
                "onpopupshowing",
                `window.top.undoListInTabmenu.populateSidebarSubmenu(this, "Tab")`
            );

            // Recently Closed Windows
            this.sidebarWindowMenu = doc.createXULElement("menu");
            this.sidebarWindowMenu.setAttribute("id", "sidebarHistoryUndoWindowMenu3");
            this.sidebarWindowMenu.setAttribute("label", this.closedWindowsLabel); // localized "Recently Closed Windows"
            let winWords = this.closedWindowsLabel.split(" ");
            this.sidebarWindowMenu.accessKey = RTL_UI
                ? this.closedWindowsLabel.substr(0, 1)
                : winWords[winWords.length - 1]?.substr(0, 1) || "W";
            context.appendChild(this.sidebarWindowMenu);

            this.sidebarUndoWindowPopup = this.sidebarWindowMenu.appendChild(
                doc.createXULElement("menupopup")
            );
            this.sidebarUndoWindowPopup.setAttribute(
                "onpopupshowing",
                `window.top.undoListInTabmenu.populateSidebarSubmenu(this, "Window")`
            );
        }

        // clean up all the sidebar context menu stuff we created
        destroySidebarPopups() {
            this.sidebarTabMenu.remove();
            this.sidebarWindowMenu.remove();
            delete this.sidebarTabMenu;
            delete this.sidebarWindowMenu;
        }

        /**
         * update submenu items
         * @param {object} popup (a menupopup DOM node to populate)
         * @param {string} type (the type of submenu being updated; "Tab" or "Window")
         */
        populateSubmenu(popup, type) {
            while (popup.hasChildNodes()) popup.removeChild(popup.firstChild); // remove existing menuitems
            let fragment;

            // list is empty so should be hidden
            if (this.ss[`getClosed${type}Count`](window) == 0) {
                popup.parentNode.setAttribute("hidden", true);
                return;
            } else popup.parentNode.removeAttribute("hidden"); // enable menu if it's not empty

            // make the list of menuitems
            fragment = RecentlyClosedTabsAndWindowsMenuUtils[`get${type}sFragment`](
                window,
                "menuitem",
                false,
                `menu-history-reopen-all-${type.toLowerCase()}s`
            );

            fragment.lastChild.accessKey = fragment.lastChild.label.substr(0, 1) || "R";
            popup.appendChild(fragment); // populate menu
        }

        /**
         * update sidebar submenu items
         * @param {object} popup (a menupopup DOM node to populate)
         * @param {string} type (the type of submenu being updated; "Tab" or "Window")
         */
        populateSidebarSubmenu(popup, type) {
            while (popup.hasChildNodes()) popup.removeChild(popup.firstChild); // remove existing menuitems
            let fragment;

            // list is empty so should be hidden
            if (this.ss[`getClosed${type}Count`](window) == 0) {
                popup.parentNode.setAttribute("hidden", true);
                return;
            } else popup.parentNode.removeAttribute("hidden"); // enable menu if it's not empty

            // make a temporary list of menuitems
            fragment = RecentlyClosedTabsAndWindowsMenuUtils[`get${type}sFragment`](
                window,
                "menuitem",
                false,
                `menu-history-reopen-all-${type.toLowerCase()}s`
            );

            // a bit of a sketchy hack... instead of inserting the fragment directly, we need to create the elements *inside* the sidebar document or else they're missing a bunch of class methods, like content optimizations. the only way I could find to get them to render properly is to iterate over the fragment, building a new tree as we go. also, since the "oncommand" callbacks need access to global objects like gBrowser which don't exist in the context menu's scope, we need to use addEventListener instead of setting "oncommand" attributes. so when we get to "oncommand" we just parse its value into an anonymous function and attach it in THIS scope.
            Object.values(fragment.children).forEach((item) => {
                let newItem = popup.ownerDocument.createXULElement(item.tagName);
                Object.values(item.attributes).forEach((attribute) => {
                    if (attribute.name === "key") return;
                    if (attribute.name === "oncommand")
                        return newItem.addEventListener(
                            "command",
                            new Function("event", attribute.value)
                        );
                    newItem.setAttribute(attribute.name, attribute.value);
                });
                popup.appendChild(newItem);
            });

            popup.lastChild.accessKey = popup.lastChild.label.substr(0, 1) || "R";
        }
    }

    // instantiate the class on the window so the "oncommand" callbacks can reference it.
    function init() {
        window.undoListInTabmenu = new UndoListInTabmenu();
    }

    // wait until the tab context menu exists
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
