// ==UserScript==
// @name           Misc. Mods
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Various tiny mods not worth making separate scripts for. Read the comments inside the script for details.
// ==/UserScript==

(function () {
    let config = {
        // by default the bookmarks toolbar unhides itself when you use the edit bookmark panel and select the bookmarks toolbar as the bookmark's folder. this is super annoying so I'm completely turning it off.
        "Disable bookmarks toolbar auto show": true,

        // on macOS the arrow keyboard shortcuts (cmd+shift+pgup) "wrap" relative to the tab bar, so moving the final tab right will move it to the beginning of the tab bar. for some reason this is turned off on linux and windows. I'm turning it on.
        "Moving tabs with arrow keys can wrap": true,

        // for some reason, when you open the downloads panel it automatically focuses the first element, which is the footer if you don't have any downloads. this is inconsistent with other panels, and a little annoying imo. it's not a big deal but one of firefox's biggest problems compared to other browsers is a general lack of consistency. so I think removing this whole behavior would probably be wise, but for now I'll just stop it from focusing the *footer*, but still allow it to focus the first download item if there are any.
        "Stop downloads panel auto-focusing the footer button": true,

        // when you use the "move tab" hotkeys, e.g. Ctrl + Shift + PageUp, it only moves the active tab, even if you have multiple tabs selected. this is inconsistent with the keyboard shortcuts "move tab to end" or "move tab to start" and of course, inconsistent with the drag & drop behavior. this will change the hotkeys so they move all selected tabs.
        "Move all selected tabs with hotkeys": true,

        // with browser.proton.places-tooltip.enabled, the bookmarks/history/tabs tooltip is improved and normally it gets anchored to the element that popped up the tooltip, i.e. the element you hovered. but for some reason menupopups are an exception. it does this on all relevant elements, including bookmarks in panels, just not on bookmarks menu popups. but I tested it and it works fine on menupopups so I'm removing the exception.
        "Anchor bookmarks menu tooltip to bookmark": true,
    };
    class UCMiscMods {
        constructor() {
            if (config["Disable bookmarks toolbar auto show"])
                gEditItemOverlay._autoshowBookmarksToolbar = function () {};
            if (config["Moving tabs with arrow keys can wrap"]) gBrowser.arrowKeysShouldWrap = true;
            if (config["Stop downloads panel auto-focusing the footer button"])
                this.stopDownloadsPanelFocus();
            if (config["Move all selected tabs with hotkeys"]) this.moveTabKeysMoveSelectedTabs();
            if (config["Anchor bookmarks menu tooltip to bookmark"]) this.anchorBookmarksTooltip();
        }
        stopDownloadsPanelFocus() {
            eval(
                `DownloadsPanel._focusPanel = function ` +
                    DownloadsPanel._focusPanel
                        .toSource()
                        .replace(/DownloadsFooter\.focus\(\)\;/, ``)
            );
        }
        moveTabKeysMoveSelectedTabs() {
            gBrowser.moveTabsBackward = function () {
                let tabs = this.selectedTab.multiselected ? this.selectedTabs : [this.selectedTab];
                let previousTab = this.tabContainer.findNextTab(tabs[0], {
                    direction: -1,
                    filter: (tab) => !tab.hidden,
                });
                for (let tab of tabs) {
                    if (previousTab) this.moveTabTo(tab, previousTab._tPos);
                    else if (this.arrowKeysShouldWrap && tab._tPos < this.browsers.length - 1)
                        this.moveTabTo(tab, this.browsers.length - 1);
                }
            };
            gBrowser.moveTabsForward = function () {
                let tabs = this.selectedTab.multiselected ? this.selectedTabs : [this.selectedTab];
                let nextTab = this.tabContainer.findNextTab(tabs[tabs.length - 1], {
                    direction: 1,
                    filter: (tab) => !tab.hidden,
                });
                for (let i = tabs.length - 1; i >= 0; i--) {
                    let tab = tabs[i];
                    if (nextTab) this.moveTabTo(tab, nextTab._tPos);
                    else if (this.arrowKeysShouldWrap && tab._tPos > 0) this.moveTabTo(tab, 0);
                }
            };
            eval(
                `gBrowser._handleKeyDownEvent = function ` +
                    gBrowser._handleKeyDownEvent
                        .toSource()
                        .replace(/moveTabBackward/, `moveTabsBackward`)
                        .replace(/moveTabForward/, `moveTabsForward`)
            );
        }
        anchorBookmarksTooltip() {
            eval(
                `BookmarksEventHandler.fillInBHTooltip = ` +
                    BookmarksEventHandler.fillInBHTooltip
                        .toSource()
                        .replace(/&&\s*\!tooltipNode\.closest\(\"menupopup\"\)/, ``)
            );
        }
    }

    if (gBrowserInit.delayedStartupFinished) new UCMiscMods();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new UCMiscMods();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
