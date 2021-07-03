// ==UserScript==
// @name           Vertical Tabs Pane
// @version        1.3.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Create a vertical pane across from the sidebar that functions like the vertical tab pane in Microsoft Edge. It doesn't hide the tab bar since people have different preferences on how to do that, but it sets an attribute on the root element that you can use to hide the regular tab bar while the vertical pane is open, for example :root[vertical-tabs] #TabsToolbar... By default, the pane is resizable just like the sidebar is. And like the pane in Edge, you can press a button to collapse it, and it will hide the tab labels and become a thin strip that just shows the tabs' favicons. Hovering the collapsed pane will expand it without moving the browser content. As with the [vertical-tabs] attribute, this "unpinned" state is reflected on the root element, so you can select it like :root[vertical-tabs-unpinned]... Like the sidebar, the state of the pane is stored between windows and recorded in preferences. There's no need to edit these preferences directly, but there are a few other preferences that are meant to be edited in about:config. If you search "userChrome.tabs.verticalTabsPane" in about:config you'll find all of the preferences. "reverse-order" changes the direction of the pane so that newer tabs are displayed on top rather than on bottom. "no-expand-on-hover" prevents the pane from expanding on hover when it's collapsed. Normally the pane collapses and then temporarily expands if you hover it, after a delay of 100ms. Then when your mouse leaves the pane, it collapses again, after a delay of 100ms. Both of these delays can be changed with the "hover-delay" and "hover-out-delay" prefs. For languages other than English, the labels and tooltips can be modified directly in the l10n object below.
// ==/UserScript==

(function () {
    let config = {
        l10n: {
            "Button label": `Vertical Tabs`, // label and tooltip for the toolbar button
            "Button tooltip": `Toggle vertical tabs`,
            "Collapse button tooltip": `Collapse pane`,
            "Pin button tooltip": `Pin pane`,
        },
    };
    if (location.href !== "chrome://browser/content/browser.xhtml") return;
    let prefSvc = Services.prefs;
    let closedPref = "userChrome.tabs.verticalTabsPane.closed";
    let unpinnedPref = "userChrome.tabs.verticalTabsPane.unpinned";
    let noExpandPref = "userChrome.tabs.verticalTabsPane.no-expand-on-hover";
    let widthPref = "userChrome.tabs.verticalTabsPane.width";
    let reversePref = "userChrome.tabs.verticalTabsPane.reverse-order";
    let hoverDelayPref = "userChrome.tabs.verticalTabsPane.hover-delay";
    let hoverOutDelayPref = "userChrome.tabs.verticalTabsPane.hover-out-delay";
    let attributeFilter = ["pending", "notselectedsinceload"];
    let tabContext = document.getElementById("tabContextMenu");
    let contextActionTimer;
    let observer = new MutationObserver((_mus) => {
        for (const row of window.verticalTabsPane.rows)
            for (const attr of attributeFilter)
                row.toggleAttribute(attr, !!row.tab.getAttribute(attr));
        delayedDisconnect();
    });
    /**
     * create a DOM node with given parameters
     * @param {object} aDoc (which document to create the element in)
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
    function delayedDisconnect() {
        window.clearTimeout(contextActionTimer);
        contextActionTimer = window.setTimeout(() => {
            observer.disconnect();
        }, 3000);
    }
    class VerticalTabsPaneBase {
        constructor() {
            this.registerSheet();
            if (!window.E10SUtils)
                XPCOMUtils.defineLazyModuleGetters(this, {
                    E10SUtils: `resource://gre/modules/E10SUtils.jsm`,
                });
            else this.E10SUtils = window.E10SUtils;
            this.pane = document.getElementById("vertical-tabs-pane");
            this.splitter = document.getElementById("vertical-tabs-splitter");
            this.innerBox = this.pane.appendChild(
                create(document, "vbox", { id: "vertical-tabs-inner-box" })
            );
            this.buttonsRow = this.innerBox.appendChild(
                create(document, "hbox", { id: "vertical-tabs-buttons-row" })
            );
            this.buttonsTabStop = this.buttonsRow.appendChild(
                create(document, "toolbartabstop", { "aria-hidden": true })
            );
            this.newTabButton = this.buttonsRow.appendChild(
                document.getElementById("new-tab-button").cloneNode(true)
            );
            this.newTabButton.id = "vertical-tabs-new-tab-button";
            this.newTabButton.setAttribute("flex", "1");
            this.newTabButton.setAttribute("class", "subviewbutton subviewbutton-iconic");
            this.newTabButton.tooltipText = GetDynamicShortcutTooltipText("new-tab-button");
            this.pinPaneButton = this.buttonsRow.appendChild(
                create(document, "toolbarbutton", {
                    id: "vertical-tabs-pin-button",
                    class: "subviewbutton subviewbutton-iconic no-label",
                    tooltiptext: config.l10n["Collapse button tooltip"],
                })
            );
            this.pinPaneButton.addEventListener("command", (e) => {
                this.pane.getAttribute("unpinned")
                    ? this.pane.removeAttribute("unpinned")
                    : this.pane.setAttribute("unpinned", true);
                this.resetPinnedTooltip();
            });
            this.closePaneButton = this.buttonsRow.appendChild(
                create(document, "toolbarbutton", {
                    id: "vertical-tabs-close-button",
                    class: "subviewbutton subviewbutton-iconic no-label",
                    tooltiptext: config.l10n["Button tooltip"],
                })
            );
            this.closePaneButton.addEventListener("command", (e) => this.toggle());
            this.innerBox.appendChild(create(document, "toolbarseparator"));
            this.containerNode = this.innerBox.appendChild(
                create(document, "arrowscrollbox", {
                    id: "vertical-tabs-list",
                    tooltip: "vertical-tabs-tooltip",
                    orient: "vertical",
                    flex: "1",
                })
            );
            let vanillaTooltip = document.getElementById("tabbrowser-tab-tooltip");
            this.tabTooltip = vanillaTooltip.cloneNode(true);
            vanillaTooltip.after(this.tabTooltip);
            this.tabTooltip.id = "vertical-tabs-tooltip";
            this.tabTooltip.setAttribute(
                "onpopupshowing",
                `verticalTabsPane.createTabTooltip(event)`
            );
            this.tabTooltip.setAttribute("position", "after_start");
            this.scrollboxTabStop = this.containerNode.appendChild(
                create(document, "toolbartabstop", { "aria-hidden": true })
            );
            this.tabToElement = new Map();
            this.listenersRegistered = false;
            if (!prefSvc.prefHasUserValue(closedPref)) prefSvc.setBoolPref(closedPref, false);
            if (!prefSvc.prefHasUserValue(unpinnedPref)) prefSvc.setBoolPref(unpinnedPref, false);
            if (!prefSvc.prefHasUserValue(noExpandPref)) prefSvc.setBoolPref(noExpandPref, false);
            if (!prefSvc.prefHasUserValue(widthPref)) prefSvc.setIntPref(widthPref, 350);
            if (!prefSvc.prefHasUserValue(reversePref)) prefSvc.setBoolPref(reversePref, false);
            if (!prefSvc.prefHasUserValue(hoverDelayPref)) prefSvc.setIntPref(hoverDelayPref, 100);
            if (!prefSvc.prefHasUserValue(hoverOutDelayPref))
                prefSvc.setIntPref(hoverOutDelayPref, 100);
            prefSvc.addObserver("userChrome.tabs.verticalTabsPane", this);
            prefSvc.addObserver("privacy.userContext", this);
            XPCOMUtils.defineLazyPreferenceGetter(
                SidebarUI,
                "_positionStart",
                SidebarUI.POSITION_START_PREF,
                true,
                SidebarUI.setPosition.bind(SidebarUI)
            );
            ["#scrollbutton-up", "#scrollbutton-down"].forEach((id) =>
                this.containerNode.shadowRoot.querySelector(id).remove()
            );
            this.l10nIfNeeded();
            this.addContextListeners();
            this.observe(prefSvc, null, noExpandPref);
            this.observe(prefSvc, null, hoverDelayPref);
            this.observe(prefSvc, null, hoverOutDelayPref);
            if (!this.hoverDelay) this.hoverDelay = 100;
            if (!this.hoverOutDelay) this.hoverOutDelay = 100;

            gBrowser.tabContainer.addEventListener(
                "SSTabRestoring",
                (e) => {
                    this.observe(prefSvc, null, reversePref);
                    this.observe(prefSvc, null, "privacy.userContext.enabled");
                    // try to adopt from previous window, otherwise restore from prefs.
                    let sourceWindow = window.opener;
                    if (sourceWindow)
                        if (
                            !sourceWindow.closed &&
                            sourceWindow.location.protocol == "chrome:" &&
                            PrivateBrowsingUtils.isWindowPrivate(sourceWindow) ===
                                PrivateBrowsingUtils.isWindowPrivate(window)
                        )
                            if (this.adoptFromWindow(sourceWindow)) return;
                    this.observe(prefSvc, null, widthPref);
                    this.observe(prefSvc, null, unpinnedPref);
                    this.observe(prefSvc, null, closedPref);
                },
                { once: true }
            );
        }
        get root() {
            return this._root || (this._root = document.documentElement);
        }
        get rows() {
            return this.tabToElement.values();
        }
        get selectedRow() {
            return this.containerNode.querySelector(".all-tabs-item[selected]");
        }
        get dragEvents() {
            return (
                this._dragEvents ||
                (this._dragEvents = ["dragstart", "dragleave", "dragover", "drop", "dragend"])
            );
        }
        get tabEvents() {
            return (
                this._tabEvents ||
                (this._tabEvents = [
                    "TabAttrModified",
                    "TabClose",
                    "TabMove",
                    "TabPinned",
                    "TabUnpinned",
                    "TabSelect",
                ])
            );
        }
        get paneEvents() {
            return (
                this._paneEvents ||
                (this._paneEvents = ["keydown", "mouseenter", "mouseleave", "focus"])
            );
        }
        get horizontalWalker() {
            if (this._horizontalWalker) return this._horizontalWalker;
            return (this._horizontalWalker = document.createTreeWalker(
                this.pane,
                NodeFilter.SHOW_ELEMENT,
                (node) => {
                    if (node.tagName == "toolbartabstop") return NodeFilter.FILTER_ACCEPT;
                    if (node.disabled || node.hidden) return NodeFilter.FILTER_REJECT;
                    if (
                        node.tagName == "button" ||
                        node.tagName == "toolbarbutton" ||
                        node.tagName == "checkbox"
                    ) {
                        if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            ));
        }
        get verticalWalker() {
            if (this._verticalWalker) return this._verticalWalker;
            return (this._verticalWalker = document.createTreeWalker(
                this.pane,
                NodeFilter.SHOW_ELEMENT,
                (node) => {
                    if (node.tagName == "toolbartabstop") return NodeFilter.FILTER_ACCEPT;
                    if (node.disabled || node.hidden) return NodeFilter.FILTER_REJECT;
                    if (
                        node.tagName == "button" ||
                        node.tagName == "toolbarbutton" ||
                        node.tagName == "checkbox"
                    ) {
                        if (node.classList.contains("all-tabs-secondary-button"))
                            return NodeFilter.FILTER_SKIP;
                        if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            ));
        }
        filterFn(tab) {
            return !tab.hidden;
        }
        adoptFromWindow(sourceWindow) {
            let sourceUI = sourceWindow.verticalTabsPane;
            if (!sourceUI || !sourceUI.pane) return false;
            this.pane.setAttribute(
                "width",
                sourceUI.pane.width || sourceUI.pane.getBoundingClientRect().width
            );
            let sourcePinned = !!sourceUI.pane.getAttribute("unpinned");
            sourcePinned
                ? this.pane.setAttribute("unpinned", true)
                : this.pane.removeAttribute("unpinned");
            sourcePinned
                ? this.root.setAttribute("vertical-tabs-unpinned", true)
                : this.root.removeAttribute("vertical-tabs-unpinned");
            this.resetPinnedTooltip();
            sourceUI.pane.hidden ? this.close() : this.open();
            return true;
        }
        findRow(el) {
            return el.classList.contains("all-tabs-item") ? el : el.closest(".all-tabs-item");
        }
        resetPinnedTooltip() {
            let newVal = this.pane.getAttribute("unpinned");
            this.pinPaneButton.tooltipText =
                config.l10n[newVal ? "Pin button tooltip" : "Collapse button tooltip"];
        }
        handleEvent(e) {
            let tab = e.target.tab;
            switch (e.type) {
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
                case "mouseenter":
                    this._onMouseEnter(e);
                    break;
                case "mouseleave":
                    this._onMouseLeave(e);
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
                case "keydown":
                    this._onKeyDown(e);
                    break;
                case "focus":
                    this._onFocus(e);
                    break;
                case "blur":
                    e.currentTarget === this.pane ? this._onPaneBlur(e) : this._onButtonBlur(e);
                    break;
                case "TabMultiSelect":
                    this._onTabMultiSelect();
                    break;
                case "TabPinned":
                case "TabUnpinned":
                    this._tabAttrModified(e.target);
                    break;
                case "TabSelect":
                    if (this.isOpen)
                        this.tabToElement.get(e.target).scrollIntoView({ block: "nearest" });
                    break;
            }
        }
        observe(sub, _top, pref) {
            let value = this.getPref(sub, pref);
            switch (pref) {
                case widthPref:
                    if (value === null) value = 350;
                    this.pane.width = value;
                    break;
                case closedPref:
                    value ? this.close() : this.open();
                    break;
                case unpinnedPref:
                    value
                        ? this.pane.setAttribute("unpinned", true)
                        : this.pane.removeAttribute("unpinned");
                    value
                        ? this.root.setAttribute("vertical-tabs-unpinned", true)
                        : this.root.removeAttribute("vertical-tabs-unpinned");
                    this.resetPinnedTooltip();
                    break;
                case noExpandPref:
                    this.noExpand = value;
                    value
                        ? this.pane.setAttribute("no-expand", true)
                        : this.pane.removeAttribute("no-expand");
                    if (value) this.pane.removeAttribute("expanded");
                    break;
                case reversePref:
                    this.reversed = value;
                    if (this.isOpen) {
                        for (let item of this.rows) item.remove();
                        this.tabToElement = new Map();
                        this._populate();
                    }
                    break;
                case hoverDelayPref:
                    this.hoverDelay = value ?? 100;
                    break;
                case hoverOutDelayPref:
                    this.hoverOutDelay = value ?? 100;
                case "privacy.userContext.enabled":
                case "privacy.userContext.newTabContainerOnLeftClick.enabled":
                    this.handlePrivacyChange();
                    break;
            }
        }
        getPref(root, pref) {
            switch (root.getPrefType(pref)) {
                case root.PREF_BOOL:
                    return root.getBoolPref(pref);
                case root.PREF_INT:
                    return root.getIntPref(pref);
                case root.PREF_STRING:
                    return root.getStringPref(pref);
                default:
                    return null;
            }
        }
        toggle() {
            this.isOpen ? this.close() : this.open();
        }
        open() {
            this.pane.hidden = this.splitter.hidden = false;
            this.pane.setAttribute("checked", true);
            this.isOpen = true;
            this.root.setAttribute("vertical-tabs", true);
            if (!this.listenersRegistered) this._populate();
        }
        close() {
            this.pane.hidden = this.splitter.hidden = true;
            this.pane.removeAttribute("checked");
            this.isOpen = false;
            this.root.setAttribute("vertical-tabs", false);
            this._cleanup();
        }
        _selectTab(tab) {
            if (gBrowser.selectedTab != tab) gBrowser.selectedTab = tab;
            else gBrowser.tabContainer._handleTabSelect();
        }
        _populate() {
            let fragment = document.createDocumentFragment();
            for (let tab of gBrowser.tabs)
                if (this.filterFn(tab))
                    fragment[this.reversed ? `prepend` : `appendChild`](this._createRow(tab));
            this._addElement(fragment);
            this._setupListeners();
            for (let row of this.rows) this._setImageAttributes(row, row.tab);
            this.selectedRow.scrollIntoView({ block: "nearest", behavior: "instant" });
        }
        _addElement(elementOrFragment) {
            this.containerNode.insertBefore(elementOrFragment, this.insertBefore);
        }
        _cleanup() {
            for (let item of this.rows) item.remove();
            this.tabToElement = new Map();
            this._cleanupListeners();
            clearTimeout(this.hoverOutTimer);
            clearTimeout(this.hoverTimer);
            this.hoverOutQueued = false;
            this.hoverQueued = false;
            this.pane.removeAttribute("expanded");
        }
        _setupListeners() {
            this.listenersRegistered = true;
            this.tabEvents.forEach((ev) => gBrowser.tabContainer.addEventListener(ev, this));
            this.dragEvents.forEach((ev) => this.containerNode.addEventListener(ev, this));
            this.paneEvents.forEach((ev) => this.pane.addEventListener(ev, this));
            this.pane.addEventListener("blur", this, true);
            gBrowser.addEventListener("TabMultiSelect", this, false);
            for (let stop of this.pane.getElementsByTagName("toolbartabstop")) {
                stop.setAttribute("aria-hidden", "true");
                stop.addEventListener("focus", this);
            }
        }
        _cleanupListeners() {
            this.tabEvents.forEach((ev) => gBrowser.tabContainer.removeEventListener(ev, this));
            this.dragEvents.forEach((ev) => this.containerNode.removeEventListener(ev, this));
            this.paneEvents.forEach((ev) => this.pane.removeEventListener(ev, this));
            this.pane.addEventListener("blur", this, true);
            gBrowser.removeEventListener("TabMultiSelect", this, false);
            for (let stop of this.pane.getElementsByTagName("toolbartabstop")) {
                stop.removeEventListener("focus", this);
            }
            this.listenersRegistered = false;
        }
        _tabAttrModified(tab) {
            let item = this.tabToElement.get(tab);
            if (item) {
                if (!this.filterFn(tab)) this._removeItem(item, tab);
                else this._setRowAttributes(item, tab);
            } else if (this.filterFn(tab)) this._addTab(tab);
        }
        _moveTab(tab) {
            let item = this.tabToElement.get(tab);
            if (item) {
                this._removeItem(item, tab);
                this._addTab(tab);
                this.selectedRow.scrollIntoView({ block: "nearest" });
            }
        }
        _addTab(newTab) {
            if (!this.filterFn(newTab)) return;
            let newRow = this._createRow(newTab);
            let nextTab = newTab.nextElementSibling;
            while (nextTab && !this.filterFn(nextTab)) nextTab = nextTab.nextElementSibling;
            let nextRow = this.tabToElement.get(nextTab);
            if (this.reversed) {
                if (nextRow) nextRow.after(newRow);
                else this.containerNode.prepend(newRow);
            } else {
                if (nextRow) nextRow.parentNode.insertBefore(newRow, nextRow);
                else this._addElement(newRow);
            }
        }
        _tabClose(tab) {
            let item = this.tabToElement.get(tab);
            if (item) this._removeItem(item, tab);
        }
        _removeItem(item, tab) {
            this.tabToElement.delete(tab);
            item.remove();
        }
        _createRow(tab) {
            let row = create(document, "toolbaritem", {
                class: "all-tabs-item",
                context: "tabContextMenu",
                draggable: true,
            });
            if (this.className) row.classList.add(this.className);

            row.tab = tab;
            row.addEventListener("command", this);
            row.addEventListener("mousedown", this);
            row.addEventListener("mouseup", this);
            row.addEventListener("click", this);
            row.addEventListener("mouseover", this);
            row.addEventListener("mouseout", this);
            this.tabToElement.set(tab, row);

            let button = row.appendChild(
                create(document, "toolbarbutton", {
                    class: "all-tabs-button subviewbutton subviewbutton-iconic",
                    flex: "1",
                    crop: "right",
                })
            );
            button.tab = tab;

            let secondaryButton = row.appendChild(
                create(document, "toolbarbutton", {
                    class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
                    closemenu: "none",
                    "toggle-mute": "true",
                })
            );
            secondaryButton.tab = tab;

            let closeButton = row.appendChild(
                create(document, "toolbarbutton", {
                    class: "all-tabs-secondary-button subviewbutton subviewbutton-iconic",
                    "close-button": "true",
                })
            );
            closeButton.tab = tab;

            this._setRowAttributes(row, tab);
            return row;
        }
        _setRowAttributes(row, tab) {
            setAttributes(row, {
                selected: tab.selected,
                pinned: tab.pinned,
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
                "activemedia-blocked": tab.activeMediaBlocked,
                pictureinpicture: tab.pictureinpicture,
                hidden: !(tab.muted || tab.soundPlaying || tab.activeMediaBlocked),
            });
        }
        _setImageAttributes(row, tab) {
            let button = row.firstElementChild;
            let image = button.icon;
            if (image) {
                let busy = tab.getAttribute("busy");
                let progress = tab.getAttribute("progress");
                setAttributes(image, { busy, progress });
                if (busy) image.classList.add("tab-throbber-tabslist");
                else image.classList.remove("tab-throbber-tabslist");
            }
        }
        getNewFocus(walker, prev) {
            return prev ? walker.previousNode() : walker.nextNode();
        }
        navigateButtons(prev, horizontal) {
            let walker = horizontal ? this.horizontalWalker : this.verticalWalker;
            let oldFocus = document.activeElement;
            walker.currentNode = oldFocus;
            let newFocus = this.getNewFocus(walker, prev);
            while (newFocus && newFocus.tagName == "toolbartabstop")
                newFocus = this.getNewFocus(walker, prev);
            if (newFocus) this._focusButton(newFocus);
        }
        _focusButton(button) {
            button.setAttribute("tabindex", "-1");
            button.focus();
            button.addEventListener("blur", this);
        }
        _onFocus(e) {
            clearTimeout(this.hoverOutTimer);
            clearTimeout(this.hoverTimer);
            this.hoverOutQueued = false;
            this.hoverQueued = false;
            if (this.pane.getAttribute("unpinned") && !this.noExpand)
                this.pane.setAttribute("expanded", true);
            if (e.target.tagName === "toolbartabstop") this._onTabStopFocus(e);
        }
        _onPaneBlur(e) {
            if (this.pane.matches(":is(:hover, :focus-within)")) return;
            clearTimeout(this.hoverOutTimer);
            clearTimeout(this.hoverTimer);
            this.hoverOutQueued = false;
            this.hoverQueued = false;
            if (this.noExpand) return this.pane.removeAttribute("expanded");
            let popNode = document.popupNode;
            if (popNode && this.pane.contains(popNode)) {
                let contextDef = popNode.closest("[context]");
                if (contextDef) {
                    document.getElementById(contextDef.getAttribute("context"))?.addEventListener(
                        "popuphidden",
                        (e) => {
                            setTimeout(() => {
                                if (!this.pane.matches(":is(:hover, :focus-within)"))
                                    this.pane.removeAttribute("expanded");
                            }, 100);
                        },
                        { once: true }
                    );
                    return;
                }
            }
            this.pane.removeAttribute("expanded");
        }
        _onButtonBlur(e) {
            if (document.activeElement == e.target) return;
            e.target.removeEventListener("blur", this);
            e.target.removeAttribute("tabindex");
        }
        _onTabStopFocus(e) {
            let walker = this.horizontalWalker;
            let oldFocus = e.relatedTarget;
            let isButton = (node) => node.tagName == "button" || node.tagName == "toolbarbutton";
            if (oldFocus) {
                this._isFocusMovingBackward =
                    oldFocus.compareDocumentPosition(e.target) & Node.DOCUMENT_POSITION_PRECEDING;
                if (this._isFocusMovingBackward && oldFocus && isButton(oldFocus)) {
                    document.commandDispatcher.rewindFocus();
                    return;
                }
            }
            walker.currentNode = e.target;
            let button = walker.nextNode();
            if (!button || !isButton(button)) {
                if (
                    oldFocus &&
                    this._isFocusMovingBackward &&
                    !gNavToolbox.contains(oldFocus) &&
                    !this.pane.contains(oldFocus)
                ) {
                    let allStops = Array.from(document.querySelectorAll("toolbartabstop"));
                    let earlierVisibleStopIndex = allStops.indexOf(e.target) - 1;
                    while (earlierVisibleStopIndex >= 0) {
                        let stop = allStops[earlierVisibleStopIndex];
                        let stopContainer = this.pane.contains(stop)
                            ? this.pane
                            : stop.closest("toolbar");
                        if (window.windowUtils.getBoundsWithoutFlushing(stopContainer).height > 0)
                            break;
                        earlierVisibleStopIndex--;
                    }
                    if (earlierVisibleStopIndex == -1) this._isFocusMovingBackward = false;
                }
                if (this._isFocusMovingBackward) document.commandDispatcher.rewindFocus();
                else document.commandDispatcher.advanceFocus();
                return;
            }
            this._focusButton(button);
        }
        _onKeyDown(e) {
            let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
            if (e.altKey || e.shiftKey || accelKey) return;
            switch (e.key) {
                case "ArrowLeft":
                    this.navigateButtons(!window.RTL_UI, true);
                    break;
                case "ArrowRight":
                    // Previous if UI is RTL, next if UI is LTR.
                    this.navigateButtons(window.RTL_UI, true);
                    break;
                case "ArrowUp":
                    this.navigateButtons(true);
                    break;
                case "ArrowDown":
                    this.navigateButtons(false);
                    break;
                case "Escape":
                    if (this.pane.contains(document.activeElement)) {
                        document.activeElement.blur();
                        break;
                    }
                // fall through
                default:
                    return;
            }
            e.preventDefault();
        }
        _onMouseDown(e, tab) {
            if (e.button !== 0) return;
            let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
            if (e.shiftKey) {
                const lastSelectedTab = gBrowser.lastMultiSelectedTab;
                if (!accelKey) {
                    gBrowser.selectedTab = lastSelectedTab;
                    gBrowser.clearMultiSelectedTabs();
                }
                gBrowser.addRangeToMultiSelectedTabs(lastSelectedTab, tab);
                e.preventDefault();
            } else if (accelKey) {
                if (tab.multiselected) gBrowser.removeFromMultiSelectedTabs(tab);
                else if (tab != gBrowser.selectedTab) {
                    gBrowser.addToMultiSelectedTabs(tab);
                    gBrowser.lastMultiSelectedTab = tab;
                }
                e.preventDefault();
            } else {
                if (!tab.selected && tab.multiselected) gBrowser.lockClearMultiSelectionOnce();
                if (
                    !e.shiftKey &&
                    !accelKey &&
                    !e.target.classList.contains("all-tabs-secondary-button") &&
                    tab !== gBrowser.selectedTab
                ) {
                    if (tab.getAttribute("pending") || tab.getAttribute("busy"))
                        tab.noCanvas = true;
                    else delete tab.noCanvas;
                    if (gBrowser.selectedTab != tab) gBrowser.selectedTab = tab;
                    else gBrowser.tabContainer._handleTabSelect();
                }
            }
        }
        _onMouseUp(e, tab) {
            if (e.button === 2) return;
            if (e.button === 1) {
                gBrowser.removeTab(tab, {
                    animate: true,
                    byMouse: false,
                });
                return;
            }
            let accelKey = AppConstants.platform == "macosx" ? e.metaKey : e.ctrlKey;
            if (e.shiftKey || accelKey || e.target.classList.contains("all-tabs-secondary-button"))
                return;
            delete tab.noCanvas;
            gBrowser.unlockClearMultiSelection();
            gBrowser.clearMultiSelectedTabs();
        }
        _onMouseEnter(e) {
            clearTimeout(this.hoverOutTimer);
            this.hoverOutQueued = false;
            if (!this.pane.getAttribute("unpinned") || this.noExpand)
                return this.pane.removeAttribute("expanded");
            if (this.hoverQueued) return;
            this.hoverQueued = true;
            this.hoverTimer = setTimeout(() => {
                this.hoverQueued = false;
                this.pane.setAttribute("expanded", true);
            }, this.hoverDelay);
        }
        _onMouseLeave(e) {
            clearTimeout(this.hoverTimer);
            this.hoverQueued = false;
            if (this.hoverOutQueued) return;
            this.hoverOutQueued = true;
            this.hoverOutTimer = setTimeout(() => {
                this.hoverOutQueued = false;
                if (this.pane.matches(":is(:hover, :focus-within)")) return;
                if (this.noExpand) return this.pane.removeAttribute("expanded");
                let popNode = document.popupNode;
                if (popNode && this.pane.contains(popNode)) {
                    let contextDef = popNode.closest("[context]");
                    if (contextDef) {
                        document
                            .getElementById(contextDef.getAttribute("context"))
                            ?.addEventListener(
                                "popuphidden",
                                (e) => {
                                    setTimeout(() => {
                                        if (!this.pane.matches(":is(:hover, :focus-within)"))
                                            this.pane.removeAttribute("expanded");
                                    }, 100);
                                },
                                { once: true }
                            );
                        return;
                    }
                }
                this.pane.removeAttribute("expanded");
            }, this.hoverOutDelay);
        }
        _onClick(e) {
            if (e.button !== 0 || e.target.classList.contains("all-tabs-secondary-button")) return;
            e.preventDefault();
        }
        _onCommand(e, tab) {
            if (e.target.hasAttribute("toggle-mute")) {
                tab.multiselected
                    ? gBrowser.toggleMuteAudioOnMultiSelectedTabs(tab)
                    : tab.toggleMuteAudio();
                return;
            }
            if (e.target.hasAttribute("close-button")) {
                if (tab.multiselected) gBrowser.removeMultiSelectedTabs();
                else gBrowser.removeTab(tab, { animate: true });
                return;
            }
            if (!gSharedTabWarning.willShowSharedTabWarning(tab))
                if (tab !== gBrowser.selectedTab) this._selectTab(tab);
            delete tab.noCanvas;
        }
        _onDragStart(e, tab) {
            let row = e.target;
            if (!tab || gBrowser.tabContainer._isCustomizing) return;
            let selectedTabs = gBrowser.selectedTabs;
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
                let newIndex = (aTab, index) => {
                    if (aTab.pinned) return Math.min(index, gBrowser._numPinnedTabs - 1);
                    return Math.max(index, gBrowser._numPinnedTabs);
                };
                let tabIndex = selectedTabs.indexOf(tab);
                let draggedTabPos = tab._tPos;
                // tabs to the left of the dragged tab
                let insertAtPos = draggedTabPos - 1;
                for (let i = tabIndex - 1; i > -1; i--) {
                    insertAtPos = newIndex(selectedTabs[i], insertAtPos);
                    if (insertAtPos && !selectedTabs[i].nextElementSibling.multiselected)
                        gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
                }
                // tabs to the right
                insertAtPos = draggedTabPos + 1;
                for (let i = tabIndex + 1; i < selectedTabs.length; i++) {
                    insertAtPos = newIndex(selectedTabs[i], insertAtPos);
                    if (insertAtPos && !selectedTabs[i].previousElementSibling.multiselected)
                        gBrowser.moveTabTo(selectedTabs[i], insertAtPos);
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
                    context.fillStyle = getComputedStyle(this.pane).getPropertyValue(
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
                movingTabs: (tab.multiselected ? gBrowser.selectedTabs : [tab]).filter(
                    this.filterFn
                ),
            };
            e.stopPropagation();
        }
        _onDragOver(e) {
            let row = this.findRow(e.target);
            let dt = e.dataTransfer;
            if (!dt.types.includes("all-tabs-item") || !row || row.tab.multiselected) return;
            let draggedTab = dt.mozGetDataAt("all-tabs-item", 0);
            if (row.tab === draggedTab) return;
            // whether a tab will be placed before or after the drop target depends on 1) whether the drop target is above or below the dragged tab, and 2) whether the order of the tab list is reversed.
            let getPosition = () => {
                return this.reversed
                    ? row.tab._tPos < draggedTab._tPos
                    : row.tab._tPos > draggedTab._tPos;
            };
            let position = getPosition() ? "after" : "before";
            row.setAttribute("dragpos", position);
            e.preventDefault();
        }
        _onDragLeave(e) {
            let row = this.findRow(e.target);
            let dt = e.dataTransfer;
            if (!dt.types.includes("all-tabs-item") || !row) return;
            this.containerNode
                .querySelectorAll("[dragpos]")
                .forEach((item) => item.removeAttribute("dragpos"));
        }
        _onDrop(e) {
            let row = this.findRow(e.target);
            let dt = e.dataTransfer;
            let tabBar = gBrowser.tabContainer;

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
                    gBrowser.moveTabTo(
                        dt.dropEffect == "copy" ? gBrowser.duplicateTab(tab) : tab,
                        dir ? newIndex++ : newIndex
                    )
                );
            }
            row.removeAttribute("dragpos");
            e.stopPropagation();
        }
        _onDragEnd(e) {
            let draggedTab = e.dataTransfer.mozGetDataAt("all-tabs-item", 0);
            delete draggedTab._dragData;
            delete draggedTab.noCanvas;
            for (let row of this.rows) row.removeAttribute("dragpos");
        }
        _onTabMultiSelect() {
            for (let item of this.rows)
                !!item.tab.multiselected
                    ? item.setAttribute("multiselected", true)
                    : item.removeAttribute("multiselected");
        }
        _setTooltip(e, tab) {
            if (e.target.hasAttribute("toggle-mute"))
                this._overPlayingIcon = e.type === "mouseover" ? true : false;
            else if (e.target.hasAttribute("close-button"))
                this.mOverCloseButton = e.type === "mouseover" ? true : false;
            SessionStore.speculativeConnectOnTabHover(tab);
            if (this.mOverCloseButton) tab = gBrowser._findTabToBlurTo(tab);
            gBrowser.warmupTab(tab);
        }
        createTabTooltip(e) {
            e.stopPropagation();
            let row = document.tooltipNode ? document.tooltipNode.closest(".all-tabs-item") : null;
            let { tab } = row;
            if (!row || !tab) return e.preventDefault();
            let stringWithShortcut = (stringId, keyElemId, pluralCount) => {
                let keyElem = document.getElementById(keyElemId);
                let shortcut = ShortcutUtils.prettifyShortcut(keyElem);
                return PluralForm.get(pluralCount, gTabBrowserBundle.GetStringFromName(stringId))
                    .replace("%S", shortcut)
                    .replace("#1", pluralCount);
            };
            let label;
            const selectedTabs = gBrowser.selectedTabs;
            const contextTabInSelection = selectedTabs.includes(tab);
            const affectedTabsLength = contextTabInSelection ? selectedTabs.length : 1;
            if (this.mOverCloseButton) {
                let shortcut = ShortcutUtils.prettifyShortcut(key_close);
                label = PluralForm.get(
                    affectedTabsLength,
                    gTabBrowserBundle.GetStringFromName("tabs.closeTabs.tooltip")
                ).replace("#1", affectedTabsLength);
                if (contextTabInSelection && shortcut) {
                    if (label.includes("%S")) label = label.replace("%S", shortcut);
                    else label = label + " (" + shortcut + ")";
                }
            } else if (this._overPlayingIcon) {
                let stringID;
                if (contextTabInSelection) {
                    stringID = tab.linkedBrowser.audioMuted
                        ? "tabs.unmuteAudio2.tooltip"
                        : "tabs.muteAudio2.tooltip";
                    label = stringWithShortcut(stringID, "key_toggleMute", affectedTabsLength);
                } else {
                    if (tab.hasAttribute("activemedia-blocked"))
                        stringID = "tabs.unblockAudio2.tooltip";
                    else
                        stringID = tab.linkedBrowser.audioMuted
                            ? "tabs.unmuteAudio2.background.tooltip"
                            : "tabs.muteAudio2.background.tooltip";
                    label = PluralForm.get(
                        affectedTabsLength,
                        gTabBrowserBundle.GetStringFromName(stringID)
                    ).replace("#1", affectedTabsLength);
                }
            } else {
                label = tab._fullLabel || tab.getAttribute("label");
                if (Services.prefs.getBoolPref("browser.tabs.tooltipsShowPidAndActiveness", false))
                    if (tab.linkedBrowser) {
                        let [contentPid, ...framePids] = this.E10SUtils.getBrowserPids(
                            tab.linkedBrowser,
                            gFissionBrowser
                        );
                        if (contentPid) {
                            label += " (pid " + contentPid + ")";
                            if (gFissionBrowser) {
                                label += " [F";
                                if (framePids.length) label += " " + framePids.join(", ");
                                label += "]";
                            }
                        }
                        if (tab.linkedBrowser.docShellIsActive) label += " [A]";
                    }
                if (tab.userContextId) {
                    label = gTabBrowserBundle.formatStringFromName("tabs.containers.tooltip", [
                        label,
                        ContextualIdentityService.getUserContextLabel(tab.userContextId),
                    ]);
                }
            }
            if (!gProtonPlacesTooltip) return e.target.setAttribute("label", label);
            e.target.moveToAnchor(row, "after_start");
            let title = e.target.querySelector(".places-tooltip-title");
            let url = e.target.querySelector(".places-tooltip-uri");
            let icon = e.target.querySelector("#places-tooltip-insecure-icon");
            title.textContent = label;
            url.value = tab.linkedBrowser?.currentURI?.spec.replace(/^https:\/\//, "");
            icon.hidden = !url.value.startsWith("http://");
        }
        handlePrivacyChange() {
            let containersEnabled =
                prefSvc.getBoolPref("privacy.userContext.enabled") &&
                !PrivateBrowsingUtils.isWindowPrivate(window);
            const newTabLeftClickOpensContainersMenu = prefSvc.getBoolPref(
                "privacy.userContext.newTabContainerOnLeftClick.enabled"
            );
            let parent = this.newTabButton;
            parent.removeAttribute("type");
            if (parent.menupopup) parent.menupopup.remove();
            if (containersEnabled) {
                parent.setAttribute("context", "new-tab-button-popup");
                let popup = document.getElementById("new-tab-button-popup").cloneNode(true);
                popup.removeAttribute("id");
                popup.className = "new-tab-popup";
                popup.setAttribute("position", "after_end");
                parent.prepend(popup);
                parent.setAttribute("type", "menu");
                if (newTabLeftClickOpensContainersMenu) {
                    gClickAndHoldListenersOnElement.remove(parent);
                    nodeToTooltipMap["new-tab-button"] = "newTabAlwaysContainer.tooltip";
                } else {
                    gClickAndHoldListenersOnElement.add(parent);
                    nodeToTooltipMap["new-tab-button"] = "newTabContainer.tooltip";
                }
            } else {
                nodeToTooltipMap["new-tab-button"] = "newTabButton.tooltip";
                parent.removeAttribute("context", "new-tab-button-popup");
            }
            gDynamicTooltipCache.delete("new-tab-button");
            this.newTabButton.tooltipText = GetDynamicShortcutTooltipText("new-tab-button");
        }
        registerSheet() {
            let css = `
:root {
    --vertical-tabs-padding: 4px;
}
#vertical-tabs-button {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill %230c0c0d"><path fill-opacity="context-fill-opacity" d="M2,7h3v6H2V7z"/><path d="M6,7v6H5V7H2V6h12v1H6z M13,1c1.657,0,3,1.343,3,3v8c0,1.657-1.343,3-3,3H3c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H13z M3,3C2.448,3,2,3.448,2,4v8c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4c0-0.6-0.4-1-1-1H3z"/></svg>');
    fill-opacity: 0.4;
}
#vertical-tabs-button:not([positionstart="true"]) .toolbarbutton-icon {
    transform: scaleX(-1);
}
#vertical-tabs-button[checked],
#vertical-tabs-close-button {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="context-fill %230c0c0d"><path fill-opacity="context-fill-opacity" d="M2,3h12v3H2V3z"/><path d="M6,7v6H5V7H2V6h12v1H6z M13,1c1.657,0,3,1.343,3,3v8c0,1.657-1.343,3-3,3H3c-1.657,0-3-1.343-3-3V4c0-1.657,1.343-3,3-3H13z M3,3C2.448,3,2,3.448,2,4v8c0,0.6,0.4,1,1,1h10c0.6,0,1-0.4,1-1V4c0-0.6-0.4-1-1-1H3z"/></svg>');
    fill-opacity: 0.4;
}
#vertical-tabs-new-tab-button {
    list-style-image: url("chrome://browser/skin/new-tab.svg");
}
#vertical-tabs-pin-button {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M11.414 10l2.293-2.293a1 1 0 0 0 0-1.414 4.418 4.418 0 0 0-.8-.622L11.425 7.15h.008l-4.3 4.3v-.017l-1.48 1.476a3.865 3.865 0 0 0 .692.834 1 1 0 0 0 1.37-.042L10 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414zm3.293-8.707a1 1 0 0 0-1.414 0L9.7 4.882A2.382 2.382 0 0 1 8 2.586V2a1 1 0 0 0-1.707-.707l-5 5A1 1 0 0 0 2 8h.586a2.382 2.382 0 0 1 2.3 1.7l-3.593 3.593a1 1 0 1 0 1.414 1.414l12-12a1 1 0 0 0 0-1.414zm-9 6a4.414 4.414 0 0 0-1.571-1.015l2.143-2.142a4.4 4.4 0 0 0 1.013 1.571 4.191 4.191 0 0 0 .9.684l-1.8 1.8a4.2 4.2 0 0 0-.684-.898z"/></svg>');
}
#vertical-tabs-pane[unpinned] #vertical-tabs-pin-button {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M14.707 13.293L11.414 10l2.293-2.293a1 1 0 0 0 0-1.414A4.384 4.384 0 0 0 10.586 5h-.172A2.415 2.415 0 0 1 8 2.586V2a1 1 0 0 0-1.707-.707l-5 5A1 1 0 0 0 2 8h.586A2.415 2.415 0 0 1 5 10.414v.169a4.036 4.036 0 0 0 1.337 3.166 1 1 0 0 0 1.37-.042L10 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414zm-7.578-1.837A2.684 2.684 0 0 1 7 10.583v-.169a4.386 4.386 0 0 0-1.292-3.121 4.414 4.414 0 0 0-1.572-1.015l2.143-2.142a4.4 4.4 0 0 0 1.013 1.571A4.384 4.384 0 0 0 10.414 7h.172a2.4 2.4 0 0 1 .848.152z"/></svg>');
}
#vertical-tabs-pane {
    background-color: var(--vertical-tabs-pane-background, var(--lwt-accent-color));
    padding: var(--vertical-tabs-padding);
}
#vertical-tabs-pane:not([unpinned]) {
    min-width: 160px;
    max-width: 50vw;
}
#vertical-tabs-pane:not([hidden]) {
    min-height: 0;
    display: flex;
}
#vertical-tabs-pane[unpinned]:not([hidden]) {
    display: flex;
    position: relative;
    z-index: 1;
    margin-inline: 0;
    max-width: calc(16px + var(--vertical-tabs-padding) * 2 + var(--arrowpanel-menuitem-padding) * 2);
    min-width: calc(16px + var(--vertical-tabs-padding) * 2 + var(--arrowpanel-menuitem-padding) * 2);
    width: calc(16px + var(--vertical-tabs-padding) * 2 + var(--arrowpanel-menuitem-padding) * 2);
    height: 0;
    transition: 0.3s ease-in-out min-width, 0.3s ease-in-out max-width, 0.3s ease-in-out margin;
}
#vertical-tabs-pane[unpinned][expanded] {
    min-width: 350px;
    width: 350px;
    max-width: 350px;
    margin-inline: 0 -314px;
}
#vertical-tabs-pane[unpinned]:not([positionstart="true"]) {
    left: auto;
    right: 0;
    margin-inline: 0;
}
#vertical-tabs-pane[unpinned][expanded]:not([positionstart="true"]) {
    margin-inline: -314px 0;
}
#vertical-tabs-inner-box {
    overflow: hidden;
    width: -moz-available;
    min-width: calc(16px + var(--arrowpanel-menuitem-padding) * 2);
}
#vertical-tabs-pane[unpinned] ~ #vertical-tabs-splitter {
    display: none;
}
#vertical-tabs-pane[unpinned]:not([expanded]) #vertical-tabs-list .all-tabs-item {
    padding-inline-end: 0;
}
#vertical-tabs-list .all-tabs-item {
    border-radius: var(--arrowpanel-menuitem-border-radius);
    box-shadow: none;
    -moz-box-align: center;
    padding-inline-end: 2px;
    margin: 0;
    overflow-x: -moz-hidden-unscrollable;
    position: relative;
}
#vertical-tabs-pane[checked] toolbartabstop {
    -moz-user-focus: normal;
}
#vertical-tabs-list .all-tabs-item .all-tabs-button:not([disabled], [open]):focus {
    background: none;
}
#vertical-tabs-list
    .all-tabs-item:is([selected], [multiselected], [usercontextid]:is(:hover, [_moz-menuactive]))
    .all-tabs-button {
    background-image: linear-gradient(
        to right,
        var(--main-stripe-color) 0,
        var(--main-stripe-color) 4px,
        transparent 4px
    ) !important;
}
#vertical-tabs-list .all-tabs-item[selected] {
    font-weight: normal;
    background-color: var(--arrowpanel-dimmed-further) !important;
    --main-stripe-color: var(--arrowpanel-dimmed-even-further);
}
#vertical-tabs-list .all-tabs-item .all-tabs-button {
    min-height: revert;
}
#vertical-tabs-list .all-tabs-item[usercontextid]:not([multiselected]) {
    --main-stripe-color: var(--identity-tab-color);
}
#vertical-tabs-list .all-tabs-item[multiselected] {
    --main-stripe-color: var(--multiselected-color, var(--toolbarbutton-icon-fill-attention));
}
#vertical-tabs-list
    .all-tabs-item:not([selected]):is(:hover, :focus-within, [_moz-menuactive], [multiselected]) {
    background-color: var(--arrowpanel-dimmed) !important;
}
#vertical-tabs-list .all-tabs-item[multiselected]:not([selected]):is(:hover, [_moz-menuactive]) {
    background-color: var(--arrowpanel-dimmed-further) !important;
}
#vertical-tabs-list
    .all-tabs-item[pending]:not([selected]):is(:hover, :focus-within, [_moz-menuactive], [multiselected]) {
    background-color: var(
        --arrowpanel-faint,
        color-mix(in srgb, var(--arrowpanel-dimmed) 60%, transparent)
    ) !important;
}
#vertical-tabs-list .all-tabs-item[pending] > .all-tabs-button {
    opacity: 0.6;
}
:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload]:not([pending]) > .all-tabs-button,
:root[italic-unread-tabs] .all-tabs-item[notselectedsinceload][pending] > .all-tabs-button[busy] {
    font-style: italic;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button {
    max-width: 18px;
    max-height: 18px;
    border-radius: 100%;
    color: inherit;
    background-color: transparent !important;
    opacity: 0.7;
    min-height: 0;
    min-width: 0;
    padding: 0;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button > .toolbarbutton-icon {
    min-width: 18px;
    min-height: 18px;
    fill: inherit;
    fill-opacity: inherit;
    -moz-context-properties: inherit;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button > label:empty {
    display: none;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button:is(:hover, :focus):not([disabled]),
#vertical-tabs-list
    .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button]:is(:hover, :focus):not([disabled]) {
    background-color: var(--arrowpanel-dimmed) !important;
    opacity: 1;
    color: inherit;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button:hover:active:not([disabled]),
#vertical-tabs-list
    .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button]:hover:active:not([disabled]) {
    background-color: var(--arrowpanel-dimmed-further) !important;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[toggle-mute] {
    list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M8.587 2.354L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618A2.191 2.191 0 0 0 4.191 11H5.5l3.17 2.717a.2.2 0 0 0 .33-.152V2.544a.25.25 0 0 0-.413-.19z'/><path d='M11.575 3.275a.5.5 0 0 0-.316.949 3.97 3.97 0 0 1 0 7.551.5.5 0 0 0 .316.949 4.971 4.971 0 0 0 0-9.449z'/><path d='M13 8a3 3 0 0 0-2.056-2.787.5.5 0 1 0-.343.939A2.008 2.008 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/></svg>") !important;
    padding: 2px 2.5px 2px 0.5px;
    margin-inline-end: 8.5px;
    margin-inline-start: -27px;
    transition: 0.25s cubic-bezier(0.07, 0.78, 0.21, 0.95) transform,
        0.2s cubic-bezier(0.07, 0.74, 0.24, 0.95) margin, 0.075s linear opacity;
    display: block !important;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[toggle-mute][hidden] {
    transform: translateX(14px);
    opacity: 0;
}
#vertical-tabs-list
    .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[toggle-mute] {
    transform: translateX(48px);
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[soundplaying] {
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[muted] {
    list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16' fill='context-fill'><path d='M13 8a2.813 2.813 0 0 0-.465-1.535l-.744.744A1.785 1.785 0 0 1 12 8a2.008 2.008 0 0 1-1.4 1.848.5.5 0 0 0 .343.939A3 3 0 0 0 13 8z'/><path d='M13.273 5.727A3.934 3.934 0 0 1 14 8a3.984 3.984 0 0 1-2.742 3.775.5.5 0 0 0 .316.949A4.985 4.985 0 0 0 15 8a4.93 4.93 0 0 0-1.012-2.988z'/><path d='M8.67 13.717a.2.2 0 0 0 .33-.152V10l-2.154 2.154z'/><path d='M14.707 1.293a1 1 0 0 0-1.414 0L9 5.586V2.544a.25.25 0 0 0-.413-.19L5.5 5H4.191A2.191 2.191 0 0 0 2 7.191v1.618a2.186 2.186 0 0 0 1.659 2.118l-2.366 2.366a1 1 0 1 0 1.414 1.414l12-12a1 1 0 0 0 0-1.414z'/></svg>") !important;
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[activemedia-blocked] {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12"><path fill="context-fill" d="M2.128.13A.968.968 0 0 0 .676.964v10.068a.968.968 0 0 0 1.452.838l8.712-5.034a.968.968 0 0 0 0-1.676L2.128.13z"/></svg>') !important;
    padding: 4px 4px 4px 5px;
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
#vertical-tabs-list
    > .all-tabs-item:not(:hover, :focus-within)
    .all-tabs-secondary-button[pictureinpicture] {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.8 512"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M568.9 0h-512C25.6 0 0 25 0 56.3v398.8C0 486.4 25.6 512 56.9 512h512c31.3 0 56.9-25.6 56.9-56.9V56.3C625.8 25 600.2 0 568.9 0zm-512 425.7V86c0-16.5 13.5-30 30-30h452c16.5 0 30 13.5 30 30v339.6c0 16.5-13.5 30-30 30h-452c-16.5.1-30-13.4-30-29.9zM482 227.6H314.4c-16.5 0-30 13.5-30 30v110.7c0 16.5 13.5 30 30 30H482c16.5 0 30-13.5 30-30V257.6c0-16.5-13.5-30-30-30z"/></svg>') !important;
    padding: 4px 4px 4px 5px;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[pictureinpicture] {
    transform: none !important;
    opacity: 0.7;
    margin-inline-start: -2px;
}
#vertical-tabs-list .all-tabs-item .all-tabs-secondary-button[close-button] {
    fill-opacity: 0;
    transform: translateX(14px);
    opacity: 0;
    margin-inline-start: -27px;
    transition: 0.25s cubic-bezier(0.07, 0.78, 0.21, 0.95) transform,
        0.2s cubic-bezier(0.07, 0.74, 0.24, 0.95) margin, 0.075s linear opacity;
    display: block;
    -moz-context-properties: fill, fill-opacity, stroke;
    fill: currentColor;
    fill-opacity: 0;
    border-radius: 50%;
    list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect fill='context-fill' fill-opacity='context-fill-opacity' width='20' height='20' rx='2' ry='2'/><path fill='context-fill' fill-opacity='context-stroke-opacity' d='M11.06 10l3.47-3.47a.75.75 0 00-1.06-1.06L10 8.94 6.53 5.47a.75.75 0 10-1.06 1.06L8.94 10l-3.47 3.47a.75.75 0 101.06 1.06L10 11.06l3.47 3.47a.75.75 0 001.06-1.06z'/></svg>");
}
#vertical-tabs-list
    .all-tabs-item:is(:hover, :focus-within)
    .all-tabs-secondary-button[close-button] {
    transform: none;
    opacity: 0.7;
    margin-inline-start: -2px;
}
#vertical-tabs-list .all-tabs-item[dragpos] {
    background-color: color-mix(
        in srgb,
        transparent 30%,
        var(--arrowpanel-faint, color-mix(in srgb, var(--arrowpanel-dimmed) 60%, transparent))
    );
}
#vertical-tabs-list .all-tabs-item[dragpos]::before {
    content: "";
    position: absolute;
    pointer-events: none;
    height: 0;
    z-index: 1000;
    width: 100%;
}
#vertical-tabs-list:not([no-expand][unpinned]) .all-tabs-item[dragpos]::before {
    border-image: linear-gradient(
        to right,
        transparent,
        var(--arrowpanel-dimmed-even-further) 1%,
        var(--arrowpanel-dimmed-even-further) 25%,
        transparent 90%
    );
    border-image-slice: 1;
}
#vertical-tabs-list .all-tabs-item[dragpos="before"]::before {
    inset-block-start: 0;
    border-top: 1px solid var(--arrowpanel-dimmed-even-further);
}
#vertical-tabs-list .all-tabs-item[dragpos="after"]::before {
    inset-block-end: 0;
    border-bottom: 1px solid var(--arrowpanel-dimmed-even-further);
}
#vertical-tabs-pane[unpinned]:not([expanded])
    #vertical-tabs-list
    .all-tabs-item
    .all-tabs-secondary-button[toggle-mute] {
    transform: none !important;
    margin-inline: revert !important;
}
#vertical-tabs-pane[unpinned]:not([expanded]) .all-tabs-item {
    min-width: 0 !important;
}
#vertical-tabs-pane[unpinned]:not([expanded]) :is(.all-tabs-item, .subviewbutton) {
    margin: 0 !important;
    -moz-box-pack: start !important;
}
#vertical-tabs-pane[unpinned] :is(.all-tabs-item, .subviewbutton) .toolbarbutton-text {
    transition: 0.3s ease-in-out opacity;
}
#vertical-tabs-pane[unpinned]:not([expanded]) .all-tabs-secondary-button {
    visibility: collapse;
}
#vertical-tabs-pane[unpinned]:not([expanded])
    :is(.all-tabs-item, .subviewbutton)
    .toolbarbutton-text {
    opacity: 0 !important;
}
#vertical-tabs-pane .subviewbutton.no-label .toolbarbutton-text {
    display: none;
}
#vertical-tabs-pane[unpinned]:not([expanded]) #vertical-tabs-buttons-row > toolbarbutton {
    min-width: calc(16px + var(--arrowpanel-menuitem-padding) * 2) !important;
}
#vertical-tabs-buttons-row {
    min-width: 0 !important;
}
#vertical-tabs-buttons-row > toolbarbutton {
    margin: 0 !important;
}
#vertical-tabs-pane[no-expand][unpinned] #vertical-tabs-buttons-row {
	-moz-box-orient: vertical;
}
#vertical-tabs-pane[no-expand] {
	transition: none !important;
}
#vertical-tabs-pane .subviewbutton-iconic > .toolbarbutton-icon {
    -moz-context-properties: fill, fill-opacity;
}
#vertical-tabs-pane .all-tabs-item[pinned] > .all-tabs-button.subviewbutton > .toolbarbutton-text {
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M14.707 13.293L11.414 10l2.293-2.293a1 1 0 0 0 0-1.414A4.384 4.384 0 0 0 10.586 5h-.172A2.415 2.415 0 0 1 8 2.586V2a1 1 0 0 0-1.707-.707l-5 5A1 1 0 0 0 2 8h.586A2.415 2.415 0 0 1 5 10.414v.169a4.036 4.036 0 0 0 1.337 3.166 1 1 0 0 0 1.37-.042L10 11.414l3.293 3.293a1 1 0 0 0 1.414-1.414zm-7.578-1.837A2.684 2.684 0 0 1 7 10.583v-.169a4.386 4.386 0 0 0-1.292-3.121 4.414 4.414 0 0 0-1.572-1.015l2.143-2.142a4.4 4.4 0 0 0 1.013 1.571A4.384 4.384 0 0 0 10.414 7h.172a2.4 2.4 0 0 1 .848.152z"/></svg>')
        no-repeat 6px/11px;
    padding-inline-start: 20px;
    -moz-context-properties: fill, fill-opacity;
    fill: currentColor;
}
#vertical-tabs-pane toolbarseparator {
    appearance: none;
    min-height: 0;
    border-top: 1px solid var(--panel-separator-color);
    border-bottom: none;
    margin: var(--panel-separator-margin);
    margin-inline: 0;
    padding: 0;
}
#vertical-tabs-pane {
    border-color: var(--sidebar-border-color);
    border-block-style: none;
    border-inline-style: solid;
    border-inline-width: 1px 0;
    z-index: 2;
}
#vertical-tabs-pane[positionstart] {
    border-inline-width: 0 1px;
}
#vertical-tabs-splitter {
    border: none;
}
            `;
            let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            );
            let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        }
        l10nIfNeeded() {
            let lazies = tabContext.querySelectorAll("[data-lazy-l10n-id]");
            if (lazies) {
                MozXULElement.insertFTLIfNeeded("browser/tabContextMenu.ftl");
                lazies.forEach((el) => {
                    el.setAttribute("data-l10n-id", el.getAttribute("data-lazy-l10n-id"));
                    el.removeAttribute("data-lazy-l10n-id");
                });
            }
        }
        addContextListeners() {
            tabContext.addEventListener(
                "command",
                () => {
                    observer.disconnect();
                    if (this.isOpen) {
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
                    delayedDisconnect();
                },
                false
            );
        }
        uninit() {
            let enumerator = Services.wm.getEnumerator("navigator:browser");
            if (!enumerator.hasMoreElements()) {
                let xulStore = Services.xulStore;
                if (this.pane.hasAttribute("checked")) xulStore.persist(this.pane, "checked");
                else xulStore.removeValue(document.documentURI, "vertical-tabs-pane", "checked");
                xulStore.persist(this.pane, "width");
                prefSvc.setBoolPref(closedPref, this.pane.hidden || false);
                prefSvc.setBoolPref(unpinnedPref, this.pane.getAttribute("unpinned") || false);
                prefSvc.setIntPref(widthPref, this.pane.width || 350);
            }
        }
    }

    function init() {
        window.verticalTabsPane = new VerticalTabsPaneBase();
        SidebarUI.setPosition();
        eval(
            `gBrowserInit.onUnload = function ` +
                gBrowserInit.onUnload
                    .toSource()
                    .replace(/(SidebarUI\.uninit\(\))/, `$1; verticalTabsPane.uninit()`)
        );
        window.onunload = gBrowserInit.onUnload.bind(gBrowserInit);
        let gNextWindowID = 0;
        let handleRequestSrc = PictureInPicture.handlePictureInPictureRequest.toSource();
        if (!handleRequestSrc.includes("_tabAttrModified"))
            eval(
                `PictureInPicture.handlePictureInPictureRequest = async function ` +
                    handleRequestSrc
                        .replace(/async handlePictureInPictureRequest/, "")
                        .replace(/\sServices\.telemetry.*\s*.*\s*.*\s*.*/, "")
                        .replace(/gCurrentPlayerCount.*/g, "")
                        .replace(
                            /(tab\.setAttribute\(\"pictureinpicture\".*)/,
                            ` parentWin.gBrowser._tabAttrModified(tab, ["pictureinpicture"]);`
                        )
            );
        let clearIconSrc = PictureInPicture.clearPipTabIcon.toSource();
        if (!clearIconSrc.includes("_tabAttrModified"))
            eval(
                `PictureInPicture.clearPipTabIcon = function ` +
                    clearIconSrc.replace(
                        /(tab\.removeAttribute\(\"pictureinpicture\".*)/,
                        ` gBrowser._tabAttrModified(tab, ["pictureinpicture"]);`
                    )
            );
    }

    function makeWidget() {
        if (CustomizableUI.getPlacementOfWidget("vertical-tabs-button", true)) return;
        CustomizableUI.createWidget({
            id: "vertical-tabs-button",
            type: "button",
            defaultArea: CustomizableUI.AREA_TABSTRIP,
            label: config.l10n["Button label"],
            tooltiptext: config.l10n["Button tooltip"],
            localized: false,
            onCommand(e) {
                e.target.ownerGlobal.verticalTabsPane.toggle();
            },
            onCreated(node) {
                let doc = node.ownerDocument;
                node.appendChild(
                    create(doc, "observes", {
                        "element": "vertical-tabs-pane",
                        "attribute": "checked",
                    })
                );
                node.appendChild(
                    create(doc, "observes", {
                        "element": "vertical-tabs-pane",
                        "attribute": "positionstart",
                    })
                );
            },
        });
    }

    document.getElementById("sidebar-splitter").after(
        create(document, "splitter", {
            class: "chromeclass-extrachrome sidebar-splitter",
            id: "vertical-tabs-splitter",
            hidden: true,
        })
    );
    document.getElementById("sidebar-splitter").after(
        create(document, "vbox", {
            class: "chromeclass-extrachrome",
            id: "vertical-tabs-pane",
            hidden: true,
        })
    );

    makeWidget();

    // tab pane's horizontal alignment should mirror that of the sidebar, which can be moved from left to right.
    SidebarUI.setPosition = function () {
        let appcontent = document.getElementById("appcontent");
        let verticalSplitter = document.getElementById("vertical-tabs-splitter");
        let verticalPane = document.getElementById("vertical-tabs-pane");
        this._box.style.MozBoxOrdinalGroup = 1;
        this._splitter.style.MozBoxOrdinalGroup = 2;
        appcontent.style.MozBoxOrdinalGroup = 3;
        verticalSplitter.style.MozBoxOrdinalGroup = 4;
        verticalPane.style.MozBoxOrdinalGroup = 5;
        if (!this._positionStart) {
            this._box.style.MozBoxOrdinalGroup = 5;
            this._splitter.style.MozBoxOrdinalGroup = 4;
            verticalSplitter.style.MozBoxOrdinalGroup = 2;
            verticalPane.style.MozBoxOrdinalGroup = 1;
            this._box.setAttribute("positionend", true);
            verticalPane.setAttribute("positionstart", true);
        } else {
            this._box.removeAttribute("positionend");
            verticalPane.removeAttribute("positionstart");
        }
        this.hideSwitcherPanel();
        let content = SidebarUI.browser.contentWindow;
        if (content && content.updatePosition) content.updatePosition();
    };

    if (gBrowserInit.delayedStartupFinished) init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
