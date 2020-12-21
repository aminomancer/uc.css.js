(function () {
    var css = `
    #BMB_bookmarksPopup menupopup::part(arrowscrollbox-scrollbox) {padding-top: 0px !important;}
    #BMB_bookmarksPopup menupopup[nofooterpopup="true"]::part(arrowscrollbox) {padding-bottom: 0px !important;}
    #BMB_bookmarksPopup menupopup[placespopup="true"]::part(innerbox) {border: none !important;}
	`,
        sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService),
        uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
})();
