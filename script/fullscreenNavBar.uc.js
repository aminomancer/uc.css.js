// ==UserScript==
// @name           Fullscreen Nav-bar
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. Those are posted here in my stylesheets but you can also do your own thing with selectors like box[popup-status="true"] > #navigator-toolbox > whatever
// ==/UserScript==

(() => {
    function init() {
        const mainPopupSet = document.getElementById("mainPopupSet");
        const navBar = document.getElementById("navigator-toolbox");
        const navBarContainer = navBar.parentElement;
        const urlbar = document.getElementById("urlbar");
        const backButton = document.getElementById("back-button");
        const fwdButton = document.getElementById("forward-button");

        const fullscreenHandler = {
            handleEvent(event) {
                if (event.target.tagName === "tooltip") return;
                switch (event.target.id) {
                    case "contentAreaContextMenu":
                    case "sidebarMenu-popup":
                    case "ctrlTab-panel":
                    case "SyncedTabsSidebarContext":
                    case "SyncedTabsSidebarTabsFilterContext":
                    case "urlbar-scheme":
                    case "urlbar-input":
                    case "urlbar-label-box":
                    case "urlbar-search-mode-indicator":
                    case "pageActionContextMenu":
                    case "confirmation-hint":
                        return;
                    case "backForwardMenu":
                        if (backButton.disabled && fwdButton.disabled) return;
                    case "":
                        if (event.target.hasAttribute("menu-api")) return;
                }
                switch (event.type) {
                    case "popupshowing":
                        navBarContainer.setAttribute("popup-status", true);
                        break;
                    case "popuphiding":
                        if (event.target.className === "urlbarView") return;
                        if (
                            event.target.parentElement.tagName === "menu" &&
                            event.target.parentElement.parentElement.tagName !== "menubar"
                        )
                            return;
                        navBarContainer.removeAttribute("popup-status");
                        break;
                }
            },

            urlbarCallback(mutationsList, _observer) {
                for (const _mutation of mutationsList) {
                    if (urlbar.getAttribute("focused"))
                        navBarContainer.setAttribute("urlbar-status", true);
                    else navBarContainer.removeAttribute("urlbar-status");
                }
            },
        };
        const observer = new MutationObserver(fullscreenHandler.urlbarCallback);

        observer.observe(urlbar, { attributes: true, attributeFilter: ["focused"] });
        mainPopupSet.addEventListener("popupshowing", fullscreenHandler, true);
        mainPopupSet.addEventListener("popuphiding", fullscreenHandler, true);
        navBar.addEventListener("popupshowing", fullscreenHandler, true);
        navBar.addEventListener("popuphiding", fullscreenHandler, true);
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
