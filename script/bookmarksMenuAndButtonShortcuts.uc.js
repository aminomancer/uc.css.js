// ==UserScript==
// @name           bookmarksMenuAndButtonShortcuts.uc.js
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason.
// ==/UserScript==

const ucBookmarksShortcuts = {
    async bookmarkClick(e) {
        if (e.button !== 1 || e.target.tagName !== "toolbarbutton") return;

        let bm = await PlacesUtils.bookmarks.fetch({ url: new URL(BookmarkingUI._uri.spec) });
        bm
            ? PlacesTransactions.Remove(bm.guid).transact()
            : BookmarkingUI.onStarCommand({ type: "click", button: 0 });

        e.preventDefault();
        e.stopPropagation();
    },

    addMenuItem(popup) {
        this.popup = popup;
        this.menuitem = popup.ownerDocument.createXULElement("menuitem");

        this.menuitem.id = "BMB_bookmarkThisPage";
        this.menuitem.setAttribute("label", "");
        this.menuitem.setAttribute("class", "menuitem-iconic subviewbutton");
        this.popup.insertBefore(this.menuitem, this.popup.firstElementChild);

        this.popup.addEventListener("popupshowing", this.updateMenuItem, false);
        this.menuitem.setAttribute("onclick", "ucBookmarksShortcuts.updateMenuItem()");
        this.menuitem.setAttribute("oncommand", "BookmarkingUI.onStarCommand(event);");
        this.menuitem.ownerDocument.l10n.setAttributes(this.menuitem, "bookmarks-current-tab");
    },

    onLocationChange(browser, _prog, _req, location, _flags) {
        if (browser !== gBrowser.selectedBrowser) return;
        this.updateMenuItem(null, location);
    },

    handlePlacesEvents(events) {
        for (let e of events) if (e.url && e.url == BookmarkingUI._uri?.spec) this.updateMenuItem();
    },

    async updateMenuItem(_e, location) {
        let uri;
        let menuitem = ucBookmarksShortcuts.menuitem;
        if (location) uri = new URL(location?.spec);
        if (BookmarkingUI._uri) uri = new URL(BookmarkingUI._uri.spec);
        if (!uri) return;

        let isStarred = await PlacesUtils.bookmarks.fetch({ url: uri });
        menuitem.ownerDocument.l10n.setAttributes(
            menuitem,
            isStarred ? "bookmarks-bookmark-edit-panel" : "bookmarks-current-tab"
        );
    },

    init() {
        // delete these two lines if you don't want the confirmation hint to show when you bookmark a page.
        Services.prefs.setIntPref("browser.bookmarks.editDialog.confirmationHintShowCount", 0);
        Services.prefs.lockPref("browser.bookmarks.editDialog.confirmationHintShowCount");

        BookmarkingUI.button.setAttribute("onclick", "ucBookmarksShortcuts.bookmarkClick(event)");
        CustomizableUI.getWidget("library-button")
            .forWindow(window)
            .node?.setAttribute("onclick", "ucBookmarksShortcuts.bookmarkClick(event)");

        this.addMenuItem(BookmarkingUI.button.firstElementChild);

        gBrowser.addTabsProgressListener(this);

        PlacesUtils.bookmarks.addObserver(this);
        PlacesUtils.observers.addListener(
            ["bookmark-added", "bookmark-removed"],
            this.handlePlacesEvents.bind(this)
        );
    },

    QueryInterface: ChromeUtils.generateQI(["nsINavBookmarkObserver"]),
};

if (gBrowserInit.delayedStartupFinished) {
    ucBookmarksShortcuts.init();
} else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            ucBookmarksShortcuts.init();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
