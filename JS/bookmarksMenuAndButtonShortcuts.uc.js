// ==UserScript==
// @name           Bookmarks Menu & Button Shortcuts
// @version        1.4.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarksMenuAndButtonShortcuts.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarksMenuAndButtonShortcuts.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

const ucBookmarksShortcuts = {
  create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  },
  async bookmarkClick(e) {
    if (e.button !== 1 || e.target.tagName !== "toolbarbutton") return;
    let bm = await PlacesUtils.bookmarks.fetch({
      url: new URL(BookmarkingUI._uri.spec),
    });
    bm ? PlacesTransactions.Remove(bm.guid).transact() : this.starCmd();
    e.preventDefault();
    e.stopPropagation();
  },
  async starCmd() {
    if (!BookmarkingUI._pendingUpdate) {
      if (!!BookmarkingUI.starAnimBox && !(BookmarkingUI._itemGuids.size > 0)) {
        document
          .getElementById("star-button-animatable-box")
          .addEventListener(
            "animationend",
            () => BookmarkingUI.star.removeAttribute("animate"),
            {
              once: true,
            }
          );
        BookmarkingUI.star.setAttribute("animate", "true");
      }
      let browser = gBrowser.selectedBrowser;
      let url = new URL(browser.currentURI.spec);
      let parentGuid = await PlacesUIUtils.defaultParentGuid;
      let info = { url, parentGuid };
      let charset = null;
      let isErrorPage = false;
      if (browser.documentURI) {
        isErrorPage = /^about:(neterror|certerror|blocked)/.test(
          browser.documentURI.spec
        );
      }
      try {
        if (isErrorPage) {
          let entry = await PlacesUtils.history.fetch(browser.currentURI);
          if (entry) info.title = entry.title;
        } else {
          info.title = browser.contentTitle;
        }
        info.title = info.title || url.href;
        charset = browser.characterSet;
      } catch (e) {}
      info.guid = await PlacesTransactions.NewBookmark(info).transact();
      if (charset) PlacesUIUtils.setCharsetForPage(url, charset, window);
      gURLBar.handleRevert();
      StarUI.showConfirmation();
    }
  },
  addMenuitems(popup) {
    let doc = popup.ownerDocument;
    this.bookmarkTab = doc.createXULElement("menuitem");
    this.bookmarkTab = this.create(doc, "menuitem", {
      id: "BMB_bookmarkThisPage",
      label: "",
      class: "menuitem-iconic subviewbutton",
      onclick: "ucBookmarksShortcuts.updateMenuItem()",
      oncommand: "BookmarkingUI.onStarCommand(event);",
      key: "addBookmarkAsKb",
      image: "chrome://browser/skin/bookmark-hollow.svg",
    });
    popup.insertBefore(this.bookmarkTab, popup.firstElementChild);
    popup.addEventListener("popupshowing", this.updateMenuItem);
    this.bookmarkTab.setAttribute(
      "data-l10n-id",
      "bookmarks-subview-bookmark-tab"
    );
  },
  onLocationChange(browser, _prog, _req, location, _flags) {
    if (browser !== gBrowser.selectedBrowser) return;
    this.updateMenuItem(null, location);
  },
  async updateMenuItem(_e, location) {
    let uri;
    let menuitem = ucBookmarksShortcuts.bookmarkTab;
    if (location) uri = new URL(location?.spec);
    if (BookmarkingUI._uri) uri = new URL(BookmarkingUI._uri.spec);
    if (!uri) return;
    let isStarred = await PlacesUtils.bookmarks.fetch({ url: uri });
    if ("l10n" in menuitem.ownerDocument && menuitem.ownerDocument.l10n) {
      menuitem.ownerDocument.l10n.setAttributes(
        menuitem,
        isStarred
          ? "bookmarks-subview-edit-bookmark"
          : "bookmarks-subview-bookmark-tab"
      );
    }
    menuitem.setAttribute(
      "image",
      isStarred
        ? "chrome://browser/skin/bookmark.svg"
        : "chrome://browser/skin/bookmark-hollow.svg"
    );
  },
  init() {
    let node = CustomizableUI.getWidget("bookmarks-menu-button")?.forWindow(
      window
    ).node;
    // delete these two lines if you don't want the confirmation hint to show
    // when you bookmark a page.
    Services.prefs.setIntPref(
      "browser.bookmarks.editDialog.confirmationHintShowCount",
      0
    );
    Services.prefs.lockPref(
      "browser.bookmarks.editDialog.confirmationHintShowCount"
    );
    BookmarkingUI.button.setAttribute(
      "onclick",
      "ucBookmarksShortcuts.bookmarkClick(event)"
    );
    CustomizableUI.getWidget("library-button")
      .forWindow(window)
      .node?.setAttribute(
        "onclick",
        "ucBookmarksShortcuts.bookmarkClick(event)"
      );
    this.addMenuitems(node.querySelector("#BMB_bookmarksPopup"));
    gBrowser.addTabsProgressListener(this);
    PlacesUtils.observers.addListener(
      ["bookmark-added", "bookmark-removed", "bookmark-url-changed"],
      events => {
        for (let e of events) {
          if (e.url && e.url == BookmarkingUI._uri?.spec) this.updateMenuItem();
        }
      }
    );
    // set the "positionend" attribute on the view bookmarks sidebar menuitem.
    // this way we can swap between the left/right sidebar icons based on which
    // side the sidebar is on, like the sidebar toolbar widget does.
    let sidebarItem = node.querySelector("#BMB_viewBookmarksSidebar");
    if (sidebarItem) {
      sidebarItem.appendChild(
        this.create(document, "observes", {
          element: "sidebar-box",
          attribute: "positionend",
        })
      );
    }
    // show the URL and keyword fields in the edit bookmark panel
    eval(
      `StarUI.showEditBookmarkPopup = async function ${StarUI.showEditBookmarkPopup
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/async showEditBookmarkPopup/, "")
        .replace(/async function\s*/, "")
        .replace(/\[\"location\", \"keyword\"\]/, "[]")}`
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
