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
#statuspanel-label {
    background-image: url("texture/noise-512x512.png") !important;
    background-color: var(--urlbarView-bgcolor) !important;
    backdrop-filter: blur(22px) !important;
}

.urlbarView #urlbar-results {
    // background-image: url("texture/noise-512x512.png") !important;
    // background-color: var(--urlbarView-bgcolor) !important;
    // backdrop-filter: blur(32px) !important;
}

@-moz-document url("chrome://global/content/alerts/alert.xhtml") {
    #alertBox {
        background-color: rgba(18, 18, 18, 0.97) !important;
        background-image: url("texture/noise-512x512.png") !important;
        backdrop-filter: blur(22px) !important;
    }
}

#fullscreen-warning {
    background-image: url("texture/noise-512x512.png") !important;
    background-color: var(--urlbarView-bgcolor) !important;
    backdrop-filter: blur(22px) !important;
}
`), null, null);

    setTimeout(() => {
      ss.loadAndRegisterSheet(uri, ss.AGENT_SHEET);
    }, 1000);

  }
};

custom_tooltips.init();