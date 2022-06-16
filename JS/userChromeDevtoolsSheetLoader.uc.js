// ==UserScript==
// @name           Browser Toolbox Stylesheet Loader
// @version        2.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Load userChrome and userContent stylesheets into Browser Toolbox windows
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

let EXPORTED_SYMBOLS = [];
(function () {
  const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
  class ToolboxProcessSheetLoader {
    constructor() {
      Services.obs.addObserver(this, "domwindowopened", false);
      this.regex = /^chrome:(\/\/devtools\/.*.html.*)/i;
      this.lastSubject = null;
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
    loadSheet(win, path, name, type) {
      let sss = win.Cc["@mozilla.org/content/style-sheet-service;1"].getService(
        win.Ci.nsIStyleSheetService
      );
      try {
        sss.loadAndRegisterSheet(win.Services.io.newURI(path + name), sss[type]);
      } catch (e) {}
    }
    unloadSheet(win, path, name, type) {
      let sss = win.Cc["@mozilla.org/content/style-sheet-service;1"].getService(
        win.Ci.nsIStyleSheetService
      );
      try {
        sss.unegisterSheet(win.Services.io.newURI(path + name), sss[type]);
      } catch (e) {}
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
        case "uninit":
          this._onWindowUninit(e);
          break;
      }
    }
    _onContentLoaded(e) {
      let document = e.originalTarget;
      let win = document.defaultView;
      this.lastSubject.removeEventListener("DomContentLoaded", this, true);
      if (
        !Services.dirsvc.get("UChrm", Ci.nsIFile).target.includes("chrome_debugger_profile") ||
        !this.regex.test(win.location.href)
      )
        return;
      const path = this.getChromePath(win);
      this.loadSheet(win, path, "userChrome.css", "AUTHOR_SHEET");
      this.loadSheet(win, path, "userContent.css", "USER_SHEET");
      win.addEventListener("uninit", this);
    }
    _onWindowUninit(e) {
      let win = e.target;
      if (
        !Services.dirsvc.get("UChrm", Ci.nsIFile).target.includes("chrome_debugger_profile") ||
        !this.regex.test(win.location.href)
      )
        return;
      const path = this.getChromePath(win);
      this.unloadSheet(win, path, "userChrome.css", "AUTHOR_SHEET");
      this.unloadSheet(win, path, "userContent.css", "USER_SHEET");
      win.removeEventListener("uninit", this);
    }
  }

  new ToolboxProcessSheetLoader();
})();
