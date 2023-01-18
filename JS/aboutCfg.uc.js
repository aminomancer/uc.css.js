// ==UserScript==
// @name           about:cfg
// @version        1.2.6
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Registers the old-school <about:config> page to the URL <about:cfg>. Intended for use with earthlng's [aboutconfig module][]. That module restores the old about:config page, and now includes a version of this script, but that version isn't compatible with fx-autoconfig. This script finds the URL for that module and registers it to an about: URL so it counts as a chrome UI page.

We're not just faking it, this makes it a bona-fide about: page. That means you can navigate to it by just typing about:cfg in the urlbar, and also means the identity icon will show it as a secure system page rather than a local file. It even means about:cfg will show up on the about:about page!

This technically also makes using the aboutconfig module safer, because it denies the document access to some privileged stuff that it would have with a `chrome://` URI. For instructions on installing earthlng's aboutconfig module for fx-autoconfig, please see the script description for [App Menu about:config Button][appMenuAboutConfigButton].

This has only been tested with fx-autoconfig, but it may work with xiaoxiaoflood's loader. I don't think it will work with Alice0775's loader but I haven't tested it.

Compatible with my [appMenuAboutConfigButton][] script. That button will automatically navigate to <about:cfg> if this script is installed. I recommend editing earthlng's config.xhtml file to remove line 13: `title="about:config"` This sets the tab title to `about:config`, which isn't necessary or desirable since we're changing the URL to `about:cfg`. Without the title attribute, firefox will automatically set the title to the tab's URL, which (with this script) is `about:cfg`.

[aboutconfig module]: https://github.com/earthlng/aboutconfig
[appMenuAboutConfigButton]: https://github.com/aminomancer/uc.css.js#app-menu-aboutconfig-button
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutCfg.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutCfg.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

let { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");

/**
 * @settings (edit in about:config):
 *
 * @setting aboutCfg.address
 * @description the value to put after "about:". if this is "cfg" then the final
 * URl will be "about:cfg". if you use this and my appMenuAboutConfigButton
 * script, and you want to change this address for whatever reason, be sure to
 * edit the urlOverride setting in that script so it says
 * "about:your-new-address"
 *
 * @setting aboutCfg.pathOverride
 * @description the script tries to automatically find earthlng's aboutconfig
 * URL, e.g. "chrome://userchrome/content/aboutconfig/config.xhtml" if you
 * followed the instructions on my repo for making it compatible with
 * fx-autoconfig. alternatively, it should also be able to find the URL if you
 * use earthlng's autoconfig loader or xiaoxiaoflood's, and didn't modify
 * anything. if it's unable to find the URL for your particular setup, please
 * find it yourself and paste it in the pref in about:config.
 */
const defaultPrefs = Services.prefs.getDefaultBranch("");
defaultPrefs.setBoolPref("aboutCfg.address", "cfg");
defaultPrefs.setBoolPref("aboutCfg.pathOverride", "");
const config = {
  address: Services.prefs.getStringPref("aboutCfg.address", "cfg"),
  pathOverride: Services.prefs.getStringPref("aboutCfg.pathOverride", ""),
};

let registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);

function findAboutConfig() {
  if (config.pathOverride) return config.pathOverride;
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
  return false;
}

// generate a unique ID on every app launch. protection against the very
// unlikely possibility that a future update adds a component with the same
// class ID, which would break the script.
function generateFreeCID() {
  let uuid = Components.ID(Services.uuid.generateUUID().toString());
  // I can't tell whether generateUUID is guaranteed to produce a unique ID, or
  // just a random ID. so I add this loop to regenerate it in the extremely
  // unlikely (or potentially impossible) event that the UUID is already
  // registered as a CID.
  while (registrar.isCIDRegistered(uuid)) {
    uuid = Components.ID(Services.uuid.generateUUID().toString());
  }
  return uuid;
}

function VintageAboutConfig() {}

let urlString = findAboutConfig();

VintageAboutConfig.prototype = {
  get uri() {
    if (!urlString) return null;
    return this._uri || (this._uri = Services.io.newURI(urlString));
  },
  newChannel(_uri, loadInfo) {
    const ch = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
    ch.owner = Services.scriptSecurityManager.getSystemPrincipal();
    return ch;
  },
  getURIFlags(_uri) {
    return (
      Ci.nsIAboutModule.ALLOW_SCRIPT | Ci.nsIAboutModule.IS_SECURE_CHROME_UI
    );
  },
  getChromeURI(_uri) {
    return this.uri;
  },
  QueryInterface: ChromeUtils.generateQI(["nsIAboutModule"]),
};

var AboutModuleFactory = {
  createInstance(aIID) {
    return new VintageAboutConfig().QueryInterface(aIID);
  },
  QueryInterface: ChromeUtils.generateQI(["nsIFactory"]),
};

if (urlString) {
  registrar.registerFactory(
    generateFreeCID(),
    `about:${config.address}`,
    `@mozilla.org/network/protocol/about;1?what=${config.address}`,
    AboutModuleFactory
  );
}

let EXPORTED_SYMBOLS = [];
