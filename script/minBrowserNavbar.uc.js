// ==UserScript==
// @name           Min Browser Nav-bar
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    This script makes the Firefox navbar UI more like Min Browser (https://minbrowser.org/) by hiding the main toolbar until the selected tab is clicked. The idle state is such that only the tab bar is visible at the top. Clicking the selected tab will automatically open the urlbar and focus the input area, while hiding the tab bar. It's essentially like the tab bar gets replaced by the urlbar (and other toolbar buttons) when the currently-open tab is clicked. When the urlbar area is un-focused, whether by clicking outside of it or by executing a search or URL navigation, the urlbar is automatically hidden again and replaced by the tab bar. Opening a new (blank) tab will also select the urlbar. Clicking and dragging tabs, and closing tabs with middle click, are still allowed. In order to preserve functionality, some new buttons have been added to the tab bar: back/forward/reload navigation buttons, and min/max/close buttons. Speaking of which, this handles all 3 size modes: normal, maximized, and fullscreen. In order to fully emulate Min Browser, the script closes the urlbar results whenever a different tab is clicked. However, this behavior can be disabled by toggling userChrome.minBrowser.resetOnBlur in about:config. In order to make everything look right, the tab bar and nav bar are given the same height, which is defined by a variable. This variable can also be changed by editing userChrome.minBrowser.toolbarHeight in about:config. I've set up the styling so that it should be as versatile as possible, working with the default layout, the proton layout, and probably most user layouts. Still, you may need to set the colors yourself. For instance, by default the backgrounds of the tab bar and the navbar are different colors. If you want them to be the same color, you'll need to handle that yourself — I wouldn't change something like that in this script, or I'd end up making it unusable for some people. And if you have a lot of your own customizations, you'll probably need to make some changes, either in your own userChrome.css or by editing the stylesheet embedded in this script (search "const css"). If you're using my whole theme, make sure you're using uc-proton.css, since it contains some rules to make this script compatible with my own theme.
// ==/UserScript==

(function () {
    function init() {
        const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm");
        const prefsvc = Services.prefs;
        const gURLBar = this.window.gURLBar;
        const gBrowser = this.window.gBrowser;
        let backBtn = document.getElementById("back-button")?.cloneNode(true);
        let fwdBtn = document.getElementById("forward-button")?.cloneNode(true);
        let reloadBtn = document.getElementById("stop-reload-button")?.cloneNode(true);
        const cTabsBar = document.getElementById("TabsToolbar-customization-target");
        const minHandler = {
            reset: "userChrome.minBrowser.resetOnBlur",
            height: "userChrome.minBrowser.toolbarHeight",
            branch: "userChrome.minBrowser",
            clicking: false,
            handleEvent(e) {
                let switcher = gBrowser._getSwitcher();
                let selectedBrowser = gBrowser.selectedBrowser;
                let selectedTab = gBrowser.selectedTab;
                switch (e.type) {
                    case "mousedown":
                        if (CustomizationHandler.isCustomizing()) break;
                        if (e.button !== 0 || e.shiftKey || e.ctrlKey) return;
                        if (
                            e.target.className.includes("tab-close-button") ||
                            e.target.className.includes("tab-icon-sound") ||
                            e.target.className === "tab-icon-overlay" ||
                            e.target.className === "tab-sharing-icon-overlay"
                        )
                            break;
                        if (e.target === selectedTab || selectedTab.contains(e.target))
                            return (this.clicking = true);
                    case "mouseup":
                        if (CustomizationHandler.isCustomizing()) break;
                        if (e.button !== 0 || e.shiftKey || e.ctrlKey) break;
                        if (this.clicking) {
                            gURLBar.select();
                            gURLBar.view._openPanel();
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            e.stopPropagation();
                            break;
                        }
                        break;
                    case "blur":
                    case "TabSelect":
                        if (CustomizationHandler.isCustomizing()) break;
                        if (switcher?.blankTab || switcher?.loadingTab) break;
                        if (selectedBrowser.userTypedValue) {
                            selectedBrowser._urlbarFocused = false;
                            gURLBar.view.close();
                            gURLBar.blur();
                            gURLBar.inputField.setSelectionRange(0, 0);
                            gURLBar.formatValue();
                            break;
                        }
                    case "TabClose":
                        selectedBrowser._urlbarFocused = false;
                        gURLBar.view.close();
                        gURLBar.view.input.handleRevert();
                        gURLBar.blur();
                        gURLBar.inputField.setSelectionRange(0, 0);
                        gURLBar.formatValue();
                        break;
                    case "unload":
                        gBrowser.tabContainer.removeEventListener("mousedown", this, true);
                        gBrowser.tabContainer.removeEventListener("mouseup", this, true);
                        gBrowser.tabContainer.removeEventListener("TabSelect", this, false);
                        gURLBar.inputField.removeEventListener("blur", this, false);
                        window.removeEventListener("unload", this, false);
                        prefsvc.removeObserver(this.branch, this);
                        this.muObserver.disconnect();
                        CustomizableUI.removeListener(this.cuiListen);
                        return;
                }
                this.clicking = false;
            },
            observe(sub, _top, pref) {
                switch (sub.getPrefType(pref)) {
                    case sub.PREF_BOOL:
                        if (sub.getBoolPref(pref)) {
                            gBrowser.tabContainer.addEventListener("TabSelect", this, false);
                            gBrowser.tabContainer.addEventListener("TabClose", this);
                            gURLBar.inputField.addEventListener("blur", this, false);
                        } else {
                            gBrowser.tabContainer.removeEventListener("TabSelect", this, false);
                            gBrowser.tabContainer.removeEventListener("TabClose", this);
                            gURLBar.inputField.removeEventListener("blur", this, false);
                        }
                        break;
                    case sub.PREF_INT:
                        gNavToolbox.style = `--min-toolbar-height: ${sub.getIntPref(pref)}px`;
                        break;
                }
            },
            muObserver: new MutationObserver(function (mus) {
                for (let mu of mus) {
                    if (CustomizationHandler.isCustomizing()) return;
                    if (gURLBar.textbox.getAttribute("focused") || gURLBar.view.isOpen)
                        gNavToolbox.setAttribute("urlbar-open", true);
                    else gNavToolbox.removeAttribute("urlbar-open");
                }
            }),
            cuiListen: {
                onCustomizeStart() {
                    gNavToolbox.setAttribute("urlbar-open", true);
                },
                onCustomizeEnd() {
                    gNavToolbox.removeAttribute("urlbar-open");
                },
            },
            initialSet() {
                if (!prefsvc.prefHasUserValue(this.reset)) prefsvc.setBoolPref(this.reset, true);
                else this.observe(prefsvc, null, this.reset);
                if (!prefsvc.prefHasUserValue(this.height)) prefsvc.setIntPref(this.height, 39);
                else this.observe(prefsvc, null, this.height);
            },
            attachListeners() {
                gBrowser.tabContainer.addEventListener("mousedown", this, true);
                gBrowser.tabContainer.addEventListener("mouseup", this, true);
                window.addEventListener("unload", this, false);
                prefsvc.addObserver(this.branch, this);
                this.muObserver.observe(gURLBar.textbox, {
                    attributeFilter: ["focused", "open", "usertyping"],
                });
                CustomizableUI.addListener(this.cuiListen);
                this.initialSet();
                this.cuiListen.onCustomizeEnd();
            },
        };

        const css = `#titlebar{-moz-appearance:none!important;-moz-default-appearance:none!important;appearance:none!important;min-height:var(--urlbar-container-height)!important;}:root[sizemode="maximized"] #titlebar{margin-top:7.333px!important;}:root:not([sizemode="fullscreen"]) #min-window-controls #window-controls{display:none;}#navigator-toolbox[urlbar-open] #titlebar{opacity:0!important;max-height:0!important;min-height:0!important;height:0!important;pointer-events:none!important;}#navigator-toolbox:not([urlbar-open]) #nav-bar{opacity:0!important;max-height:0!important;min-height:0!important;height:0!important;pointer-events:none!important;}#urlbar{--urlbar-toolbar-height:var(--urlbar-container-height)!important;}#urlbar-container{--urlbar-container-height:var(--min-toolbar-height)!important;}:root{--min-toolbar-height:39px;}#navigator-toolbox{--min-toolbar-height:39px;--tab-min-height:var(--min-toolbar-height)!important;--urlbar-container-height:var(--min-toolbar-height)!important;}#tabbrowser-tabs[movingtab]{padding-bottom:0!important;margin-bottom:0!important;}#TabsToolbar>.titlebar-spacer{display:none;}.tab-background,.tabbrowser-tab{min-height:0!important;margin:0!important;}#TabsToolbar .toolbarbutton-1>.toolbarbutton-icon,#TabsToolbar .toolbarbutton-1>.toolbarbutton-badge-stack{min-height:16px!important;padding-block:6px!important;}#TabsToolbar .toolbarbutton-1{margin-block:0 0 var(--tabs-navbar-shadow-size)!important;}#min-window-controls>.titlebar-buttonbox-container{margin-bottom:var(--tabs-navbar-shadow-size);}:root:not([uidensity="compact"]) #PanelUI-menu-button{padding-inline-end:2px!important;}`;

        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            ),
            uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));

        const navbar = document.getElementById("nav-bar");
        const ctrlWrapper = document.createElementNS(
            "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
            "hbox"
        );
        const windowCtrls = document
            .getElementsByClassName("titlebar-buttonbox-container")[0]
            .cloneNode(true);
        const fsCtrls = document.getElementById("window-controls").cloneNode(true);

        navbar.appendChild(ctrlWrapper);
        ctrlWrapper.appendChild(windowCtrls);
        ctrlWrapper.appendChild(fsCtrls);
        ctrlWrapper.id = "min-window-controls";
        windowCtrls.hidden = false;
        fsCtrls.hidden = false;

        document.documentElement.setAttribute("min-browser", true);
        minHandler.attachListeners();
        sss.loadAndRegisterSheet(uri, sss.AGENT_SHEET);
        cTabsBar.insertBefore(backBtn, gBrowser.tabContainer);
        backBtn.after(fwdBtn);
        fwdBtn.after(reloadBtn);
        for (let name of ["click", "mousedown", "keypress"]) {
            backBtn.addEventListener(name, gClickAndHoldListenersOnElement);
            fwdBtn.addEventListener(name, gClickAndHoldListenersOnElement);
        }
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
