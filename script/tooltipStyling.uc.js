// ==UserScript==
// @name           tooltipStyling.uc.js
// @description    tooltipStyling
// @include        *
// ==/UserScript==
Components.utils.import("resource://gre/modules/Services.jsm");
var ss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);

var custom_tooltips = {

  init: function () {

    var uri = Services.io.newURI("data:text/css;charset=utf-8," + encodeURIComponent(`
@namespace html url("http://www.w3.org/1999/xhtml");
tooltip {
        -moz-appearance: none!important;
        background-color: rgba(15, 17, 34, 1)!important;
        color: rgba(255, 255, 255, 1)!important;
        border: none!important;
        padding: 5px!important;
        font-family: FreeMono!important;
} 
`), null, null);

    ss.loadAndRegisterSheet(uri, ss.AGENT_SHEET);

  }
};

custom_tooltips.init();