// ==UserScript==
// @name           Component Hacker
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    A script that can override any built-in custom element with a pretty hamfisted method. If you're going to try to use this I strongly recommend reading resources/script-override/customElements.js all the way through. This is 100% experimental, but it does work. I don't recommend overriding something as fundamental as a custom element like <button> or <checkbox> because it means you'll have to update your modified version frequently to keep up with Firefox updates. However, at least the option is here, if you want it for whatever reason.
// @backgroundmodule
// ==/UserScript==

var EXPORTED_SYMBOLS = [];

const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

Services.obs.addObserver(
    {
        observe(doc) {
            if (
                doc.nodePrincipal.isSystemPrincipal &&
                (doc.contentType == "application/xhtml+xml" || doc.contentType == "text/html") &&
                doc.URL != "about:blank"
            ) {
                const loadExtraCustomElements = !(
                    doc.documentURI == "chrome://extensions/content/dummy.xhtml" ||
                    doc.documentURI == "chrome://geckoview/content/geckoview.xhtml"
                );
                if (loadExtraCustomElements) {
                    Services.scriptloader.loadSubScript(
                        "chrome://userchrome/content/script-override/customElements.js",
                        doc.ownerGlobal
                    );
                }
            }
        },
    },
    "initial-document-element-inserted"
);
