// ==UserScript==
// @name           Extension Stylesheet Loader
// @version        1.1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Allows users to share stylesheets for webextensions without
// needing to edit the URL. This works by creating an actor in every extension
// browser that sets an attribute on the root element to expose the addon's ID
// to user stylesheets. This means we can use the addon's ID instead of
// @-moz-document url(). That is good because addons' URLs are randomly
// generated upon install, meaning the URLs I specify in
// resources/in-content/ext-*.css will not be the same as yours, so they will
// not work for you. You can also use this in combination with my
// debugExtensionInToolbarContextMenu.uc.js to add your own style rules for
// extension content. Once you have that script installed, you can right-click
// an addon's toolbar button > Debug Extension > Copy ID. Then, in
// userContent.css, add a rule like :root[uc-extension-id="example@aminomancer"]{color:red}
// Keep in mind, the ID is not the same as the URL. That's why this script is
// necessary in the first place. URLs are random, unique, and per-install.
// Conversely, an extension's ID is permanent and universal, but potentially not
// unique, in that two authors could potentially make extensions with the same
// ID. I haven't seen this before but it's possible, in principle. If you need
// to, you can find the ID by navigating to about:debugging#/runtime/this-firefox
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// @startup        extensionStylesheetLoader
// @onlyonce
// ==/UserScript==

class ExtensionStylesheetLoader {
  constructor() {
    this.setup();
  }
  async setup() {
    // make a temp directory for our child file
    const registrar = Components.manager.QueryInterface(Ci.nsIComponentRegistrar);
    let tempDir = Services.dirsvc.get("UChrm", Ci.nsIFile);
    tempDir.append(".ExtensionStylesheetLoader");
    let { path } = tempDir;
    await IOUtils.makeDirectory(path, { ignoreExisting: true, createAncestors: false });
    // hide the temp dir on windows so it doesn't get in the way of user
    // activities or prevent its eventual deletion.
    if (AppConstants.platform === "win") {
      await IOUtils.setWindowsAttributes?.(path, { hidden: true });
    }
    this.tempPath = path;

    // create a manifest file that registers a URI for
    // chrome://uc-extensionstylesheetloader/content/
    this.manifestFile = await this.createTempFile(`content uc-extensionstylesheetloader ./`, {
      name: "ucsss",
      type: "manifest",
    });
    this.childFile = await this.createTempFile(
      `"use strict";const{WebExtensionPolicy}=Cu.getGlobalForObject(Services);export class ExtensionStylesheetLoaderChild extends JSWindowActorChild{handleEvent(e){let policy=WebExtensionPolicy.getByHostname(this.document.location.hostname);if(policy&&policy.id)this.document.documentElement.setAttribute("uc-extension-id",policy.id)}}`,
      { name: "ExtensionStylesheetLoaderChild", type: "sys.mjs" }
    );

    tempDir.append(this.manifestFile.name);
    if (tempDir.exists()) registrar.autoRegister(tempDir);
    else return;
    ChromeUtils.registerWindowActor("ExtensionStylesheetLoader", {
      child: {
        esModuleURI: this.childFile.url,
        events: { DOMDocElementInserted: {} },
      },
      allFrames: true,
      matches: ["moz-extension://*/*"],
      messageManagerGroups: ["browsers", "webext-browsers", "sidebars"],
    });
    // listen for application quit so we can clean up the temp files.
    Services.obs.addObserver(this, "quit-application");
  }
  /**
   * create a file in the temp folder
   * @param {string} contents (the actual file contents in UTF-8)
   * @param {object} options (an optional object containing properties path or
   *                         name. path creates a file at a specific absolute
   *                         path. name creates a file of that name in the
   *                         chrome/.ExtensionStylesheetLoader folder.
   *                         if omitted, it will create
   *                         chrome/.ExtensionStylesheetLoader/uc-temp)
   * @returns {object} (an object containing the filename and
   *                   a chrome:// URL leading to the file)
   */
  async createTempFile(contents, options = {}) {
    let { path = null, name = "uc-temp", type = "txt" } = options;
    const uuid = Services.uuid.generateUUID().toString();
    name += "-" + uuid + "." + type;
    if (!path) {
      let dir = Services.dirsvc.get("UChrm", Ci.nsIFile);
      dir.append(".ExtensionStylesheetLoader");
      dir.append(name);
      path = dir.path;
    }
    await IOUtils.writeUTF8(path, contents);
    let url = "chrome://uc-extensionstylesheetloader/content/" + name;
    return { name, url };
  }
  // application quit listener. clean up the temp files.
  observe(subject, topic, data) {
    switch (topic) {
      case "quit-application":
        Services.obs.removeObserver(this, "quit-application");
        this.cleanup();
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
}

_ucUtils.sharedGlobal.extensionStylesheetLoader = {
  _startup: () => {},
};

if (location.href === AppConstants.BROWSER_CHROME_URL) new ExtensionStylesheetLoader();
