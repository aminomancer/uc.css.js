// ==UserScript==
// @name           about:userchrome
// @version        1.0.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    A manager for your userscripts. This allows you to automatically update scripts that include an updateURL or downloadURL field in their script metadata. Requires the content in `/resources/aboutuserchrome/` to function. Visit about:userchrome to get started.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutUserChrome.sys.mjs
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutUserChrome.sys.mjs
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

// user configuration
const config = {
  // The value to put after "about:" - if this is "userchrome" then the final
  // URL will be "about:userchrome"
  address: "userchrome",

  // The script tries to locate the page content in `resources/aboutuserchrome/`,
  // resulting in a URL like `chrome://userchrome/content/aboutuserchrome/aboutuserchrome.html`
  // If you need to use a different URL, you can specify it here.
  urlOverride: "",
};

let { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
let { manager: Cm } = Components;
let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
let chromeRegistry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(
  Ci.nsIChromeRegistry
);
let fphs = Cc["@mozilla.org/network/protocol;1?name=file"].getService(
  Ci.nsIFileProtocolHandler
);

function findResources() {
  if (config.urlOverride) return config.urlOverride;
  let url =
    config.urlOverride ||
    "chrome://userchrome/content/aboutuserchrome/aboutuserchrome.html";
  let uri = Services.io.newURI(url);
  let fileUri = chromeRegistry.convertChromeURL(uri);
  let file = fphs.getFileFromURLSpec(fileUri.spec).QueryInterface(Ci.nsIFile);
  if (file.exists()) return url;
  Cu.reportError(
    `about:userchrome source files not found.
Please download them from https://github.com/aminomancer/uc.css.js/tree/master/resources/aboutuserchrome`
  );
  return false;
}

function generateFreeCID() {
  let uuid = Components.ID(Services.uuid.generateUUID().toString());
  while (registrar.isCIDRegistered(uuid)) {
    uuid = Components.ID(Services.uuid.generateUUID().toString());
  }
  return uuid;
}

function AboutUserChrome() {}

let urlString = findResources();

AboutUserChrome.prototype = {
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
    return new AboutUserChrome().QueryInterface(aIID);
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
