(function () {
    var css = `
    tooltip {
        -moz-appearance: none!important;
        background-color: rgb(15, 17, 34)!important;
        color: rgba(255, 255, 255, 1)!important;
        border: none!important;
        padding: 5px!important;
        font-family: FreeMono!important;
    }
    @namespace url(http: //www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
    :not(select):not(hbox) > scrollbar {
        -moz-appearance: none!important;
        position: relative;
        background-color: transparent;
        background-image: none;
        z-index: 2147483647;
        padding: 0px;
    }
    :not(select):not(hbox) > scrollbar[orient = "vertical"] {
        -moz-margin-start: -9px;
        min-width: 9px;
        max-width: 9px;
    }
    :not(select):not(hbox) > scrollbar[orient = "vertical"] thumb {
        min-height: 20px;
    }
    :not(select):not(hbox) > scrollbar[orient = "horizontal"] {
        margin-top: -9px;
        min-height: 9px;
        max-height: 9px;
    }
    :not(select):not(hbox) > scrollbar[orient = "horizontal"] thumb {
        min-width: 20px;
    }
    :not(select):not(hbox) > scrollbar thumb {
        -moz-appearance: none!important;
        border-width: 0px!important;
        border-radius: 5px!important;
        background-color: rgba(125, 125, 125, 0)!important;
        transition: background-color 0.14s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar:hover thumb {
        background-color: rgba(125, 125, 125, 0.5)!important;
        transition: background-color 0.06s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar thumb:active {
        background-color: rgba(125, 125, 125, 0.9)!important;
        transition: background-color 0.04s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar scrollbarbutton, :not(select):not(hbox) > scrollbar gripper {
        display: none;
    }
    .hidevscroll-scrollbar {
        -moz-appearance: none!important;
        margin-left: 4px!important;
        border: none!important;
        position: relative!important;
        background-color: transparent!important;
        padding: 0px!important;
        z-index: 2147483647!important;
    }
    .hidevscroll-scrollbar[orient = "vertical"] {
        -moz-margin-start: -9px!important;
        min-width: 9px!important;
    }
    .hidevscroll-scrollbar[orient = "vertical"] thumb {
        min-height: 20px!important;
    }
    .hidevscroll-scrollbar thumb {
        -moz-appearance: none!important;
        border-width: 0px!important;
        border-radius: 5px!important;
        background-color: rgba(125, 125, 125, 0)!important;
        transition: background-color 0.14s ease-in-out!important;
        -webkit-transform-style: preserve-3d!important;
        -webkit-backface-visibility: hidden!important;
    }
    .hidevscroll-scrollbar:hover thumb {
        background-color: rgba(125, 125, 125, 0.5)!important;
        transition: background-color 0.06s ease-in-out!important;
        -webkit-transform-style: preserve-3d!important;
        -webkit-backface-visibility: hidden!important;
    }
    .hidevscroll-scrollbar thumb:active {
        background-color: rgba(125, 125, 125, 0.9)!important;
        transition: background-color 0.04s ease-in-out!important;
        -webkit-transform-style: preserve-3d!important;
        -webkit-backface-visibility: hidden!important;
    }
    .hidevscroll-scrollbar scrollbarbutton, .hidevscroll-scrollbar gripper {
        display: none!important;
    }
    link[href$="global.css"] ~ scrollbox {
        overflow-y: auto !important;
    }
    link[href$="global.css"] ~ .menupopup-scrollbutton {
        display: none !important;
    }
    link[href$="global.css"] ~ hbox > arrowscrollbox.in-bookmarks-menu {
        padding-bottom: 0px !important;
    }
    link[href$="global.css"] ~ scrollbox {
        padding-top: 0px !important;
    }
    link[href$="global.css"] ~ .scrollbutton-up,
    link[href$="global.css"] ~ .scrollbutton-down,
    link[href$="global.css"] ~ spacer[part=arrowscrollbox-overflow-start-indicator],
    link[href$="global.css"] ~ spacer[part=arrowscrollbox-overflow-end-indicator] {
        display: none !important;
    }
	`;

    var sss = Cc['@mozilla.org/content/style-sheet-service;1'].getService(Ci.nsIStyleSheetService);
    var uri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(css));

    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);

})();
