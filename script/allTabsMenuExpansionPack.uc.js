// ==UserScript==
// @name           All Tabs Menu Expansion Pack
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a big scrolling menu containing all the tabs. This script adds several new features to the "all tabs menu" to help it catch up to the functionality of the regular tabs bar. First, it adds an animated close button for every tab in this menu. Second, it allows you to multiselect tabs in the all tabs menu and close an unlimited number of tabs at once without closing/blurring the popup. Third, it significantly improves the mute/unmute button by making it work like the mute button in the tabs bar used to work. If you only have one tab selected, it mutes/unmutes that tab. If you have multiple tabs selected, it mutes/unmutes all of them. This also adds a tooltip to the mute button. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. This script adds the same functionality to the all tabs menu. It also adds special color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can differentiate them from normal tabs. Since version 1.1 it also includes a preference (userChrome.tabs.all-tabs-menu.reverse-order) that lets you reverse the order of the tabs so that newer tabs are displayed on top rather than on bottom. It also modifies the all tabs button's tooltip to display the number of tabs as well as the shortcut to open the all tabs menu, Ctrl+Shift+Tab. All the relevant CSS for this is already included in and loaded by the script. It's designed to look consistent with my theme and with the latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in here, or the end of uc-tabs-bar.css on my repo.
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

    function setAttributes(element, attrs) {
        for (let [name, value] of Object.entries(attrs)) {
            if (value) {
                element.setAttribute(name, value);
            } else {
                element.removeAttribute(name);
            }
        }
    }

    function contextCmd(_e) {
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
    }

    function contextHide(_e) {
        if (gTabsPanel.allTabsPanel.view.panelMultiView) delayedDisconnect();
    }

    function delayedDisconnect() {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            observer.disconnect();
        }, 3000);
    }

    function registerSheet() {
        const css = `#allTabsMenu-allTabsViewTabs>.all-tabs-item{border-radius:var(--arrowpanel-menuitem-border-radius);box-shadow:none;margin-inline:4px;min-height:28px;-moz-box-align:center;padding-inline-end:2px;overflow-x:-moz-hidden-unscrollable;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-button:not([disabled],[open]):focus{background:none;}#allTabsMenu-allTabsViewTabs{margin:var(--panel-subview-body-padding);padding-block-start:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is([selected],[multiselected],[usercontextid]:is(:hover,[_moz-menuactive])) .all-tabs-button{background-image:linear-gradient(to right,var(--main-stripe-color) 0,var(--main-stripe-color) 4px,transparent 4px)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[selected]{font-weight:normal;background-color:var(--arrowpanel-dimmed-further)!important;--main-stripe-color:var(--arrowpanel-dimmed-even-further);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[usercontextid]:not([multiselected]){--main-stripe-color:var(--identity-tab-color);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]{--main-stripe-color:var(--multiselected-color,var(--lwt-selected-tab-background-color));}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-dimmed)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]:not([selected]):is(:hover,[_moz-menuactive]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,[_moz-menuactive]):active{background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-faint,color-mix(in srgb,var(--arrowpanel-dimmed) 60%,transparent))!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]>.all-tabs-button{opacity:.6;}:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload]:not([pending])>.all-tabs-button,:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload][pending]>.all-tabs-button[busy]{font-style:italic;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button{max-width:18px;max-height:18px;border-radius:100%;color:white;background-color:transparent!important;opacity:.7;min-height:0;min-width:0;padding:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>.toolbarbutton-icon{min-width:18px;min-height:18px;fill:inherit;fill-opacity:inherit;-moz-context-properties:inherit;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>label:empty{display:none;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:is(:hover,:focus):not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:is(:hover,:focus):not([disabled]){background-color:var(--arrowpanel-dimmed)!important;opacity:1;color:white;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:hover:active:not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:hover:active:not([disabled]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[toggle-mute]{padding:2px 2px 2px 1px;margin-inline-end:8px;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[soundplaying]{list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M8.587 2.354L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618A2.191 2.191 0 0 0 4.191 11H5.5l3.17 2.717a.2.2 0 0 0 .33-.152V2.544a.25.25 0 0 0-.413-.19z'/><path d='M11.575 3.275a.5.5 0 0 0-.316.949 3.97 3.97 0 0 1 0 7.551.5.5 0 0 0 .316.949 4.971 4.971 0 0 0 0-9.449z'/><path d='M13 8a3 3 0 0 0-2.056-2.787.5.5 0 1 0-.343.939A2.008 2.008 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/></svg>")!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[muted]{list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M13 8a2.813 2.813 0 0 0-.465-1.535l-.744.744A1.785 1.785 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/><path d='M13.273 5.727A3.934 3.934 0 0 1 14 8a3.984 3.984 0 0 1-2.742 3.775.5.5 0 0 0 .316.949A4.985 4.985 0 0 0 15 8a4.93 4.93 0 0 0-1.012-2.988z'/><path d='M8.67 13.717a.2.2 0 0 0 .33-.152V10l-2.154 2.154z'/><path d='M14.707 1.293a1 1 0 0 0-1.414 0L9 5.586V2.544a.25.25 0 0 0-.413-.19L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618a2.186 2.186 0 0 0 1.659 2.118l-2.366 2.366a1 1 0 1 0 1.414 1.414l12-12a1 1 0 0 0 0-1.414z'/></svg>")!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[close-button]{fill-opacity:0;transform:translateX(14px);opacity:0;margin-inline-start:-27px;transition:.25s cubic-bezier(.07,.78,.21,.95) transform,.2s cubic-bezier(.07,.74,.24,.95) margin,.075s linear opacity;display:block;-moz-context-properties:fill,fill-opacity,stroke;fill:currentColor;fill-opacity:0;border-radius:50%;list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect fill='context-fill' fill-opacity='context-fill-opacity' width='20' height='20' rx='2' ry='2'/><path fill='context-fill' fill-opacity='context-stroke-opacity' d='M11.06 10l3.47-3.47a.75.75 0 00-1.06-1.06L10 8.94 6.53 5.47a.75.75 0 10-1.06 1.06L8.94 10l-3.47 3.47a.75.75 0 101.06 1.06L10 11.06l3.47 3.47a.75.75 0 001.06-1.06z'/></svg>");}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]{transform:none;opacity:.7;margin-inline-start:-2px;}`;
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
        tabContext.addEventListener("popupshowing", attachContextListeners, { once: true });
    }

    function attachContextListeners() {
        tabContext.addEventListener("command", contextCmd, true);
        tabContext.addEventListener("popuphidden", contextHide, false);
    }

    function reverseTabOrder() {
        let panel = gTabsPanel.allTabsPanel;
        if (prefSvc.getBoolPref(reversePref))
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
                        .replace(/appendChild/, `prepend`)
                        .replace(
                            /(setImageAttributes.*)\n/,
                            `$1\n      if (row.tab.selected)\n      PanelMultiView.forNode(this.view).selectedElement = row.firstElementChild;\n      PanelMultiView.forNode(this.view).focusSelectedElement(true);\n`
                        ) +
                    `\n panel._addTab = function ` +
                    panel._addTab
                        .toSource()
                        .replace(
                            /nextRow\.parentNode\.insertBefore\(newRow\, nextRow\)\;/,
                            `nextRow.after(newRow)`
                        )
                        .replace(/this\.\_addElement/, `this.containerNode.prepend`)
            );
        else {
            delete panel._addElement;
            delete panel._populate;
            delete panel._addTab;
        }
    }

    function prefHandler(_sub, _top, _pref) {
        let panel = gTabsPanel.allTabsPanel;
        if (panel.panelMultiView)
            panel.panelMultiView.addEventListener("PanelMultiViewHidden", reverseTabOrder, {
                once: true,
            });
        else reverseTabOrder();
    }

    function start() {
        gTabsPanel.init();
        registerSheet();

        gTabsPanel.allTabsPanel._setupListeners = function () {
            this.listenersRegistered = true;
            this.gBrowser.tabContainer.addEventListener("TabAttrModified", this);
            this.gBrowser.tabContainer.addEventListener("TabClose", this);
            this.gBrowser.tabContainer.addEventListener("TabMove", this);
            this.gBrowser.tabContainer.addEventListener("TabPinned", this);
            this.gBrowser.addEventListener("TabMultiSelect", this, false);
        };

        gTabsPanel.allTabsPanel._cleanupListeners = function () {
            this.gBrowser.tabContainer.removeEventListener("TabAttrModified", this);
            this.gBrowser.tabContainer.removeEventListener("TabClose", this);
            this.gBrowser.tabContainer.removeEventListener("TabMove", this);
            this.gBrowser.tabContainer.removeEventListener("TabPinned", this);
            this.gBrowser.removeEventListener("TabMultiSelect", this, false);
            this.listenersRegistered = false;
        };

        gTabsPanel.allTabsPanel._createRow = function (tab) {
            let { doc } = this;
            let row = doc.createXULElement("toolbaritem");
            row.setAttribute("class", "all-tabs-item");
            row.setAttribute("context", "tabContextMenu");
            if (this.className) {
                row.classList.add(this.className);
            }
            row.tab = tab;
            row.addEventListener("command", this);
            row.addEventListener("click", this);
            this.tabToElement.set(tab, row);

            let button = doc.createXULElement("toolbarbutton");
            button.setAttribute("class", "all-tabs-button subviewbutton subviewbutton-iconic");
            button.setAttribute("flex", "1");
            button.setAttribute("crop", "right");
            button.tab = tab;

            row.appendChild(button);

            let secondaryButton = doc.createXULElement("toolbarbutton");
            secondaryButton.setAttribute(
                "class",
                "all-tabs-secondary-button subviewbutton subviewbutton-iconic"
            );
            secondaryButton.setAttribute("closemenu", "none");
            secondaryButton.setAttribute("toggle-mute", "true");
            secondaryButton.tab = tab;
            secondaryButton.addEventListener("mouseover", this);
            secondaryButton.addEventListener("mouseout", this);
            row.appendChild(secondaryButton);

            let closeButton = doc.createXULElement("toolbarbutton");
            closeButton.setAttribute(
                "class",
                "all-tabs-secondary-button subviewbutton subviewbutton-iconic"
            );
            closeButton.setAttribute("close-button", "true");
            closeButton.tab = tab;
            closeButton.addEventListener("mouseover", this);
            closeButton.addEventListener("mouseout", this);
            row.appendChild(closeButton);

            this._setRowAttributes(row, tab);

            return row;
        };

        gTabsPanel.allTabsPanel.handleEvent = function (e) {
            let eventMaySelectTab = true;
            switch (e.type) {
                case "PanelMultiViewHidden":
                    if (e.target == this.panelMultiView) {
                        this._cleanup();
                        this.panelMultiView = null;
                    }
                    break;
                case "ViewShowing":
                    if (!this.listenersRegistered && e.target == this.view) {
                        this.panelMultiView = this.view.panelMultiView;
                        this._populate(e);
                    }
                    break;
                case "click":
                    if (e.button === 2) break;
                    if (e.button === 1) {
                        gBrowser.removeTab(e.target.tab, {
                            animate: true,
                            byMouse: false,
                        });
                        break;
                    }
                    let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
                    if (e.shiftKey) {
                        eventMaySelectTab = false;
                        const lastSelectedTab = gBrowser.lastMultiSelectedTab;
                        if (!accelKey) {
                            gBrowser.selectedTab = lastSelectedTab;
                            gBrowser.clearMultiSelectedTabs();
                        }
                        gBrowser.addRangeToMultiSelectedTabs(lastSelectedTab, e.target.tab);
                        e.preventDefault();
                    } else if (accelKey) {
                        eventMaySelectTab = false;
                        if (e.target.tab.multiselected)
                            gBrowser.removeFromMultiSelectedTabs(e.target.tab);
                        else if (e.target.tab != gBrowser.selectedTab) {
                            gBrowser.addToMultiSelectedTabs(e.target.tab);
                            gBrowser.lastMultiSelectedTab = e.target.tab;
                        }
                        e.preventDefault();
                    }
                    break;
                case "command":
                    if (e.target.hasAttribute("toggle-mute")) {
                        e.target.tab.multiselected
                            ? gBrowser.toggleMuteAudioOnMultiSelectedTabs(e.target.tab)
                            : e.target.tab.toggleMuteAudio();
                        break;
                    }
                    if (e.target.hasAttribute("close-button")) {
                        if (e.target.tab.multiselected) gBrowser.removeMultiSelectedTabs();
                        else
                            gBrowser.removeTab(e.target.tab, {
                                animate: true,
                                byMouse: e.mozInputSource == MouseEvent.MOZ_SOURCE_MOUSE,
                            });
                        break;
                    }
                    if (!e.target.tab.selected && e.target.tab.multiselected)
                        gBrowser.lockClearMultiSelectionOnce();
                    if (gSharedTabWarning.willShowSharedTabWarning(e.target.tab))
                        eventMaySelectTab = false;
                    if (eventMaySelectTab) {
                        if (e.target.tab === gBrowser.selectedTab) break;
                        this._selectTab(e.target.tab);
                    }
                    break;
                case "mouseover":
                case "mouseout":
                    const selectedTabs = gBrowser.selectedTabs;
                    const affectedTabsLength = selectedTabs.includes(e.target.tab)
                        ? selectedTabs.length
                        : 1;
                    let stringID;
                    if (e.target.hasAttribute("toggle-mute"))
                        stringID = e.target.tab.hasAttribute("activemedia-blocked")
                            ? "tabs.unblockAudio2.tooltip"
                            : e.target.tab.linkedBrowser.audioMuted
                            ? "tabs.unmuteAudio2.background.tooltip"
                            : "tabs.muteAudio2.background.tooltip";
                    if (e.target.hasAttribute("close-button")) stringID = "tabs.closeTabs.tooltip";
                    e.target.setAttribute(
                        "tooltiptext",
                        PluralForm.get(
                            affectedTabsLength,
                            gTabBrowserBundle.GetStringFromName(stringID)
                        ).replace("#1", affectedTabsLength)
                    );
                    break;
                case "TabAttrModified":
                    this._tabAttrModified(e.target);
                    break;
                case "TabMultiSelect":
                    this._onTabMultiSelect(e.target);
                    break;
                case "TabClose":
                    this._tabClose(e.target);
                    break;
                case "TabMove":
                    this._moveTab(e.target);
                    break;
                case "TabPinned":
                    if (!this.filterFn(e.target)) this._tabClose(e.target);
                    break;
            }
        };

        gTabsPanel.allTabsPanel._onTabMultiSelect = function () {
            for (let item of this.rows) {
                item.tab.multiselected
                    ? item.setAttribute("multiselected", "true")
                    : item.removeAttribute("multiselected");
            }
        };

        gTabsPanel.allTabsPanel._setRowAttributes = function (row, tab) {
            let pending = tab.getAttribute("pending");
            let multiselected = tab.getAttribute("multiselected");
            let notselectedsinceload = tab.getAttribute("notselectedsinceload");

            setAttributes(row, {
                selected: tab.selected,
                pending,
                multiselected,
                notselectedsinceload,
            });

            if (tab.userContextId) {
                let idColor = ContextualIdentityService.getPublicIdentityFromId(
                    tab.userContextId
                )?.color;
                row.className = `all-tabs-item identity-color-${idColor}`;
                row.setAttribute("usercontextid", tab.userContextId);
            } else {
                row.className = "all-tabs-item";
                row.removeAttribute("usercontextid");
            }

            let busy = tab.getAttribute("busy");
            let button = row.firstElementChild;

            setAttributes(button, {
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

        gTabsPanel.allTabsButton.setAttribute(
            "onmouseover",
            `this.tooltipText = PluralForm.get(gBrowser.tabs.length, gNavigatorBundle.getString("ctrlTab.listAllTabs.label")).replace("#1", gBrowser.tabs.length).toLocaleLowerCase().replace(RTL_UI ? /.$/i : /^./i, function (letter) { return letter.toLocaleUpperCase(); }).trim() + " (" + ShortcutUtils.prettifyShortcut(key_showAllTabs) + ")";`
        );

        reverseTabOrder();

        gTabsPanel.allTabsView.addEventListener("ViewShowing", oneTimeSetup, { once: true });
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
