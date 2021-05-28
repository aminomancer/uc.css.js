// ==UserScript==
// @name           about:cfg
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Registers the old-school about:config page to the URL about:cfg. Intended for use with earthlng's aboutconfig module. That module restores the old about:config page, but gives it a long-winded URL like "chrome://userchromejs/content/aboutconfig/config.xhtml" which takes a lot longer to type in and doesn't look very elegant. This script finds the URL for that module and registers it to an about: URL so it counts as a chrome UI page. We're not just faking it, this makes it a bona-fide about: page. That means you can navigate to it by just typing about:cfg in the urlbar, and also means the identity icon will show it as a secure system page rather than a local file. It even means about:cfg will show up on the about:about page! This technically also makes using the aboutconfig module safer, because it denies the document access to some privileged stuff that it would have with a chrome:// URI. For instructions on installing earthlng's aboutconfig module for fx-autoconfig, please see the script description for App Menu about:config Button. This has only been tested with fx-autoconfig, but it may work with xiaoxiaoflood's loader. I don't think it will work with Alice0775's loader but I haven't tested it. Compatible with my appMenuAboutConfigButton.uc.js script. That button will automatically navigate to about:cfg if this script is installed. I recommend editing earthlng's config.xhtml file to remove line 13: title="about:config" This sets the tab title to about:config, which isn't necessary or desirable since we're changing the URL to about:cfg. Without the title attribute, firefox will automatically set the title to the tab's URL, which (with this script) is about:cfg.
// @backgroundmodule
// ==/UserScript==

// user configuration
const config = {
    urlOverride: "", // the script tries to automatically find earthlng's aboutconfig URL, e.g. "chrome://userchrome/content/aboutconfig/config.xhtml" if you followed the instructions on my repo for making it compatible with fx-autoconfig. alternatively, it should also be able to find the URL if you use earthlng's autoconfig loader or xiaoxiaoflood's, and didn't modify anything. if it's unable to find the URL for your particular setup, please find it yourself and paste it here, *inside the quotes*
};

let { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
let { classes: Cc, interfaces: Ci, manager: Cm, utils: Cu, results: Cr } = Components;
ChromeUtils.defineModuleGetter(this, "FileUtils", "resource://gre/modules/FileUtils.jsm");

function findAboutConfig() {
    if (config.urlOverride) return config.urlOverride;
    if (FileUtils.getDir("UChrm", ["resources", "aboutconfig", "config.xhtml"]).exists())
        return "chrome://userchrome/content/aboutconfig/config.xhtml";
    if (FileUtils.getDir("UChrm", ["utils", "aboutconfig", "config.xhtml"]).exists())
        return "chrome://userchromejs/content/aboutconfig/config.xhtml";
    if (FileUtils.getDir("UChrm", ["utils", "aboutconfig", "aboutconfig.xhtml"]).exists())
        return "chrome://userchromejs/content/aboutconfig/aboutconfig.xhtml";
}

function VintageAboutConfig() {}

VintageAboutConfig.prototype = {
    uri: Services.io.newURI(findAboutConfig()),
    newChannel: function (_uri, loadInfo) {
        const ch = Services.io.newChannelFromURIWithLoadInfo(this.uri, loadInfo);
        ch.owner = Services.scriptSecurityManager.getSystemPrincipal();
        return ch;
    },
    getURIFlags: function (_uri) {
        return Ci.nsIAboutModule.ALLOW_SCRIPT;
    },
    getChromeURI: function (_uri) {
        return this.uri;
    },
    QueryInterface: ChromeUtils.generateQI(["nsIAboutModule"]),
};

var AboutModuleFactory = {
    createInstance(aOuter, aIID) {
        if (aOuter) {
            throw Components.Exception("", Cr.NS_ERROR_NO_AGGREGATION);
        }
        return new VintageAboutConfig().QueryInterface(aIID);
    },
    QueryInterface: ChromeUtils.generateQI(["nsIFactory"]),
};

let registrar = Cm.QueryInterface(Ci.nsIComponentRegistrar);
registrar.registerFactory(
    Components.ID("{56388dad-287b-4240-a785-85c394012504}"),
    "about:cfg",
    "@mozilla.org/network/protocol/about;1?what=cfg",
    AboutModuleFactory
);

let onChromeWindow = {
    observe(win, _top, _data) {
        eval(
            "win.gIdentityHandler._secureInternalPages = " +
                `/${win.gIdentityHandler._secureInternalPages.source.replace(
                    /\|config\|/,
                    `|config|cfg|`
                )}/`
        );
    },
};
Services.obs.addObserver(onChromeWindow, "browser-delayed-startup-finished");

let EXPORTED_SYMBOLS = [];
