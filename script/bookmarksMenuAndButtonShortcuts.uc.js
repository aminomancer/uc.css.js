// ==UserScript==
// @name           Bookmarks Menu & Button Shortcuts
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason. Third, another menu item is added to replicate the "Search bookmarks" button in the app menu's bookmarks panel. Clicking it will open the urlbar in bookmarks search mode.
// ==/UserScript==

const ucBookmarksShortcuts = {
    create(aDoc, tag, props, isHTML = false) {
        let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
        for (let prop in props) el.setAttribute(prop, props[prop]);
        return el;
    },

    async bookmarkClick(e) {
        if (e.button !== 1 || e.target.tagName !== "toolbarbutton") return;

        let bm = await PlacesUtils.bookmarks.fetch({ url: new URL(BookmarkingUI._uri.spec) });
        bm
            ? PlacesTransactions.Remove(bm.guid).transact()
            : BookmarkingUI.onStarCommand({ type: "click", button: 0 });

        e.preventDefault();
        e.stopPropagation();
    },

    addMenuitems(popup) {
        this.bookmarkTab = popup.ownerDocument.createXULElement("menuitem");
        this.bookmarkTab = this.create(popup.ownerDocument, "menuitem", {
            id: "BMB_bookmarkThisPage",
            label: "",
            class: "menuitem-iconic subviewbutton",
            onclick: "ucBookmarksShortcuts.updateMenuItem()",
            oncommand: "BookmarkingUI.onStarCommand(event);",
            image: "chrome://browser/skin/bookmark-hollow.svg",
        });
        popup.insertBefore(this.bookmarkTab, popup.firstElementChild);
        popup.addEventListener("popupshowing", this.updateMenuItem, false);
        this.bookmarkTab.ownerDocument.l10n.setAttributes(
            this.bookmarkTab,
            "bookmarks-current-tab"
        );

        this.searchBookmarks = popup.querySelector("#BMB_viewBookmarksSidebar").after(
            this.create(popup.ownerDocument, "menuitem", {
                id: "BMB_searchBookmarks",
                class: "menuitem-iconic subviewbutton",
                "data-l10n-id": "bookmarks-search",
                oncommand: "PlacesCommandHook.searchBookmarks();",
                image: "chrome://global/skin/icons/search-glass.svg",
            })
        );
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
        let menuitem = ucBookmarksShortcuts.bookmarkTab;
        if (location) uri = new URL(location?.spec);
        if (BookmarkingUI._uri) uri = new URL(BookmarkingUI._uri.spec);
        if (!uri) return;

        let isStarred = await PlacesUtils.bookmarks.fetch({ url: uri });
        menuitem.ownerDocument.l10n.setAttributes(
            menuitem,
            isStarred ? "bookmarks-bookmark-edit-panel" : "bookmarks-current-tab"
        );
        menuitem.setAttribute(
            "image",
            isStarred
                ? "chrome://browser/skin/bookmark.svg"
                : "chrome://browser/skin/bookmark-hollow.svg"
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

        this.addMenuitems(document.getElementById("BMB_bookmarksPopup"));

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
