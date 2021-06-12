// ==UserScript==
// @name           Screenshot Page Action Button
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Creates a screenshot button in the page actions area (the right side of the urlbar) that works just like the screenshot toolbar button.
// ==/UserScript==

(function () {
    const config = {
        "Disable in private browsing": false, // if set to true, the screenshot action will not appear in private windows. this seems like a logical choice, but that's not how the built-in screenshot button or context menu item work, so this option is false by default.
    };

    // get BrowserPageActions object from the top context for a given action/node (usually the window)
    function browserPageActions(obj) {
        if (obj.BrowserPageActions) {
            return obj.BrowserPageActions;
        }
        return obj.ownerGlobal.BrowserPageActions;
    }

    // handle all the actual behavior in the window context
    BrowserPageActions.screenshot = {
        id: "screenshot", // yields a node ID of #pageAction-urlbar-screenshot
        pref: "extensions.screenshots.disabled",
        css: `#pageAction-urlbar-screenshot{list-style-image:var(--screenshot-icon,url("chrome://browser/skin/screenshot.svg"));}#pageAction-urlbar-screenshot[shooting]{background-color:hsla(0,0%,70%,.1);}`, // use the icon defined in uc-globals.css, there are 2 options there — the camera icon from the devtools or the default screenshot icon that looks like scissors cutting a picture. I prefer the camera so that's the default if you have my theme installed. without the theme, it just uses the default built-in icon. set up the disabled icon appearance.
        get action() {
            return PageActions.actionForID(this.id);
        },
        get node() {
            return BrowserPageActions.urlbarButtonNodeForActionID(this.id);
        },
        async getString() {
            if (this.titleString) return this.titleString;
            this.strings = await new Localization(["browser/screenshots.ftl"], true);
            const formatted = await this.strings.formatMessages(["screenshot-toolbarbutton"]);
            this.titleString = formatted[0].attributes[1].value;
            return this.titleString;
        },
        async addAction() {
            let title = await this.getString();
            const key = window["ext-keyset-id-screenshots_mozilla_org"]?.firstChild;
            const shortcut = !!key ? ` (${ShortcutUtils.prettifyShortcut(key)})` : "";
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
                    onLocationChange(win) {
                        browserPageActions(win).screenshot.onLocationChange(win);
                    },
                })
            );
        },
        // set the icon with CSS so it can be styled more easily by userChrome.css
        setStyle() {
            let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            );
            let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(this.css));
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        },
        /**
         * Screenshot extension observer
         * @param {*} sub (notification subject)
         * @param {string} top (notification topic)
         * @param {string} data (notification data)
         *                 is "true" if we're currently taking a screenshot, "false" if not.
         */
        observe(sub, top, data) {
            if (sub && sub !== window) return;
            this.setButtonState(data === "true"); // disable the button while we're already taking a screenshot, just like the toolbar button.
        },
        /**
         * Set the "shooting" property on the button node.
         * @param {boolean} disabled (true if button should be disabled)
         */
        setButtonState(disabled) {
            if (!this.node) return;
            // while taking a screenshot, block pointer events on the button and set fill opacity to 40%.
            disabled
                ? this.node.setAttribute("shooting", true)
                : this.node.removeAttribute("shooting");
        },
        /**
         * For a given URI, determine if the button should be hidden. The screenshot feature is actually a webextension, and it doesn't work on privileged content, extension documents, or other internal files. Clicking the button under those conditions would just result in an error notification, so we hide the button instead.
         * @param {ChromeDocument} win (the window in which a location change occurred)
         * @returns {boolean} (true if button should be hidden)
         */
        shouldHide(win) {
            let uri = win.gBrowser.currentURI;
            return (
                Services.prefs.getBoolPref("extensions.screenshots.disabled", false) ||
                /^(?:about:(?!reader)|resource:(?!\/\/pdf\.js)|chrome:|data:|moz-extension:)/i.test(
                    uri.spec
                )
            );
        },
        /**
         * Command handler — what to do when the button is clicked.
         * @param {object} _e (the event that invoked us; not needed)
         * @param {object} buttonNode (DOM node of the button that was activated)
         */
        onCommand(_e, buttonNode) {
            if (buttonNode === this.node)
                buttonNode.ownerGlobal.Services.obs.notifyObservers(null, "menuitem-screenshot");
        },
        /**
         * Set up the screenshot extension listener and localization strings when a window is launched.
         * @param {ChromeDocument} win (the window in which the button was placed)
         */
        async onBeforePlacedInWindow(win) {
            if (win !== window || this.isSetup) return;
            win.Services.obs.addObserver(this, "toggle-screenshot-disable");
            const titleString = await this.getString();
            const key = window["ext-keyset-id-screenshots_mozilla_org"]?.firstChild;
            const shortcut = !!key ? ` (${ShortcutUtils.prettifyShortcut(key)})` : "";
            this.action.setTooltip(titleString + shortcut, win);
            this.isSetup = true;
            this.stringIsDone = !!shortcut;
        },
        muObserver: new MutationObserver(async function (mus) {
            const keyset = window["ext-keyset-id-screenshots_mozilla_org"];
            if (BrowserPageActions.screenshot.stringIsDone || !keyset) return;
            const titleString = await BrowserPageActions.screenshot.getString();
            const key = keyset.firstChild;
            const shortcut = !!key ? ` (${ShortcutUtils.prettifyShortcut(key)})` : "";
            if (!BrowserPageActions.screenshot.action) return;
            BrowserPageActions.screenshot.action.setTooltip(titleString + shortcut, window);
            BrowserPageActions.screenshot.stringIsDone = !!shortcut;
            if (shortcut) this.disconnect(), delete BrowserPageActions.screenshot.muObserver;
        }),
        /**
         * Listen to location changes (tab switches, web navigation, etc.) to hide/reveal the button
         * @param {ChromeDocument} win
         */
        onLocationChange(win) {
            if (win !== window) return;
            let shouldHide = this.shouldHide(win);
            if (shouldHide != this.action.getDisabled(win))
                this.action.setDisabled(this.shouldHide(win), win);
        },
    };

    if (PageActions.actionForID("screenshot")) return; // the action itself only needs to be registered once per app launch, not once per window. firefox internally handles replicating it across all windows so we want to stop here if this is the 2nd time the script has executed during a given runtime.
    BrowserPageActions.screenshot.setStyle(); // likewise, stylesheets loaded by the stylesheet XPCOM service are automatically dumped in every window, so it isn't necessary to register the stylesheet any more than once per session.
    BrowserPageActions.screenshot.addAction();
    BrowserPageActions.screenshot.muObserver.observe(document.documentElement, { childList: true });
})();
