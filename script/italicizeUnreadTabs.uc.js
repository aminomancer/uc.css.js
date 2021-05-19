// ==UserScript==
// @name           Italicize Unread Tabs
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Modifies some javascript methods so that unread tabs can be styled in CSS. Normally when you open a new tab without it being selected, it gains the attribute "notselectedsinceload" which could be used to style it. But this attribute doesn't go away when you select the tab, so it doesn't actually mean "unread." It doesn't go away until you navigate to a new page in the tab. But we can change this so it will go away immediately as soon as you click it. Also, normally the attribute isn't added until web progress has finished, so it won't turn italic until after it's finished loading a bit. This doesn't look as good so we're also changing it to add the attribute as soon as the tab is created. So now all you need to do to style unread tabs is add something like this to your userchrome.css file:
// .tabbrowser-tab[notselectedsinceload]:not([pending]:not([busy])) { font-style: italic !important; }
// ==/UserScript==

(function () {
    document.documentElement.setAttribute("italic-unread-tabs", true);
    function init() {
        gBrowser.tabContainer._handleTabSelect = function (aInstant) {
            let selectedTab = this.selectedItem;
            if (this.getAttribute("overflow") == "true")
                this.arrowScrollbox.ensureElementIsVisible(selectedTab, aInstant);
            selectedTab._notselectedsinceload = false;
            selectedTab.removeAttribute("notselectedsinceload");
        };

        gBrowser.tabContainer._handleNewTab = function (tab) {
            if (tab.container != this) return;
            tab._fullyOpen = true;
            gBrowser.tabAnimationsInProgress--;
            this._updateCloseButtons();
            if (tab.getAttribute("selected") == "true") this._handleTabSelect();
            else {
                tab._notselectedsinceload = true;
                tab.setAttribute("notselectedsinceload", true);
                if (!tab.hasAttribute("skipbackgroundnotify")) this._notifyBackgroundTab(tab);
            }
            this.arrowScrollbox._updateScrollButtonsDisabledState();
            if (tab.linkedPanel) NewTabPagePreloading.maybeCreatePreloadedBrowser(window);

            if (UserInteraction.running("browser.tabs.opening", window))
                UserInteraction.finish("browser.tabs.opening", window);
        };
    }

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
