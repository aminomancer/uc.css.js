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
        let attachKeyListener = (e, t) => {
            if ("document-element-inserted" == t && content && e == content.document)
                try {
                    content.addEventListener("keydown", (e) => {
                        if ("KeyF" === e.code && e.ctrlKey && e.shiftKey && !e.repeat) {
                            try {
                                let t = utils.SelectionUtils.getSelectionDetails(content);
                                if (t.text && !t.docSelectionIsCollapsed) {
                                    let s = e.composedTarget.ownerDocument.nodePrincipal,
                                        i = {
                                            csp: utils.E10SUtils.serializeCSP(
                                                e.composedTarget.ownerDocument.csp
                                            ),
                                            text: t.text,
                                            linkURL: t.linkURL,
                                            principal: s,
                                        };
                                    try {
                                        sendAsyncMessage("ctrl-shift-f", i);
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
                        principal = message.data.principal;
                    if (linkURL) {
                        openLinkIn(linkURL, "tab", {
                            inBackground: false,
                            triggeringPrincipal: principal,
                        });
                    } else {
                        window.BrowserSearch.loadSearchFromContext(text, false, principal, csp);
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
