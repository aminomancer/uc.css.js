// ==UserScript==
// @name           Toggle Menubar Hotkey
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Press alt+M to toggle the menubar.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    const hotkeyId = "key_toggleMenubar";
    let hotkeyRegistered = _ucUtils.registerHotkey(
        {
            id: hotkeyId,
            modifiers: "alt",
            key: "M",
        },
        (win, key) => {
            if (win === window)
                Services.obs.notifyObservers(
                    null,
                    "browser-set-toolbar-visibility",
                    JSON.stringify([
                        CustomizableUI.AREA_MENUBAR,
                        AutoHideMenubar._node.getAttribute("inactive"),
                    ])
                );
        }
    );

    function init() {
        if (!hotkeyRegistered) return;
        document.getElementById("toolbar-menubar").setAttribute("key", hotkeyId);
        window.onViewToolbarsPopupShowing = function (aEvent, aInsertPoint) {
            var popup = aEvent.target;
            if (popup != aEvent.currentTarget) return;
            for (var i = popup.children.length - 1; i >= 0; --i) {
                var deadItem = popup.children[i];
                if (deadItem.hasAttribute("toolbarId")) popup.removeChild(deadItem);
            }
            MozXULElement.insertFTLIfNeeded("browser/toolbarContextMenu.ftl");
            let firstMenuItem = aInsertPoint || popup.firstElementChild;
            let toolbarNodes = gNavToolbox.querySelectorAll("toolbar");
            for (let toolbar of toolbarNodes) {
                if (!toolbar.hasAttribute("toolbarname")) continue;

                if (toolbar.id == "PersonalToolbar") {
                    let menu = BookmarkingUI.buildBookmarksToolbarSubmenu(toolbar);
                    popup.insertBefore(menu, firstMenuItem);
                } else {
                    let menuItem = document.createXULElement("menuitem");
                    menuItem.setAttribute("id", "toggle_" + toolbar.id);
                    menuItem.setAttribute("toolbarId", toolbar.id);
                    menuItem.setAttribute("type", "checkbox");
                    menuItem.setAttribute("label", toolbar.getAttribute("toolbarname"));
                    let hidingAttribute =
                        toolbar.getAttribute("type") == "menubar" ? "autohide" : "collapsed";
                    menuItem.setAttribute(
                        "checked",
                        toolbar.getAttribute(hidingAttribute) != "true"
                    );
                    menuItem.setAttribute("accesskey", toolbar.getAttribute("accesskey"));
                    if (toolbar.hasAttribute("key"))
                        menuItem.setAttribute("key", toolbar.getAttribute("key"));
                    popup.insertBefore(menuItem, firstMenuItem);
                    menuItem.addEventListener("command", onViewToolbarCommand);
                }
            }
            let moveToPanel = popup.querySelector(".customize-context-moveToPanel");
            let removeFromToolbar = popup.querySelector(".customize-context-removeFromToolbar");
            if (!moveToPanel || !removeFromToolbar) return;
            let toolbarItem = popup.triggerNode;
            if (toolbarItem && toolbarItem.localName == "toolbarpaletteitem")
                toolbarItem = toolbarItem.firstElementChild;
            else if (toolbarItem && toolbarItem.localName != "toolbar")
                while (toolbarItem && toolbarItem.parentElement) {
                    let parent = toolbarItem.parentElement;
                    if (
                        (parent.classList && parent.classList.contains("customization-target")) ||
                        parent.getAttribute("overflowfortoolbar") ||
                        parent.localName == "toolbarpaletteitem" ||
                        parent.localName == "toolbar"
                    )
                        break;
                    toolbarItem = parent;
                }
            else toolbarItem = null;
            let showTabStripItems = toolbarItem && toolbarItem.id == "tabbrowser-tabs";
            for (let node of popup.querySelectorAll('menuitem[contexttype="toolbaritem"]'))
                node.hidden = showTabStripItems;
            for (let node of popup.querySelectorAll('menuitem[contexttype="tabbar"]'))
                node.hidden = !showTabStripItems;
            document
                .getElementById("toolbar-context-menu")
                .querySelectorAll("[data-lazy-l10n-id]")
                .forEach((el) => {
                    el.setAttribute("data-l10n-id", el.getAttribute("data-lazy-l10n-id"));
                    el.removeAttribute("data-lazy-l10n-id");
                });
            let menuSeparator = document.getElementById("toolbarItemsMenuSeparator");
            menuSeparator.hidden = false;
            document.getElementById("toolbarNavigatorItemsMenuSeparator").hidden =
                !showTabStripItems;
            if (
                !CustomizationHandler.isCustomizing() &&
                CustomizableUI.isSpecialWidget(toolbarItem?.id || "")
            ) {
                moveToPanel.hidden = true;
                removeFromToolbar.hidden = true;
                menuSeparator.hidden = !showTabStripItems;
            }
            if (showTabStripItems) {
                let multipleTabsSelected = !!gBrowser.multiSelectedTabsCount;
                document.getElementById("toolbar-context-bookmarkSelectedTabs").hidden =
                    !multipleTabsSelected;
                document.getElementById("toolbar-context-bookmarkSelectedTab").hidden =
                    multipleTabsSelected;
                document.getElementById("toolbar-context-reloadSelectedTabs").hidden =
                    !multipleTabsSelected;
                document.getElementById("toolbar-context-reloadSelectedTab").hidden =
                    multipleTabsSelected;
                document.getElementById("toolbar-context-selectAllTabs").disabled =
                    gBrowser.allTabsSelected();
                document.getElementById("toolbar-context-undoCloseTab").disabled =
                    SessionStore.getClosedTabCount(window) == 0;
                return;
            }
            let movable =
                toolbarItem && toolbarItem.id && CustomizableUI.isWidgetRemovable(toolbarItem);
            if (movable) {
                if (CustomizableUI.isSpecialWidget(toolbarItem.id))
                    moveToPanel.setAttribute("disabled", true);
                else moveToPanel.removeAttribute("disabled");
                removeFromToolbar.removeAttribute("disabled");
            } else {
                moveToPanel.setAttribute("disabled", true);
                removeFromToolbar.setAttribute("disabled", true);
            }
        };
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
