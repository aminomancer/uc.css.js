// ==UserScript==
// @name           about:userchrome
// @version        1.1.7
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
A manager for your userscripts. This allows you to automatically update scripts that include an updateURL or downloadURL field in their script metadata. Requires the content in [resources/aboutuserchrome][] to function. Visit about:userchrome to get started.

[resources/aboutuserchrome]: https://github.com/aminomancer/uc.css.js/tree/master/resources/aboutuserchrome
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutUserChrome.sys.mjs
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/aboutUserChrome.sys.mjs
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";

const lazy = {};
try {
  ChromeUtils.defineESModuleGetters(lazy, {
    AppMenuNotifications: "resource://gre/modules/AppMenuNotifications.sys.mjs",
    gScriptUpdater:
      "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs",
    PREF_NOTIFICATIONS_ENABLED:
      "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs",
    UPDATE_CHANGED_TOPIC:
      "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs",
  });
  XPCOMUtils.defineLazyModuleGetters(lazy, {
    EveryWindow: "resource:///modules/EveryWindow.jsm",
  });
} catch (error) {
  console.error(error);
}

const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
const chromeRegistry = Cc["@mozilla.org/chrome/chrome-registry;1"].getService(
  Ci.nsIChromeRegistry
);
const fphs = Cc["@mozilla.org/network/protocol;1?name=file"].getService(
  Ci.nsIFileProtocolHandler
);

function findResources() {
  let url = "chrome://userchrome/content/aboutuserchrome/aboutuserchrome.html";
  let uri = Services.io.newURI(url);
  let fileUri = chromeRegistry.convertChromeURL(uri);
  let file = fphs.getFileFromURLSpec(fileUri.spec).QueryInterface(Ci.nsIFile);
  if (file.exists()) return url;
  // eslint-disable-next-line no-console
  console.warn(
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
  // Register the about:userchrome page.
  registrar.registerFactory(
    generateFreeCID(),
    "about:userchrome",
    "@mozilla.org/network/protocol/about;1?what=userchrome",
    AboutModuleFactory
  );
}

function initUserChromeNotifications() {
  let gUserChromeNotifications;
  let gStylesheet;
  try {
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    gStylesheet = sss.preloadSheet(
      Services.io.newURI(
        "chrome://userchrome/content/aboutuserchrome/chrome/userchrome-notifications.css"
      ),
      sss.AUTHOR_SHEET
    );
  } catch (error) {
    console.error(`Failed to load aboutUserChrome stylesheet: ${error.name}`); // eslint-disable-line no-console
  }

  /** Per-window class to handle app menu banners. */
  class UserChromeWindowNotifications {
    /** @param {Window} win chrome window */
    constructor(win) {
      this.win = win;
      if (!win._ucUtils) return;
      this.utils = win._ucUtils;
      if (win.gBrowserInit.delayedStartupFinished) {
        this.#init();
      } else {
        Services.obs.addObserver(this, "browser-delayed-startup-finished");
        this.#waitingForStartup = true;
      }
    }

    #init() {
      if (this.#initialized) return;
      if (!gUserChromeNotifications) {
        gUserChromeNotifications = new UserChromeNotifications(this.utils);
      }
      Services.obs.addObserver(this, lazy.UPDATE_CHANGED_TOPIC);
      try {
        this.win.windowUtils.addSheet(
          gStylesheet,
          Ci.nsIDOMWindowUtils.AUTHOR_SHEET
        );
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to load aboutUserChrome stylesheet: ${error.name}`
        );
      }
      this.#updateBanner();
      this.#addEntryPoints();
      this.#initialized = true;
    }

    uninit() {
      if (this.#waitingForStartup) {
        Services.obs.removeObserver(this, "browser-delayed-startup-finished");
      }
      if (this.#initialized) {
        Services.obs.removeObserver(this, lazy.UPDATE_CHANGED_TOPIC);
      }
    }

    observe(subject, topic, data) {
      switch (topic) {
        case lazy.UPDATE_CHANGED_TOPIC:
          this.#updateBanner();
          break;
        case "browser-delayed-startup-finished":
          Services.obs.removeObserver(this, topic);
          this.#waitingForStartup = false;
          this.#init();
          break;
      }
    }

    #updateBanner() {
      let { notificationId } = gUserChromeNotifications;
      if (notificationId) {
        if (!this.#banner) {
          let sibling = this.win.PanelMultiView.getViewNode(
            this.win.document,
            "appMenu-proton-update-banner"
          );
          let banner = sibling.ownerDocument.createXULElement("toolbarbutton");
          banner.className = "panel-banner-item subviewbutton";
          banner.id = "userChromeManager-notification";
          banner.setAttribute("wrap", "true");
          banner.setAttribute(
            "oncommand",
            `if (this.getAttribute("notificationid") === "script-updates-restart") {
            setTimeout(() => _ucUtils.restart(true), 300);
            PanelMultiView.forNode(this.closest("panelmultiview")).hidePopup();
          } else {
            switchToTabHavingURI("about:userchrome", true);
          }
          event.preventDefault();`
          );
          this.#setBannerAttributes(banner, notificationId);
          sibling.after(banner);
          this.#banner = banner;
        } else {
          this.#setBannerAttributes(this.#banner, notificationId);
        }
      } else if (this.#banner) {
        this.#banner.remove();
        this.#banner = null;
      }
    }

    /**
     * Set the banner text and notificationid attribute.
     * @param {Element} banner The banner to update
     * @param {string} notification The notification id to set
     */
    #setBannerAttributes(banner, notification) {
      if (banner.getAttribute("notificationid") === notification) return;
      let text =
        notification === "script-updates-available"
          ? "Script updates available"
          : "Restart to update scripts";
      banner.setAttribute("label", text);
      banner.setAttribute("notificationid", notification);
    }

    #addEntryPoints() {
      // Add menu item to the Tools menu
      let addonsItem = this.win.document.getElementById("menu_openAddons");
      let item = this.utils.createElement(this.win.document, "menuitem", {
        id: "menu_openUserChrome",
        label: "UserChrome Manager",
        accesskey: "U",
        key: "key_openAboutUserchrome",
        oncommand: `switchToTabHavingURI("about:userchrome", true)`,
      });
      addonsItem.after(item);

      // Add button to the app menu
      let addonsButton = this.win.PanelMultiView.getViewNode(
        this.win.document,
        "appMenu-extensions-themes-button"
      );
      let button = this.utils.createElement(
        addonsButton.ownerDocument,
        "toolbarbutton",
        {
          id: "appMenu-userChrome-button",
          class: "subviewbutton",
          label: "UserChrome Manager",
          key: "key_openAboutUserchrome",
          oncommand: `switchToTabHavingURI("about:userchrome", true)`,
        }
      );
      addonsButton.after(button);

      // Add a hotkey to open the manager
      this.utils.registerHotkey(
        { modifiers: "accel shift", key: "U", id: "key_openAboutUserchrome" },
        win => {
          if (win === this.win) {
            this.win.switchToTabHavingURI("about:userchrome", true);
          }
        }
      );
    }

    #banner;
    #initialized = false;
    #waitingForStartup = false;
  }

  /** Singleton class to handle badge notifications. */
  class UserChromeNotifications {
    /**
     * @param {Object} utils The _ucUtils object fx-autoconfig defines on each
     *   chrome window. This is used to get the script data and header parsing
     *   behavior. fx-autoconfig only exposes this to windows, so to use it from
     *   this module context we have to pass it in.
     */
    constructor(utils) {
      this.utils = utils;
      Services.obs.addObserver(this, lazy.UPDATE_CHANGED_TOPIC);
      utils.getScriptData().forEach(script => {
        lazy.gScriptUpdater.getHandle(script).checkRemoteFile();
      });
      this.#updateBadge();
      this.#warnOnMismatchedVersions();
    }

    observe(subject, topic, data) {
      if (topic === lazy.UPDATE_CHANGED_TOPIC) this.#updateBadge();
    }

    #updateBadge() {
      let { notificationId } = this;
      if (!notificationId) {
        lazy.AppMenuNotifications.removeNotification(
          "script-updates-available"
        );
        lazy.AppMenuNotifications.removeNotification("script-updates-restart");
      } else if (notificationId === "script-updates-restart") {
        lazy.AppMenuNotifications.removeNotification(
          "script-updates-available"
        );
        lazy.AppMenuNotifications.showBadgeOnlyNotification(notificationId);
      } else {
        lazy.AppMenuNotifications.removeNotification("script-updates-restart");
        lazy.AppMenuNotifications.showBadgeOnlyNotification(notificationId);
      }
    }

    get notificationId() {
      let { handles } = lazy.gScriptUpdater;
      let updates = handles.filter(handle => {
        if (!handle.remoteFile || handle.writing || handle.updateError) {
          return false;
        }
        let remoteScriptData = this.utils.parseStringAsScriptInfo(
          handle.filename,
          handle.remoteFile
        );
        let newVersion = remoteScriptData.version;
        return Services.vc.compare(newVersion, handle.currentVersion) > 0;
      });
      if (!updates.length) {
        return null;
      }
      if (updates.every(handle => handle.pendingRestart)) {
        return "script-updates-restart";
      }
      return "script-updates-available";
    }

    async #warnOnMismatchedVersions() {
      if (!this.utils) return;
      let chromeUri = Services.io.newURI(
        "chrome://userchrome/content/aboutuserchrome/src/aboutuserchrome.json"
      );
      let fileUri = chromeRegistry.convertChromeURL(chromeUri);
      let file = fphs
        .getFileFromURLSpec(fileUri.spec)
        .QueryInterface(Ci.nsIFile);

      let resourceVersion = "unknown";
      if (file.exists()) {
        try {
          let data = await IOUtils.readUTF8(file.path);
          let json = JSON.parse(data);
          resourceVersion = json.version;
        } catch (error) {}
      } else {
        // Check for version file in pre-1.1.7 location
        let oldFile = file.parent.clone();
        oldFile.append("VERSION");
        if (oldFile.exists()) {
          try {
            let data = await IOUtils.readUTF8(oldFile.path);
            resourceVersion = data.trim();
          } catch (error) {}
        }
      }

      let scriptVersion = "unknown";
      let script = this.utils
        .getScriptData()
        .find(script => script.name === "about:userchrome");
      if (script) scriptVersion = script.version;

      let warning;
      let repoURL = "https://github.com/aminomancer/uc.css.js";
      switch (Services.vc.compare(resourceVersion, scriptVersion)) {
        case 1:
          warning = `The version of aboutUserChrome.sys.mjs is ${scriptVersion}, but the version of the resource files is ${resourceVersion}. Update the script to the latest version from ${repoURL}/blob/master/JS/aboutUserChrome.sys.mjs`;
          break;
        case -1:
          warning = `The version of aboutUserChrome.sys.mjs is ${scriptVersion}, but the version of the resource files is ${resourceVersion}. Update the resource files to the latest version from ${repoURL}/tree/master/resources/aboutuserchrome`;
          break;
        case 0:
          if (resourceVersion === "unknown" && scriptVersion === "unknown") {
            warning = `Could not determine the version of aboutUserChrome.sys.mjs or the resource files. Make sure you have the latest version of both from ${repoURL}`;
            break;
          }
        // Fall through
        default:
          return;
      }

      // eslint-disable-next-line no-console
      console.warn(warning);
    }
  }

  // Setup for each window.
  lazy.EveryWindow.registerCallback(
    "userChromeNotifications",
    win => {
      win.userChromeWindowNotifications = new UserChromeWindowNotifications(
        win
      );
    },
    win => {
      win.userChromeWindowNotifications.uninit();
    }
  );
}

const defaultPrefs = Services.prefs.getDefaultBranch("");
defaultPrefs.setBoolPref(lazy.PREF_NOTIFICATIONS_ENABLED, true);

if (Services.prefs.getBoolPref(lazy.PREF_NOTIFICATIONS_ENABLED, true)) {
  initUserChromeNotifications();
}
