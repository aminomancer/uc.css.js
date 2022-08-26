// ==UserScript==
// @name           Agent/Author Sheet Loader
// @version        2.6
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Load *.ag.css files as agent sheets and *.au.css files as
// author sheets. Will also load *.us.css files as user sheets, in case you ever
// need that for some reason. This loader is capable of loading stylesheets into
// browser toolbox windows, but it will not try to load userChrome.css or
// userContent.css in the browser toolbox. For that you will need
// userChromeDevtoolsSheetLoader.uc.js instead.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

let EXPORTED_SYMBOLS = [];
(function() {
  const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  function traverseToMainProfile(str) {
    let dir = Services.dirsvc.get(str, Ci.nsIFile);
    if (!dir.exists()) {
      let toAddChrome = false;
      while (dir.target.includes("chrome_debugger_profile")) {
        dir = dir.parent;
        toAddChrome = true;
      }
      if (toAddChrome) dir.append("chrome");
    }
    return dir;
  }

  let chromeDir = traverseToMainProfile("UChrm");
  let files = chromeDir.directoryEntries.QueryInterface(Ci.nsISimpleEnumerator);
  if (!files) return;
  while (files.hasMoreElements()) {
    let file = files.getNext().QueryInterface(Ci.nsIFile);
    let name = file.leafName;
    if (!file.isFile()) continue;
    if (/\.(?:au||ag||us)\.css$/i.test(name)) {
      let typePrefix = name.split(".")[1];
      let type, typeString;
      switch (typePrefix) {
        case "au":
          type = sss.AUTHOR_SHEET;
          typeString = "author sheet";
          break;
        case "ag":
          type = sss.AGENT_SHEET;
          typeString = "agent sheet";
          break;
        case "us":
          type = sss.USER_SHEET;
          typeString = "user sheet";
          break;
      }
      let uri = Services.io
        .getProtocolHandler("file")
        .QueryInterface(Ci.nsIFileProtocolHandler)
        .getURLSpecFromDir(chromeDir);
      try {
        sss.loadAndRegisterSheet(Services.io.newURI(uri + name), type);
        console.info(`Loaded ${typeString}: ${name}`);
      } catch (e) {
        console.error(`Could not load ${name}: ${e.name}`);
      }
    }
  }
})();
