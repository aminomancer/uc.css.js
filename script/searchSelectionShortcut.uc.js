// ==UserScript==
// @name           searchSelectionShortcut.uc.js
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL.
// @author         aminomancer
// ==/UserScript==

(() => {
    function frameScript() {
        const { Services: Services } = ChromeUtils.import("resource://gre/modules/Services.jsm"),
            { XPCOMUtils: XPCOMUtils } = ChromeUtils.import(
                "resource://gre/modules/XPCOMUtils.jsm"
            ),
            utils = {};
        XPCOMUtils.defineLazyModuleGetters(utils, {
            E10SUtils: "resource://gre/modules/E10SUtils.jsm",
            SelectionUtils: "resource://gre/modules/SelectionUtils.jsm",
        });
        let attachKeyListener = (d, n) => {
            if ("document-element-inserted" == n && content && d == content.document)
                try {
                    content.addEventListener("keydown", (e) => {
                        if ("KeyF" === e.code && e.ctrlKey && e.shiftKey && !e.repeat) {
                            try {
                                let s = utils.SelectionUtils.getSelectionDetails(content);
                                if (s.text && !s.docSelectionIsCollapsed) {
                                    let msg = {
                                        csp: utils.E10SUtils.serializeCSP(
                                            e.composedTarget.ownerDocument.csp
                                        ),
                                        text: s.text,
                                        linkURL: s.linkURL,
                                        location: content.location.href,
                                    };
                                    try {
                                        sendAsyncMessage("ctrl-shift-f", msg);
                                    } catch (e) {}
                                }
                            } catch (e) {}
                            e.stopPropagation(), e.stopImmediatePropagation(), e.preventDefault();
                        }
                    });
                } catch (e) {}
        };
        Services.obs.addObserver(attachKeyListener, "document-element-inserted"),
            attachKeyListener(content.document, "document-element-inserted");
    }

    function init() {
        try {
            window.messageManager.loadFrameScript(
                "data:application/javascript," +
                    encodeURIComponent(`(${frameScript.toString()})()`),
                true
            );
        } catch (e) {}
        window.messageManager.addMessageListener("ctrl-shift-f", (message) => {
            if (message.target === gBrowser.selectedBrowser) {
                try {
                    let csp = E10SUtils.deserializeCSP(message.data.csp),
                        text = message.data.text,
                        linkURL = message.data.linkURL,
                        principal = Services.scriptSecurityManager.getSystemPrincipal(),
                        location = message.data.location,
                        where =
                            location === AboutNewTab.newTabURL || location === HomePage.get(window)
                                ? "current"
                                : "tab";
                    if (linkURL) {
                        openLinkIn(linkURL, where, {
                            inBackground: false,
                            triggeringPrincipal: principal,
                        });
                    } else {
                        window.BrowserSearch._loadSearch(
                            text,
                            where,
                            false,
                            "contextmenu",
                            principal,
                            csp,
                            false
                        );
                    }
                } catch (e) {}
            }
        });
    }

    if (gBrowserInit.delayedStartupFinished) {
        setTimeout(init, 1000);
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                setTimeout(init, 1000);
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
