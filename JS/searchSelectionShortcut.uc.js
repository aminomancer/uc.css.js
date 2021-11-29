// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.3.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL. Since v1.3 this script supports Fission by using JSActors instead of Message Managers. Normally JSActors require multiple files — a parent script and a child script, to communicate between the content frame and the parent process. And to instantiate them would require a third file, the autoconfig script. An autoconfig script requiring multiple additional files doesn't make for a very user-friendly experience. So this script automatically generates its own subscript files in your chrome folder and cleans them up when you quit Firefox. I had a lot of fun figuring this out. If you're trying to learn how to make these kinds of mods, this is a good subject to research since JSActors are really powerful. It's also cool to see how a standalone autoconfig script can be made to create its own little network of temp files to work in a more vanilla-style manner.
// @include        main
// @onlyonce
// ==/UserScript==

class SearchSelectionShortcut {
    constructor() {
        this.setup();
    }
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async setup() {
        // the component registrar — this is the interface that lets us make custom URIs with chrome:// protocols.
        const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
        // a temp directory we're making in the chrome folder.
        // I tried making this folder in the *actual* Temp directory, but I guess it has a permissions issue or something.
        // when we try that, the hotkey works on system pages, but not on regular webpages. very strange, never figured out why.
        // so just make it a dotfile so it won't get in the way. that should hide the folder on linux unless showing hidden files is enabled.
        // not sure about macOS. somebody let me know if it's hidden or not.
        let tempDir = FileUtils.getFile("UChrm", [".SearchSelectionShortcut"]);
        let { path } = tempDir;
        await IOUtils.makeDirectory(path, { ignoreExisting: true });
        // hide the temp dir on windows so it doesn't get in the way of user activities or prevent its eventual deletion.
        OS.File.setPermissions(path, { winAttributes: { hidden: true } });
        this.tempPath = path;

        // create a manifest file that registers a URI for chrome://uc-searchselectionshortcut/content/
        this.manifestFile = await this.createTempFile(`content uc-searchselectionshortcut ./`, {
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
        let manifest = FileUtils.getFile("UChrm", [".SearchSelectionShortcut", "ucsss.manifest"]);
        // some problem with IOUtils writing methods makes autoRegister unable to read them until they've been read by OS.File.
        // I'm guessing it has something to do with their asynchrony. but it makes no sense because they are supposed to resolve a promise
        // when they're finished writing. apparently they resolve before they're truly finished, or something.
        // waiting for OS.File.stat works, but OS.File will be removed eventually.
        // at that point this can be substituted for just waiting for like 50ms.
        await OS.File.stat(manifest.path);
        // registering the manifest gives the temp folder a chrome:// URI that we can reference below
        if (manifest.exists()) registrar.autoRegister(manifest);
        else return;
        this.registrar = registrar;
        this.manifest = manifest;

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
        if (!path) path = FileUtils.getFile("UChrm", [".SearchSelectionShortcut", name]).path;
        await IOUtils.writeUTF8(path, contents);
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
        await IOUtils.remove(this.tempPath, {
            ignoreAbsent: true,
            recursive: true,
        });
    }
}

new SearchSelectionShortcut();
