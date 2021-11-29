// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.3.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL. Since v1.3 this script supports Fission by using JSActors instead of Message Managers. Normally JSActors require multiple files — a parent script and a child script, to communicate between the content frame and the parent process. And to instantiate them would require a third file, the autoconfig script. An autoconfig script requiring multiple additional files doesn't make for a very user-friendly experience. So this script automatically generates its own subscript files in your chrome folder and cleans them up when you quit Firefox. I had a lot of fun figuring this out. If you're trying to learn how to make these kinds of mods, this is a good subject to research since JSActors are really powerful. It's also cool to see how a standalone autoconfig script can be made to create its own little network of temp files to work in a more vanilla-style manner.
// ==/UserScript==

class SearchSelectionShortcut {
    constructor() {
        this.setup();
    }
    async setup() {
        const Cm = Components.manager;
        // the component registrar — this is the interface that lets us make custom URIs with chrome:// protocols.
        const registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
        // the {profile}/chrome/ folder! where all your mods are located.
        let UChrm = Services.dirsvc.get("UChrm", Ci.nsIFile);
        // a temp directory we're making in the chrome folder.
        // I tried making this folder in the *actual* Temp directory, but I guess it has a permissions issue or something.
        // when we try that, the hotkey works on system pages, but not on regular webpages. very strange, never figured out why.
        // so just make it a dotfile so it won't get in the way. that should hide the folder on linux unless showing hidden files is enabled.
        // not sure about macOS. somebody let me know if it's hidden or not.
        let path = await OS.Path.join(UChrm.path, ".SearchSelectionShortcut");
        await OS.File.makeDir(path, { ignoreExisting: true });
        this.tempPath = path;
        UChrm.append(".SearchSelectionShortcut");
        // hide the temp dir on windows so it doesn't get in the way of user activities or prevent its eventual deletion.
        OS.File.setPermissions(UChrm.path, { winAttributes: { hidden: true } });

        // create a manifest file that registers a URI for chrome://uc-searchselectionshortcut/content/
        this.manifest = await this.createTempFile(`content uc-searchselectionshortcut ./`, {
            name: "ucsss.manifest",
        });
        // JSActors require parent files and child files. see: https://firefox-source-docs.mozilla.org/dom/ipc/jsactors.html
        // this parent file listens for messages from the child file. when it gets a message, it triggers a search or link navigation.
        // the message includes info about the sender, the page's location and CSP, and the selected text or link.
        // if the selected text constitutes a valid link, it will navigate directly to that page.
        // otherwise, it will launch a new browser search using the selected text as a query string.
        // it will normally open the search/link in a new tab. but if you're currently on your new tab page,
        // it assumes you don't want to keep an empty tab around, so it'll open the search/link in the current tab.
        this.parentFile = await this.createTempFile(
            `"use strict";var EXPORTED_SYMBOLS=["SearchSelectionShortcutParent"];class SearchSelectionShortcutParent extends JSWindowActorParent{receiveMessage(message){let browser=this.manager.rootFrameLoader.ownerElement;let win=browser.ownerGlobal;let{windowContext,browsingContext}=message.target;if(browsingContext.topChromeWindow===win.BrowserWindowTracker.getTopWindow()){try{let csp=win.E10SUtils.deserializeCSP(message.data.csp);let{text,linkURL,locationURL}=message.data;let principal=windowContext.documentPrincipal;let options={inBackground:false,triggeringPrincipal:principal,relatedToCurrent:true};let where=new RegExp("("+win.BROWSER_NEW_TAB_URL+"|"+win.HomePage.get(win)+")","i").test(locationURL)?"current":"tab";if(/^((chrome|resource|file|moz-extension)\\:\\/\\/|about:).+/.test(text)){if(/^moz-extension\\:\\/\\/.+/.test(text)){let host=win.Services.io.newURI(text)?.host;let policy=win.WebExtensionPolicy.getByHostname(host);let extPrincipal=policy&&policy.extension.principal;if(extPrincipal){options.triggeringPrincipal=extPrincipal;return win.openLinkIn(text,where,options)}}else{options.triggeringPrincipal=win.Services.scriptSecurityManager.getSystemPrincipal();return win.openLinkIn(text,where,options)}}else if(linkURL){let fixup,fixable;try{fixup=win.Services.uriFixup.getFixupURIInfo(text,win.Services.uriFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP);fixable=true}catch(e){fixable=false}if(fixable&&!fixup._keywordProviderName){linkURL=fixup._fixedURI.scheme==="http"?fixup._fixedURI.host:fixup._fixedURI.spec;if(linkURL)return win.openLinkIn(linkURL,where,options)}}win.BrowserSearch._loadSearch(text,where,false,"contextmenu",principal,csp,false)}catch(e){}}}}`,
            { name: "SearchSelectionShortcutParent.jsm" }
        );
        // the child actor is where the hotkey itself is set up. it listens for the Ctrl+Shift+F hotkey,
        // and if text is selected within the actor's frame at the time the hotkey is pressed,
        // it will send a message containing the aforementioned properties back up to the parent actor.
        this.childFile = await this.createTempFile(
            `"use strict";var EXPORTED_SYMBOLS=["SearchSelectionShortcutChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{E10SUtils:"resource://gre/modules/E10SUtils.jsm",SelectionUtils:"resource://gre/modules/SelectionUtils.jsm"});class SearchSelectionShortcutChild extends JSWindowActorChild{handleEvent(e){if("KeyF"===e.code&&e.ctrlKey&&e.shiftKey&&!e.repeat){try{let selection=SelectionUtils.getSelectionDetails(this.contentWindow);if(selection.text&&!selection.docSelectionIsCollapsed){let msg={csp:E10SUtils.serializeCSP(e.originalTarget.ownerDocument.csp),text:selection.text,linkURL:selection.linkURL,locationURL:this.contentWindow.location.href};try{this.sendAsyncMessage("ctrl-shift-f",msg)}catch(e){}}}catch(e){}e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}}}`,
            { name: "SearchSelectionShortcutChild.jsm" }
        );

        // find the manifest in the temp directory and register it with the component registrar.
        UChrm.append("ucsss.manifest");
        if (UChrm.exists()) registrar.autoRegister(UChrm);
        else return;

        // register the JSActor, passing the temporary files' chrome:// URLs.
        // includeChrome, allFrames, and messageManagerGroups are specified to ensure this works in every frame.
        // this means it'll work on ANY page in ANY browser. it will even work in addon pages loaded in webextension popup panels.
        // for example if you open the uBlock Origin popup from its toolbar button and select some text, the hotkey will search for it in a new tab.
        ChromeUtils.registerWindowActor("SearchSelectionShortcut", {
            parent: {
                moduleURI: this.parentFile.url,
            },
            child: {
                moduleURI: this.childFile.url,
                events: { keydown: {} },
            },
            includeChrome: true,
            allFrames: true,
            messageManagerGroups: ["browsers", "webext-browsers"],
        });
        // listen for application quit so we can clean up the temp files.
        Services.obs.addObserver(this, "quit-application");
    }
    /**
     * create a file in the temp folder
     * @param {string} contents (the actual file contents in UTF-8)
     * @param {object} options (an optional object containing properties path or name. path creates a file at a specific absolute path. name creates a file of that name in the chrome/.SearchSelectionShortcut folder. if omitted, it will create chrome/.SearchSelectionShortcut/uc-temp)
     * @returns {object} { name, url } (an object containing the filename and a chrome:// URL leading to the file)
     */
    async createTempFile(contents, options = {}) {
        let { path = null, name = "uc-temp" } = options;
        if (!path) {
            const basePath = OS.Path.join(
                Services.dirsvc.get("UChrm", Ci.nsIFile).path,
                ".SearchSelectionShortcut",
                name
            );
            const file = await OS.File.open(
                basePath,
                { write: true, read: true },
                { humanReadable: true }
            );
            const stat = await file.stat();
            path = stat.path;
            await file.close();
        }
        let encoder = new TextEncoder();
        let array = encoder.encode(contents);
        await OS.File.writeAtomic(path, array, {
            encoding: "utf-8",
            tmpPath: path + ".tmp",
        });
        let url = "chrome://uc-searchselectionshortcut/content/" + name;
        return { name, url };
    }
    // application quit listener
    observe(subject, topic, data) {
        switch (topic) {
            case "quit-application":
                Services.obs.removeObserver(this, "quit-application");
                this.cleanup();
                break;
            default:
        }
    }
    // remove the temp directory when firefox's main process ends
    async cleanup() {
        await OS.File.removeDir(this.tempPath, { ignoreAbsent: true });
    }
}

new SearchSelectionShortcut();
