// ==UserScript==
// @name           tooltipStyling.uc.js
// @description    tooltipStyling
// @include        *
// ==/UserScript==
(function () {
let sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

let uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(`
tooltip {

  -moz-appearance: none!important;
  background-color: rgba(15, 17, 34, 1)!important;
  color: rgba(255, 255, 255, 1)!important;
  border: none!important;
  padding: 5px!important;
  font-family: FreeMono!important;

} 
`), null, null);

sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
})();
