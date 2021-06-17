// ==UserScript==
// @name           All Tabs Menu Expansion Pack
// @version        1.6
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a big scrolling menu containing all the tabs. This script adds several new features to the "all tabs menu" to help it catch up to the functionality of the regular tabs bar.
// 1) it allows you to drag and drop tabs in the all tabs menu.
// 2) it adds an animated close button for every tab in this menu.
// 3) it allows you to multiselect tabs in the all tabs menu and close an unlimited number of tabs at once without closing/blurring the popup.
// 4) it significantly improves the mute/unmute button by making it work like the mute button in the tabs bar used to work. If you only have one tab selected, it mutes/unmutes that tab. If you have multiple tabs selected, it mutes/unmutes all of them. This also adds a tooltip to the mute button.
// 5) By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. This script adds the same functionality to the all tabs menu.
// 6) It also adds special color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can differentiate them from normal tabs.
// 7) It also includes a preference (userChrome.tabs.all-tabs-menu.reverse-order) that lets you reverse the order of the tabs so that newer tabs are displayed on top rather than on bottom.
// 8) It also modifies the all tabs button's tooltip to display the number of tabs as well as the shortcut to open the all tabs menu, Ctrl+Shift+Tab.
// All the relevant CSS for this is already included in and loaded by the script. It's designed to look consistent with my theme as well as with the latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in here, or the end of uc-tabs-bar.css on my repo.
// ==/UserScript==
(function () {
    let timer;
    let prefSvc = Services.prefs;
    let reversePref = "userChrome.tabs.all-tabs-menu.reverse-order";
    let attributeFilter = ["pending", "notselectedsinceload"];
    let tabContext = document.getElementById("tabContextMenu");
    let observer = new MutationObserver((_mus) => {
        for (const row of gTabsPanel.allTabsPanel.rows)
            for (const attr of attributeFilter)
                row.toggleAttribute(attr, !!row.tab.getAttribute(attr));
        delayedDisconnect();
    });

    /**
     * create a DOM node with given parameters
     * @param {object} aDoc (which doc to create the element in)
     * @param {string} tag (an HTML tag name, like "button" or "p")
     * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
     * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
     * @returns the created DOM node
     */
    function create(aDoc, tag, props, isHTML = false) {
        let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
        for (let prop in props) {
            el.setAttribute(prop, props[prop]);
        }
        return el;
    }

    function setAttributes(element, attrs) {
        for (let [name, value] of Object.entries(attrs))
            if (value) element.setAttribute(name, value);
            else element.removeAttribute(name);
    }

    function findRow(el) {
        return el.classList.contains("all-tabs-item") ? el : el.closest(".all-tabs-item");
    }

    function delayedDisconnect() {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            observer.disconnect();
        }, 3000);
    }

    function registerSheet() {
        const css = `#allTabsMenu-allTabsViewTabs>.all-tabs-item{border-radius:var(--arrowpanel-menuitem-border-radius);box-shadow:none;-moz-box-align:center;padding-inline-end:2px;overflow-x:-moz-hidden-unscrollable;position:relative;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-button:not([disabled],[open]):focus{background:none;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is([selected],[multiselected],[usercontextid]:is(:hover,[_moz-menuactive])) .all-tabs-button{background-image:linear-gradient(to right,var(--main-stripe-color) 0,var(--main-stripe-color) 4px,transparent 4px)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[selected]{font-weight:normal;background-color:var(--arrowpanel-dimmed-further)!important;--main-stripe-color:var(--arrowpanel-dimmed-even-further);}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-button{min-height:revert;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[usercontextid]:not([multiselected]){--main-stripe-color:var(--identity-tab-color);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]{--main-stripe-color:var(--multiselected-color,var(--toolbarbutton-icon-fill-attention));}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-dimmed)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]:not([selected]):is(:hover,[_moz-menuactive]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,[_moz-menuactive]):active{background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-faint,color-mix(in srgb,var(--arrowpanel-dimmed) 60%,transparent))!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]>.all-tabs-button{opacity:.6;}:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload]:not([pending])>.all-tabs-button,:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload][pending]>.all-tabs-button[busy]{font-style:italic;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button{max-width:18px;max-height:18px;border-radius:100%;color:inherit;background-color:transparent!important;opacity:.7;min-height:0;min-width:0;padding:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>.toolbarbutton-icon{min-width:18px;min-height:18px;fill:inherit;fill-opacity:inherit;-moz-context-properties:inherit;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>label:empty{display:none;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:is(:hover,:focus):not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:is(:hover,:focus):not([disabled]){background-color:var(--arrowpanel-dimmed)!important;opacity:1;color:inherit;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:hover:active:not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:hover:active:not([disabled]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[toggle-mute]{list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M8.587 2.354L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618A2.191 2.191 0 0 0 4.191 11H5.5l3.17 2.717a.2.2 0 0 0 .33-.152V2.544a.25.25 0 0 0-.413-.19z'/><path d='M11.575 3.275a.5.5 0 0 0-.316.949 3.97 3.97 0 0 1 0 7.551.5.5 0 0 0 .316.949 4.971 4.971 0 0 0 0-9.449z'/><path d='M13 8a3 3 0 0 0-2.056-2.787.5.5 0 1 0-.343.939A2.008 2.008 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/></svg>")!important;padding:2px 2.5px 2px .5px;margin-inline-end:8.5px;margin-inline-start:-27px;transition:.25s cubic-bezier(.07,.78,.21,.95) transform,.2s cubic-bezier(.07,.74,.24,.95) margin,.075s linear opacity;display:block!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[toggle-mute][hidden]{transform:translateX(14px);opacity:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[toggle-mute]{transform:translateX(48px);}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[soundplaying]{transform:none!important;opacity:.7;margin-inline-start:-2px;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[muted]{list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M13 8a2.813 2.813 0 0 0-.465-1.535l-.744.744A1.785 1.785 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/><path d='M13.273 5.727A3.934 3.934 0 0 1 14 8a3.984 3.984 0 0 1-2.742 3.775.5.5 0 0 0 .316.949A4.985 4.985 0 0 0 15 8a4.93 4.93 0 0 0-1.012-2.988z'/><path d='M8.67 13.717a.2.2 0 0 0 .33-.152V10l-2.154 2.154z'/><path d='M14.707 1.293a1 1 0 0 0-1.414 0L9 5.586V2.544a.25.25 0 0 0-.413-.19L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618a2.186 2.186 0 0 0 1.659 2.118l-2.366 2.366a1 1 0 1 0 1.414 1.414l12-12a1 1 0 0 0 0-1.414z'/></svg>")!important;transform:none!important;opacity:.7;margin-inline-start:-2px;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[close-button]{fill-opacity:0;transform:translateX(14px);opacity:0;margin-inline-start:-27px;transition:.25s cubic-bezier(.07,.78,.21,.95) transform,.2s cubic-bezier(.07,.74,.24,.95) margin,.075s linear opacity;display:block;-moz-context-properties:fill,fill-opacity,stroke;fill:currentColor;fill-opacity:0;border-radius:50%;list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect fill='context-fill' fill-opacity='context-fill-opacity' width='20' height='20' rx='2' ry='2'/><path fill='context-fill' fill-opacity='context-stroke-opacity' d='M11.06 10l3.47-3.47a.75.75 0 00-1.06-1.06L10 8.94 6.53 5.47a.75.75 0 10-1.06 1.06L8.94 10l-3.47 3.47a.75.75 0 101.06 1.06L10 11.06l3.47 3.47a.75.75 0 001.06-1.06z'/></svg>");}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]{transform:none;opacity:.7;margin-inline-start:-2px;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[dragpos]{background-color:color-mix(in srgb,transparent 30%,var(--arrowpanel-faint,color-mix(in srgb,var(--arrowpanel-dimmed) 60%,transparent)));}#allTabsMenu-allTabsViewTabs>.all-tabs-item[dragpos]::before{content:"";position:absolute;pointer-events:none;height:0;width:30%;z-index:1000;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[dragpos="before"]::before{inset-block-start:0;border-top:1px solid var(--arrowpanel-dimmed-even-further);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[dragpos="after"]::before{inset-block-end:0;border-bottom:1px solid var(--arrowpanel-dimmed-even-further);}`;
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
            Ci.nsIStyleSheetService
        );
        let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
        if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }

    function oneTimeSetup() {
        let lazies = tabContext.querySelectorAll("[data-lazy-l10n-id]");
        if (lazies) {
            MozXULElement.insertFTLIfNeeded("browser/tabContextMenu.ftl");
            lazies.forEach((el) => {
                el.setAttribute("data-l10n-id", el.getAttribute("data-lazy-l10n-id"));
                el.removeAttribute("data-lazy-l10n-id");
            });
        }
        function addContextListeners() {
            tabContext.addEventListener(
                "command",
                () => {
                    observer.disconnect();
                    if (gTabsPanel.allTabsPanel.view.panelMultiView) {
                        if (
                            gBrowser.selectedTabs.length > 1 &&
                            gBrowser.selectedTabs.includes(TabContextMenu.contextTab)
                        )
                            gBrowser.selectedTabs.forEach((tab) => {
                                observer.observe(tab, {
                                    attributes: true,
                                    attributeFilter,
                                });
                            });
                        else
                            observer.observe(TabContextMenu.contextTab, {
                                attributes: true,
                                attributeFilter,
                            });
                    }
                },
                true
            );
            tabContext.addEventListener(
                "popuphidden",
                () => {
                    if (gTabsPanel.allTabsPanel.view.panelMultiView) delayedDisconnect();
                },
                false
            );
        }
        tabContext.addEventListener("popupshowing", addContextListeners, { once: true });
    }

    function reverseTabOrder() {
        let panel = gTabsPanel.allTabsPanel;
        if (prefSvc.getBoolPref(reversePref)) {
            eval(
                `panel._populate = function ` +
                    panel._populate
                        .toSource()
                        .replace(
                            /super\.\_populate\(event\)\;/,
                            Object.getPrototypeOf(Object.getPrototypeOf(panel))
                                ._populate.toSource()
                                .replace(/^.*\n\s*/, "")
                                .replace(/\n.*$/, "")
                        )
                        .replace(/appendChild/, `prepend`) +
                    `\n panel._addTab = function ` +
                    panel._addTab
                        .toSource()
                        .replace(
                            /nextRow\.parentNode\.insertBefore\(newRow\, nextRow\)\;/,
                            `nextRow.after(newRow)`
                        )
                        .replace(/this\.\_addElement/, `this.containerNode.prepend`)
            );
        } else {
            delete panel._populate;
            delete panel._addTab;
        }
    }

    function skipHiddenButtons() {
        let panelViewClass = PanelView.forNode(gTabsPanel.allTabsView);
        eval(
            `panelViewClass._makeNavigableTreeWalker = function ` +
                panelViewClass._makeNavigableTreeWalker
                    .toSource()
                    .replace(/(node\.disabled)/, `$1 || node.hidden`)
        );
        delete panelViewClass.__arrowNavigableWalker;
        delete panelViewClass.__tabNavigableWalker;
    }

    function prefHandler(_sub, _top, _pref) {
        let multiview = gTabsPanel.allTabsPanel.panelMultiView;
        if (multiview)
            multiview.addEventListener("PanelMultiViewHidden", reverseTabOrder, {
                once: true,
            });
        else reverseTabOrder();
    }

    function start() {
        gTabsPanel.init();
        registerSheet();
        let allTabs = gTabsPanel.allTabsPanel;
        allTabs._setupListeners = function () {
            this.listenersRegistered = true;
            this.gBrowser.tabContainer.addEventListener("TabAttrModified", this);
            this.gBrowser.tabContainer.addEventListener("TabClose", this);
            this.gBrowser.tabContainer.addEventListener("TabMove", this);
            this.gBrowser.tabContainer.addEventListener("TabPinned", this);
            this.gBrowser.addEventListener("TabMultiSelect", this, false);
            this.panelMultiView.addEventListener("PanelMultiViewHidden", this);
        };
        allTabs._cleanupListeners = function () {
            this.gBrowser.tabContainer.removeEventListener("TabAttrModified", this);
            this.gBrowser.tabContainer.removeEventListener("TabClose", this);
            this.gBrowser.tabContainer.removeEventListener("TabMove", this);
            this.gBrowser.tabContainer.removeEventListener("TabPinned", this);
            this.gBrowser.removeEventListener("TabMultiSelect", this, false);
            this.panelMultiView.removeEventListener("PanelMultiViewHidden", this);
            this.listenersRegistered = false;
        };
        allTabs._createRow = function (tab) {
            let { doc } = this;
            let row = create(doc, "toolbaritem", {
                class: "all-tabs-item",
                context: "tabContextMenu",
                draggable: true,
            });
            if (this.className) {
                row.classList.add(this.className);
            }
            row.tab = tab;
            row.addEventListener("command", this);
            row.addEventListener("mousedown", this);
            row.addEventListener("mouseup", this);
            row.addEventListener("click", this);
            this.tabToElement.set(tab, row);

            let button = create(doc, "toolbarbutton", {
                class: "all-tabs-button subviewbutton subviewbutton-iconic",
                flex: "1",
                crop: "right",
            });
            button.tab = tab;
            row.appendChild(button);

            let secondaryButton = create(doc, "toolbarbutton", {
                class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
                closemenu: "none",
                "toggle-mute": "true",
            });
            secondaryButton.tab = tab;
            secondaryButton.addEventListener("mouseover", this);
            secondaryButton.addEventListener("mouseout", this);
            row.appendChild(secondaryButton);

            let closeButton = create(doc, "toolbarbutton", {
                class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
                "close-button": "true",
            });
            closeButton.tab = tab;
            closeButton.addEventListener("mouseover", this);
            closeButton.addEventListener("mouseout", this);
            row.appendChild(closeButton);

            this._setRowAttributes(row, tab);
            return row;
        };
        allTabs._setRowAttributes = function (row, tab) {
            setAttributes(row, {
                selected: tab.selected,
                pending: tab.getAttribute("pending"),
                multiselected: tab.getAttribute("multiselected"),
                notselectedsinceload: tab.getAttribute("notselectedsinceload"),
            });
            if (tab.userContextId) {
                let idColor = ContextualIdentityService.getPublicIdentityFromId(
                    tab.userContextId
                )?.color;
                row.className = idColor
                    ? `all-tabs-item identity-color-${idColor}`
                    : "all-tabs-item";
                row.setAttribute("usercontextid", tab.userContextId);
            } else {
                row.className = "all-tabs-item";
                row.removeAttribute("usercontextid");
            }

            let busy = tab.getAttribute("busy");
            setAttributes(row.firstElementChild, {
                busy,
                label: tab.label,
                image: !busy && tab.getAttribute("image"),
                iconloadingprincipal: tab.getAttribute("iconloadingprincipal"),
            });

            this._setImageAttributes(row, tab);

            let secondaryButton = row.querySelector(".all-tabs-secondary-button");
            setAttributes(secondaryButton, {
                muted: tab.muted,
                soundplaying: tab.soundPlaying,
                pictureinpicture: tab.pictureinpicture,
                hidden: !(tab.muted || tab.soundPlaying),
            });
        };
        allTabs.handleEvent = function (e) {
            let tab = e.target.tab;
            switch (e.type) {
                case "ViewShowing":
                    if (!this.listenersRegistered && e.target == this.view) {
                        this.panelMultiView = this.view.panelMultiView;
                        this._populate(e);
                    }
                    break;
                case "mousedown":
                    this._onMouseDown(e, tab);
                    break;
                case "mouseup":
                    this._onMouseUp(e, tab);
                    break;
                case "click":
                    this._onClick(e);
                    break;
                case "command":
                    this._onCommand(e, tab);
                    break;
                case "mouseover":
                case "mouseout":
                    this._setTooltip(e, tab);
                    break;
                case "TabAttrModified":
                    this._tabAttrModified(e.target);
                    break;
                case "TabClose":
                    this._tabClose(e.target);
                    break;
                case "TabMove":
                    this._moveTab(e.target);
                    break;
                case "dragstart":
                    this._onDragStart(e, tab);
                    break;
                case "dragleave":
                    this._onDragLeave(e);
                    break;
                case "dragover":
                    this._onDragOver(e);
                    break;
                case "dragend":
                    this._onDragEnd(e);
                    break;
                case "drop":
                    this._onDrop(e);
                    break;
                case "TabMultiSelect":
                    this._onTabMultiSelect();
                    break;
                case "TabPinned":
                    if (!this.filterFn(e.target)) this._tabClose(e.target);
                    break;
                case "PanelMultiViewHidden":
                    if (e.target == this.panelMultiView) {
                        this._cleanup();
                        this.panelMultiView = null;
                    }
                    break;
            }
        };
        allTabs._onMouseDown = function (e, tab) {
            if (e.button !== 0) return;
            let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
            if (e.shiftKey) {
                const lastSelectedTab = this.gBrowser.lastMultiSelectedTab;
                if (!accelKey) {
                    this.gBrowser.selectedTab = lastSelectedTab;
                    this.gBrowser.clearMultiSelectedTabs();
                }
                this.gBrowser.addRangeToMultiSelectedTabs(lastSelectedTab, tab);
                e.preventDefault();
            } else if (accelKey) {
                if (tab.multiselected) this.gBrowser.removeFromMultiSelectedTabs(tab);
                else if (tab != this.gBrowser.selectedTab) {
                    this.gBrowser.addToMultiSelectedTabs(tab);
                    this.gBrowser.lastMultiSelectedTab = tab;
                }
                e.preventDefault();
            } else {
                if (!tab.selected && tab.multiselected) this.gBrowser.lockClearMultiSelectionOnce();
                if (
                    !e.shiftKey &&
                    !accelKey &&
                    !e.target.classList.contains("all-tabs-secondary-button") &&
                    tab !== this.gBrowser.selectedTab
                ) {
                    if (tab.getAttribute("pending") || tab.getAttribute("busy"))
                        tab.noCanvas = true;
                    else delete tab.noCanvas;
                    if (this.gBrowser.selectedTab != tab) this.gBrowser.selectedTab = tab;
                    else this.gBrowser.tabContainer._handleTabSelect();
                }
            }
        };
        allTabs._onMouseUp = function (e, tab) {
            if (e.button === 2) return;
            if (e.button === 1) {
                this.gBrowser.removeTab(tab, {
                    animate: true,
                    byMouse: false,
                });
                return;
            }
            let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
            if (e.shiftKey || accelKey || e.target.classList.contains("all-tabs-secondary-button"))
                return;
            delete tab.noCanvas;
            this.gBrowser.unlockClearMultiSelection();
            this.gBrowser.clearMultiSelectedTabs();
            PanelMultiView.hidePopup(this.view.closest("panel"));
        };
        allTabs._onClick = function (e) {
            if (e.button !== 0 || e.target.classList.contains("all-tabs-secondary-button")) return;
            e.preventDefault();
        };
        allTabs._onCommand = function (e, tab) {
            if (e.target.hasAttribute("toggle-mute")) {
                tab.multiselected
                    ? this.gBrowser.toggleMuteAudioOnMultiSelectedTabs(tab)
                    : tab.toggleMuteAudio();
                return;
            }
            if (e.target.hasAttribute("close-button")) {
                if (tab.multiselected) this.gBrowser.removeMultiSelectedTabs();
                else this.gBrowser.removeTab(tab, { animate: true });
                return;
            }
            if (!gSharedTabWarning.willShowSharedTabWarning(tab))
                if (tab !== this.gBrowser.selectedTab) this._selectTab(tab);
            delete tab.noCanvas;
        };
        allTabs._onDragStart = function (e, tab) {
            let row = e.target;
            if (!tab || this.gBrowser.tabContainer._isCustomizing) return;
            let selectedTabs = this.gBrowser.selectedTabs;
            let otherSelectedTabs = selectedTabs.filter((selectedTab) => selectedTab != tab);
            let dataTransferOrderedTabs = [tab].concat(otherSelectedTabs);
            let dt = e.dataTransfer;
            for (let i = 0; i < dataTransferOrderedTabs.length; i++) {
                let dtTab = dataTransferOrderedTabs[i];
                dt.mozSetDataAt("all-tabs-item", dtTab, i);
            }
            dt.mozCursor = "default";
            dt.addElement(row);
            // if multiselected tabs aren't adjacent, make them adjacent
            if (tab.multiselected) {
                function newIndex(aTab, index) {
                    if (aTab.pinned) return Math.min(index, this.gBrowser._numPinnedTabs - 1);
                    return Math.max(index, this.gBrowser._numPinnedTabs);
                }
                let tabIndex = selectedTabs.indexOf(tab);
                let draggedTabPos = tab._tPos;
                // tabs to the left of the dragged tab
                let insertAtPos = draggedTabPos - 1;
                for (let i = tabIndex - 1; i > -1; i--) {
                    insertAtPos = newIndex(selectedTabs[i], insertAtPos);
                    if (insertAtPos && !selectedTabs[i].nextElementSibling.multiselected)
                        this.gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
                }
                // tabs to the right
                insertAtPos = draggedTabPos + 1;
                for (let i = tabIndex + 1; i < selectedTabs.length; i++) {
                    insertAtPos = newIndex(selectedTabs[i], insertAtPos);
                    if (insertAtPos && !selectedTabs[i].previousElementSibling.multiselected)
                        this.gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
                }
            }
            // tab preview
            if (
                !tab.noCanvas &&
                (AppConstants.platform == "win" || AppConstants.platform == "macosx")
            ) {
                delete tab.noCanvas;
                let windowUtils = window.windowUtils;
                let scale = windowUtils.screenPixelsPerCSSPixel / windowUtils.fullZoom;
                let canvas = this._dndCanvas;
                if (!canvas) {
                    this._dndCanvas = canvas = document.createElementNS(
                        "http://www.w3.org/1999/xhtml",
                        "canvas"
                    );
                    canvas.style.width = "100%";
                    canvas.style.height = "100%";
                    canvas.mozOpaque = true;
                }
                canvas.width = 160 * scale;
                canvas.height = 90 * scale;
                let toDrag = canvas;
                let dragImageOffset = -16;
                let browser = tab.linkedBrowser;
                if (gMultiProcessBrowser) {
                    let context = canvas.getContext("2d");
                    context.fillStyle = getComputedStyle(this.view).getPropertyValue(
                        "background-color"
                    );
                    context.fillRect(0, 0, canvas.width, canvas.height);

                    let captureListener = () =>
                        dt.updateDragImage(canvas, dragImageOffset, dragImageOffset);
                    PageThumbs.captureToCanvas(browser, canvas).then(captureListener);
                } else {
                    PageThumbs.captureToCanvas(browser, canvas);
                    dragImageOffset = dragImageOffset * scale;
                }
                dt.setDragImage(toDrag, dragImageOffset, dragImageOffset);
            }
            tab._dragData = {
                movingTabs: (tab.multiselected ? this.gBrowser.selectedTabs : [tab]).filter(
                    this.filterFn
                ),
            };
            e.stopPropagation();
        };
        // set the drop target style with an attribute, "dragpos", which is either "after" or "before"
        allTabs._onDragOver = function (e) {
            let row = findRow(e.target);
            let dt = e.dataTransfer;
            if (!dt.types.includes("all-tabs-item") || !row || row.tab.multiselected) return;
            let draggedTab = dt.mozGetDataAt("all-tabs-item", 0);
            if (row.tab === draggedTab) return;
            // whether a tab will be placed before or after the drop target depends on 1) whether the drop target is above or below the dragged tab, and 2) whether the order of the tab list is reversed.
            function getPosition() {
                return prefSvc.getBoolPref(reversePref)
                    ? row.tab._tPos < draggedTab._tPos
                    : row.tab._tPos > draggedTab._tPos;
            }
            let position = getPosition() ? "after" : "before";
            row.setAttribute("dragpos", position);
            e.preventDefault();
        };
        // remove the drop target style.
        allTabs._onDragLeave = function (e) {
            let row = findRow(e.target);
            let dt = e.dataTransfer;
            if (!dt.types.includes("all-tabs-item") || !row) return;
            this.containerNode
                .querySelectorAll("[dragpos]")
                .forEach((item) => item.removeAttribute("dragpos"));
        };
        // move the tab(s)
        allTabs._onDrop = function (e) {
            let row = findRow(e.target);
            let dt = e.dataTransfer;
            let tabBar = this.gBrowser.tabContainer;

            if (!dt.types.includes("all-tabs-item") || !row) return;

            let draggedTab = dt.mozGetDataAt("all-tabs-item", 0);
            let movingTabs = draggedTab._dragData.movingTabs;

            if (
                !movingTabs ||
                dt.mozUserCancelled ||
                dt.dropEffect === "none" ||
                tabBar._isCustomizing
            ) {
                delete draggedTab._dragData;
                return;
            }

            tabBar._finishGroupSelectedTabs(draggedTab);

            if (draggedTab) {
                let newIndex = row.tab._tPos;
                const dir = newIndex < movingTabs[0]._tPos;
                movingTabs.forEach((tab) =>
                    this.gBrowser.moveTabTo(
                        dt.dropEffect == "copy" ? this.gBrowser.duplicateTab(tab) : tab,
                        dir ? newIndex++ : newIndex
                    )
                );
            }
            row.removeAttribute("dragpos");
            e.stopPropagation();
        };
        // clean up remaining crap
        allTabs._onDragEnd = function (e) {
            let draggedTab = e.dataTransfer.mozGetDataAt("all-tabs-item", 0);
            delete draggedTab._dragData;
            delete draggedTab.noCanvas;
            for (let row of this.rows) row.removeAttribute("dragpos");
        };
        allTabs._setTooltip = function (e, tab) {
            const selectedTabs = this.gBrowser.selectedTabs;
            const contextTabInSelection = selectedTabs.includes(tab);
            const affectedTabsLength = contextTabInSelection ? selectedTabs.length : 1;
            let label;
            if (e.target.hasAttribute("toggle-mute"))
                if (contextTabInSelection)
                    label = PluralForm.get(
                        affectedTabsLength,
                        gTabBrowserBundle.GetStringFromName(
                            tab.linkedBrowser.audioMuted
                                ? "tabs.unmuteAudio2.tooltip"
                                : "tabs.muteAudio2.tooltip"
                        )
                    )
                        .replace("%S", ShortcutUtils.prettifyShortcut(key_toggleMute))
                        .replace("#1", affectedTabsLength);
                else
                    label = PluralForm.get(
                        affectedTabsLength,
                        gTabBrowserBundle.GetStringFromName(
                            tab.linkedBrowser.audioMuted
                                ? "tabs.unmuteAudio2.background.tooltip"
                                : "tabs.muteAudio2.background.tooltip"
                        )
                    ).replace("#1", affectedTabsLength);
            else if (e.target.hasAttribute("close-button")) {
                label = PluralForm.get(
                    affectedTabsLength,
                    gTabBrowserBundle.GetStringFromName("tabs.closeTabs.tooltip")
                ).replace("#1", affectedTabsLength);
                if (contextTabInSelection) {
                    let shortcut = ShortcutUtils.prettifyShortcut(key_close);
                    label = label.includes("%S")
                        ? label.replace("%S", shortcut)
                        : label + ` (${shortcut})`;
                }
            } else return;
            e.target.setAttribute("tooltiptext", label);
        };
        allTabs._onTabMultiSelect = function () {
            for (let item of this.rows)
                item.toggleAttribute("multiselected", !!item.tab.multiselected);
        };

        gTabsPanel.allTabsButton.setAttribute(
            "onmouseover",
            `this.tooltipText = PluralForm.get(gBrowser.tabs.length, gNavigatorBundle.getString("ctrlTab.listAllTabs.label")).replace("#1", gBrowser.tabs.length).toLocaleLowerCase().replace(RTL_UI ? /.$/i : /^./i, function (letter) { return letter.toLocaleUpperCase(); }).trim() + " (" + ShortcutUtils.prettifyShortcut(key_showAllTabs) + ")";`
        );

        gTabsPanel.allTabsView.addEventListener("ViewShowing", oneTimeSetup, { once: true });
        ["dragstart", "dragleave", "dragover", "drop", "dragend"].forEach((ev) =>
            allTabs.containerNode.addEventListener(ev, allTabs)
        );

        reverseTabOrder();
        skipHiddenButtons();
    }

    if (!prefSvc.prefHasUserValue(reversePref)) prefSvc.setBoolPref(reversePref, false);
    prefSvc.addObserver(reversePref, prefHandler);

    if (gBrowserInit.delayedStartupFinished) {
        start();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                start();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
