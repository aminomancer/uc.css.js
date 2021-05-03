// ==UserScript==
// @name           All Tabs Menu Expansion Pack
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a big scrolling menu containing all the tabs. This script adds several new features to the "all tabs menu" to help it catch up to the functionality of the regular tabs bar. First, it adds an animated close button for every tab in this menu. Second, it significantly improves the mute/unmute button by making it work like the mute button in the tabs bar used to work. If you only have one tab selected, it mutes/unmutes that tab. If you have multiple tabs selected, it mutes/unmutes all of them. This also adds a tooltip to the mute button. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. This script adds the same functionality to the all tabs menu. It also adds special color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can differentiate them from normal tabs. All the relevant CSS for this is already included in and loaded by the script. But if you've already changed global variables or altered the menu's appearance significantly, I can't promise it'll still match your layout. It's designed to look consistent with my theme and with the latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in here, or look to the end of uc-tabs-bar.css on my repo.
// @author         aminomancer
// ==/UserScript==
(function () {
    let timer;
    let tabContext = document.getElementById("tabContextMenu");
    let observer = new MutationObserver(delayedUpdate);

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
                        attributeFilter: ["pending"],
                    });
                });
            else
                observer.observe(TabContextMenu.contextTab, {
                    attributes: true,
                    attributeFilter: ["pending"],
                });
        }
    }

    function contextHide(_e) {
        if (gTabsPanel.allTabsPanel.view.panelMultiView) delayedDisconnect();
    }

    function delayedUpdate(mus) {
        for (const _mu of mus) {
            updatePendingState();
            delayedDisconnect();
        }
    }

    function delayedDisconnect() {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            observer.disconnect();
        }, 3000);
    }

    function updatePendingState() {
        Array.from(gTabsPanel.allTabsViewTabs.children).forEach((item) => {
            item.tab.linkedPanel
                ? item.removeAttribute("pending")
                : item.setAttribute("pending", "true");
        });
    }

    class TabEventHandler {
        constructor(target) {
            this.target = target;
            target.addEventListener("click", this, true);
            target.addEventListener("mouseover", this, true);
            target.addEventListener("mouseout", this, true);
        }

        sentenceCase(str) {
            return str
                .replace(/[a-z]/i, function (letter) {
                    return letter.toUpperCase();
                })
                .trim();
        }

        handleEvent(e) {
            if (!e.target.hasAttribute("toggle-mute") && !e.target.hasAttribute("close-button"))
                return;
            let tab = e.target.tab;
            switch (e.type) {
                case "mouseover":
                case "mouseout":
                    this.tooltipHandler(e, tab);
                    break;
                case "click":
                    e.target.hasAttribute("toggle-mute") && this.clickHandler(e, tab);
                    break;
                default:
                    return false;
            }
        }

        async tooltipHandler(e, tab) {
            const selectedTabs = gBrowser.selectedTabs;
            const tabInSelection = selectedTabs.includes(tab);
            const affectedTabsLength = tabInSelection ? selectedTabs.length : 1;
            let stringID;

            if (e.target.hasAttribute("toggle-mute"))
                stringID = tab.hasAttribute("activemedia-blocked")
                    ? "tabs.unblockAudio2.tooltip"
                    : tab.linkedBrowser.audioMuted
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
        }

        clickHandler(e, tab) {
            if (e.button != 0 || e.getModifierState("Accel") || e.shiftKey) return;

            if (tab.soundPlaying || tab.muted || tab.activeMediaBlocked) {
                tab.multiselected
                    ? gBrowser.toggleMuteAudioOnMultiSelectedTabs(tab)
                    : tab.toggleMuteAudio();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        }
    }

    function registerSheet() {
        const css = `#allTabsMenu-allTabsViewTabs>.all-tabs-item{border-radius:var(--arrowpanel-menuitem-border-radius);box-shadow:none;margin-inline:4px;min-height:28px;-moz-box-align:center;padding-inline-end:2px;overflow-x:-moz-hidden-unscrollable;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-button:not([disabled],[open]):focus{background:none;}#allTabsMenu-allTabsViewTabs{margin:var(--panel-subview-body-padding);padding-block-start:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[selected],#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected],#allTabsMenu-allTabsViewTabs>.all-tabs-item[usercontextid]:is(:hover,[_moz-menuactive]){background-image:linear-gradient(to right,var(--main-stripe-color) 0,var(--main-stripe-color) 4px,transparent 4px)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[selected]{font-weight:normal;background-color:var(--arrowpanel-dimmed-further)!important;--main-stripe-color:var(--arrowpanel-dimmed-even-further);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[usercontextid]:not([multiselected]){--main-stripe-color:var(--identity-tab-color);}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]{--main-stripe-color:var(--multiselected-color,var(--lwt-selected-tab-background-color));}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-dimmed)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[multiselected]:not([selected]):is(:hover,[_moz-menuactive]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item:not([selected]):is(:hover,[_moz-menuactive]):active{background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]:not([selected]):is(:hover,:focus-within,[_moz-menuactive],[multiselected]){background-color:var(--arrowpanel-faint,color-mix(in srgb,var(--arrowpanel-dimmed) 60%,transparent))!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item[pending]>.all-tabs-button{opacity:.6;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button,#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:focus:not([disabled]){max-width:18px;max-height:18px;border-radius:100%;color:white;background-color:transparent!important;opacity:.7;min-height:0;min-width:0;padding:0;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>.toolbarbutton-icon{min-width:18px;min-height:18px;fill:inherit;fill-opacity:inherit;-moz-context-properties:inherit;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button>label:empty{display:none;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:is(:hover,:focus):not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:is(:hover,:focus):not([disabled]){background-color:var(--arrowpanel-dimmed)!important;opacity:1;color:white;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button:hover:active:not([disabled]),#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]:hover:active:not([disabled]){background-color:var(--arrowpanel-dimmed-further)!important;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[toggle-mute]{padding:2px 2px 2px 1px;margin-inline-end:8px;}#allTabsMenu-allTabsViewTabs>.all-tabs-item .all-tabs-secondary-button[close-button]{fill-opacity:0;transform:translateX(28px);opacity:0;margin-inline-start:-28px;transition:.075s ease-in-out transform,.075s ease-in-out margin,.075s linear opacity;display:block;-moz-context-properties:fill,fill-opacity,stroke;fill:currentColor;fill-opacity:0;border-radius:50%;list-style-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect fill='context-fill' fill-opacity='context-fill-opacity' width='20' height='20' rx='2' ry='2'/><path fill='context-fill' fill-opacity='context-stroke-opacity' d='M11.06 10l3.47-3.47a.75.75 0 00-1.06-1.06L10 8.94 6.53 5.47a.75.75 0 10-1.06 1.06L8.94 10l-3.47 3.47a.75.75 0 101.06 1.06L10 11.06l3.47 3.47a.75.75 0 001.06-1.06z'/></svg>");}#allTabsMenu-allTabsViewTabs>.all-tabs-item:is(:hover,:focus-within) .all-tabs-secondary-button[close-button]{transform:none;opacity:.7;margin-inline-start:-2px;}`;
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
            Ci.nsIStyleSheetService
        );
        let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
        if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }

    function reallyStart() {
        new TabEventHandler(gTabsPanel.allTabsViewTabs);
        gBrowser.addEventListener("TabMultiSelect", gTabsPanel.allTabsPanel, false);
        tabContext.addEventListener("popupshowing", attachContextListeners, { once: true });
    }

    function attachContextListeners() {
        tabContext.addEventListener("command", contextCmd, true);
        tabContext.addEventListener("popuphidden", contextHide, false);
    }

    function start() {
        const TABS_PANEL_EVENTS = {
            show: "ViewShowing",
            hide: "PanelMultiViewHidden",
        };

        gTabsPanel.init();
        registerSheet();

        gTabsPanel.allTabsPanel._createRow = function _createRow(tab) {
            let { doc } = this;
            let row = doc.createXULElement("toolbaritem");
            row.setAttribute("class", "all-tabs-item");
            row.setAttribute("context", "tabContextMenu");
            if (this.className) {
                row.classList.add(this.className);
            }
            row.tab = tab;
            row.addEventListener("command", this);
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
            row.appendChild(secondaryButton);

            let closeButton = doc.createXULElement("toolbarbutton");
            closeButton.setAttribute(
                "class",
                "all-tabs-secondary-button subviewbutton subviewbutton-iconic"
            );
            closeButton.setAttribute("close-button", "true");
            closeButton.tab = tab;
            row.appendChild(closeButton);

            this._setRowAttributes(row, tab);

            return row;
        };

        gTabsPanel.allTabsPanel.handleEvent = function handleEvent(event) {
            switch (event.type) {
                case TABS_PANEL_EVENTS.hide:
                    if (event.target == this.panelMultiView) {
                        this._cleanup();
                        this.panelMultiView = null;
                    }
                    break;
                case TABS_PANEL_EVENTS.show:
                    if (!this.listenersRegistered && event.target == this.view) {
                        this.panelMultiView = this.view.panelMultiView;
                        this._populate(event);
                    }
                    break;
                case "command":
                    if (event.target.hasAttribute("toggle-mute")) {
                        event.target.tab.toggleMuteAudio();
                        break;
                    }
                    if (event.target.hasAttribute("close-button")) {
                        if (event.target.parentElement.tab.multiselected)
                            gBrowser.removeMultiSelectedTabs();
                        else
                            gBrowser.removeTab(event.target.parentElement.tab, {
                                animate: true,
                                byMouse: event.mozInputSource == MouseEvent.MOZ_SOURCE_MOUSE,
                            });
                        break;
                    }
                    this._selectTab(event.target.tab);
                    break;
                case "TabAttrModified":
                    this._tabAttrModified(event.target);
                    break;
                case "TabMultiSelect":
                    this._tabMultiSelect(event.target);
                    break;
                case "TabClose":
                    this._tabClose(event.target);
                    break;
                case "TabMove":
                    this._moveTab(event.target);
                    break;
                case "TabPinned":
                    if (!this.filterFn(event.target)) this._tabClose(event.target);
                    break;
            }
        };

        gTabsPanel.allTabsPanel._tabMultiSelect = function _tabMultiSelect() {
            for (let item of this.rows) {
                item.tab.multiselected
                    ? item.setAttribute("multiselected", "true")
                    : item.removeAttribute("multiselected");
            }
        };

        gTabsPanel.allTabsPanel._setRowAttributes = function _setRowAttributes(row, tab) {
            let pending = tab.getAttribute("pending");
            let multiselected = tab.getAttribute("multiselected");

            setAttributes(row, {
                selected: tab.selected,
                pending,
                multiselected,
            });

            if (tab.userContextId) {
                let idColor = ContextualIdentityService.getPublicIdentityFromId(tab.userContextId)
                    ?.color;
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

        gTabsPanel.allTabsView.addEventListener("ViewShowing", reallyStart, { once: true });
    }

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
