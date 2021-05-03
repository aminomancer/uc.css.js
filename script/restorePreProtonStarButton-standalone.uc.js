// ==UserScript==
// @name           Restore pre-Proton Star Button
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    The bookmark page action button used to have a pretty cool starburst animation. That's been removed but it's not too difficult to restore. This standalone version of the script doesn't require any additional CSS, but it does require that you download the icons from the resources/bookmarks/ folder on my repo and place them in {your profile}/chrome/bookmarks/
// ==/UserScript==

(function () {
    // delete these two lines if you don't want the confirmation hint to show when you bookmark a page.
    Services.prefs.setIntPref("browser.bookmarks.editDialog.confirmationHintShowCount", 0);
    Services.prefs.lockPref("browser.bookmarks.editDialog.confirmationHintShowCount");

    function init() {
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
            Ci.nsIStyleSheetService
        );
        const starAnimBox = document.createXULElement("hbox");
        const starAnimImg = document.createXULElement("image");
        starAnimBox.id = "star-button-animatable-box";
        starAnimImg.id = "star-button-animatable-image";
        starAnimImg.setAttribute("role", "presentation");
        starAnimBox.appendChild(starAnimImg);
        BookmarkingUI.star.after(starAnimBox);
        BookmarkingUI.starAnimBox = starAnimBox;
        BookmarkingUI.starAnimImg = starAnimImg;

        BookmarkingUI.onStarCommand = function onStarCommand(aEvent) {
            // Ignore non-left clicks on the star, or if we are updating its state.
            if (!this._pendingUpdate && (aEvent.type != "click" || aEvent.button == 0)) {
                if (!this._itemGuids.size > 0) {
                    BrowserUIUtils.setToolbarButtonHeightProperty(this.star);
                    document.getElementById("star-button-animatable-box").addEventListener(
                        "animationend",
                        (_e) => {
                            this.star.removeAttribute("animate");
                        },
                        { once: true }
                    );
                    this.star.setAttribute("animate", "true");
                }
                PlacesCommandHook.bookmarkPage();
            }
        };

        BookmarkingUI.handleEvent = function BUI_handleEvent(aEvent) {
            switch (aEvent.type) {
                case "mouseover":
                    this.star.setAttribute("preloadanimations", "true");
                    break;
                case "ViewShowing":
                    this.onPanelMenuViewShowing(aEvent);
                    break;
                case "ViewHiding":
                    this.onPanelMenuViewHiding(aEvent);
                    break;
            }
        };

        BookmarkingUI.uninit = function BUI_uninit() {
            this.updateBookmarkPageMenuItem(true);
            CustomizableUI.removeListener(this);
            this.star.removeEventListener("mouseover", this);
            this._uninitView();
            if (this._hasBookmarksObserver) {
                PlacesUtils.bookmarks.removeObserver(this);
                PlacesUtils.observers.removeListener(
                    ["bookmark-added", "bookmark-removed"],
                    this.handlePlacesEvents
                );
            }
            if (this._pendingUpdate) delete this._pendingUpdate;
        };

        BookmarkingUI._updateStar = function BUI__updateStar() {
            let starred = this._itemGuids.size > 0;
            if (!starred) this.star.removeAttribute("animate");
            for (let element of [
                this.star,
                document.getElementById("context-bookmarkpage"),
                PanelMultiView.getViewNode(document, "panelMenuBookmarkThisPage"),
                document.getElementById("pageAction-panel-bookmark"),
            ]) {
                if (!element) continue;
                if (starred) element.setAttribute("starred", "true");
                else element.removeAttribute("starred");
            }
            if (!this.star) {
                this.updateBookmarkPageMenuItem(true);
                return;
            }
            let shortcut = document.getElementById(this.BOOKMARK_BUTTON_SHORTCUT);
            let l10nArgs = {
                shortcut: ShortcutUtils.prettifyShortcut(shortcut),
            };
            document.l10n.setAttributes(
                this.star,
                starred ? "urlbar-star-edit-bookmark" : "urlbar-star-add-bookmark",
                l10nArgs
            );
            this.updateBookmarkPageMenuItem();
            Services.obs.notifyObservers(
                null,
                "bookmark-icon-updated",
                starred ? "starred" : "unstarred"
            );
        };

        BookmarkingUI.star.addEventListener("mouseover", BookmarkingUI, {
            once: true,
        });

        const css = `#bookmarks-menu-button{list-style-image:url(chrome:}#pageAction-panel-bookmark,#star-button{list-style-image:url(bookmarks/bookmark-hollow.svg);}#sidebar-switcher-bookmarks,#pageAction-panel-bookmark[starred],#star-button[starred]{list-style-image:url(bookmarks/bookmark.svg);}@media (prefers-reduced-motion:no-preference){@keyframes bookmark-animation{from{transform:translateX(0)}to{transform:translateX(-627px)}}#star-button-box{position:relative}#star-button[preloadanimations] + #star-button-animatable-box>#star-button-animatable-image{background-image:url(bookmarks/bookmark-animation.svg),url(bookmarks/library-bookmark-animation.svg);background-size:0,0}#star-button[starred][animate]{fill:transparent;position:relative}#star-button[starred][animate] + #star-button-animatable-box{display:block;position:absolute;overflow:hidden;top:calc(50% - 16.5px);margin-inline-start:-2.5px;width:33px;height:33px}:root[uidensity="compact"] #star-button[starred][animate] + #star-button-animatable-box{margin-inline-start:-4.5px}:root[uidensity="touch"] #star-button[starred][animate] + #star-button-animatable-box{margin-inline-start:-1.5px}#star-button[starred][animate] + #star-button-animatable-box>#star-button-animatable-image{background-image:url(bookmarks/bookmark-animation.svg);background-size:auto;list-style-image:none;height:var(--toolbarbutton-height);min-height:33px;animation-name:bookmark-animation;animation-fill-mode:forwards;animation-iteration-count:1;animation-timing-function:steps(19);animation-duration:317ms;width:660px;-moz-context-properties:fill,stroke;stroke:var(--toolbarbutton-icon-fill-attention)}#star-button[starred][animate]:-moz-locale-dir(rtl) + #star-button-animatable-box>#star-button-animatable-image{scale:-1 1}}`;
        let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
