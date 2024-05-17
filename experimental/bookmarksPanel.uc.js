// ==UserScript==
// @name           Bookmarks Panel
// @version        1.0.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    A work in progress. Create a toolbar button that shows all your bookmarks in a *panel* rather than a menupopup. This is largely a matter of preference, but menupopups can be somewhat laggy when they have a lot of children (bookmarks) to show. For my part, I think panels generally look and feel better to use. The bookmarks button is the only remaining toolbar widget that opens a menupopup. From what I understand, the only reason it hasn't been updated to be consistent with the rest of the UI is that doing so is a bitch and could require more maintenance, the former of which I can personally attest to. This script can also optionally replace the built-in bookmarks panel (in the app menu) with the more powerful panel created by the script. The built-in panel only shows 42 recent bookmarks, while this panel shows all your bookmarks folders as well as 20 recent bookmarks — that number can be increased in the config below.
// ==/UserScript==

class BookmarksPanel {
  static config = {
    "Icon URL": `chrome://browser/skin/bookmark-star-on-tray.svg`, // if you want to change the button's icon for whatever reason, you can replace this string with any URL or data URL that leads to an image.
    "Max recent bookmarks": 20, // how many bookmarks to display in the recent bookmarks section of the panel
    "Replace built-in panel": true, // whether to replace the lame built-in bookmarks panel in the app menu with the new panel
    "Show bookmarks menu contents instead of recent bookmarks": false, // the panel can only show the full contents of one folder at a time or things get a bit out of hand. so if you'd rather see your bookmarks menu contents rather than recent bookmarks in the main panel, set this to true. for me, the bookmarks menu is pretty empty, so this is pointless. but others might have a lot of bookmarks in that folder.
  };
  /**
   * create a DOM node with given parameters
   * @param {object} aDoc (which doc to create the element in)
   * @param {string} tag (an HTML tag name, like "button" or "p")
   * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
   * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
   * @returns the created DOM node
   */
  create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }
  /**
   * set or remove multiple attributes for a given node
   * @param {object} el (a DOM node)
   * @param {object} props (an object of attribute name/value pairs)
   * @returns the DOM node
   */
  setAttributes(el, props) {
    for (let [name, value] of Object.entries(props)) {
      if (value) el.setAttribute(name, value);
      else el.removeAttribute(name);
    }
  }
  /**
   * make a valid ID for a DOM node based on a bookmarks GUID.
   * @param {string} id (a bookmarks GUID)
   * @returns an ID with crap removed so it can be used in a DOM node's ID.
   */
  makeSafeId(id) {
    id = id.toLowerCase();
    return id.replace(/[^a-z0-9_-]/g, "_");
  }
  // where panelviews are hiding when we're not looking
  get viewCache() {
    return document.getElementById("appMenu-viewCache");
  }
  get toolbarButton() {
    return CustomizableUI.getWidget("bookmarks-panel-button")?.forWindow(window)
      ?.node;
  }
  constructor() {
    this.config = BookmarksPanel.config;
    this.QueryInterface = ChromeUtils.generateQI(["nsINavBookmarkObserver"]);
    this.viewId = this.config["Replace built-in panel"]
      ? "PanelUI-bookmarks"
      : "PanelUI-bookmarks-folders";
    this.makeWidget();
    this.loadStylesheet();
  }
  async updateEditBookmark(location) {
    if (!this.bmCurrentTab) return;
    let uri;
    if (location) uri = new URL(location?.spec);
    if (BookmarkingUI._uri) uri = new URL(BookmarkingUI._uri.spec);
    if (!uri) return;
    let isStarred = await PlacesUtils.bookmarks.fetch({ url: uri });
    document.l10n.setAttributes(
      this.bmCurrentTab,
      isStarred ? "bookmarks-bookmark-edit-panel" : "bookmarks-current-tab"
    );
    this.bmCurrentTab.setAttribute(
      "image",
      isStarred
        ? "chrome://browser/skin/bookmark.svg"
        : "chrome://browser/skin/bookmark-hollow.svg"
    );
  }
  updateViewSidebar() {
    let l10nID = this.bmViewSidebar.getAttribute("data-l10n-id");
    document.l10n.setAttributes(this.bmViewSidebar, l10nID, {
      isVisible: SidebarUI.currentID == "viewBookmarksSidebar",
    });
    this.bmViewSidebar.setAttribute(
      "image",
      SidebarUI._positionStart
        ? "chrome://browser/skin/sidebars.svg"
        : "chrome://browser/skin/sidebars-right.svg"
    );
  }
  updateViewToolbar() {
    let l10nID = this.bmViewToolbar.getAttribute("data-l10n-id");
    document.l10n.setAttributes(this.bmViewToolbar, l10nID, {
      isVisible: !BookmarkingUI.toolbar.collapsed,
    });
  }
  makeWidget() {
    if (
      /^chrome:\/\/browser\/content\/browser.(xul||xhtml)$/i.test(location) &&
      !CustomizableUI.getPlacementOfWidget("bookmarks-panel-button", true)
    ) {
      CustomizableUI.createWidget({
        id: "bookmarks-panel-button",
        viewId: this.viewId,
        shortcutId: "viewBookmarksSidebarKb",
        type: "view",
        defaultArea: CustomizableUI.AREA_NAVBAR,
        removable: true,
        label: "menu-view-bookmarks",
        tooltiptext: "bookmarksMenuButton.tooltip",
        onClick: e => {},
        // create the panelview before the toolbar button
        onBeforeCreated: aDoc => {
          let panelview = this.create(aDoc, "panelview", {
            id: this.viewId,
            class: "PanelUI-subView cui-widget-panelview",
            flex: "1",
            style: "min-width:30em",
          });
          aDoc.getElementById("appMenu-viewCache").appendChild(panelview);
          aDoc.defaultView.bookmarksPanel.panelview = panelview;
          panelview.body = panelview.appendChild(
            this.create(aDoc, "vbox", {
              id: `${this.viewId}-body`,
              class: "panel-subview-body",
            })
          );
          panelview.body.setAttribute("context", "placesContext");

          // separator
          panelview.appendChild(document.createXULElement("toolbarseparator"));
          // manage bookmarks
          panelview.appendChild(
            this.create(document, "toolbarbutton", {
              id: "PanelUI-bookmarks-manage-subviewbutton",
              class: "subviewbutton panel-subview-footer-button",
              "data-l10n-id": "bookmarks-manage-bookmarks",
              command: "Browser:ShowAllBookmarks",
              key: "manBookmarkKb",
              shortcut: ShortcutUtils.prettifyShortcut(manBookmarkKb),
              image: "chrome://browser/skin/library.svg",
            })
          );
        },
        onViewShowing: e => {
          if (
            e.originalTarget !== e.target.ownerGlobal.bookmarksPanel.panelview
          ) {
            return;
          }
          let panelview = e.target;
          let { body } = panelview;
          let showBmMenuContents =
            this.config[
              "Show bookmarks menu contents instead of recent bookmarks"
            ];

          if (!this.mainViewMenu) {
            // bookmark current tab
            this.bmCurrentTab = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-edit-bookmark-subviewbutton",
                class: "subviewbutton subviewbutton-iconic",
                "data-l10n-id": "bookmarks-current-tab",
                oncommand: "BookmarkingUI.onStarCommand(event);",
                onclick: "bookmarksPanel.updateEditBookmark()",
                image: "chrome://browser/skin/bookmark-hollow.svg",
              })
            );

            // view bookmarks sidebar
            this.bmViewSidebar = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-view-sidebar-subviewbutton",
                class: "subviewbutton subviewbutton-iconic",
                "data-l10n-id": "bookmarks-tools-sidebar-visibility",
                "data-l10n-args": `{"isVisible":false}`,
                oncommand: "SidebarUI.toggle('viewBookmarksSidebar');",
                onclick: "bookmarksPanel.updateViewSidebar()",
                image: "chrome://browser/skin/sidebars.svg",
              })
            );

            // search bookmarks
            this.bmSearch = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-search-subviewbutton",
                class: "subviewbutton subviewbutton-iconic",
                "data-l10n-id": "bookmarks-search",
                oncommand:
                  "PlacesCommandHook.searchBookmarks(); PanelUI.hide();",
                image: "chrome://global/skin/icons/search-glass.svg",
              })
            );

            // separator
            body.appendChild(document.createXULElement("toolbarseparator"));

            // bookmarks menu
            if (!showBmMenuContents) {
              let menuPlacesNode = PlacesUtils.getFolderContents(
                PlacesUtils.bookmarks.menuGuid
              ).root;
              let bmMenuSubviewNav = body.appendChild(
                this.create(document, "toolbarbutton", {
                  id: "PanelUI-bookmarks-menu-subviewbutton",
                  class: "subviewbutton subviewbutton-nav bookmark-item",
                  closemenu: "none",
                  "widget-type": "view",
                  "data-l10n-id": "bookmarks-menu-button",
                  container: "true",
                })
              );
              bmMenuSubviewNav._placesNode = menuPlacesNode;
              bmMenuSubviewNav.addEventListener("command", e =>
                this.showSubView(e)
              );
              if (menuPlacesNode.icon) {
                bmMenuSubviewNav.setAttribute("image", menuPlacesNode.icon);
              }
              this.buildSubView(menuPlacesNode);
            }

            // "Bookmarks toolbar"
            let toolbarPlacesNode = PlacesUtils.getFolderContents(
              PlacesUtils.bookmarks.toolbarGuid
            ).root;
            let bmToolbarSubviewNav = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-toolbar-subviewbutton",
                class: "subviewbutton subviewbutton-nav bookmark-item",
                closemenu: "none",
                "widget-type": "view",
                "data-l10n-id": "bookmarks-toolbar-menu",
                container: "true",
              })
            );
            bmToolbarSubviewNav._placesNode = toolbarPlacesNode;
            bmToolbarSubviewNav.addEventListener("command", e =>
              this.showSubView(e)
            );
            if (toolbarPlacesNode.icon) {
              bmToolbarSubviewNav.setAttribute("image", toolbarPlacesNode.icon);
            }
            let toolbarView = this.buildSubView(toolbarPlacesNode);

            // separator
            toolbarView.appendChild(
              document.createXULElement("toolbarseparator")
            );

            // view bookmarks toolbar
            this.bmViewToolbar = toolbarView.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-view-toolbar-subviewbutton",
                class:
                  "subviewbutton panel-subview-footer-button subviewbutton-iconic",
                "data-l10n-id": "bookmarks-tools-toolbar-visibility-menuitem",
                "data-l10n-args": `{"isVisible":false}`,
                oncommand:
                  "BookmarkingUI.toggleBookmarksToolbar('bookmarks-widget');",
                onclick: "bookmarksPanel.updateViewToolbar()",
                image: "chrome://browser/skin/places/bookmarksToolbar.svg",
              })
            );
            toolbarView.addEventListener("ViewShowing", e =>
              this.updateViewToolbar()
            );

            // "Other bookmarks"
            let unfiledPlacesNode = PlacesUtils.getFolderContents(
              PlacesUtils.bookmarks.unfiledGuid
            ).root;
            let bmUnfiledSubviewNav = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-other-subviewbutton",
                class: "subviewbutton subviewbutton-nav bookmark-item",
                closemenu: "none",
                "widget-type": "view",
                "data-l10n-id": "bookmarks-other-bookmarks-menu",
                container: "true",
              })
            );
            bmUnfiledSubviewNav._placesNode = unfiledPlacesNode;
            bmUnfiledSubviewNav.addEventListener("command", e =>
              this.showSubView(e)
            );
            if (unfiledPlacesNode.icon) {
              bmUnfiledSubviewNav.setAttribute("image", unfiledPlacesNode.icon);
            }
            this.buildSubView(unfiledPlacesNode);

            // "Mobile bookmarks"
            let mobilePlacesNode = PlacesUtils.getFolderContents(
              PlacesUtils.bookmarks.mobileGuid
            ).root;
            let bmMobileSubviewNav = body.appendChild(
              this.create(document, "toolbarbutton", {
                id: "PanelUI-bookmarks-mobile-subviewbutton",
                class: "subviewbutton subviewbutton-nav bookmark-item",
                closemenu: "none",
                "widget-type": "view",
                "data-l10n-id": "bookmarks-mobile-bookmarks-menu",
                container: "true",
              })
            );
            bmMobileSubviewNav._placesNode = mobilePlacesNode;
            bmMobileSubviewNav.addEventListener("command", e =>
              this.showSubView(e)
            );
            if (mobilePlacesNode.icon) {
              bmMobileSubviewNav.setAttribute("image", mobilePlacesNode.icon);
            }
            this.buildSubView(mobilePlacesNode);
            this.mobileSubview = bmMobileSubviewNav;

            // "Recent bookmarks"
            if (showBmMenuContents) {
              let bmRecentSubviewNav = body.appendChild(
                this.create(document, "toolbarbutton", {
                  id: "PanelUI-bookmarks-recent-subviewbutton",
                  class:
                    "subviewbutton subviewbutton-iconic subviewbutton-nav bookmark-item",
                  closemenu: "none",
                  "widget-type": "view",
                  "data-l10n-id": "bookmarks-recent-bookmarks-panel-subheader",
                })
              );
              bmRecentSubviewNav.addEventListener("command", e =>
                this.showSubView(e)
              );
              this.buildSubView(
                null,
                `place:queryType=${Ci.nsINavHistoryQueryOptions.QUERY_TYPE_BOOKMARKS}&sort=${Ci.nsINavHistoryQueryOptions.SORT_BY_DATEADDED_DESCENDING}&maxResults=50&excludeQueries=1`
              );
            }

            body.appendChild(document.createXULElement("toolbarseparator"));

            // Recent bookmarks label
            if (!showBmMenuContents) {
              body.appendChild(
                this.create(
                  document,
                  "h2",
                  {
                    class: "subview-subheader",
                    "data-l10n-id":
                      "bookmarks-recent-bookmarks-panel-subheader",
                  },
                  true
                )
              );
            }

            // main container
            this.mainContainer = body.appendChild(
              this.create(document, "toolbaritem", {
                id: "PanelUI-bookmarks-recent-content",
                orient: "vertical",
                smoothscroll: "true",
                flatList: "true",
                tooltip: "bhTooltip",
                role: "group",
              })
            );

            this.mainViewMenu = true;
          }

          this.mainMenu = new PlacesContainerPanelview(
            this.mainContainer,
            panelview,
            showBmMenuContents
              ? `place:parent=${PlacesUtils.bookmarks.menuGuid}`
              : `place:queryType=${Ci.nsINavHistoryQueryOptions.QUERY_TYPE_BOOKMARKS}&sort=${Ci.nsINavHistoryQueryOptions.SORT_BY_DATEADDED_DESCENDING}&maxResults=${this.config["Max recent bookmarks"]}&excludeQueries=1`
          );
          if (showBmMenuContents) {
            panelview._placesNode = PlacesUtils.getFolderContents(
              PlacesUtils.bookmarks.menuGuid
            ).root;
          }

          this.updateEditBookmark();
          this.updateViewSidebar();
          this.mobileSubview.hidden =
            !BookmarkingUI._shouldShowMobileBookmarks();
        },
        // delete the panel if the widget node is destroyed
        onDestroyed: aDoc => {
          let view = aDoc.getElementById(this.viewId);
          if (view) {
            CustomizableUI.hidePanelForNode(view);
            view.remove();
          }
        },
      });
    }
  }
  /**
   * for a given placesNode, build a panel subview
   * @param {object} placesNode (an placesNode object provided by PlacesUtils)
   */
  buildSubView(placesNode, query) {
    let newId = `PanelUI-bookmarks-${this.makeSafeId(
      placesNode?.bookmarkGuid || "recentView"
    )}`; // turn the bookmarks GUID into a DOM node ID
    let view = this.create(document, "panelview", {
      id: newId,
      flex: "1",
      class: "PanelUI-subView cui-widget-panelview",
    });
    document.createXULElement("panelview");
    this.viewCache.appendChild(view); // put it in the panel view cache, showSubView will pull it out later
    let body = view.appendChild(
      this.create(document, "vbox", {
        id: `${newId}-body`,
        class: "panel-subview-body",
      })
    );
    let container = body.appendChild(
      this.create(document, "toolbaritem", {
        id: `${newId}-content`,
        orient: "vertical",
        smoothscroll: "true",
        flatList: "true",
        tooltip: "bhTooltip",
        role: "group",
      })
    );
    view.addEventListener(
      "ViewShowing",
      e =>
        (view.panelMenu = new PlacesContainerPanelview(
          container,
          view,
          placesNode?.uri || query
        ))
    );
    if (placesNode) view._placesNode = placesNode;
    return view;
  }
  /**
   * show the subview for a given extension
   * @param {object} e (a triggering command/click event)
   * @param {object} anchor (the subviewbutton that was clicked — dictates the title of the subview)
   */
  showSubView(e, anchor) {
    if (!anchor) anchor = e.target;
    PanelUI.showSubView(
      `PanelUI-bookmarks-${this.makeSafeId(
        anchor._placesNode?.bookmarkGuid || "recentView"
      )}`,
      anchor,
      e
    );
  }
  // generate and load a stylesheet
  loadStylesheet() {
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(
      `data:text/css;charset=UTF=8,${encodeURIComponent(
        `#bookmarks-panel-button{list-style-image:url('${this.config["Icon URL"]}');}`
      )}`
    );
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

class PlacesContainerPanelview extends PlacesPanelview {
  constructor(container, panelview, place, options = {}) {
    super(container, panelview, place, options);
  }
  _onCommand(e) {
    e = BrowserUtils.getRootEvent(e);
    let button = e.originalTarget;
    if (!button._placesNode) return;
    if (PlacesUtils.containerTypes.includes(button._placesNode.type)) return;
    let modifKey = AppConstants.platform === "macosx" ? e.metaKey : e.ctrlKey;
    if (!PlacesUIUtils.openInTabClosesMenu && modifKey) {
      button.setAttribute("closemenu", "none");
    } else {
      button.removeAttribute("closemenu");
    }

    PlacesUIUtils.openNodeWithEvent(button._placesNode, e);
    if (
      button.parentNode.id != "panelMenu_bookmarksMenu" ||
      (e.type == "click" && e.button == 1 && PlacesUIUtils.openInTabClosesMenu)
    ) {
      this.panelMultiView.closest("panel").hidePopup();
    }
  }
  _insertNewItem(aChild, aInsertionNode, aBefore = null) {
    let element = this._createDOMNodeForPlacesNode(aChild);
    aInsertionNode.insertBefore(element, aBefore);
    return element;
  }
  _createDOMNodeForPlacesNode(placesNode) {
    this._domNodes.delete(placesNode);
    let element;
    let { type } = placesNode;
    if (type == Ci.nsINavHistoryResultNode.RESULT_TYPE_SEPARATOR) {
      element = document.createXULElement("toolbarseparator");
    } else {
      if (type == Ci.nsINavHistoryResultNode.RESULT_TYPE_URI) {
        element = document.createXULElement("toolbarbutton");
        element.classList.add(
          "subviewbutton",
          "subviewbutton-iconic",
          "bookmark-item"
        );
        element.setAttribute(
          "scheme",
          PlacesUIUtils.guessUrlSchemeForUI(placesNode.uri)
        );
      } else if (PlacesUtils.containerTypes.includes(type)) {
        element = this.create(document, "toolbarbutton", {
          class: "subviewbutton subviewbutton-nav bookmark-item",
          closemenu: "none",
          container: "true",
        });
        element.addEventListener("command", e => this.showSubView(e));
        if (typeof this.options.extraClasses.entry == "string") {
          element.classList.add(this.options.extraClasses.entry);
        }
        if (!this._domNodes.has(placesNode)) {
          this._domNodes.set(placesNode, element);
        }
        let panel = this.buildSubView(placesNode, element);
      }
      element.setAttribute("label", PlacesUIUtils.getBestTitle(placesNode));
      let { icon } = placesNode;
      if (icon) element.setAttribute("image", icon);
    }
    element._placesNode = placesNode;
    if (!this._domNodes.has(placesNode)) {
      this._domNodes.set(placesNode, element);
    }
    return element;
  }
  nodeInserted(aParentPlacesNode, aPlacesNode, aIndex) {
    let parentElt = this._getDOMNodeForPlacesNode(aParentPlacesNode);
    if (parentElt != this._rootElt) return;
    let { children } = this._rootElt;
    this._insertNewItem(
      aPlacesNode,
      this._rootElt,
      aIndex < children.length ? children[aIndex] : null
    );
    this._setEmptyPopupStatus(parentElt, false);
  }
  nodeRemoved(aParentPlacesNode, aPlacesNode, aIndex) {
    let parentElt = this._getDOMNodeForPlacesNode(aParentPlacesNode);
    if (parentElt != this._rootElt) return;
    let elt = this._getDOMNodeForPlacesNode(aPlacesNode);
    let placesNode = elt._placesNode;
    if (PlacesUtils.containerTypes.includes(placesNode.type)) {
      this.destroySubView(placesNode, elt);
    }
    this._removeChild(elt);
    this._setEmptyPopupStatus(parentElt, true);
  }
  nodeMoved(
    aPlacesNode,
    aOldParentPlacesNode,
    aOldIndex,
    aNewParentPlacesNode,
    aNewIndex
  ) {
    let parentElt = this._getDOMNodeForPlacesNode(aNewParentPlacesNode);
    if (parentElt != this._rootElt) return;
    let elt = this._getDOMNodeForPlacesNode(aPlacesNode);
    this._removeChild(elt);
    this._rootElt.insertBefore(elt, this._rootElt.children[aNewIndex]);
  }
  nodeTitleChanged(aPlacesNode, aNewTitle) {
    let elt = this._getDOMNodeForPlacesNode(aPlacesNode);
    elt.setAttribute(
      "label",
      aNewTitle || PlacesUIUtils.getBestTitle(aPlacesNode)
    );
  }
  invalidateContainer(aPlacesNode) {
    let elt = this._getDOMNodeForPlacesNode(aPlacesNode);
    if (elt != this._rootElt) return;
    while (this._rootElt.hasChildNodes()) this._rootElt.firstChild.remove();
    let fragment = document.createDocumentFragment();
    for (let i = 0; i < this._resultNode.childCount; ++i) {
      this._insertNewItem(this._resultNode.getChild(i), fragment);
    }
    this._rootElt.appendChild(fragment);
  }
  /**
   * create a DOM node with given parameters
   * @param {object} aDoc (which doc to create the element in)
   * @param {string} tag (an HTML tag name, like "button" or "p")
   * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
   * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
   * @returns the created DOM node
   */
  create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }
  /**
   * make a valid ID for a DOM node based on a bookmarks GUID.
   * @param {string} id (a bookmarks GUID)
   * @returns an ID with crap removed so it can be used in a DOM node's ID.
   */
  makeSafeId(id) {
    id = id.toLowerCase();
    return id.replace(/[^a-z0-9_-]/g, "_");
  }
  // where panelviews are hiding when we're not looking
  get viewCache() {
    return document.getElementById("appMenu-viewCache");
  }
  /**
   * for a given placesNode, build a panel subview
   * @param {object} placesNode (an placesNode object provided by PlacesUtils)
   */
  buildSubView(placesNode) {
    let newId = `PanelUI-bookmarks-${this.makeSafeId(placesNode.bookmarkGuid)}`; // turn the bookmarks GUID into a DOM node ID
    let view = this.create(document, "panelview", {
      id: newId,
      flex: "1",
      class: "PanelUI-subView cui-widget-panelview",
    });
    document.createXULElement("panelview");
    this.viewCache.appendChild(view); // put it in the panel view cache, showSubView will pull it out later
    let body = view.appendChild(
      this.create(document, "vbox", {
        id: `${newId}-body`,
        class: "panel-subview-body",
      })
    );
    let container = body.appendChild(
      this.create(document, "toolbaritem", {
        id: `${newId}-content`,
        orient: "vertical",
        smoothscroll: "true",
        flatList: "true",
        tooltip: "bhTooltip",
        role: "group",
      })
    );
    view.addEventListener(
      "ViewShowing",
      e =>
        (view.panelMenu = new PlacesContainerPanelview(
          container,
          view,
          placesNode.uri
        ))
    );
    view._placesNode = placesNode;
    return view;
  }
  destroySubView(placesNode) {
    let view = PanelMultiView.getViewNode(
      document,
      `PanelUI-bookmarks-${this.makeSafeId(placesNode.bookmarkGuid)}`
    );
    if (view.panelMenu) view.panelMenu.uninit();
    view.remove();
  }
  /**
   * show the subview for a given extension
   * @param {object} e (a triggering command/click event)
   * @param {object} anchor (the subviewbutton that was clicked — dictates the title of the subview)
   */
  showSubView(e, anchor) {
    if (!anchor) anchor = e.target;
    if (!("_placesNode" in anchor)) return;
    PanelUI.showSubView(
      `PanelUI-bookmarks-${this.makeSafeId(anchor._placesNode.bookmarkGuid)}`,
      anchor,
      e
    );
  }
}

window.bookmarksPanel = new BookmarksPanel();
