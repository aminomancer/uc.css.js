// ==UserScript==
// @name           userChrome_devtools_module.uc.js
// @namespace      userChrome_DevTools_module
// @version        1.0
// @note           Load userChrome and userContent stylesheets into Browser Toolbox windows
// @backgroundmodule
// ==/UserScript==

let EXPORTED_SYMBOLS = [];
(function () {
  const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
  if (!Services.dirsvc.get('UChrm',Ci.nsIFile).target.includes('chrome_debugger_profile')) return;
	let sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
  function traverseToMainProfile(str){
    let dir = Services.dirsvc.get(str,Ci.nsIFile);
    if (!dir.exists()) {
      let toAddChrome = false;
      while (dir.target.includes('chrome_debugger_profile')) {
        dir = dir.parent;
        toAddChrome = true;
      }
      if (toAddChrome) dir.append('chrome');
    }
    return dir;
  }
  const path = Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromDir(traverseToMainProfile('UChrm'));
  try{
    sss.loadAndRegisterSheet(Services.io.newURI(path + "userChrome.css"), sss.AGENT_SHEET);
    sss.loadAndRegisterSheet(Services.io.newURI(path + "userContent.css"), sss.USER_SHEET);
  }catch(e){
    console.error(`Could not load stylesheets into Browser Toolbox: ${e.name}`)
  }
})();