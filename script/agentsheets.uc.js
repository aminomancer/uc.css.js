// ==UserScript==
// @name           userChrome.js
// @namespace      scrollbars_win10
// @version        0.0.8
// @note           Windows 10 style by /u/mrkwatz https://www.reddit.com/r/FirefoxCSS/comments/7fkha6/firefox_57_windows_10_uwp_style_overlay_scrollbars/
// @note           Brought to Firefox 57 by /u/Wiidesire https://www.reddit.com/r/firefox/comments/7f6kc4/floating_scrollbar_finally_possible_in_firefox_57/
// @note           userChrome.js https://github.com/nuchi/firefox-quantum-userchromejs
// @note           Forked from https://github.com/Endor8/userChrome.js/blob/master/floatingscrollbar/FloatingScrollbar.uc.js
// ==/UserScript==

(function () {
    var css = `
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
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0!important;
        transition: opacity 0.4s ease-in-out!important;
        -webkit-transform-style: preserve-3d!important;
        -webkit-backface-visibility: hidden!important;
    }
    .hidevscroll-scrollbar:hover thumb {
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0.5!important;
        transition: opacity 0.1s ease-in-out!important;
        -webkit-transform-style: preserve-3d!important;
        -webkit-backface-visibility: hidden!important;
    }
    .hidevscroll-scrollbar thumb:active {
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0.9!important;
        transition: opacity 0.06s ease-in-out!important;
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
    .BMB-special-scrollbutton-up,
    .BMB-special-scrollbutton-down,
    link[href$="global.css"] ~ .scrollbutton-up.BMB-special-scrollbutton-up,
    link[href$="global.css"] ~ .scrollbutton-down.BMB-special-scrollbutton-down {
        display: -moz-box !important;
    }
    @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);
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
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0!important;
        transition: opacity 0.4s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar:hover thumb {
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0.5!important;
        transition: opacity 0.1s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar thumb:active {
        background-color: rgba(124, 124, 131, 1)!important;
        opacity: 0.9!important;
        transition: opacity 0.06s ease-in-out;
        -webkit-transform-style: preserve-3d;
        -webkit-backface-visibility: hidden;
    }
    :not(select):not(hbox) > scrollbar scrollbarbutton, :not(select):not(hbox) > scrollbar gripper {
        display: none;
    }
	`,
        sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
})();
