// ==UserScript==
// @name           agentsheets.uc.js
// @version        1.0
// @homepage       https://github.com/aminomancer
// @description    Make Windows scrollbars look like macOS scrollbars. Also hide the tab bar's scroll buttons and overflow end indicators.
// @author         aminomancer
// ==/UserScript==

(function () {
    var css = `
            .hidevscroll-scrollbar {
                -moz-appearance: none !important;
                margin-left: 4px !important;
                border: none !important;
                position: relative !important;
                background-color: transparent !important;
                padding: 0px !important;
                z-index: 2147483647 !important;
            }
            .hidevscroll-scrollbar[orient="vertical"] {
                -moz-margin-start: -11px !important;
                min-width: 11px !important;
                padding-block: 2px !important;
            }
            .hidevscroll-scrollbar[orient="vertical"] slider[orient="vertical"] {
                -moz-margin-end: 0.1px;
            }
            .hidevscroll-scrollbar[orient="vertical"] thumb {
                min-height: 20px !important;
            }
            .hidevscroll-scrollbar thumb {
                -moz-appearance: none !important;
                border-width: 0px !important;
                border-radius: 5px !important;
                background-color: transparent !important;
                opacity: 0 !important;
                transition: opacity 0.4s ease-in-out !important;
                -webkit-transform-style: preserve-3d !important;
                -webkit-backface-visibility: hidden !important;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            .hidevscroll-scrollbar thumb::before {
                content: "" !important;
                display: -moz-box !important;
                min-width: 25px !important;
                min-height: 25px !important;
                border-radius: 5px !important;
                opacity: 0 !important;
                background-color: rgba(124, 124, 131, 1) !important;
                -moz-box-flex: 1 !important;
                transition: opacity 0.4s ease-in-out;
            }
            .hidevscroll-scrollbar[orient="vertical"] thumb::before {
                margin-inline-end: 2px !important;
            }
            .hidevscroll-scrollbar:hover thumb::before {
                opacity: 1 !important;
                transition: opacity 0.1s ease-in-out;
            }
            .hidevscroll-scrollbar thumb:active::before {
                opacity: 1 !important;
                transition: opacity 0.06s ease-in-out;
            }
            .hidevscroll-scrollbar:hover thumb {
                background-color: transparent !important;
                opacity: 0.5 !important;
                transition: opacity 0.1s ease-in-out !important;
                -webkit-transform-style: preserve-3d !important;
                -webkit-backface-visibility: hidden !important;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            .hidevscroll-scrollbar thumb:active {
                background-color: transparent !important;
                opacity: 0.9 !important;
                transition: opacity 0.06s ease-in-out !important;
                -webkit-transform-style: preserve-3d !important;
                -webkit-backface-visibility: hidden !important;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            .hidevscroll-scrollbar scrollbarbutton,
            .hidevscroll-scrollbar gripper {
                display: none !important;
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
            link[href$="global.css"] ~ spacer[part="arrowscrollbox-overflow-start-indicator"],
            link[href$="global.css"] ~ spacer[part="arrowscrollbox-overflow-end-indicator"] {
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
                -moz-appearance: none !important;
                position: relative;
                background-color: transparent;
                background-image: none;
                z-index: 2147483647;
                padding: 0px;
            }
            :not(select):not(hbox) > scrollbar[orient="vertical"] {
                -moz-margin-start: -11px;
                min-width: 11px;
                max-width: 11px;
                padding-block: 2px !important;
            }
            :not(select):not(hbox) > scrollbar[orient="vertical"] slider[orient="vertical"] {
                -moz-margin-end: 0.1px;
            }
            :not(select):not(hbox) > scrollbar[orient="vertical"] thumb {
                min-height: 20px;
            }
            :not(select):not(hbox) > scrollbar[orient="horizontal"] {
                margin-top: -11px;
                min-height: 11px;
                max-height: 11px;
                padding-inline: 2px !important;
            }
            :not(select):not(hbox) > scrollbar[orient="horizontal"] thumb {
                min-width: 20px;
            }
            :not(select):not(hbox) > scrollbar thumb {
                -moz-appearance: none !important;
                border-width: 0px !important;
                border-radius: 5px !important;
                background-color: transparent !important;
                opacity: 0 !important;
                transition: opacity 0.4s ease-in-out;
                -webkit-transform-style: preserve-3d;
                -webkit-backface-visibility: hidden;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            :not(select):not(hbox) > scrollbar thumb::before {
                content: "" !important;
                display: -moz-box !important;
                min-width: 25px !important;
                min-height: 25px !important;
                border-radius: 5px !important;
                opacity: 0 !important;
                background-color: rgba(124, 124, 131, 1) !important;
                -moz-box-flex: 1 !important;
                transition: opacity 0.4s ease-in-out;
            }
            :not(select):not(hbox) > scrollbar[orient="vertical"] thumb::before {
                margin-inline-end: 2px !important;
            }
            :not(select):not(hbox) > scrollbar[orient="horizontal"] thumb::before {
                margin-block-end: 2px !important;
            }
            :not(select):not(hbox) > scrollbar:hover thumb::before {
                opacity: 1 !important;
                transition: opacity 0.1s ease-in-out;
            }
            :not(select):not(hbox) > scrollbar thumb:active::before {
                opacity: 1 !important;
                transition: opacity 0.06s ease-in-out;
            }
            :not(select):not(hbox) > scrollbar:hover thumb {
                background-color: transparent !important;
                opacity: 0.5 !important;
                transition: opacity 0.1s ease-in-out;
                -webkit-transform-style: preserve-3d;
                -webkit-backface-visibility: hidden;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            :not(select):not(hbox) > scrollbar thumb:active {
                background-color: transparent !important;
                opacity: 0.9 !important;
                transition: opacity 0.06s ease-in-out;
                -webkit-transform-style: preserve-3d;
                -webkit-backface-visibility: hidden;
                -moz-transform-style: preserve-3d !important;
                -moz-backface-visibility: hidden !important;
                transform-style: preserve-3d !important;
                backface-visibility: hidden !important;
            }
            :not(select):not(hbox) > scrollbar scrollbarbutton,
            :not(select):not(hbox) > scrollbar gripper {
                display: none;
            }
        `,
        sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

    sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
})();
