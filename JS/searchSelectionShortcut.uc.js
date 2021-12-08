// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.5.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (Ctrl+Shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL. Optionally, you can also configure the script to use your other (non-default) search engines as well. The preference "userChrome.searchSelectionShortcut.match-engine-to-current-tab" will add a second hotkey (Ctrl+Alt+F) that will look for an installed engine that matches the current webpage. So if your default search engine is Google but you use the hotkey on Wikipedia, and you have a search engine for Wikipedia installed, it will search Wikipedia for the selected text instead. This preference is disabled by default. You can change the hotkey itself (though not the modifiers) by setting "userChrome.searchSelectionShortcut.keycode" to a valid KeyboardEvent code. The default value "KeyF" corresponds to the F key. The correct notation is different for numbers and special characters, so visit https://keycode.info and press the desired key to find its event.code. Since v1.3 this script supports Fission by using JSActors instead of Message Managers. Normally JSActors require multiple files — a parent script and a child script, to communicate between the content frame and the parent process. And to instantiate them would require a third file, the autoconfig script. An autoconfig script requiring multiple additional files doesn't make for a very user-friendly experience. So this script automatically generates its own subscript files in your chrome folder and cleans them up when you quit Firefox. I had a lot of fun figuring this out. If you're trying to learn how to make these kinds of mods, this is a good subject to research since JSActors are really powerful. It's also cool to see how a standalone autoconfig script can be made to create its own little network of temp files to work in a more vanilla-style manner.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @onlyonce
// ==/UserScript==

class SearchSelectionShortcut {
    // these are all the prefs the script uses for configuration, with their default values.
    // this particular property is only used for setting the prefs on first install.
    // the window actor has its own way of retrieving these prefs.
    static prefs = [
        { name: "userChrome.searchSelectionShortcut.keycode", def: "KeyF" },
        { name: "userChrome.searchSelectionShortcut.match-engine-to-current-tab", def: false },
    ];
    constructor() {
        this.makePrefs();
        this.setup();
    }
    makePrefs() {
        let firstRun = false;
        let oldPref = "userChrome.searchSelectionShortcut.action-override-hotkey";
        if (Services.prefs.prefHasUserValue(oldPref)) {
            Services.prefs.clearUserPref(oldPref);
            firstRun = true;
        }
        for (let pref of SearchSelectionShortcut.prefs) {
            let type;
            let { name, def } = pref;
            // determine the pref type (boolean, number, string).
            // there are a couple more but we won't ever use them.
            switch (typeof def) {
                case "boolean":
                    type = "Bool";
                    break;
                case "number":
                    type = "Int";
                    break;
                case "string":
                    type = "String";
                    break;
                default:
                    return;
            }
            // if the pref hasn't already been set, set it now.
            if (!Services.prefs.prefHasUserValue(name)) {
                Services.prefs[`set${type}Pref`](name, def);
                firstRun = true;
            }
        }
        // if it's the first time installing v1.5,
        // make a splash menu to reveal the new prefs
        // and offer an affordance to change them.
        if (firstRun) {
            if (gBrowserInit?.delayedStartupFinished) this.handleSplash();
            else Services.obs.addObserver(this, "browser-delayed-startup-finished");
        }
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
            `"use strict";const EXPORTED_SYMBOLS=["SearchSelectionShortcutParent"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{BrowserWindowTracker:"resource:///modules/BrowserWindowTracker.jsm",E10SUtils:"resource://gre/modules/E10SUtils.jsm"});class SearchSelectionShortcutParent extends JSWindowActorParent{async getMatchingEngine(match,url,host){if(!match)return null;const visibleEngines=await Services.search.getVisibleEngines();let engines=visibleEngines.filter((engine=>engine.getResultDomain()==host));if(engines.length>1){const regex=/^(http|https|ftp):\\/\\//i;engines=engines.sort(((a,b)=>{const strippedURL=url.replace(regex,""),strippedURI=Services.io.newURI(url),templateA=this.getEngineTemplate(a,regex),templateB=this.getEngineTemplate(b,regex),commonA=this.commonLength(strippedURL,templateA,strippedURI),commonB=this.commonLength(strippedURL,templateB,strippedURI);return commonB-commonA}))}return engines[0]}commonLength(x,y,xu){if(!(x&&y))return 0;let len=x.length,i=0,k=0,sq="",xp=xu?.query,yp=Services.io.newURI("https://"+y)?.query;while(i<len&&x.charAt(i)===y.charAt(i))i++;while(k<len&&x.charAt(len-k)===y.charAt(y.length-k))k++;if(xp&&yp){let xa=xp.split("&"),ya=yp.split("&"),qp;ya=ya.filter((p=>{if(p.endsWith("{searchTerms}")){qp=p.replace(/{searchTerms}/,"");return}return true}));xa=xa.filter((p=>!(qp&&p.startsWith(qp))));sq=xa.filter((p=>ya.includes(p))).join("&")}return x.substring(0,i).length+x.substring(len-k,len).length+sq.length}getEngineTemplate(e,regex){const engineURL=e._getURLOfType("text/html"),template=engineURL.params.length>0?e._searchForm:engineURL.template;return template.replace(regex,"")}async receiveMessage(msg){const browser=this.manager.rootFrameLoader.ownerElement,win=browser.ownerGlobal,{data,target}=msg,{windowContext,browsingContext}=target;if(browsingContext.topChromeWindow===BrowserWindowTracker.getTopWindow()){let{text,linkURL,locationURL,locationHost,match}=data;const csp=E10SUtils.deserializeCSP(data.csp),principal=windowContext.documentPrincipal;let options={inBackground:false,triggeringPrincipal:principal,relatedToCurrent:true};const where=locationURL.startsWith(win.BROWSER_NEW_TAB_URL)?"current":"tab",schemes=/^((chrome|resource|file|moz-extension)\\:\\/\\/|about:|mailto:.*@.*).+/i;if(schemes.test(text)){if(/^moz-extension\\:\\/\\/.+/.test(text)){const host=Services.io.newURI(text)?.host,policy=win.WebExtensionPolicy.getByHostname(host),extPrincipal=policy&&policy.extension.principal;if(extPrincipal){options.triggeringPrincipal=extPrincipal;return win.openLinkIn(text,where,options)}}else{options.triggeringPrincipal=Services.scriptSecurityManager.getSystemPrincipal();return win.openLinkIn(text,where,options)}}else if(linkURL){let fixup,fixable;try{fixup=Services.uriFixup.getFixupURIInfo(text,Services.uriFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP);fixable=true}catch(e){fixable=false}if(fixable&&!fixup._keywordProviderName){let{_fixedURI}=fixup;linkURL=_fixedURI.scheme==="http"?_fixedURI.host:_fixedURI.spec;if(linkURL)return win.openLinkIn(linkURL,where,options)}}let engine=await this.getMatchingEngine(match,locationURL,locationHost);win.BrowserSearch._loadSearch(text,where,false,"contextmenu",principal,csp,false,engine)}}}`,
            { name: "SearchSelectionShortcutParent.jsm" }
        );
        // the child actor is where the hotkey itself is set up. it listens for the Ctrl+Shift+F hotkey,
        // and if text is selected within the actor's frame at the time the hotkey is pressed,
        // it will send a message containing the aforementioned properties back up to the parent actor.
        this.childFile = await this.createTempFile(
            `"use strict";const EXPORTED_SYMBOLS=["SearchSelectionShortcutChild"];const{Services}=ChromeUtils.import("resource://gre/modules/Services.jsm");const{XPCOMUtils}=ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");XPCOMUtils.defineLazyModuleGetters(this,{SelectionUtils:"resource://gre/modules/SelectionUtils.jsm",E10SUtils:"resource://gre/modules/E10SUtils.jsm"});class SearchSelectionShortcutChild extends JSWindowActorChild{getKeyState(e){if(e.code!==KEYCODE||e.repeat)return false;let alt=e.getModifierState("Alt");let shift=e.getModifierState("Shift");if(e.getModifierState("Accel")){if(MATCH_ENGINE_TO_TAB&&!shift&&alt)return"match";if(shift&&!alt)return"default"}return false}handleEvent(e){let match=false;switch(this.getKeyState(e)){case"default":break;case"match":match=true;break;default:return}let selection=SelectionUtils.getSelectionDetails(this.contentWindow);if(selection&&selection.text&&!selection.docSelectionIsCollapsed){let msg={csp:E10SUtils.serializeCSP(e.originalTarget.ownerDocument.csp),text:selection.text,linkURL:selection.linkURL,locationURL:this.contentWindow.location.href,locationHost:this.contentWindow.location.hostname,match};this.sendAsyncMessage("ctrl-shift-f",msg);e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}}}XPCOMUtils.defineLazyPreferenceGetter(this,"KEYCODE","userChrome.searchSelectionShortcut.keycode","KeyF");XPCOMUtils.defineLazyPreferenceGetter(this,"MATCH_ENGINE_TO_TAB","userChrome.searchSelectionShortcut.match-engine-to-current-tab",false);`,
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
                events: { keydown: { mozSystemGroup: true } },
            },
            includeChrome: true,
            allFrames: true,
            messageManagerGroups: ["browsers", "webext-browsers", "sidebars"],
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
    // application quit listener. clean up the temp files.
    observe(subject, topic, data) {
        switch (topic) {
            case "quit-application":
                Services.obs.removeObserver(this, "quit-application");
                this.cleanup();
                break;
            case "browser-delayed-startup-finished":
                if (subject === window) {
                    Services.obs.removeObserver(this, "browser-delayed-startup-finished");
                    this.handleSplash();
                }
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
    handleSplash() {
        let template = document.getElementById("appMenuNotificationTemplate");
        let target = template?.content || document;
        let panel = target.querySelector("#appMenu-notification-popup");
        panel.appendChild(
            MozXULElement.parseXULToFragment(`<popupnotification id="appMenu-sss-installed-notification" popupid="sss-installed" closebuttonhidden="true"
                learnmoreurl="https://github.com/aminomancer/uc.css.js#search-selection-keyboard-shortcut" dropmarkerhidden="true"
                checkboxhidden="true" secondarybuttonhidden="true" buttonhighlight="true" hasicon="true" hidden="true"
                style="--popup-notification-body-width: 30em;">
                <popupnotificationcontent class="addon-installed-notification-content" orient="vertical">
                    <checkbox id="sss-match-engine-checkbox"
                        label="Add a second hotkey (Ctrl+Alt+F) that matches the search engine to the active page automatically"
                        accesskey="A" />
                </popupnotificationcontent>
            </popupnotification>`)
        );
        let sssResolve = (win) => {
            let match = win.document.getElementById("sss-match-engine-checkbox");
            Services.prefs.setBoolPref(
                "userChrome.searchSelectionShortcut.match-engine-to-current-tab",
                match.checked
            );
            AppMenuNotifications.removeNotification("sss-installed");
        };
        let options = {
            message: `<> has been installed. It adds a second hotkey that can use all your search engines. While visiting a page whose domain matches of your engines, Ctrl+Alt+F will use that engine instead of your default engine.`,
            name: `Search Selection Shortcut 1.5`,
            popupIconURL: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"> <path d="M12.278,1c-1.501,0-2.722,1.221-2.722,2.722v1.167H6.444V3.722C6.444,2.221,5.223,1,3.722,1S1,2.221,1,3.722 s1.221,2.722,2.722,2.722h1.167v3.111H3.722C2.221,9.556,1,10.777,1,12.278S2.221,15,3.722,15s2.722-1.221,2.722-2.722v-1.167 h3.111v1.167c0,1.501,1.221,2.722,2.722,2.722S15,13.779,15,12.278s-1.221-2.722-2.722-2.722h-1.167V6.444h1.167 C13.779,6.444,15,5.223,15,3.722S13.779,1,12.278,1L12.278,1z M11.111,4.889V3.722c0-0.646,0.521-1.167,1.167-1.167 s1.167,0.521,1.167,1.167s-0.521,1.167-1.167,1.167H11.111L11.111,4.889z M3.722,4.889c-0.646,0-1.167-0.521-1.167-1.167 s0.521-1.167,1.167-1.167s1.167,0.521,1.167,1.167v1.167H3.722L3.722,4.889z M6.444,9.556V6.444h3.111v3.111H6.444L6.444,9.556z M12.278,13.444c-0.646,0-1.167-0.521-1.167-1.167v-1.167h1.167c0.646,0,1.167,0.521,1.167,1.167S12.923,13.444,12.278,13.444 L12.278,13.444z M3.722,13.444c-0.646,0-1.167-0.521-1.167-1.167s0.521-1.167,1.167-1.167h1.167v1.167 C4.889,12.923,4.368,13.444,3.722,13.444L3.722,13.444z" /> </svg>`,
            beforeShowDoorhanger: (doc) => {
                let match = doc.getElementById("sss-match-engine-checkbox");
                match.checked = Services.prefs.getBoolPref(
                    "userChrome.searchSelectionShortcut.match-engine-to-current-tab",
                    false
                );
            },
            onDismissed: sssResolve,
        };
        setTimeout(
            () =>
                AppMenuNotifications.showNotification(
                    "sss-installed",
                    { callback: sssResolve },
                    { callback: sssResolve },
                    options
                ),
            5000
        );
    }
}

if (location.href === AppConstants.BROWSER_CHROME_URL) new SearchSelectionShortcut();
