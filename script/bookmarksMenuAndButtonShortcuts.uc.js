// ==UserScript==
// @name           bookmarksMenuAndButtonShortcuts.uc.js
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason.
// ==/UserScript==

const ucBookmarksShortcuts = {
    async bookmarkClick(e) {
        if (e.button !== 1 || e.target.tagName !== "toolbarbutton") {
            return;
        }

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
        this.menuitem.setAttribute("onclick", "ucBookmarksShortcuts.updateMenuItem(event)");
        this.menuitem.setAttribute("oncommand", "BookmarkingUI.onStarCommand(event);");
    },

    async updateMenuItem(_e) {
        let bm = await PlacesUtils.bookmarks.fetch({ url: new URL(BookmarkingUI._uri.spec) });
        let isStarred = !!bm;
        let l10nId = isStarred ? "bookmarks-bookmark-edit-panel" : "bookmarks-current-tab";
        document.l10n.setAttributes(ucBookmarksShortcuts.menuitem, l10nId);
    },

    init() {
        BookmarkingUI.button.setAttribute("onclick", "ucBookmarksShortcuts.bookmarkClick(event)");
        CustomizableUI.getWidget("library-button")
            .forWindow(window)
            .node?.setAttribute("onclick", "ucBookmarksShortcuts.bookmarkClick(event)");
        this.addMenuItem(BookmarkingUI.button.firstElementChild);
    },
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
