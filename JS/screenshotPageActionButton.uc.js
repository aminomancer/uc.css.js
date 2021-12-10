// ==UserScript==
// @name           Screenshot Page Action Button
// @version        1.3.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Creates a screenshot button in the page actions area (the right side of the urlbar) that works just like the screenshot toolbar button.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    const config = {
        "Disable in private browsing": false, // if set to true, the screenshot action will not appear in private windows. this seems like a logical choice, but that's not how the built-in screenshot button or context menu item work, so this option is false by default.
    };
    // get BrowserPageActions object from the top context for a given action/node (usually the window)
    function browserPageActions(obj) {
        if (obj.BrowserPageActions) return obj.BrowserPageActions;
        return obj.ownerGlobal.BrowserPageActions;
    }
    class ScreenshotAction {
        constructor() {
            XPCOMUtils.defineLazyPreferenceGetter(
                this,
                "SCREENSHOT_BROWSER_COMPONENT",
                "screenshots.browser.component.enabled",
                false
            );
            this.id = "screenshot"; // yields a node ID of #pageAction-urlbar-screenshot
            this.pref = "extensions.screenshots.disabled";
            // use the icon defined in uc-globals.css, there are 2 options there — the camera icon from the devtools or the default screenshot icon that looks like scissors cutting a picture. I prefer the camera so that's the default if you have my theme installed. without the theme, it just uses the default built-in icon.
            this.css = `#pageAction-urlbar-screenshot,#pageAction-panel-screenshot{list-style-image:var(--screenshot-icon,url("chrome://browser/skin/screenshot.svg"));}`;
            this.muObserver = new MutationObserver(async function (mus) {
                let { screenshot } = BrowserPageActions;
                if (screenshot.stringIsDone) return;
                const titleString = await screenshot.getString();
                const shortcut = !!key_screenshot
                    ? ` (${ShortcutUtils.prettifyShortcut(key_screenshot)})`
                    : "";
                if (!screenshot.action) return;
                screenshot.action.setTooltip(titleString + shortcut, window);
                screenshot.stringIsDone = !!shortcut;
                if (shortcut) this.disconnect(), delete screenshot.muObserver;
            });
            // the action itself only needs to be registered once per app launch, not once per window. firefox internally handles replicating it across all windows so we want to stop here if this is the 2nd time the script has executed during a given runtime.
            if (PageActions.actionForID("screenshot")) return;
            // likewise, stylesheets loaded by the stylesheet XPCOM service are automatically dumped in every window, so it isn't necessary to register the stylesheet any more than once per session.
            this.setStyle();
            this.addAction();
            this.muObserver.observe(document.documentElement, {
                childList: true,
            });
        }
        get action() {
            return PageActions.actionForID(this.id);
        }
        get node() {
            return BrowserPageActions.urlbarButtonNodeForActionID(this.id);
        }
        async getString() {
            if (this.titleString) return this.titleString;
            this.strings = await new Localization(["browser/screenshots.ftl"], true);
            const formatted = await this.strings.formatMessages(["screenshot-toolbarbutton"]);
            this.titleString = formatted[0].attributes[1].value;
            return this.titleString;
        }
        async addAction() {
            let title = await this.getString();
            const shortcut = !!key_screenshot
                ? ` (${ShortcutUtils.prettifyShortcut(key_screenshot)})`
                : "";
            let tooltip = title + shortcut;
            PageActions.addAction(
                new PageActions.Action({
                    id: "screenshot",
                    title,
                    tooltip,
                    pinnedToUrlbar: true,
                    disablePrivateBrowsing: config[`Disable in private browsing`],
                    onCommand(event, buttonNode) {
                        browserPageActions(buttonNode).screenshot.onCommand(event, buttonNode);
                    },
                    onBeforePlacedInWindow(win) {
                        browserPageActions(win).screenshot.onBeforePlacedInWindow(win);
                    },
                })
            );
        }
        // set the icon with CSS so it can be styled more easily by userChrome.css
        setStyle() {
            let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            );
            let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(this.css));
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        }
        /**
         * Screenshot extension observer
         * @param {*} sub (notification subject)
         * @param {string} top (notification topic)
         * @param {string} data (notification data)
         *                 is "false" if the extension is disabled on the active tab. we use this to hide the page action.
         */
        observe(sub, top, data) {
            if (sub === window) this.action.setDisabled(data === "true", sub);
        }
        /**
         * Command handler — what to do when the button is clicked.
         * @param {object} _e (the event that invoked us; not needed)
         * @param {object} buttonNode (DOM node of the button that was activated)
         */
        onCommand(_e, buttonNode) {
            if (buttonNode === this.node) {
                let { obs } = buttonNode.ownerGlobal.Services;
                if (this.SCREENSHOT_BROWSER_COMPONENT)
                    obs.notifyObservers(buttonNode.ownerGlobal, "menuitem-screenshot");
                else obs.notifyObservers(null, "menuitem-screenshot-extension", "toolbar");
            }
        }
        /**
         * Set up the screenshot extension listener and localization strings when a window is launched.
         * @param {ChromeDocument} win (the window in which the button was placed)
         */
        async onBeforePlacedInWindow(win) {
            if (win !== window || this.isSetup) return;
            win.Services.obs.addObserver(this, "toggle-screenshot-disable");
            const titleString = await this.getString();
            const shortcut = !!key_screenshot
                ? ` (${ShortcutUtils.prettifyShortcut(key_screenshot)})`
                : "";
            this.action.setTooltip(titleString + shortcut, win);
            this.isSetup = true;
            this.stringIsDone = !!shortcut;
        }
    }

    BrowserPageActions.screenshot = new ScreenshotAction();
})();
