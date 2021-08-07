// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL.
// ==/UserScript==

(() => {
    function frameScript() {
        const utils = {};
        const { Services: Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
        const { XPCOMUtils: XPCOMUtils } = ChromeUtils.import(
            "resource://gre/modules/XPCOMUtils.jsm"
        );
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
                                        locationURL: content.location.href,
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
        Services.obs.addObserver(attachKeyListener, "document-element-inserted");
        attachKeyListener(content.document, "document-element-inserted");
    }

    function init() {
        try {
            messageManager.loadFrameScript(
                "data:application/javascript," +
                    encodeURIComponent(`(${frameScript.toString()})()`),
                true
            );
        } catch (e) {}
        messageManager.addMessageListener("ctrl-shift-f", (message) => {
            if (message.target === gBrowser.selectedBrowser) {
                try {
                    let csp = E10SUtils.deserializeCSP(message.data.csp);
                    let { text, linkURL, locationURL } = message.data;
                    let principal = gBrowser.selectedBrowser.contentPrincipal;
                    let options = {
                        inBackground: false,
                        triggeringPrincipal: principal,
                        relatedToCurrent: true,
                    };
                    let where = new RegExp(
                        `(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`,
                        "i"
                    ).test(locationURL)
                        ? "current"
                        : "tab";

                    if (/^((chrome|resource|file|moz-extension)\:\/\/|about:).+/.test(text)) {
                        if (/^moz-extension\:\/\/.+/.test(text)) {
                            let host = Services.io.newURI(text)?.host;
                            let policy = WebExtensionPolicy.getByHostname(host);
                            let extPrincipal = policy && policy.extension.principal;
                            if (extPrincipal) {
                                options.triggeringPrincipal = extPrincipal;
                                return openLinkIn(text, where, options);
                            }
                        } else {
                            options.triggeringPrincipal =
                                Services.scriptSecurityManager.getSystemPrincipal();
                            return openLinkIn(text, where, options);
                        }
                    } else if (linkURL) {
                        let fixup, fixable;
                        try {
                            fixup = Services.uriFixup.getFixupURIInfo(
                                text,
                                Services.uriFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP
                            );
                            fixable = true;
                        } catch (e) {
                            fixable = false;
                        }
                        if (fixable && !fixup._keywordProviderName) {
                            linkURL =
                                fixup._fixedURI.scheme === "http"
                                    ? fixup._fixedURI.host
                                    : fixup._fixedURI.spec;
                            if (linkURL) return openLinkIn(linkURL, where, options);
                        }
                    }

                    BrowserSearch._loadSearch(
                        text,
                        where,
                        false,
                        "contextmenu",
                        principal,
                        csp,
                        false
                    );
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
