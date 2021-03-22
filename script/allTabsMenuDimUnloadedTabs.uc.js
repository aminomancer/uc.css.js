// ==UserScript==
// @name           Dim unloaded tabs in the "allTabsMenu"
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a big scrolling menu containing all the tabs. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. But the "all tabs" menu doesn't give tabs the same attribute, so CSS alone can't distinguish running tabs from unloaded or "discarded" tabs. We use a lightweight script to calculate each tab's loadedness upon receiving events that are likely to load/unload a tab, and set an attribute on each tab accordingly, with which we can style the tabs in CSS: .all-tabs-item[pending] {opacity: .6} This now additionally adds attributes to multiselected tabs and container tabs. You can use these attributes to style the tabs too. See the end of uc-tabs-bar.css for an example where I've added a color stripe to indicate multiselected or container tabs.
// @author         aminomancer
// ==/UserScript==
(function () {
    let tab;
    let timer;
    let tabContext = document.getElementById("tabContextMenu");
    let observer = new MutationObserver(delayedUpdate);

    function contextCmd(_e) {
        observer.disconnect();
        if (gTabsPanel.allTabsPanel.view.panelMultiView) {
            tab = TabContextMenu.contextTab;
            observer.observe(tab, {
                attributes: true,
                attributeFilter: ["pending", "busy"],
            });
        }
    }

    function tabUpdated(_e) {
        if (gTabsPanel.allTabsPanel.view.panelMultiView) {
            updateTabItems();
        }
    }

    function contextHide(_e) {
        if (gTabsPanel.allTabsPanel.view.panelMultiView) delayedDisconnect();
    }

    function delayedUpdate(mus) {
        for (const _mu of mus) {
            updateTabItems();
            delayedDisconnect();
        }
    }

    function delayedDisconnect() {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            observer.disconnect();
        }, 3000);
    }

    function updateTabItems() {
        Array.from(gTabsPanel.allTabsViewTabs.children).forEach((item) => {
            item.tab.linkedPanel
                ? item.removeAttribute("pending")
                : item.setAttribute("pending", "true");
            item.tab.multiselected
                ? item.setAttribute("multiselected", "true")
                : item.removeAttribute("multiselected");
            if (item.tab.userContextId) {
                let idColor = ContextualIdentityService.getPublicIdentityFromId(
                    item.tab.userContextId
                )?.color;
                item.className = `all-tabs-item identity-color-${idColor}`;
                item.setAttribute("usercontextid", item.tab.userContextId);
            } else {
                item.className = "all-tabs-item";
                item.removeAttribute("usercontextid");
            }
        });
    }

    function attachContextListeners() {
        tabContext.addEventListener("command", contextCmd, true);
        tabContext.addEventListener("popuphidden", contextHide, false);
    }

    function reallyStart() {
        gBrowser.tabContainer.addEventListener("TabAttrModified", tabUpdated, false);
        gBrowser.addEventListener("TabMultiSelect", tabUpdated, false);
        tabContext.addEventListener("popupshowing", attachContextListeners, { once: true });
    }

    function start() {
        gTabsPanel.init();
        gTabsPanel.allTabsView.addEventListener("ViewShowing", reallyStart, { once: true });
        gTabsPanel.allTabsView.addEventListener("ViewShowing", updateTabItems);
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
