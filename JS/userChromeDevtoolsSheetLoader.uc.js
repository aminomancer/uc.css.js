// ==UserScript==
// @name           Browser Toolbox Stylesheet Loader
// @version        2.1.4
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @description    Load userChrome and userContent stylesheets into Browser Toolbox windows.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/userChromeDevtoolsSheetLoader.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/userChromeDevtoolsSheetLoader.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

let EXPORTED_SYMBOLS = [];
(function() {
  class ToolboxProcessSheetLoader {
    regex = /^chrome:(\/\/devtools\/.*.html.*)/i;
    lastSubject = null;
    constructor() {
      Services.obs.addObserver(this, "domwindowopened");
    }
    traverseToMainProfile(win, str) {
      let dir = Services.dirsvc.get(str, win.Ci.nsIFile);
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
    getChromePath(win) {
      return Services.io
        .getProtocolHandler("file")
        .QueryInterface(win.Ci.nsIFileProtocolHandler)
        .getURLSpecFromDir(this.traverseToMainProfile(win, "UChrm"));
    }
    isDevtools(win) {
      return (
        Services.dirsvc
          .get("UChrm", Ci.nsIFile)
          .target.includes("chrome_debugger_profile") &&
        this.regex.test(win.location.href)
      );
    }
    loadSheet(win, path, name, type) {
      let sss = win.Cc["@mozilla.org/content/style-sheet-service;1"].getService(
        win.Ci.nsIStyleSheetService
      );
      let uri = win.Services.io.newURI(path + name);
      if (!sss.sheetRegistered(uri, sss[type])) {
        sss.loadAndRegisterSheet(uri, sss[type]);
      }
    }
    observe(sub) {
      if (this.lastSubject === sub) return;
      this.lastSubject = sub;
      sub.addEventListener("DOMContentLoaded", this, true, { once: true });
    }
    handleEvent(e) {
      switch (e.type) {
        case "DOMContentLoaded":
          this._onContentLoaded(e);
          break;
      }
    }
    _onContentLoaded(e) {
      let document = e.originalTarget;
      let win = document.defaultView;
      this.lastSubject.removeEventListener("DomContentLoaded", this, true);
      if (!this.isDevtools(win)) return;
      const path = this.getChromePath(win);
      this.loadSheet(win, path, "userChrome.css", "AUTHOR_SHEET");
      this.loadSheet(win, path, "userContent.css", "USER_SHEET");
    }
  }

  new ToolboxProcessSheetLoader();
})();
