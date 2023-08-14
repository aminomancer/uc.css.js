// ==UserScript==
// @name           App Menu about:config Button
// @version        1.2.5
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Adds an <about:config> shortcut button to the main app menu panel, under the built-in Settings button. It can open the built-in about:config page, or it can open the old-school about:config page with earthlng's [aboutconfig module][] To use that with fx-autoconfig, download ONLY the [profile/chrome/utils/aboutconfig][] folder and place it inside your `profile/chrome/resources` folder. Then open `config.xhtml` and find & replace `userchromejs` with `userchrome` and save. Now <chrome://userchrome/content/aboutconfig/config.xhtml> should be the correct URL.

By default the script will open to that link, so if you don't have that module installed the button will open to a blank page. If you can't get the module to work or if you just prefer Firefox's built-in page, you can change the constant on line 10 below to `about:config` and it'll open to the same page you'd get if you typed about:config in the address bar. (the URL must be in quotes) That said, typing about:config is already easy enough. The reason I made this script was to make a clean shortcut to reach the old-school page, and in a more central location than a bookmark. FYI I added an icon for this button (and for all the other main app menu buttons too) in [uc-app-menu.css][].

[aboutconfig module]: https://github.com/earthlng/aboutconfig
[profile/chrome/utils/aboutconfig]: https://github.com/earthlng/aboutconfig/tree/master/profile/chrome/utils/aboutconfig
[uc-app-menu.css]: https://github.com/aminomancer/uc.css.js/blob/master/uc-app-menu.css
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/appMenuAboutConfigButton.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/appMenuAboutConfigButton.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  /**
   * @settings (edit in about:config):
   *
   * @setting aboutCfg.pathOverride
   * @description the script tries to automatically find earthlng's aboutconfig
   * URL, and if it can't be found, uses the built-in about:config URL instead.
   * if it's unable to find the URL for your particular setup, or if you just
   * want to use the vanilla about:config page, replace this empty string with
   * your preferred URL, in quotes. if you want to use my about:cfg script that
   * registers earthlng's aboutconfig page to about:cfg, and you want the
   * about:config button to take you to about:cfg, then leave this empty. it
   * will automatically use about:cfg if the script exists. if about:cfg doesn't
   * work for you then change the pathOverride in *that* script instead of
   * setting urlOverride in this one. if you changed the address (the "cfg"
   * string) in that script, you'll need to use urlOverride here if you want the
   * button to direct to earthlng's aboutconfig page. so if for example you
   * changed the address to "config2" then change urlOverride above to
   * "about:config2"
   */
  Services.prefs.getDefaultBranch("").setBoolPref("aboutCfg.pathOverride", "");
  const config = {
    urlOverride: Services.prefs.getStringPref("aboutCfg.pathOverride", ""),
  };

  function findAboutConfig() {
    if (config.urlOverride) return config.urlOverride;

    if (
      Components.manager
        .QueryInterface(Ci.nsIComponentRegistrar)
        .isContractIDRegistered(
          "@mozilla.org/network/protocol/about;1?what=cfg"
        )
    ) {
      return "about:cfg";
    }

    let dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    let appendFn = nm => dir.append(nm);

    // fx-autoconfig
    ["resources", "aboutconfig", "config.xhtml"].forEach(appendFn);
    if (dir.exists()) {
      return "chrome://userchrome/content/aboutconfig/config.xhtml";
    }

    // earthlng's loader
    dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    ["utils", "aboutconfig", "config.xhtml"].forEach(appendFn);
    if (dir.exists()) {
      return "chrome://userchromejs/content/aboutconfig/config.xhtml";
    }

    // xiaoxiaoflood's loader
    dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    ["utils", "aboutconfig", "aboutconfig.xhtml"].forEach(appendFn);
    if (dir.exists()) {
      return "chrome://userchromejs/content/aboutconfig/aboutconfig.xhtml";
    }

    // no about:config replacement found
    return "about:config";
  }

  async function createButton() {
    // get fluent file for AboutConfig page
    const configStrings = await new Localization(
      ["toolkit/about/config.ftl"],
      true
    );
    // localize the "Advanced Preferences" string
    const advancedPrefsLabel = await configStrings.formatValue([
      "about-config-page-title",
    ]);
    const { mainView } = PanelUI;
    const doc = mainView.ownerDocument;
    const settingsButton =
      doc.getElementById("appMenu-settings-button") ??
      doc.getElementById("appMenu-preferences-button");
    const prefsButton = doc.createXULElement("toolbarbutton");

    prefsButton.preferredURL = findAboutConfig();
    for (const [key, val] of Object.entries({
      id: "appMenu-advanced-settings-button",
      class: "subviewbutton",
      label: advancedPrefsLabel,
      oncommand: `openTrustedLinkIn(this.preferredURL, gBrowser.currentURI.spec === AboutNewTab.newTabURL || gBrowser.currentURI.spec === HomePage.get(window) ? "current" : "tab")`,
    })) {
      prefsButton.setAttribute(key, val);
    }
    // place after the built-in "Settings" button
    settingsButton.after(prefsButton);
  }

  function init() {
    PanelMultiView.getViewNode(document, "appMenu-multiView").addEventListener(
      "ViewShowing",
      createButton,
      { once: true }
    );
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
