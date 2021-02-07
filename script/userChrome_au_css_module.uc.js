// ==UserScript==
// @name           userChrome_au_css_module.uc.js
// @namespace      userChrome_Author_Sheet_CSS_module
// @version        1.0
// @note           Load userChrome.au.css file as author sheet
// @backgroundmodule
// ==/UserScript==

let EXPORTED_SYMBOLS = [];
(function () {
  const {Services} = ChromeUtils.import('resource://gre/modules/Services.jsm');
	let sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
  const path = Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromDir(Services.dirsvc.get('UChrm',Ci.nsIFile));
  try{
    sss.loadAndRegisterSheet(Services.io.newURI(path + "userChrome.au.css"), sss.AUTHOR_SHEET);
  }catch(e){
    console.error(`Could not load userChrome.au.css: ${e.name}`)
  }
})();