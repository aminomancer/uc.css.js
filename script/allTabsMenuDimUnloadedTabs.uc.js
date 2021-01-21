// ==UserScript==
// @name           Dim unloaded tabs in the "allTabsMenu"
// @homepage       https://github.com/aminomancer
// @description    Next to the "new tab" button in Firefox there's a V-shaped button that opens a big scrolling menu containing all the tabs. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. But the "all tabs" menu doesn't give tabs the same attribute, so CSS alone can't distinguish running tabs from unloaded or "discarded" tabs. We use a lightweight script to calculate each tab's loadedness upon receiving events that are likely to load/unload a tab, and set an attribute on each tab accordingly, with which we can style the tabs in CSS: .all-tabs-item[pending] {opacity: .6}
// @author         aminomancer
// ==/UserScript==
(function () {
    let tab,
        timer,
        observer = new MutationObserver(delayedChange),
        options = {
            attributes: true,
            attributeFilter: ["pending", "busy"],
        };

    function contextCmd(e) {
        observer.disconnect();
        if (gTabsPanel.allTabsPanel.view.panelMultiView) {
            tab = TabContextMenu.contextTab;
            observer.observe(tab, options);
        }
    }

    function delayedChange(mus) {
        for (let mu of mus) {
            setOpacity();
            window.clearTimeout(timer);
            timer = window.setTimeout(() => {
                observer.disconnect();
            }, 3000);
        }
    }

    function setOpacity() {
        let tabs = gTabsPanel.allTabsViewTabs.children;
        for (let i = 0; i < tabs.length; i++) {
            tabs[i].tab.linkedPanel
                ? tabs[i].removeAttribute("pending")
                : tabs[i].setAttribute("pending", "true");
        }
    }

    function start() {
        gTabsPanel.init();
        gTabsPanel.allTabsView.addEventListener("ViewShowing", setOpacity);
        document.getElementById("tabContextMenu").addEventListener("command", contextCmd, true);
    }

    if (gBrowserInit.delayedStartupFinished) {
        start();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                start();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
