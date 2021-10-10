// ==UserScript==
// @name           Misc. Mods
// @version        1.7.1
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

        // with browser.proton.places-tooltip.enabled, the bookmarks/history/tabs tooltip is improved and normally it gets anchored to the element that popped up the tooltip, i.e. the element you hovered. but for some reason menupopups are an exception. it does this on all relevant elements, including bookmarks in panels, just not on bookmarks menu popups. but I tested it and it works fine on menupopups so I'm removing the exception. there also isn't any anchoring inside sidebars, because the bookmarks/history items in the sidebar aren't actual DOM elements. there's just one node, the tree, and the individual items are drawn inside it. so they're kind of like virtual nodes. we can't anchor to them the normal way since they're not elements, but we can get their screen coordinates and constrain the tooltip popup within those coordinates. so this will implement the proton places tooltip behavior everywhere, rather than it being restricted to panels and the tab bar.
        "Anchor bookmarks menu tooltip to bookmark": true,

        // by default, when you hit ctrl+tab it waits 200ms before opening the panel. if you replace the 200 with another number, it will wait that long in milliseconds instead.
        "Reduce ctrl+tab delay": 200,

        // normally, firefox only animates the stop/reload button when it's in the main customizable navbar. if you enter customize mode and move the button to the tabs toolbar, menu bar, or personal/bookmarks toolbar, the animated transition between the stop icon to the reload icon disappears. the icon just instantly changes. I suspect this is done in order to avoid potential problems with density modes, but it doesn't seem necessary. as long as you provide some CSS it works fine:
        // #stop-reload-button {position: relative;}
        // #stop-reload-button > :is(#reload-button, #stop-button) > .toolbarbutton-animatable-box {display: block;}
        // :is(#reload-button, #stop-button) > .toolbarbutton-icon {padding: var(--toolbarbutton-inner-padding) !important;}
        "Allow stop/reload button to animate in other toolbars": true,

        // the toast popup that opens when you enable/disable tracking protection on a site has a bug where it doesn't fade out when it closes.
        // see here: https://bugzilla.mozilla.org/show_bug.cgi?id=1724622
        "Fix missing tracking protection toast popup fade animation": true,

        // When you open a private window, it shows a little private browsing icon in the top of the navbar, next to the window control buttons.
        // It doesn't have a tooltip for some reason, so if you don't already recognize the private browsing icon, you won't know what it means.
        // This simply gives it a localized tooltip like "You're in a Private Window" in English.
        // The exact string is drawn from Firefox's fluent files, so it depends on your language.
        "Give the private browsing indicator a tooltip": true,
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
            this.reduceCtrlTabDelay(config["Reduce ctrl+tab delay"]);
            if (config["Allow stop/reload button to animate in other toolbars"])
                this.stopReloadAnimations();
            if (config["Fix missing tracking protection toast popup fade animation"])
                this.fixProtectionsToast();
            if (config["Give the private browsing indicator a tooltip"])
                this.addPrivateBrowsingTooltip();
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
            BookmarksEventHandler.fillInBHTooltip = function (aDocument, aEvent) {
                var node;
                var cropped = false;
                var targetURI;
                let tooltip = aEvent.target;
                if (tooltip.triggerNode.localName == "treechildren") {
                    var tree = tooltip.triggerNode.parentNode;
                    var cell = tree.getCellAt(aEvent.clientX, aEvent.clientY);
                    if (cell.row == -1) return false;
                    node = tree.view.nodeForTreeIndex(cell.row);
                    cropped = tree.isCellCropped(cell.row, cell.col);
                    // get coordinates for the cell in a tree.
                    var cellCoords = tree.getCoordsForCellItem(cell.row, cell.col, "cell");
                } else {
                    var tooltipNode = tooltip.triggerNode;
                    if (tooltipNode._placesNode) node = tooltipNode._placesNode;
                    else targetURI = tooltipNode.getAttribute("targetURI");
                }
                if (!node && !targetURI) return false;
                var title = node ? node.title : tooltipNode.label;
                var url;
                if (targetURI || PlacesUtils.nodeIsURI(node)) url = targetURI || node.uri;
                if (!cropped && !url) return false;
                if (gProtonPlacesTooltip) {
                    aEvent.target.setAttribute("position", "after_start");
                    if (tooltipNode) aEvent.target.moveToAnchor(tooltipNode, "after_start");
                    else if (tree && cellCoords)
                        // anchor the tooltip to the tree cell
                        aEvent.target.moveTo(
                            cellCoords.left + tree.screenX,
                            cellCoords.bottom + tree.screenY
                        );
                }
                let tooltipTitle = aEvent.target.querySelector(".places-tooltip-title");
                tooltipTitle.hidden = !title || title == url;
                if (!tooltipTitle.hidden) tooltipTitle.textContent = title;
                let tooltipUrl = aEvent.target.querySelector(".places-tooltip-uri");
                tooltipUrl.hidden = !url;
                if (!tooltipUrl.hidden) tooltipUrl.value = url;
                return true;
            };
        }
        reduceCtrlTabDelay(delay) {
            if (delay === 200) return;
            ctrlTab.open = function () {
                if (this.isOpen) return;
                this.canvasWidth = Math.ceil((screen.availWidth * 0.85) / this.maxTabPreviews);
                this.canvasHeight = Math.round(this.canvasWidth * tabPreviews.aspectRatio);
                this.updatePreviews();
                this._selectedIndex = 1;
                gBrowser.warmupTab(this.selected._tab);
                this._timer = setTimeout(() => {
                    this._timer = null;
                    this._openPanel();
                }, delay);
            };
        }
        stopReloadAnimations() {
            eval(
                `CombinedStopReload.switchToStop = function ` +
                    CombinedStopReload.switchToStop
                        .toSource()
                        .replace(/switchToStop/, "")
                        .replace(/#nav-bar-customization-target/, `.customization-target`)
            );
            eval(
                `CombinedStopReload.switchToReload = function ` +
                    CombinedStopReload.switchToReload
                        .toSource()
                        .replace(/switchToReload/, "")
                        .replace(/#nav-bar-customization-target/, `.customization-target`)
            );
        }
        fixProtectionsToast() {
            eval(
                `gProtectionsHandler.showProtectionsPopup = function ` +
                    gProtectionsHandler.showProtectionsPopup
                        .toSource()
                        .replace(
                            /PanelMultiView\.hidePopup\(this\.\_protectionsPopup\)/,
                            `this._protectionsPopup.hidePopup(true)`
                        )
            );
        }
        async addPrivateBrowsingTooltip() {
            this.privateL10n = await new Localization(["browser/aboutPrivateBrowsing.ftl"], true);
            let l10nId = PrivateBrowsingUtils.isWindowPrivate(window)
                ? "about-private-browsing-info-title"
                : "about-private-browsing-not-private";
            document.querySelector(".private-browsing-indicator").tooltipText =
                await this.privateL10n.formatValue([l10nId]);
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
