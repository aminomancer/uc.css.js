// ==UserScript==
// @name           Browser Chrome Bookmark Keywords
// @version        1.1.7
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Allow the creation of special keyword bookmarks with JavaScript to be executed in the browser chrome (i.e., the main window). Normally when you [add a JavaScript bookmark][keyword searches] like `javascript:location.href="https://example.com/search?q=%s"` the script will run in the browser window. With this script, you can make a bookmark like `ucjs:console.log("%{searchString}")` and basically execute any arbitrary code from the urlbar, with the same level of access as this script itself has.

As you can see, the placeholder `%{searchString}` represents the value you typed in the urlbar, just like `%s` does for normal bookmark keywords. I used a longer, more complex symbol for the placeholder because it's possible you might want to use the string `%s` in your script for other reasons.

Your bookmark code will have access to four parameters, plus the search string: result, event, element, and browser. You probably won't need any of them except event and maybe browser. If you're going to use `gBrowser.selectedBrowser` in your bookmark code, always replace it with browser instead. As for event, it just represents the event that triggered the result activation. So if you held down the Alt or Ctrl key as you activated the result, `event.ctrlKey` or `event.altKey` will be true, and you can use that in your bookmark to simulate behavior of normal urlbar results (e.g., opening in a new tab when Ctrl or Alt is pressed, opening in a new window when Shift is pressed, etc.). Firefox uses a couple methods to do that, but the one normally used in the urlbar is `gURLBar._whereToOpen(event)` That will return a value like "tab" or "window" which can be passed to the utility overlay functions like `openWebLinkIn`.

Beware that you shouldn't be escaping anything in your bookmark code with URL encoding, because it isn't really parsed like a URL. However, you can use escape sequences to encode special characters that you would ordinarily need to encode in JavaScript strings, such as \n for new line or \\ for backslash. Just be aware of this if you use backslashes, as [they need to be doubled up][escape sequences].

So putting all of this together, you can make a bookmark keyword like this:
```js
ucjs:openWebLinkIn(
  "https://www.google.com/search?q=site:" +
    gBrowser.currentURI.host +
    " %{searchString}",
  gURLBar._whereToOpen(event)
);
```

That will allow you to search Google's results for whatever website you're currently on. This is already possible with normal bookmark keywords, but when you use modifier keys to run the search in a new tab/window, it will fail, because it needs information about 1) the current tab, and 2) the new tab. Traditional bookmark keywords don't have that level of access. But that was the inspiration for this script — by executing the bookmark keyword code in the browser chrome, we can access nearly everything the average autoconfig script can access. So this will let you do it with modifier keys.

That's just a really simple example, but in theory you could paste an entire autoconfig script into a bookmark URL and run it from the urlbar. Also, keep in mind that you don't need to use search strings in your keywords. With traditional keywords, they just didn't show up in the list at all if you typed a search string but your keyword URL didn't have `%s` in it somewhere. With ucjs: keyword bookmarks, if you want to run some code that doesn't care about what you type, you can just omit the search string placeholder from your code altogether, and it will be ignored.

If you make a bookmark whose URL is just `%{searchString}` and nothing else, then this module will execute whatever you type in the urlbar as JavaScript. So, if your bookmark's keyword is just `keyword`, then if you were to type `keyword console.log("Hello, world!")` in the urlbar and hit enter, it would do exactly that. So you can use this kind of like a mini console if you want. But the normal use (and definitely the safer) is to define the JavaScript in advance in the URL, and just use the search string for actual strings.

There are some configuration settings below if you want to format things a bit differently. By the way, I recommend using my [Bookmarks Menu & Button Shortcuts][] if you're using bookmark keywords, since it adds the URL and keyword fields directly to the "Add/edit bookmark" panel (the one you access by clicking the star button in the urlbar). Otherwise, you need to go out of your way to add a keyword.

Be careful when using this, of course. You always need to take care when using JavaScript bookmarks, and since this new type has access to the browser chrome, it has significantly more powers.

[escape sequences]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences "String - JavaScript | MDN"
[keyword searches]: https://kb.mozillazine.org/Using_keyword_searches "Using keyword searches - MozillaZine Knowledge Base"
[Bookmarks Menu & Button Shortcuts]: https://github.com/aminomancer/uc.css.js#bookmarks-menu--button-shortcuts
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/browserChromeBookmarkKeywords.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/browserChromeBookmarkKeywords.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

/* eslint-disable mozilla/valid-lazy, no-unused-vars */
(function() {
  // User configuration settings
  const config = {
    // The icon that will show on browser chrome bookmark keyword results.
    "Result icon URL": `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M0 4a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H3a3 3 0 0 1-3-3V4zm3-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3z" /><path d="M4.22 5.2a.62.62 0 0 1 .88.02l2.75 2.85c.23.24.23.62 0 .86L5.1 11.78a.63.63 0 0 1-.9-.86L6.53 8.5 4.2 6.08a.62.62 0 0 1 .02-.88z" /></svg>`,

    // The string that will show next to these results.
    // (e.g. instead of "Visit" or "Search with {engine}")
    "Result action string": "Execute",

    // This pattern matches the symbol you will put in your bookmark URL as a
    // placeholder representing the search string you'll type in the urlbar.
    // It's %{searchString} by default, but if you want something simpler you
    // can just change it to %s or whatever you want really. So basically just
    // make sure this value matches between the script (here) and your ucjs:
    // keyword bookmarks. Make sure it's wrapped in forward slashes / like all
    // RegExp patterns defined by literal notation. And it should have a g at
    // the end, so it will replace all instances of the placeholder with your
    // typed string. Your bookmark code can have multiple instances of the
    // placeholder. It shouldn't ever be necessary, because you can just put in
    // your bookmark code `let string = %{searchString};` and then refer to
    // `string` in the rest of your bookmark code instead of `%searchString`.
    // But it doesn't hurt to add the g (global) flag. Keep in mind this obeys
    // the usual JavaScript literal notation rules, so I don't recommend putting
    // backslashes \ in this placeholder symbol. Honestly I would really just
    // recommend leaving this alone lol.
    "Search string placeholder": /%{searchString}/g,
  };

  function init() {
    const lazy = {};
    XPCOMUtils.defineLazyModuleGetters(lazy, {
      PartnerLinkAttribution: "resource:///modules/PartnerLinkAttribution.jsm",
      CONTEXTUAL_SERVICES_PING_TYPES:
        "resource:///modules/PartnerLinkAttribution.jsm",
    });
    ChromeUtils.defineESModuleGetters(lazy, {
      UrlbarUtils: "resource:///modules/UrlbarUtils.sys.mjs",
      UrlbarPrefs: "resource:///modules/UrlbarPrefs.sys.mjs",
      UrlbarProvidersManager:
        "resource:///modules/UrlbarProvidersManager.sys.mjs",
      ExtensionSearchHandler:
        "resource://gre/modules/ExtensionSearchHandler.sys.mjs",
    });

    const UrlbarProvidersManager = gURLBar.view.controller.manager;

    let UrlbarProviderBookmarkKeywords = UrlbarProvidersManager.getProvider(
      "BookmarkKeywords"
    );

    let schema = UrlbarUtils.getPayloadSchema(UrlbarUtils.RESULT_TYPE.KEYWORD);
    schema.properties.ucjs = { type: "boolean" };

    if (!gURLBar.pickResult.BCBK_modified) {
      const SCALAR_CATEGORY_TOPSITES = "contextual.services.topsites.click";
      eval(
        `gURLBar.pickResult = function ${gURLBar.pickResult
          .toSource()
          .replace(
            /(openParams\.allowInheritPrincipal = true;)/,
            /* javascript */ `if (result.payload.ucjs) {\n  UrlbarProvidersManager.getProvider(result.providerName)?.tryMethod("pickResult", result, event, element, browser);\n  return;\n}\n$1;`
          )}`
      );
      gURLBar.pickResult.BCBK_modified = true;
    }

    if (gURLBar.view._updateRow && !gURLBar.view._updateRow.BCBK_modified) {
      function getUniqueId(prefix) {
        return prefix + (gURLBar.view.uniqueIdSerial++ % 9999);
      }
      if (!gURLBar.view.hasOwnProperty("uniqueIdSerial")) {
        gURLBar.view.uniqueIdSerial = 1;
      }
      eval(
        `gURLBar.view._updateRow = function ${gURLBar.view._updateRow
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^_updateRow\s*/, "")
          .replace(
            /(isVisitAction = result\.payload\.input\.trim\(\) == result\.payload\.keyword;)/,
            /* javascript */ `if (result.payload.ucjs) {\n  actionSetter = () => {\n    this._removeElementL10n(action);\n    action.textContent = config["Result action string"];\n  }\n}\nelse $1;`
          )}`
      );
      gURLBar.view._updateRow.BCBK_modified = true;
    }

    if (UrlbarProviderBookmarkKeywords.BCBK_modified) return;

    const { KeywordUtils } = ChromeUtils.import(
      "resource://gre/modules/KeywordUtils.jsm"
    );
    const { UrlbarProvider } = ChromeUtils.importESModule(
      "resource:///modules/UrlbarUtils.sys.mjs"
    );
    const { UrlbarTokenizer } = ChromeUtils.importESModule(
      "resource:///modules/UrlbarTokenizer.sys.mjs"
    );
    const { UrlbarResult } = ChromeUtils.importESModule(
      "resource:///modules/UrlbarResult.sys.mjs"
    );
    UrlbarProvidersManager.unregisterProvider(UrlbarProviderBookmarkKeywords);

    class BrowserChromeBookmarkKeywords extends UrlbarProvider {
      /**
       * Returns the name of this provider.
       * @returns {string} The name of this provider.
       */
      get name() {
        return "BookmarkKeywords";
      }

      /**
       * Just here to stop us from registering the provider more than once.
       * @returns {boolean} true
       */
      get BCBK_modified() {
        return true;
      }

      /**
       * Returns the type of this provider.
       * @returns {integer} One of the types from UrlbarUtils.PROVIDER_TYPE.*
       */
      get type() {
        return UrlbarUtils.PROVIDER_TYPE.HEURISTIC;
      }

      /**
       * Whether this provider should be invoked for the given context.
       * If this method returns false, the providers manager won't start a query
       * with this provider, to save on resources.
       * @param {UrlbarQueryContext} queryContext The query context object.
       * @returns {boolean} Whether this provider should be invoked for the search.
       */
      isActive(queryContext) {
        return (
          (!queryContext.restrictSource ||
            queryContext.restrictSource == UrlbarTokenizer.RESTRICT.BOOKMARK) &&
          !queryContext.searchMode &&
          queryContext.tokens.length
        );
      }

      /**
       * This is where your bookmark keyword code is executed when you pick the
       * result. You have access to 4 parameters, plus the user-typed string.
       * You don't care about result since that's where your code is. The event
       * parameter is how you can identify whether modifier keys are pressed,
       * whether the element was clicked or activated by keypress, etc. You also
       * have access to the urlbar result element and the browser argument. The
       * browser argument always refers to the selected browser except when this
       * is activated during navigation. So if you're going to use
       * gBrowser.selectedBrowser in your code, you should just use browser
       * instead. That might prevent some obscure bugs for you. As for the
       * element parameter, this is pretty much useless because it's not always
       * passed. If you really need to do something with the result element, I
       * suggest using this: gURLBar.view._rows.children[result.rowIndex]
       * @param {UrlbarResult} result The result that was picked.
       * @param {Event} event The event that picked the result.
       * @param {DOMElement} element The picked view element, if available.
       * @param {object} browser The browser to use for the load.
       */
      pickResult(result, event, element, browser) {
        try {
          eval(result.payload.url.replace(/^ucjs:/, ""));
        } catch (e) {
          console.error(`Error in bookmark keyword :>> ${e}`);
          console.error(
            `Bookmark keyword parsed source :>> ${result.payload.url}`
          );
        }
      }

      /**
       * Starts querying.
       * @param {object} queryContext The query context object.
       * @param {function} addCallback Callback invoked by the provider to add a new result.
       */
      async startQuery(queryContext, addCallback) {
        let keyword = queryContext.tokens[0]?.value;

        let searchString = UrlbarUtils.substringAfter(
          queryContext.searchString,
          keyword
        ).trim();
        let {
          entry,
          url,
          postData,
          ucjs,
          hadPlaceholder,
        } = await this.getBindableKeyword(keyword, searchString);
        if (!entry || !url) {
          return;
        }

        let uri = entry.url ?? new URL(url);
        let title;
        let prefix;
        let icon;
        let inputHighlight;

        if (ucjs) {
          let bm = await PlacesUtils.bookmarks.fetch({ url: uri });
          prefix = bm.title;
          icon = config["Result icon URL"];
        } else {
          prefix = uri.host;
          icon = UrlbarUtils.getIconForUrl(uri);
        }

        if (prefix && searchString && (hadPlaceholder || !ucjs)) {
          let format = (val1, val2) =>
            UrlbarUtils.strings.formatStringFromName("bookmarkKeywordSearch", [
              val1,
              val2,
            ]);
          let typedValue = queryContext.tokens
            .slice(1)
            .map(t => t.value)
            .join(" ");
          title = format(prefix, typedValue);
          inputHighlight = {
            title: [[prefix.length + format("", "").length, typedValue.length]],
          };
        } else {
          title = ucjs && prefix ? prefix : UrlbarUtils.unEscapeURIForUI(url);
        }

        let [payload, highlights] = [
          ...UrlbarResult.payloadAndSimpleHighlights(queryContext.tokens, {
            title: [title, UrlbarUtils.HIGHLIGHT.TYPED],
            url: [url, UrlbarUtils.HIGHLIGHT.TYPED],
            keyword,
            input: queryContext.searchString,
            postData,
            icon,
            ucjs,
          }),
        ];

        let result = new UrlbarResult(
          UrlbarUtils.RESULT_TYPE.KEYWORD,
          UrlbarUtils.RESULT_SOURCE.BOOKMARKS,
          payload,
          inputHighlight ?? highlights
        );
        result.heuristic = true;
        addCallback(this, result);
      }

      /**
       * Returns a set of parameters if a keyword is registered and the search
       * string can be bound to it. For browser chrome keyword bookmarks, the
       * URL doesn't have to accept a search string.
       * @param {string} keyword The typed keyword.
       * @param {string} searchString The full search string, including the keyword.
       * @returns { entry, url, postData }
       */
      async getBindableKeyword(keyword, searchString) {
        let entry = await PlacesUtils.keywords.fetch(keyword);
        if (!entry) return {};
        if (entry.url.protocol === "ucjs:" && !entry.postData) {
          let hadPlaceholder = false;
          let url = entry.url.href.replace(
            config["Search string placeholder"],
            () => {
              hadPlaceholder = true;
              return searchString;
            }
          );
          return {
            entry,
            ucjs: true,
            url,
            hadPlaceholder,
            postData: entry.postData,
          };
        }
        try {
          let [url, postData] = await KeywordUtils.parseUrlAndPostData(
            entry.url.href,
            entry.postData,
            searchString
          );
          return { entry, url, postData };
        } catch (ex) {
          return {};
        }
      }
    }

    UrlbarProviderBookmarkKeywords = new BrowserChromeBookmarkKeywords();
    UrlbarProvidersManager.registerProvider(UrlbarProviderBookmarkKeywords);
  }

  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
