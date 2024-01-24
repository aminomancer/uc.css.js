// ==UserScript==
// @name           Search Mode Indicator Icons
// @version        1.5.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
Automatically replace the urlbar's identity icon with the current search engine's icon. Optionally replace the searchglass icon in regular search mode by dynamically retrieving icons from your [resources/engines][] folder. That means on the new tab page or when typing in the urlbar, instead of showing a searchglass icon it will show a Google icon if your default engine is Google; a Bing icon if your default engine is Bing; etc. Read the comments in the config section below for more details on adding your own engine icons.

Also optionally show any engine name in the urlbar placeholder, even if the engine was installed by an addon. By default, Firefox only shows your default engine's name in the placeholder if the engine was built into Firefox. With this script, the placeholder will include the name of your engine. This can be disabled and configured/restricted in the config section below.

The main feature (setting the identity icon to match the current engine in one-off search mode) also adds an `[engine]` attribute to the identity icon so you can customize the icons yourself if you don't like a search engine's icon, or want to adjust its dimensions. If you have google set to "goo" and type in goo then hit spacebar, the identity icon will change to a google icon. And it'll also gain an attribute reflecting that, so you can change its icon further with a CSS rule like:

```css
#identity-icon[engine="Tabs"] {
  list-style-image: url("chrome://browser/skin/tab.svg") !important;
}
```

This doesn't change anything about the layout so you may want to tweak some things in your stylesheet. For example I have mine set up so the tracking protection icon disappears while the user is typing in the urlbar, and so a little box appears behind the identity icon while in one-off search mode. This way the icon appears to the left of the label, like it does on about:preferences and other UI pages.

[resources/engines]: https://github.com/aminomancer/uc.css.js/tree/master/resources/engines
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/searchModeIndicatorIcons.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/searchModeIndicatorIcons.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  // user preferences. add these in about:config if you want them to persist
  // between script updates without having to reapply them.
  const config = {
    // when you type into the urlbar or open a new tab, the identity icon
    // (lock icon) is set to resemble a magnifying glass. historically my
    // theme has replaced this with a google logo, but I realized this is a
    // bit invasive since many firefox users avoid google like the plague.
    // however, I dislike the search icon since it makes the urlbar harder
    // to distinguish from the searchbar. so I set up this module to
    // dynamically check the user's default search engine and look for a
    // matching icon in the chrome/resources/engines/ folder. if you use my
    // theme, you'll already have this folder with several engine icons
    // included in it. if you don't use my theme, or if my theme doesn't
    // include an icon for your search engine, you can add one yourself by
    // placing it in chrome/resources/engines/ your icon file must have an
    // SVG, PNG, JPG, or JPEG file extension. use SVG for best visual
    // results. if other extensions work that I'm not aware of, make a
    // request on https://github.com/aminomancer/uc.css.js/issues
    // name the icon file according to this format:
    // engine name: "Google Search" => googlesearch.svg
    // engine name: "Google-Search" => google-search.svg
    // delete all spaces but don't delete anything else. the engine name refers
    // to whatever name appears in the search shortcuts list in
    // about:preferences#search (the table with engine names and keywords).
    // engine name is often the same as the name of the extension that created
    // the engine, but not always. so always check about:preferences#search to
    // get the actual name of the engine. keep in mind this feature is totally
    // separate from the rest of the script, which sets the identity icon in
    // *one-off* search mode, e.g., after clicking a one-off search engine
    // button. this setting affects the normal search mode. if you set this
    // setting to false, it will leave the searchglass as-is in normal mode, but
    // will still set icons in one-off search mode. the script achieves this
    // replacement by setting the value of a variable: --default-search-identity-icon
    // on its own, this doesn't do anything. if you don't have my theme duskFox,
    // you'll need to add some CSS to set the identity icon's URL to
    // var(--default-search-identity-icon) as you normally would to replace an
    // image. I do this with the following CSS rule:
    // #urlbar[pageproxystate="invalid"] #identity-box #identity-icon,
    // #tracking-protection-icon-container[hidden]
    //   ~ #identity-box[pageproxystate="valid"].notSecure:not(.chromeUI, .localResource)
    //   #identity-icon {
    //     list-style-image: var(--default-search-identity-icon,
    //                           url("chrome://userchrome/content/search-glass.svg")) !important;
    // }
    "Try to replace searchglass icon with engine icon in normal mode":
      Services.prefs.getBoolPref(
        "searchModeIndicatorIcons.replaceSearchGlass",
        true
      ),

    // by default, firefox ONLY shows your default search engine's name in the
    // urlbar placeholder text IF the engine is built into firefox, for example,
    // the default Google engine. if you switch your engine to an engine from an
    // extension or one you built yourself with "Add custom search engine", the
    // placeholder will just say "Search or enter address". this script changes
    // that. it will show the name in the placeholder even if the engine was
    // installed by the user. the extra settings below can add some restrictions
    // if you want.

    // it's possible for an extension to add an engine with any arbitrary name.
    // so if the developer is stupid, they could name an engine "Awesome Amazon
    // Search Extension OMGWTFBBQ" and then you could end up with a placeholder
    // that says "Search with Awesome Amazon Search Extension OMGWTFBBQ or enter
    // address". I imagine you can see the problem with that. so the following
    // setting will limit the number of characters: if the number of characters
    // in the engine's name is above the character limit, it will use the
    // generic placeholder instead. I think 25 is a good default limit. if you
    // don't want this limit at all, i.e., you're okay with arbitrarily long
    // engine names, set the value to -1 or 0
    "Engine name character limit": Services.prefs.getIntPref(
      "searchModeIndicatorIcons.engineNameCharLimit",
      25
    ),

    // an engine name might also have an unreasonable number of words (too many
    // spaces). again, if the engine name is "Awesome Amazon Search Extension
    // OMGWTFBBQ" it will go over the limit. and the script will default to the
    // generic placeholder "Search or enter address". increase the word limit by
    // changing the value 3 below. a value of -1 or 0 disables the limit
    // entirely.
    "Engine name word limit": Services.prefs.getIntPref(
      "searchModeIndicatorIcons.engineNameWordLimit",
      3
    ),
  };
  function init() {
    const defaultIcon = `chrome://global/skin/icons/search-glass.svg`;
    const searchModeIndicatorFocused = gURLBar._searchModeIndicatorTitle;
    const urlbar = gURLBar.textbox;
    const identityIcon = gURLBar._identityBox.firstElementChild;
    const oneOffs = gURLBar.view.oneOffSearchButtons;
    const { buttons } = oneOffs;
    // use an author sheet to set the identity icon equal to the search engine
    // icon when in search mode
    function registerSheet() {
      let css = `#urlbar[searchmode=""][pageproxystate="invalid"] #identity-box > #identity-icon-box > #identity-icon, #urlbar[searchmode=""][pageproxystate="valid"] #identity-box > #identity-icon-box > #identity-icon, #urlbar[searchmode=""] #identity-icon-box > #identity-icon, #urlbar[pageproxystate="invalid"] #identity-box > #identity-icon-box[engine] > #identity-icon, #urlbar[pageproxystate="valid"] #identity-box > #identity-icon-box[engine] > #identity-icon, #urlbar #identity-icon-box[engine] > #identity-icon {list-style-image: var(--search-engine-icon, url("${defaultIcon}"));}`;
      let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
        Ci.nsIStyleSheetService
      );
      let uri = makeURI(
        `data:text/css;charset=UTF=8,${encodeURIComponent(css)}`
      );
      if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }
    function handleDefaultEngine() {
      if (
        config[
          "Try to replace searchglass icon with engine icon in normal mode"
        ]
      ) {
        function findLocalEngineIcon(name) {
          const files = _ucUtils.fs.getEntry("engines");
          if (!files?.isDirectory()) return false;
          let nameParts = name
            .toLowerCase()
            .split(" ")
            .filter(word => word !== "search");
          let joinedName = nameParts.join("");
          if (!joinedName) return false;
          let typeRegex = /(.*)(\.svg|\.png|\.jpg|\.jpeg)$/i;
          let identical;
          let included;
          let partIncluded;
          for (let file of files) {
            let { leafName } = file;
            let fileParts = leafName.toLowerCase().match(typeRegex);
            if (file.isFile() && fileParts?.[1]) {
              if (joinedName === fileParts[1]) {
                identical = leafName;
                break;
              } else if (
                joinedName.includes(fileParts[1]) ||
                fileParts[1].includes(joinedName)
              ) {
                if (!included) included = leafName;
              } else if (fileParts[1].includes(nameParts[0])) {
                if (!partIncluded) partIncluded = leafName;
              }
            }
          }
          let filename = identical || included || partIncluded;
          return filename
            ? `url(chrome://userchrome/content/engines/${filename})`
            : false;
        }
        function findEngineIcon(name) {
          let localIcon = findLocalEngineIcon(name);
          if (localIcon) return localIcon;
          let engine = Services.search.getEngineByName(name);
          let installedIcon = engine?.iconURI?.spec;
          return installedIcon ? `url("${installedIcon}")` : false;
        }
        eval(
          `BrowserSearch._setURLBarPlaceholder = function ${BrowserSearch._setURLBarPlaceholder
            .toSource()
            .replace(/^_setURLBarPlaceholder/, "")
            .replace(
              /\}$/,
              `  let icon = findEngineIcon(name);\n    if (icon) document.documentElement.style.setProperty("--default-search-identity-icon", icon);\n    else document.documentElement.style.removeProperty("--default-search-identity-icon");\n}`
            )}`
        );
      }
      let placeholderString = `engine`;
      if (config["Engine name character limit"] > 0) {
        placeholderString += ` && engineName.length <= config["Engine name character limit"]`;
      }
      if (config["Engine name word limit"] > 0) {
        placeholderString += ` && engineName.split(" ").length <= config["Engine name word limit"]`;
      }
      if (BrowserSearch._updateURLBarPlaceholder.name) {
        eval(
          `BrowserSearch._updateURLBarPlaceholder = function ${BrowserSearch._updateURLBarPlaceholder
            .toSource()
            .replace(/^_updateURLBarPlaceholder/, "")
            .replace(/engine\.isAppProvided/, placeholderString)}`
        );
      }
      if (SearchUIUtils.updatePlaceholderNamePreference.name) {
        eval(
          `SearchUIUtils.updatePlaceholderNamePreference = function ${SearchUIUtils.updatePlaceholderNamePreference
            .toSource()
            .replace(/^updatePlaceholderNamePreference/, "")
            .replace(
              /engine\.isAppProvided/,
              placeholderString.replace(/engineName/g, "engine.name")
            )}`
        );
      }
      BrowserSearch.initPlaceHolder();
    }
    async function searchModeCallback(mus, _observer) {
      for (let mu of mus) {
        // since we're listening to the whole urlbar, check that the target is
        // one of the things we actually care about. alternatively we could have
        // set more specific nodes to observe and made multiple observers but i
        // think that's clunkier.
        if (
          mu.target === searchModeIndicatorFocused ||
          mu.target === urlbar ||
          buttons.contains(mu.target)
        ) {
          // a string representing the current engine if the indicator label has
          // any text, use that (this is almost always the case when we're
          // actually in search mode)
          let engineStr = searchModeIndicatorFocused.textContent || null;

          // if not, then it's possible we're in switchtab mode, which you may
          // never run into depending on your prefs. if certain prefs are
          // enabled, then you'll occasionally get regular search results
          // telling you to switch tabs. so we'll honor that, but the browser
          // also overrides the action of these results when holding down shift
          // or ctrl. (that's what "actionoverride" represents) so we're going
          // to honor that and only use the Tabs string if we're explicitly in
          // search mode, or if we're in switchtab mode and not holding down a
          // modifier key. for any other case, we just remove the engine
          // attribute, which can be styled by :not([engine]).
          let switchTab;
          if (!engineStr) {
            switchTab =
              urlbar.getAttribute("actiontype") === "switchtab" &&
              urlbar.getAttribute("actionoverride") !== "true";
          }
          if (switchTab) engineStr = "Tabs";

          // now actually set the attribute equal to the temporary string
          if (engineStr === null) identityIcon.removeAttribute("engine");
          else identityIcon.setAttribute("engine", engineStr);

          let url;
          // in switchtab mode we'll use the tab icon
          if (switchTab) {
            url = `chrome://browser/skin/tab.svg`;
          }
          // built-in engines don't have icons or engine names, they just have
          // integer sources. the icons are defined in browser.css so we'll use
          // those icons.
          else if (gURLBar.searchMode?.source) {
            let { BOOKMARKS, HISTORY, TABS, ACTIONS } =
              UrlbarUtils.RESULT_SOURCE;
            switch (gURLBar.searchMode.source) {
              case BOOKMARKS:
                url = `chrome://browser/skin/bookmark.svg`;
                break;
              case HISTORY:
                url = `chrome://browser/skin/history.svg`;
                break;
              case TABS:
                url = `chrome://browser/skin/tab.svg`;
                break;
              case ACTIONS:
                url = `chrome://browser/skin/quickactions.svg`;
                break;
            }
          }
          if (!url) {
            let engines = await Services.search.getVisibleEngines();
            // set a variable var(--search-engine-icon) equal to the engine's
            // icon, as a fallback if the user doesn't have CSS for the engine.
            // we prefer to set the icon with CSS because it allows the user to
            // adjust it and use a better icon than might be included with the
            // engine. so use the [engine="engine name"] attribute wherever
            // possible, but the following will handle situations where you
            // don't have a rule for the engine.
            let filterFn = gURLBar.searchMode?.engineName
              ? engine => engine._name === gURLBar.searchMode?.engineName
              : engine =>
                  engine._name === searchModeIndicatorFocused.textContent;
            let engine = engines.find(filterFn);
            // use the default icon if there is still no engine.
            url = (engine && engine._iconURI?.spec) || defaultIcon;
          }
          // set a CSS property instead of setting icon directly so user can
          // modify it with userChrome.css
          urlbar.style.setProperty("--search-engine-icon", `url("${url}")`);
        }
      }
    }
    registerSheet();
    handleDefaultEngine();
    new MutationObserver(searchModeCallback).observe(urlbar, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["actiontype", "searchmode", "actionoverride"],
    });
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
