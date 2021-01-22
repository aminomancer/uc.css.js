(function () {
    var mainPopupSet = document.getElementById("mainPopupSet");
    var navBar = document.getElementById("navigator-toolbox");
    var navBarContainer = navBar.parentElement;
    var urlbar = document.getElementById("urlbar");
    var backButton = document.getElementById("back-button");
    var fwdButton = document.getElementById("forward-button");
    const options = {
        attributes: true,
        attributeFilter: ["focused"],
    };
    const observer = new MutationObserver(urlbarCallback);

    function popupShowing(event) {
        switch (event.target.id) {
            case "contentAreaContextMenu":
            case "aHTMLTooltip":
            case "remoteBrowserTooltip":
            case "sidebarMenu-popup":
            case "ctrlTab-panel":
            case "dynamic-shortcut-tooltip":
            case "SyncedTabsSidebarContext":
            case "SyncedTabsSidebarTabsFilterContext":
            case "urlbar-scheme":
            case "urlbar-input":
            case "urlbar-label-box":
            case "urlbar-search-mode-indicator":
            case "tracking-protection-icon-tooltip":
            case "tabbrowser-tab-tooltip":
            case "pageActionContextMenu":
            case "confirmation-hint":
                break;
            case "backForwardMenu":
                if (backButton.disabled == true && fwdButton.disabled == true) {
                    break;
                } else {
                    navBarContainer.setAttribute("popup-status", "true");
                }
            case "":
                if (event.target.hasAttribute("menu-api")) {
                    break;
                }
            default:
                navBarContainer.setAttribute("popup-status", "true");
        }
    }

    function popupHiding(event) {
        switch (event.target.id) {
            case "contentAreaContextMenu":
            case "aHTMLTooltip":
            case "remoteBrowserTooltip":
            case "sidebarMenu-popup":
            case "ctrlTab-panel":
            case "dynamic-shortcut-tooltip":
            case "SyncedTabsSidebarContext":
            case "SyncedTabsSidebarTabsFilterContext":
            case "urlbar-scheme":
            case "urlbar-input":
            case "urlbar-label-box":
            case "urlbar-search-mode-indicator":
            case "tracking-protection-icon-tooltip":
            case "tabbrowser-tab-tooltip":
            case "pageActionContextMenu":
            case "confirmation-hint":
                break;
            case "backForwardMenu":
                if (backButton.disabled == true && fwdButton.disabled == true) {
                    break;
                } else {
                    navBarContainer.removeAttribute("popup-status");
                }
            case "":
                if (event.target.hasAttribute("menu-api")) {
                    break;
                }
            default:
                if (event.target.className != "urlbarView") {
                    if (
                        event.target.parentElement.tagName != "menu" ||
                        event.target.parentElement.parentElement.tagName == "menubar"
                    ) {
                        navBarContainer.removeAttribute("popup-status");
                    }
                }
        }
    }

    function urlbarCallback(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === "attributes") {
                if (urlbar.getAttribute("focused") == "true") {
                    navBarContainer.setAttribute("urlbar-status", "true");
                } else {
                    navBarContainer.removeAttribute("urlbar-status");
                }
            }
        }
    }

    observer.observe(urlbar, options);
    mainPopupSet.addEventListener("popupshowing", popupShowing, true);
    mainPopupSet.addEventListener("popuphiding", popupHiding, true);
    navBar.addEventListener("popupshowing", popupShowing, true);
    navBar.addEventListener("popuphiding", popupHiding, true);
})();
