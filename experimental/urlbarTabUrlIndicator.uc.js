// ==UserScript==
// @name           Urlbar Tab URL Indicator
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Upon hovering a tab, replace the urlbar's text (at least, appear to do so) with the hovered tab's URL instead of showing a normal tab tooltip. This is actually a mod of the tab tooltip, so the urlbar's text remains intact. If we changed the urlbar's text directly it would massively increase the complexity of the script and make it more prone to bugs or future breakdowns. So instead we just change how the tab tooltip works and looks so that it is indistinguishable from the urlbar's text.
// ==/UserScript==

(function () {
    let bounds = windowUtils.getBoundsWithoutFlushing;
    // stylesheet handles much of the work
    let css = `#tabbrowser-tab-tooltip {
            padding: 0;
            margin: 0;
            font-size: 1.15em;
            width: min-content;
            max-width: min-content;
            min-width: 0px;
        }
        :root[tab-tooltip-visible] .urlbar-input-box input {
            visibility: hidden !important;
        }
        #tabbrowser-tab-tooltip .places-tooltip-box {
            padding: revert;
            background: transparent;
            color: var(--toolbar-field-color);
            border: none;
            border-radius: revert;
            box-shadow: none !important;
            overflow: hidden;
        }
        #tabbrowser-tab-tooltip .places-tooltip-title {
            max-height: revert;
            overflow-y: hidden;
            white-space: nowrap;
            display: none;
        }
        #tabbrowser-tab-tooltip .places-tooltip-uri {
            color: var(--toolbar-field-color);
        }
        .places-tooltip-box[textoverflow="both"] {
            mask-image: linear-gradient(to right, transparent, black 3ch, black calc(100% - 3ch), transparent);
        }
        .places-tooltip-box[textoverflow="right"] {
            mask-image: linear-gradient(to left, transparent, black 3ch);
        }
        .places-tooltip-box[textoverflow="left"] {
            mask-image: linear-gradient(to right, transparent, black 3ch);
        }`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

    let tabTooltip = document.querySelector("#tabbrowser-tab-tooltip");
    tabTooltip.setAttribute("onpopuphiding", `gBrowser.onTabTooltipHiding(event)`); // involved in setting the [tab-tooltip-visible] property on the :root element
    Services.prefs.setBoolPref("browser.proton.places-tooltip.enabled", true); // make sure we're using the modern tooltip first
    document.querySelector("#tabbrowser-tab-tooltip > description").style.display = "none"; // hide the pre-modern tooltip label just in case
    document.querySelector("#places-tooltip-insecure-icon").hidden = true; // hide the insecure lock icon
    document
        .querySelector("#tabbrowser-tab-tooltip .places-tooltip-box")
        .setAttribute("pack", "center"); // make sure the tooltip's URL text is vertically centered

    // make sure the tooltip isn't showing when the urlbar is being interacted withs
    [
        "compositionstart",
        "compositionend",
        "dragstart",
        "drop",
        "focus",
        "blur",
        "input",
        "keydown",
        "keyup",
        "overflow",
        "underflow",
        "paste",
        "select",
    ].forEach((ev) => gURLBar.addEventListener(ev, () => tabTooltip.hidePopup()));

    ["TabOpen", "SSTabRestored", "TabClose", "TabMove", "TabSelect"].forEach((ev) =>
        gBrowser.tabContainer.addEventListener(ev, () => tabTooltip.hidePopup())
    );

    gBrowser.tabContainer.addEventListener("TabAttrModified", (e) => {
        if (e.target === tabTooltip.cachedTab)
            gBrowser.createTooltip({
                stopPropagation() {},
                preventDefault() {},
                target: tabTooltip.cachedTab,
            });
    });

    function _checkForRtlText(value) {
        let directionality = windowUtils.getDirectionFromText(value);
        if (directionality == windowUtils.DIRECTION_RTL) return true;
        return false;
    }

    // mask the edges of the tab URL text when it overflows the urlbar input area
    ["overflow", "underflow"].forEach((ev) =>
        tabTooltip.querySelector(".places-tooltip-box").addEventListener(ev, function (e) {
            switch (e.type) {
                case "overflow":
                    this._overflowing = true;
                    break;
                case "underflow":
                    this._overflowing = false;
                    break;
            }
            if (!this._overflowing) {
                this.removeAttribute("textoverflow");
                return;
            }
            let text = tabTooltip.querySelector(".places-tooltip-uri");
            let isRTL = _checkForRtlText(text.value);
            promiseDocumentFlushed(() => {
                if (text && this._overflowing) {
                    let side = "both";
                    if (isRTL) {
                        if (text.scrollLeft == 0) side = "left";
                        else if (text.scrollLeft == text.scrollLeftMin) side = "right";
                    } else if (text.scrollLeft == 0) side = "right";
                    else if (text.scrollLeft == text.scrollLeftMax) side = "left";
                    requestAnimationFrame(() => {
                        if (this._overflowing) this.setAttribute("textoverflow", side);
                    });
                }
            });
        })
    );

    // removes the [tab-tooltip-visible] property when the tooltip hides
    gBrowser.onTabTooltipHiding = function (e) {
        e.target.removeAttribute("position");
        tabTooltip.cachedTab = null;
        document.documentElement.removeAttribute("tab-tooltip-visible");
    };

    // called when the tooltip opens, e.g., most likely in response to a tab being hovered
    gBrowser.createTooltip = function (e) {
        e.stopPropagation();
        let tooltip = e.target;
        let tab = tooltip.triggerNode ? tooltip.triggerNode.closest("tab") : null;
        // if there is somehow no tab associated with the tooltip (unlikely),
        // if the hovered tab is the active tab and their URLs match,
        // or if the user is currently typing in the urlbar,
        // bail out of showing the tooltip since it would look identical to the urlbar.
        if (
            !tab ||
            gURLBar.focused ||
            gURLBar.view.isOpen ||
            (tab.selected && gURLBar.getAttribute("pageproxystate") === "valid")
        ) {
            e.preventDefault();
            return;
        }
        // set the [tab-tooltip-visible] property when the tooltip appears.
        // importantly, this is how we hide the urlbar when the tooltip is open
        document.documentElement.setAttribute("tab-tooltip-visible", true);
        tabTooltip.cachedTab = tab;
        // get the height, width, etc. of the urlbar input field
        let inputBounds = bounds(gURLBar.inputField);
        // set the tooltip's width, height, and padding equal to the urlbar input field's
        tooltip.style.height = `${inputBounds.height}px`;
        document.querySelector(
            "#tabbrowser-tab-tooltip .places-tooltip-box"
        ).style.cssText = `padding-left: ${getComputedStyle(gURLBar.inputField).paddingLeft};
        max-width: ${inputBounds.width}px`;
        // this determines how the tooltip is aligned relative to the anchor element
        tooltip.setAttribute("position", "overlap");
        // and this determines the element to which it's anchored.
        // so this results in the tooltip being anchored to the top left corner of the urlbar,
        // with the tooltip's own anchor point being its own top left corner.
        // in other words, the tooltip's top left corner is lined up with the urlbar's top left corner.
        tooltip.moveToAnchor(gURLBar.inputField, "overlap");
        let url = tooltip.querySelector(".places-tooltip-uri");
        let tempUrl = tab.linkedBrowser?.currentURI?.spec; // get hovered tab's URL
        // if there is no URL or the tab would show a search placeholder instead,
        // (e.g., on the new tab page) default to showing the tab's title instead.
        if (
            !tempUrl ||
            tempUrl === "about:blank" ||
            new RegExp(BROWSER_NEW_TAB_URL, "i").test(tempUrl)
        )
            tempUrl = gBrowser.getTabTooltip(tab);
        // if the trim URLs pref is enabled, http:// will be trimmed out of the URL
        else if (UrlbarPrefs.get("trimURLs")) tempUrl = tempUrl.replace(/^http:\/\//, "");
        url.value = tempUrl; // finally set the tooltip's text to the hovered tab's URL
    };
})();
