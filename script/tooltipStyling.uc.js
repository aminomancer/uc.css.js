// ==UserScript==
// @name           tooltipStyling.uc.js
// @description    tooltipStyling
// @include        *
// ==/UserScript==
(function () {
    let css = `
@namespace html url("http://www.w3.org/1999/xhtml");
tooltip {
        -moz-appearance: none!important;
        background-color: rgba(15, 17, 34, 1)!important;
        color: rgba(255, 255, 255, 1)!important;
        border: none!important;
        padding: 5px!important;
        font-family: FreeMono!important;
}
	`,
        sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

    let style = `
tooltip,
#tooltip,
.tooltip,
#aHTMLTooltip {
    -moz-appearance: none !important;
    background-color: rgba(15, 17, 34, 1) !important;
    color: rgba(255, 255, 255, 1) !important;
    border: none !important;
    padding: 5px !important;
    font-family: FreeMono !important;
}
      `;

    let sspi = document.createProcessingInstruction(
        "xml-stylesheet",
        'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
    );
    custom_tooltips.init();
    document.insertBefore(sspi, document.documentElement);
    sspi.getAttribute = function (name) {
        return document.documentElement.getAttribute(name);
    };
    document
        .getElementById("fullscreen-button")
        .setAttribute("tooltiptext", "Display the window in full screen (Ctrl+E)");
    document.getElementById("fullscreen-button").removeAttribute("tooltip");
    document.getElementById("sidebar-button").setAttribute("tooltiptext", "Show sidebars (Ctrl+B)");
})();
