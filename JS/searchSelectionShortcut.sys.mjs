// ==UserScript==
// @name           Search Selection Keyboard Shortcut
// @version        1.8.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
Adds a new keyboard shortcut (Ctrl+Shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option `Search {Engine} for {Selection}` except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL. Optionally, you can also configure the script to use your other (non-default) search engines as well.

The preference `userChrome.searchSelectionShortcut.match-engine-to-current-tab` will add a second hotkey (Ctrl+Alt+F) that will look for an installed engine that matches the current webpage. So if your default search engine is Google but you use the hotkey on Wikipedia, and you have a search engine for Wikipedia installed, it will search Wikipedia for the selected text instead. This preference is disabled by default, since some extensions may use that key combination. You can toggle it in a popup that appears the first time you install the script, or in <about:config>.

But what if you have a non-default search engine that you want to use for a particular website? Let's say you're on <about:config>, browsing through preferences. You highlight a pref name and hit the hotkey to search for it and find out what it does. Normally, pressing the second hotkey will launch your default engine, since about:config doesn't correspond to any normal URL. But by setting the pref `userChrome.searchSelectionShortcut.custom-matches`, you can "link" any website to any engine you have installed.

This pref accepts a JSON-formatted object containing zero or more name-value pairs, separated by commas. This object can also include one reserved property called REG_EXPS, which uses regular expressions instead of URL strings. The object format is:
```yaml
{
  REG_EXPS: {
    <regexp1>: <engine>,
    <regexp2>: <engine>
  },
  <site1>: <engine>,
  <site2>: <engine>
}
```

Here's an example:
```json
{
  "REG_EXPS": {
    "^https?://bugzilla\\.mozilla\\.org(/.*)?$": "https://bugzilla.mozilla.org/buglist.cgi?quicksearch=%s",
    "^https?://(.*\\.)?(github|githubusercontent)\\.com(/.*)?$": "https://github.com/search?q=%s"
  },
  "about:config": "Searchfox",
  "mozilla.org": "searchfox.org",
  "google.com": "https://www.google.com/search?client=firefox-b-1-d&q=%s"
}
```

The example above showcases several different accepted formats. `<site>` or `<regexp>` represents a website you might visit, and `<engine>` represents the engine to use when you press the hotkey while on the `<site>`. So, the "about:config" one tells the script to _use Searchfox when the hotkey is activated on about:config_. This is JSON, so all values must be wrapped in quotes and the pairs must be separated by commas, or the pref won't work at all. All forward slashes must be escaped, so when escaping characters in your regular expressions, use two forward slashes instead of one.

The current URL will be tested against each `<regexp>` in the `REG_EXPS` object. If a match is found, the corresponding `<engine>` will be used. If no match is found (or if the `REG_EXPS` object does not exist), the URL will be tested against each `<site>` in the pref. If a match is found, the corresponding `<engine>` will be used. If no match is found, the default engine will be used.

A `<regexp>` value must be a valid regular expression, wrapped in double quotes and escaped.

A `<site>` value must be some kind of valid URL. Ideally a host (domain) is best, but it doesn't have to be a host, because some types of URLs lack hosts. If you're unsure what the host is for a website you're trying to link to an engine, open the website in a browser tab, open the content toolbox, and type `location.host`. For pages that lack hosts or have very important protocols (like `"moz-extension://"` URLs) you can specify the full page URL, like `"moz-extension://blahblah/index.html"` — or better yet, use a regular expression instead.

An `<engine>` value can be either:

1. an engine's name — the label that appears next to the search engine in the UI, e.g. `"Google"`
2. the domain on which the search engine is hosted, e.g. `"www.google.com"`
3. the engine's full search URL, or something close to it, e.g. `"www.google.com/search?q=%s"`

Any of these values will work, but using the engine's name is most efficient.

If you already use these hotkeys for something else, e.g., an extension, you can change the hotkey (though not the modifiers) by setting `userChrome.searchSelectionShortcut.keycode` to a valid [KeyboardEvent code][]. The default value `KeyF` corresponds to the F key. The correct notation is different for numbers and special characters, so visit [keycode.info][] and press your desired key to find the `event.code` you need to input for the preference.

This script automatically generates its own subscript files in your chrome folder and cleans them up when you quit Firefox. This is unfortunately necessary to avoid requiring users to download multiple files just to make a single script work.

[KeyboardEvent code]: https://developer.mozilla.org/docs/Web/API/KeyboardEvent/code
[keycode.info]: https://keycode.info
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/searchSelectionShortcut.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/searchSelectionShortcut.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";

const lazy = {};

ChromeUtils.defineESModuleGetters(lazy, {
  E10SUtils: "resource://gre/modules/E10SUtils.sys.mjs",
  SelectionUtils: "resource://gre/modules/SelectionUtils.sys.mjs",
  WebNavigationFrames: "resource://gre/modules/WebNavigationFrames.sys.mjs",
});

export class SearchSelectionShortcutChild extends JSWindowActorChild {
  get keycode() {
    return this.sendQuery("SearchSelectionShortcut:Keycode");
  }

  get matchEngineToTab() {
    return this.sendQuery("SearchSelectionShortcut:MatchEngineToTab");
  }

  async getKeyState(e) {
    if (e.code !== (await this.keycode) || e.repeat) {
      return false;
    }
    const alt = e.getModifierState("Alt");
    const shift = e.getModifierState("Shift");
    if (e.getModifierState("Accel")) {
      if ((await this.matchEngineToTab) && !shift && alt) {
        return "match";
      }
      if (shift && !alt) {
        return "default";
      }
    }
    return false;
  }

  async handleEvent(e) {
    let match = false;
    switch (await this.getKeyState(e)) {
      case "default":
        break;
      case "match":
        match = true;
        break;
      default:
        return;
    }

    const doc = e.composedTarget.ownerDocument;
    const selection = lazy.SelectionUtils.getSelectionDetails(
      this.contentWindow,
      8192
    );

    if (!selection?.text || selection?.docSelectionIsCollapsed) {
      return;
    }
    this.sendAsyncMessage("SearchSelectionShortcut:Keydown", {
      csp: lazy.E10SUtils.serializeCSP(doc.csp),
      referrerInfo: lazy.E10SUtils.serializeReferrerInfo(doc.referrerInfo),
      text: selection.text,
      locationURL: this.contentWindow.location.href,
      locationHost: this.contentWindow.location.hostname,
      frameID: lazy.WebNavigationFrames.getFrameId(doc.defaultView),
      match,
    });
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}

const schemes = /^http|https|ftp$/;

const getBaseDomain = host => {
  let domain;
  try {
    domain = Services.eTLD.getBaseDomainFromHost(host);
  } catch (e) {}
  return domain;
};

export class SearchSelectionShortcutParent extends JSWindowActorParent {
  get browser() {
    return this.browsingContext.top.embedderElement;
  }

  getEngineTemplate(e) {
    const engineURL = e._getURLOfType("text/html");
    return engineURL.params.length ? e._searchForm : engineURL.template;
  }

  async getMatchingEngine(match, url, host) {
    if (!match) {
      return null;
    }
    let preferred;
    let uri = Services.io.newURI(url);
    let MATCHES = {};
    try {
      MATCHES = JSON.parse(lazy.CUSTOM_MATCHES);
      if (typeof MATCHES !== "object" || Array.isArray(MATCHES)) {
        MATCHES = {};
        throw new SyntaxError("Custom matches must be a plain object.");
      }
    } catch (error) {
      console.error(
        `Error parsing userChrome.searchSelectionShortcut.custom-matches: ${lazy.CUSTOM_MATCHES}\n`,
        error
      );
    }
    if (MATCHES.REG_EXPS) {
      for (let [regExpString, engineStr] of Object.entries(MATCHES.REG_EXPS)) {
        let regExp;
        try {
          regExp = new RegExp(regExpString);
        } catch (error) {
          console.error(
            `Error parsing regular expression: ${regExpString}\n`,
            error
          );
          continue;
        }
        if (regExp.test(url)) {
          preferred = engineStr;
        }
      }
      delete MATCHES.REG_EXPS;
    }
    if (!preferred && url in MATCHES) {
      preferred = MATCHES[url];
    }
    if (!preferred && host in MATCHES) {
      preferred = MATCHES[host];
    }
    if (!preferred && !host) {
      try {
        preferred = MATCHES[uri.prePath + uri.filePath];
      } catch (e) {}
    }
    if (preferred) {
      let engine = Services.search.getEngineByName(preferred);
      if (engine && !engine.hidden) {
        return engine;
      }
      engine = Services.search.getEngineById(preferred);
      if (engine && !engine.hidden) {
        return engine;
      }
    }
    const visibleEngines = await Services.search.getVisibleEngines();
    let engines = visibleEngines.filter(
      engine => engine.searchUrlDomain === host
    );
    if (!engines.length) {
      const baseHost = getBaseDomain(host);
      if (baseHost || !preferred) {
        engines = visibleEngines.filter(
          engine => getBaseDomain(engine.searchUrlDomain) === baseHost
        );
      }
    }
    if (engines.length > 1) {
      engines.sort((a, b) => {
        const uriA = Services.io.newURI(this.getEngineTemplate(a));
        const uriB = Services.io.newURI(this.getEngineTemplate(b));
        const cmnA = this.commonLength(uri, uriA);
        const cmnB = this.commonLength(uri, uriB);
        return (
          cmnB.host - cmnA.host ||
          cmnB.path - cmnA.path ||
          cmnB.query - cmnA.query
        );
      });
    }
    return engines[0];
  }

  commonLength(x, y) {
    if (!(x?.spec && y?.spec)) {
      return 0;
    }
    let xh = "";
    let yh = "";
    try {
      xh = x.host;
    } catch (e) {}
    try {
      yh = y.host;
    } catch (e) {}
    let xf = x.filePath;
    let yf = y.filePath;
    let xs = x.scheme;
    let ys = y.scheme || "https";
    let xq = x.query;
    let yq = y.query;
    let i = 0;
    let k = 0;
    let len = xh.length;
    let sq = "";
    if (xs != ys && !(schemes.test(xs) && schemes.test(ys))) {
      return 0;
    }
    while (k < len && xh.charAt(len - k) === yh.charAt(yh.length - k)) {
      k++;
    }
    while (i < xf.length && xf.charAt(i) === yf.charAt(i)) {
      i++;
    }
    if (xq && yq) {
      let xa = xq.split("&");
      let ya = yq.split("&");
      let qp;
      ya = ya.filter(p => {
        if (p.endsWith("{searchTerms}")) {
          qp = p.replace(/{searchTerms}/, "");
          return;
        }
        return true;
      });
      xa = xa.filter(p => !(qp && p.startsWith(qp)));
      sq = xa.filter(p => ya.includes(p));
    }
    return {
      host: xh.substring(len - k, len).length,
      path: xf.substring(0, i).length,
      query: sq.length,
    };
  }

  stripURLPrefix(str) {
    const match = /^[a-z]+:(?:\/){0,2}/i.exec(str);
    if (!match) {
      return ["", str];
    }
    let prefix = match[0];
    if (prefix.length < str.length && str[prefix.length] === " ") {
      return ["", str];
    }
    return [prefix, str.substr(prefix.length)];
  }

  getFixupInfo(text) {
    let fixupInfo;
    let fixupError;
    try {
      let flags =
        Ci.nsIURIFixup.FIXUP_FLAG_FIX_SCHEME_TYPOS |
        Ci.nsIURIFixup.FIXUP_FLAG_ALLOW_KEYWORD_LOOKUP;
      const info = Services.uriFixup.getFixupURIInfo(text, flags);
      if (lazy.PrivateBrowsingUtils.isWindowPrivate(this.browser.ownerGlobal)) {
        flags |= Ci.nsIURIFixup.FIXUP_FLAG_PRIVATE_CONTEXT;
      }
      fixupInfo = {
        uri: info.fixedURI,
        href: info.fixedURI.spec,
        isSearch: !!info.keywordAsSent,
      };
    } catch (e) {
      fixupError = e.result;
    }
    return { info: fixupInfo, error: fixupError };
  }

  parseURL(text) {
    try {
      const str = Services.textToSubURI.unEscapeURIForUI(text);
      const [prefix, suffix] = this.stripURLPrefix(str);
      if (!suffix && prefix) {
        return null;
      }
      const fixup = this.getFixupInfo(text);
      if (fixup.error) {
        return null;
      }
      if (!fixup.info?.href || fixup.info?.isSearch) {
        return null;
      }
      const { uri } = fixup.info;
      const url = new URL(fixup.info.href);
      const hostExpected = ["http:", "https:", "ftp:", "chrome:"].includes(
        url.protocol
      );
      if (hostExpected && !url.host) {
        return null;
      }
      return { uri, url, href: url.toString() };
    } catch (e) {
      return null;
    }
  }

  async onKeydown({ data, target }) {
    const browser = this.manager.rootFrameLoader.ownerElement;
    const win = browser.ownerGlobal;
    const { windowContext, browsingContext } = target;
    if (
      browsingContext.topChromeWindow !==
      lazy.BrowserWindowTracker.getTopWindow()
    ) {
      return;
    }
    const { text, locationURL, locationHost, match, frameID } = data;
    const csp = lazy.E10SUtils.deserializeCSP(data.csp);

    const principal =
      windowContext.documentPrincipal ||
      Services.scriptSecurityManager.createNullPrincipal({
        userContextId:
          win.gBrowser.selectedBrowser.getAttribute("userContextId"),
      });

    let options = {
      inBackground: Services.prefs.getBoolPref(
        "browser.search.context.loadInBackground",
        true
      ),
      triggeringPrincipal: principal,
      relatedToCurrent: true,
      allowThirdPartyFixup: true,
      frameID,
    };
    const where = locationURL.startsWith(win.BROWSER_NEW_TAB_URL)
      ? "current"
      : "tab";
    if (!match) {
      const parsed = this.parseURL(text);
      if (parsed) {
        const { uri } = parsed;
        let canon = true;
        let host = "";
        try {
          host = uri.host;
        } catch (e) {}
        switch (uri.scheme) {
          case "moz-extension":
            const policy = WebExtensionPolicy.getByHostname(host);
            if (policy) {
              const extPrincipal = policy && policy.extension.principal;
              if (extPrincipal) {
                options.triggeringPrincipal = extPrincipal;
              }
            } else {
              canon = false;
            }
            break;
          case "about":
            canon = lazy.E10SUtils.getAboutModule(uri);
            options.triggeringPrincipal =
              Services.scriptSecurityManager.getSystemPrincipal();
            break;
          case "chrome":
          case "resource":
            if (!host) {
              canon = false;
              break;
            }
          // fall through
          case "file":
            options.triggeringPrincipal =
              Services.scriptSecurityManager.getSystemPrincipal();
            break;
          case "data":
            if (!uri.filePath.includes(",")) {
              canon = false;
              break;
            }
            options.forceAllowDataURI = true;
            options.triggeringPrincipal =
              Services.scriptSecurityManager.createNullPrincipal({
                userContextId:
                  win.gBrowser.selectedBrowser.getAttribute("userContextId"),
              });
            break;
          case "javascript":
            canon = false;
            break;
          default:
            options.referrerInfo = lazy.E10SUtils.deserializeReferrerInfo(
              data.referrerInfo
            );
            break;
        }
        if (canon) {
          win.openLinkIn(parsed.href, where, options);
          return;
        }
      }
    }
    const engine = await this.getMatchingEngine(
      match,
      locationURL,
      locationHost
    );
    win.BrowserSearch._loadSearch(
      text,
      where,
      false,
      null,
      principal,
      csp,
      options.inBackground,
      engine
    );
  }

  async receiveMessage(msg) {
    switch (msg.name) {
      case "SearchSelectionShortcut:Keycode":
        return lazy.KEYCODE;
      case "SearchSelectionShortcut:MatchEngineToTab":
        return lazy.MATCH_ENGINE_TO_TAB;
      case "SearchSelectionShortcut:Keydown":
        this.onKeydown(msg);
        break;
    }
  }
}

if (Services.appinfo.processType === Services.appinfo.PROCESS_TYPE_DEFAULT) {
  function addDefaultPrefs() {
    let oldPref = "userChrome.searchSelectionShortcut.action-override-hotkey";
    if (Services.prefs.prefHasUserValue(oldPref)) {
      Services.prefs.clearUserPref(oldPref);
    }
    const defaultPrefs = Services.prefs.getDefaultBranch("");
    for (let [name, val] of [
      ["userChrome.searchSelectionShortcut.keycode", "KeyF"],
      ["userChrome.searchSelectionShortcut.match-engine-to-current-tab", false],
      ["userChrome.searchSelectionShortcut.custom-matches", "{}"],
    ]) {
      let type;
      // determine the pref type (boolean, number, string). there are a couple
      // more but we won't ever use them.
      switch (typeof val) {
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
      defaultPrefs[`set${type}Pref`](name, val);
    }
  }

  addDefaultPrefs();

  ChromeUtils.defineESModuleGetters(lazy, {
    BrowserWindowTracker: "resource:///modules/BrowserWindowTracker.sys.mjs",
    PrivateBrowsingUtils: "resource://gre/modules/PrivateBrowsingUtils.sys.mjs",
  });
  XPCOMUtils.defineLazyPreferenceGetter(
    lazy,
    "CUSTOM_MATCHES",
    "userChrome.searchSelectionShortcut.custom-matches",
    "{}"
  );
  XPCOMUtils.defineLazyPreferenceGetter(
    lazy,
    "KEYCODE",
    "userChrome.searchSelectionShortcut.keycode",
    "KeyF"
  );
  XPCOMUtils.defineLazyPreferenceGetter(
    lazy,
    "MATCH_ENGINE_TO_TAB",
    "userChrome.searchSelectionShortcut.match-engine-to-current-tab",
    false
  );

  let esModuleURI = import.meta.url;
  ChromeUtils.registerWindowActor("SearchSelectionShortcut", {
    parent: { esModuleURI },
    child: { esModuleURI, events: { keydown: { mozSystemGroup: true } } },
    includeChrome: true,
    allFrames: true,
    messageManagerGroups: ["browsers", "webext-browsers", "sidebars"],
  });
}
