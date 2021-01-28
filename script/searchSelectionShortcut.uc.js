// ==UserScript==
// @name          searchSelectionShortcut.uc.js
// @namespace     https://github.com/aminomancer/uc.css.js
// @description   Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL. Seems simple but this was actually quite a challenge for me.
// @version       1.0
// ==/UserScript==
(() => {
    // script that gets loaded into every tab, similar to the context menu
    const frameScript = `const{Services:Services}=ChromeUtils.import("resource://gre/modules/Services.jsm"),{XPCOMUtils:XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{E10SUtils:"resource://gre/modules/E10SUtils.jsm"});let attachKeyListener=(e,t)=>{if("document-element-inserted"==t&&content&&e==content.document)try{content.addEventListener("keydown",e=>{if("KeyF"===e.code&&e.ctrlKey&&e.shiftKey&&!e.repeat){try{let t=BrowserUtils.getSelectionDetails(content);if(t.text&&!t.docSelectionIsCollapsed){let s=e.composedTarget.ownerDocument.nodePrincipal,i={csp:E10SUtils.serializeCSP(e.composedTarget.ownerDocument.csp),text:t.text,linkURL:t.linkURL,principal:s};try{this.sendAsyncMessage("ctrl-shift-f",i)}catch(e){}}}catch(e){}e.stopPropagation(),e.stopImmediatePropagation(),e.preventDefault()}})}catch(e){}};Services.obs.addObserver(attachKeyListener,"document-element-inserted"),attachKeyListener(content.document,"document-element-inserted");`;

    function init() {
        try {
            // inject the script
            window.messageManager.loadFrameScript(`data:,${frameScript}`, true);
        } catch (e) {}
        // listen for messages from the frame script
        window.messageManager.addMessageListener("ctrl-shift-f", (message) => {
            // ensure the message is being sent from the browser we're currently on
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

    // wait for everything to initialize before trying to access message managers
    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
