// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.7.4
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Adds a new keyboard shortcut (Ctrl+Shift+F) that searches your default search
// engine for whatever text you currently have highlighted. This does basically the same thing as
// the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL,
// instead of searching for the selection it will navigate directly to the URL. Optionally, you can
// also configure the script to use your other (non-default) search engines as well.

// The preference `userChrome.searchSelectionShortcut.match-engine-to-current-tab` will add a second
// hotkey (Ctrl+Alt+F) that will look for an installed engine that matches the current webpage. So
// if your default search engine is Google but you use the hotkey on Wikipedia, and you have a
// search engine for Wikipedia installed, it will search Wikipedia for the selected text instead.
// This preference is disabled by default, since some extensions may use that key combination. You
// can toggle it in a popup that appears the first time you install the script, or in about:config.

// But what if you have a non-default search engine that you want to use for a particular website?
// Let's say you're on about:config, browsing through preferences. You highlight a pref name and hit
// the hotkey to search for it and find out what it does. Normally, pressing the second hotkey will
// launch your default engine, since about:config doesn't correspond to any normal URL. But by
// setting the pref `userChrome.searchSelectionShortcut.custom-matches`, you can "link" any website
// to any engine you have installed.

// This pref accepts a JSON-formatted object containing zero or more name-value pairs, separated by
// commas. This object can also include one reserved property called REG_EXPS, which uses regular
// expressions instead of URL strings. The object format is:
// {
//   "REG_EXPS": {
//     <regexp1>: <engine>,
//     <regexp2>: <engine>
//   },
//   <site1>: <engine>,
//   <site2>: <engine>
// }

// Here's an example:
// {
//   "REG_EXPS": {
//     "^https?://bugzilla\\.mozilla\\.org(/.*)?$": "https://bugzilla.mozilla.org/buglist.cgi?quicksearch=%s",
//     "^https?://(.*\\.)?(github|githubusercontent)\\.com(/.*)?$": "https://github.com/search?q=%s"
//   },
//   "about:config": "Searchfox",
//   "mozilla.org": "searchfox.org",
//   "google.com": "https://www.google.com/search?client=firefox-b-1-d&q=%s"
// }
// The example above showcases several different accepted formats. <site> or <regexp> represents a
// website you might visit, and <engine> represents the engine to use when you press the hotkey
// while on the <site>. So, the "about:config" one tells the script to use Searchfox when the hotkey
// is activated on about:config. This is JSON, so all values must be wrapped in quotes and the pairs
// must be separated by commas, or the pref won't work at all. All forward slashes must be escaped,
// so when escaping characters in your regular expressions, use two forward slashes instead of one.

// The current URL will be tested against each <regexp> in the REG_EXPS object. If a match is found,
// the corresponding <engine> will be used. If no match is found (or if the REG_EXPS object does not
// exist), the URL will be tested against each <site> in the pref. If a match is found, the
// corresponding <engine> will be used. If no match is found, the default engine will be used.

// A <regexp> value must be a valid regular expression, wrapped in double quotes and escaped.

// A <site> value must be some kind of valid URL. Ideally a host (domain) is best, but it
// doesn't have to be a host, because some types of URLs lack hosts. If you're unsure what the host
// is for a website you're trying to link to an engine, open the website in a browser tab, open the
// content toolbox, and type location.host. For pages that lack hosts or have very important
// protocols (like `moz-extension://` URLs) you can specify the full page URL, like
// `moz-extension://blahblah/index.html` — or better yet, use a regular expression instead.

// An <engine> value can be either:
// 1) an engine's name — the label that appears next to the search engine in the UI, e.g. "Google"
// 2) the domain on which the search engine is hosted, e.g. "www.google.com"
// 3) the engine's full search URL, or something close to it, e.g. "www.google.com/search?q=%s".
// Any of these values will work, but using the engine's name is most efficient

// If you already use these hotkeys for something else, e.g., an extension, you can change the
// hotkey (though not the modifiers) by setting `userChrome.searchSelectionShortcut.keycode` to a
// valid KeyboardEvent code. The default value "KeyF" corresponds to the F key. The correct notation
// is different for numbers and special characters, so visit https://keycode.info and press the
// desired key to find the event.code you need to input for the preference.

// This script automatically generates its own subscript files in your chrome folder and cleans them
// up when you quit Firefox. This is unfortunately necessary to avoid requiring users to download
// multiple files just to make a single script work.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @startup        searchSelectionShortcut
// @onlyonce
// ==/UserScript==

class SearchSelectionShortcut {
  // these are all the prefs the script uses for configuration, with their default values.
  // this particular property is only used for setting the prefs on first install.
  // the window actor has its own way of retrieving these prefs.
  static prefs = new Map([
    ["userChrome.searchSelectionShortcut.keycode", "KeyF"],
    ["userChrome.searchSelectionShortcut.match-engine-to-current-tab", false],
    ["userChrome.searchSelectionShortcut.custom-matches", "{}"],
  ]);
  constructor() {
    ChromeUtils.defineModuleGetter(
      this,
      "AppMenuNotifications",
      "resource://gre/modules/AppMenuNotifications.jsm"
    );
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
    SearchSelectionShortcut.prefs.forEach((def, name) => {
      let type;
      // determine the pref type (boolean, number, string). there are a couple
      // more but we won't ever use them.
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
        firstRun = name !== "userChrome.searchSelectionShortcut.custom-matches";
      }
    });
    // if it's the first time installing v1.6, make a splash menu to reveal the
    // new prefs and offer an affordance to change them.
    if (firstRun) {
      if (gBrowserInit?.delayedStartupFinished) this.handleSplash();
      else Services.obs.addObserver(this, "browser-delayed-startup-finished");
    }
  }
  async setup() {
    // the component registrar — this is the interface that lets us make
    // custom URIs with chrome:// protocols.
    const registrar = Components.manager.QueryInterface(
      Ci.nsIComponentRegistrar
    );
    // a temp directory we're making in the chrome folder. I tried making this
    // folder in the *actual* Temp directory, but I guess it has a permissions
    // issue or something. when we try that, the hotkey works on system pages,
    // but not on regular webpages. very strange, never figured out why. so just
    // make it a dotfile so it won't get in the way. that should hide the folder
    // on linux unless showing hidden files is enabled. not sure about macOS.
    // somebody let me know if it's hidden or not.
    let tempDir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    tempDir.append(".SearchSelectionShortcut");
    let { path } = tempDir;
    await IOUtils.makeDirectory(path, {
      ignoreExisting: true,
      createAncestors: false,
    });
    // hide the temp dir on windows so it doesn't get in the way of user activities or prevent its eventual deletion.
    if (AppConstants.platform === "win") {
      await IOUtils.setWindowsAttributes?.(path, { hidden: true });
    }
    this.tempPath = path;

    // create a manifest file that registers a URI for chrome://uc-searchselectionshortcut/content/
    this.manifestFile = await this.createTempFile(
      `content uc-searchselectionshortcut ./`,
      {
        name: "ucsss",
        type: "manifest",
      }
    );
    // JSActors require parent files and child files.
    // see https://firefox-source-docs.mozilla.org/dom/ipc/jsactors.html
    // this parent file listens for messages from the child file. when it gets a
    // message, it triggers a search or link navigation. the message includes
    // info about the sender, the page's location and CSP, and the selected text
    // or link. if the selected text constitutes a valid link, it will navigate
    // directly to that page. otherwise, it will launch a new browser search
    // using the selected text as a query string. it will normally open the
    // search/link in a new tab. but if you're currently on your new tab page,
    // it assumes you don't want to keep an empty tab around, so it'll open the
    // search/link in the current tab.
    this.parentFile = await this.createTempFile(
      `"use strict";import{XPCOMUtils}from"resource://gre/modules/XPCOMUtils.sys.mjs";const lazy={};XPCOMUtils.defineLazyModuleGetters(lazy,{BrowserWindowTracker:"resource:///modules/BrowserWindowTracker.jsm",PrivateBrowsingUtils:"resource://gre/modules/PrivateBrowsingUtils.jsm",E10SUtils:"resource://gre/modules/E10SUtils.jsm"});XPCOMUtils.defineLazyPreferenceGetter(lazy,"CUSTOM_MATCHES","userChrome.searchSelectionShortcut.custom-matches","{}");const{WebExtensionPolicy}=Cu.getGlobalForObject(Services);const schemes=/^http|https|ftp$/;const base=host=>{let domain;try{domain=Services.eTLD.getBaseDomainFromHost(host)}catch(e){}return domain};export class SearchSelectionShortcutParent extends JSWindowActorParent{get browser(){return this.browsingContext.top.embedderElement}getEngineTemplate(e){const engineURL=e._getURLOfType("text/html");return engineURL.params.length>0?e._searchForm:engineURL.template}async getMatchingEngine(match,url,host,check=true){if(!match)return null;let preferred;let uri=Services.io.newURI(url);if(check){let MATCHES=JSON.parse(lazy.CUSTOM_MATCHES);if(MATCHES.REG_EXPS){for(let[regExp,engineStr]of Object.entries(MATCHES.REG_EXPS)){if(new RegExp(regExp)?.test(url)){preferred=engineStr;break}}delete MATCHES.REG_EXPS}if(!preferred&&url in MATCHES)preferred=MATCHES[url];if(!preferred&&host in MATCHES)preferred=MATCHES[host];if(!preferred&&!host){try{preferred=MATCHES[uri.prePath+uri.filePath]}catch(e){}}if(preferred){const engine=Services.search.getEngineByName(preferred);if(engine&&!engine.hidden)return engine}}const visibleEngines=await Services.search.getVisibleEngines();let originalHost;if(preferred&&/.+\\..+/.test(preferred)){originalHost=host;host=preferred}let engines=visibleEngines.filter((engine=>engine.getResultDomain()==host));if(!engines.length){const baseHost=base(host);if(baseHost||!preferred)engines=visibleEngines.filter((engine=>base(engine.getResultDomain())==baseHost))}if(originalHost&&!engines.length){try{const fixup=Services.uriFixup.getFixupURIInfo(preferred,Ci.nsIURIFixup.FIXUP_FLAG_FIX_SCHEME_TYPOS);uri=fixup.fixedURI;engines=visibleEngines.filter((engine=>engine.getResultDomain()==uri.host))}catch(e){}if(!engines.length)return this.getMatchingEngine(match,url,originalHost,false)}if(engines.length>1){engines.sort(((a,b)=>{const uriA=Services.io.newURI(this.getEngineTemplate(a)),uriB=Services.io.newURI(this.getEngineTemplate(b)),cmnA=this.commonLength(uri,uriA),cmnB=this.commonLength(uri,uriB);return cmnB.host-cmnA.host||cmnB.path-cmnA.path||cmnB.query-cmnA.query}))}return engines[0]}commonLength(x,y){if(!(x?.spec&&y?.spec))return 0;let xh="",yh="";try{xh=x.host}catch(e){}try{yh=y.host}catch(e){}let xf=x.filePath,yf=y.filePath,xs=x.scheme,ys=y.scheme||"https",xq=x.query,yq=y.query,i=0,k=0,len=xh.length,sq="";if(xs!=ys&&!(schemes.test(xs)&&schemes.test(ys)))return 0;while(k<len&&xh.charAt(len-k)===yh.charAt(yh.length-k))k++;while(i<xf.length&&xf.charAt(i)===yf.charAt(i))i++;if(xq&&yq){let xa=xq.split("&"),ya=yq.split("&"),qp;ya=ya.filter((p=>{if(p.endsWith("{searchTerms}")){qp=p.replace(/{searchTerms}/,"");return}return true}));xa=xa.filter((p=>!(qp&&p.startsWith(qp))));sq=xa.filter((p=>ya.includes(p)))}return{host:xh.substring(len-k,len).length,path:xf.substring(0,i).length,query:sq.length}}stripURLPrefix(str){const match=/^[a-z]+:(?:\\/){0,2}/i.exec(str);if(!match)return["",str];let prefix=match[0];if(prefix.length<str.length&&str[prefix.length]==" ")return["",str];return[prefix,str.substr(prefix.length)]}getFixupInfo(text){let fixupInfo,fixupError;try{let flags=Ci.nsIURIFixup.FIXUP_FLAG_FIX_SCHEME_TYPOS|Ci.nsIURIFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP;const info=Services.uriFixup.getFixupURIInfo(text,flags);if(lazy.PrivateBrowsingUtils.isWindowPrivate(this.browser.ownerGlobal))flags|=Ci.nsIURIFixup.FIXUP_FLAG_PRIVATE_CONTEXT;fixupInfo={uri:info.fixedURI,href:info.fixedURI.spec,isSearch:!!info.keywordAsSent}}catch(e){fixupError=e.result}return{info:fixupInfo,error:fixupError}}parseURL(text){try{const str=Services.textToSubURI.unEscapeURIForUI(text);const[prefix,suffix]=this.stripURLPrefix(str);if(!suffix&&prefix)return null;const fixup=this.getFixupInfo(text);if(fixup.error)return null;if(!fixup.info?.href||fixup.info?.isSearch)return null;const{uri}=fixup.info;const url=new URL(fixup.info.href);const hostExpected=["http:","https:","ftp:","chrome:"].includes(url.protocol);if(hostExpected&&!url.host)return null;return{uri,url,href:url.toString()}}catch(e){return null}}async receiveMessage(msg){const browser=this.manager.rootFrameLoader.ownerElement,win=browser.ownerGlobal,{data,target}=msg,{windowContext,browsingContext}=target;if(browsingContext.topChromeWindow!==lazy.BrowserWindowTracker.getTopWindow())return;const{text,locationURL,locationHost,match,frameID}=data;const csp=lazy.E10SUtils.deserializeCSP(data.csp),principal=windowContext.documentPrincipal||Services.scriptSecurityManager.createNullPrincipal({userContextId:win.gBrowser.selectedBrowser.getAttribute("userContextId")});let options={inBackground:Services.prefs.getBoolPref("browser.search.context.loadInBackground",true),triggeringPrincipal:principal,relatedToCurrent:true,allowThirdPartyFixup:true,frameID};const where=locationURL.startsWith(win.BROWSER_NEW_TAB_URL)?"current":"tab";if(!match){const parsed=this.parseURL(text);if(parsed){const{uri}=parsed;let canon=true;let host="";try{host=uri.host}catch(e){}switch(uri.scheme){case"moz-extension":const policy=WebExtensionPolicy.getByHostname(host);if(policy){const extPrincipal=policy&&policy.extension.principal;if(extPrincipal)options.triggeringPrincipal=extPrincipal}else canon=false;break;case"about":canon=lazy.E10SUtils.getAboutModule(uri);options.triggeringPrincipal=Services.scriptSecurityManager.getSystemPrincipal();break;case"chrome":case"resource":if(!host){canon=false;break}case"file":options.triggeringPrincipal=Services.scriptSecurityManager.getSystemPrincipal();break;case"data":if(!uri.filePath.includes(",")){canon=false;break}options.forceAllowDataURI=true;options.triggeringPrincipal=Services.scriptSecurityManager.createNullPrincipal({userContextId:win.gBrowser.selectedBrowser.getAttribute("userContextId")});break;case"javascript":canon=false;break;default:options.referrerInfo=lazy.E10SUtils.deserializeReferrerInfo(data.referrerInfo);break}if(!!canon)return win.openLinkIn(parsed.href,where,options)}}const engine=await this.getMatchingEngine(match,locationURL,locationHost);win.BrowserSearch._loadSearch(text,where,false,null,principal,csp,options.inBackground,engine)}}`,
      { name: "SearchSelectionShortcutParent", type: "sys.mjs" }
    );
    // the child actor is where the hotkey itself is set up. it listens for the
    // Ctrl+Shift+F hotkey, and if text is selected within the actor's frame at
    // the time the hotkey is pressed, it will send a message containing the
    // aforementioned properties back up to the parent actor.
    this.childFile = await this.createTempFile(
      `"use strict";import{XPCOMUtils}from"resource://gre/modules/XPCOMUtils.sys.mjs";const lazy={};XPCOMUtils.defineLazyModuleGetters(lazy,{SelectionUtils:"resource://gre/modules/SelectionUtils.jsm",E10SUtils:"resource://gre/modules/E10SUtils.jsm",WebNavigationFrames:"resource://gre/modules/WebNavigationFrames.jsm"});XPCOMUtils.defineLazyPreferenceGetter(lazy,"KEYCODE","userChrome.searchSelectionShortcut.keycode","KeyF");XPCOMUtils.defineLazyPreferenceGetter(lazy,"MATCH_ENGINE_TO_TAB","userChrome.searchSelectionShortcut.match-engine-to-current-tab",false);export class SearchSelectionShortcutChild extends JSWindowActorChild{getKeyState(e){if(e.code!==lazy.KEYCODE||e.repeat)return false;const alt=e.getModifierState("Alt");const shift=e.getModifierState("Shift");if(e.getModifierState("Accel")){if(lazy.MATCH_ENGINE_TO_TAB&&!shift&&alt)return"match";if(shift&&!alt)return"default"}return false}handleEvent(e){let match=false;switch(this.getKeyState(e)){case"default":break;case"match":match=true;break;default:return}const doc=e.composedTarget.ownerDocument,selection=lazy.SelectionUtils.getSelectionDetails(this.contentWindow,8192);if(!selection?.text||selection?.docSelectionIsCollapsed)return;let msg={csp:lazy.E10SUtils.serializeCSP(doc.csp),referrerInfo:lazy.E10SUtils.serializeReferrerInfo(doc.referrerInfo),text:selection.text,locationURL:this.contentWindow.location.href,locationHost:this.contentWindow.location.hostname,frameID:lazy.WebNavigationFrames.getFrameId(doc.defaultView),match};this.sendAsyncMessage("SearchSelectionKeydown",msg);e.stopPropagation();e.stopImmediatePropagation();e.preventDefault()}}`,
      { name: "SearchSelectionShortcutChild", type: "sys.mjs" }
    );

    // find the manifest in the temp directory and register it with the component registrar.
    tempDir.append(this.manifestFile.name);
    // registering the manifest gives the temp folder a chrome:// URI that we can reference below
    if (tempDir.exists()) registrar.autoRegister(tempDir);
    else return;
    // register the JSActor, passing the temporary files' chrome:// URLs.
    // includeChrome, allFrames, and messageManagerGroups are specified to ensure
    // this works in every frame. this means it'll work on ANY page in ANY
    // browser. it will even work in addon pages loaded in webextension popup
    // panels. for example if you open the uBlock Origin popup from its toolbar
    // button and select some text, the hotkey will search for it in a new tab.
    ChromeUtils.registerWindowActor("SearchSelectionShortcut", {
      parent: {
        esModuleURI: this.parentFile.url,
      },
      child: {
        esModuleURI: this.childFile.url,
        events: { keydown: { mozSystemGroup: true } },
      },
      includeChrome: true,
      allFrames: true,
      messageManagerGroups: ["browsers", "webext-browsers", "sidebars"],
    });
    // listen for application quit so we can clean up the temp files.
    Services.obs.addObserver(this, "quit-application");
  }
  get uuid() {
    if (!this._uuid) this._uuid = Services.uuid.generateUUID().toString();
    return this._uuid;
  }
  /**
   * create a file in the temp folder
   * @param {string} contents (the actual file contents in UTF-8)
   * @param {object} options (an optional object containing properties path or
   *                         name. path creates a file at a specific absolute
   *                         path. name creates a file of that name in the
   *                         chrome/.SearchSelectionShortcut folder. if omitted,
   *                         it will create chrome/.SearchSelectionShortcut/uc-temp)
   * @returns {object} (an object containing the filename and
   *                   a chrome:// URL leading to the file)
   */
  async createTempFile(contents, options = {}) {
    let { path = null, name = "uc-temp", type = "txt" } = options;
    name += "-" + this.uuid + "." + type;
    if (!path) {
      let dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
      dir.append(".SearchSelectionShortcut");
      dir.append(name);
      path = dir.path;
    }
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
      MozXULElement.parseXULToFragment(`<popupnotification
  id="appMenu-sss-installed-notification"
  popupid="sss-installed"
  closebuttonhidden="true"
  learnmoreurl="https://github.com/aminomancer/uc.css.js#search-selection-keyboard-shortcut"
  dropmarkerhidden="true"
  checkboxhidden="true"
  secondarybuttonhidden="true"
  buttonhighlight="true"
  hasicon="true"
  hidden="true"
  style="--popup-notification-body-width: 30em">
  <popupnotificationcontent class="addon-installed-notification-content" orient="vertical">
    <checkbox
      id="sss-match-engine-checkbox"
      label="Add a second hotkey (Ctrl+Alt+F) that matches the search engine to the active page automatically"
      accesskey="A"/>
  </popupnotificationcontent>
</popupnotification>`)
    );
    let sssResolve = win => {
      let match = win.document.getElementById("sss-match-engine-checkbox");
      Services.prefs.setBoolPref(
        "userChrome.searchSelectionShortcut.match-engine-to-current-tab",
        match.checked
      );
      this.AppMenuNotifications.removeNotification("sss-installed");
    };
    let options = {
      message: `<> has been installed. It adds a second hotkey that can use all your search engines. While visiting a page whose domain matches of your engines, Ctrl+Alt+F will use that engine instead of your default engine.`,
      name: `Search Selection Shortcut 1.6`,
      popupIconURL: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"> <path d="M12.278,1c-1.501,0-2.722,1.221-2.722,2.722v1.167H6.444V3.722C6.444,2.221,5.223,1,3.722,1S1,2.221,1,3.722 s1.221,2.722,2.722,2.722h1.167v3.111H3.722C2.221,9.556,1,10.777,1,12.278S2.221,15,3.722,15s2.722-1.221,2.722-2.722v-1.167 h3.111v1.167c0,1.501,1.221,2.722,2.722,2.722S15,13.779,15,12.278s-1.221-2.722-2.722-2.722h-1.167V6.444h1.167 C13.779,6.444,15,5.223,15,3.722S13.779,1,12.278,1L12.278,1z M11.111,4.889V3.722c0-0.646,0.521-1.167,1.167-1.167 s1.167,0.521,1.167,1.167s-0.521,1.167-1.167,1.167H11.111L11.111,4.889z M3.722,4.889c-0.646,0-1.167-0.521-1.167-1.167 s0.521-1.167,1.167-1.167s1.167,0.521,1.167,1.167v1.167H3.722L3.722,4.889z M6.444,9.556V6.444h3.111v3.111H6.444L6.444,9.556z M12.278,13.444c-0.646,0-1.167-0.521-1.167-1.167v-1.167h1.167c0.646,0,1.167,0.521,1.167,1.167S12.923,13.444,12.278,13.444 L12.278,13.444z M3.722,13.444c-0.646,0-1.167-0.521-1.167-1.167s0.521-1.167,1.167-1.167h1.167v1.167 C4.889,12.923,4.368,13.444,3.722,13.444L3.722,13.444z" /> </svg>`,
      beforeShowDoorhanger: doc => {
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
        this.AppMenuNotifications.showNotification(
          "sss-installed",
          { callback: sssResolve },
          { callback: sssResolve },
          options
        ),
      5000
    );
  }
}

_ucUtils.sharedGlobal.searchSelectionShortcut = {
  _startup: () => {},
};

if (location.href === AppConstants.BROWSER_CHROME_URL) {
  new SearchSelectionShortcut();
}
