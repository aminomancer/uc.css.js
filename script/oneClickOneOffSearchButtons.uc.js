// ==UserScript==
// @name           oneClickOneOffSearchButtons.uc.js
// @homepage       https://github.com/aminomancer
// @description    Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. Until recently this could be overridden with a preference in about:config, but that setting was removed. This script simply restores the old functionality.
// @author         aminomancer
// ==/UserScript==

(() => {
    function init() {
        var oneOffs = gURLBar.view.oneOffSearchButtons,
            buttons = oneOffs.buttons,
            buttonsList = buttons.children;
        let observer = new MutationObserver(listenAll),
            options = {
                childList: true,
                subtree: true,
            };

        observer.observe(buttons, options);

        function listenAll(mutations) {
            for (let mutation of mutations) {
                switch (mutation.type) {
                    case "childList":
                    case "subtree":
                        // setTimeout(() => {
                        for (let i = 0; i < buttonsList.length; i++) {
                            if (buttonsList[i].getAttribute("listening") != "true") {
                                buttonsList[i].addEventListener(
                                    "click",
                                    searchClickCallback,
                                    false
                                );
                                buttonsList[i].setAttribute("listening", "true");
                            }
                        }
                        // }, 100);
                        break;
                }
            }
        }

        function searchClickCallback(event) {
            if (event.button == 2) {
                return;
            }

            let button = event.originalTarget;
            if (!button.engine && !button.source) {
                return;
            }

            oneOffs.selectedButton = button;
            executeSearchOnClick(event, {
                engineName: button.engine?.name,
                source: button.source,
                entry: "oneoff",
            });
            event.stopImmediatePropagation();
            event.preventDefault();
        }

        function executeSearchOnClick(event, searchMode) {
            // The settings button is a special case. Its action should be executed
            // immediately.
            if (event.target == oneOffs.settingsButtonCompact) {
                oneOffs.input.controller.engagementEvent.discard();
                oneOffs.selectedButton.doCommand();
                return;
            }

            let startQueryParams = {
                    allowAutofill:
                        !searchMode.engineName &&
                        searchMode.source != UrlbarUtils.RESULT_SOURCE.SEARCH,
                    event,
                },
                userTypedSearchString =
                    oneOffs.input.value && oneOffs.input.getAttribute("pageproxystate") != "valid",
                engine = Services.search.getEngineByName(searchMode.engineName),
                { where, params } = oneOffs._whereToOpen(event);
            // { where, params } = oneOffs.input._whereToOpen(event);

            if (userTypedSearchString && engine) {
                oneOffs.input.handleNavigation({
                    event,
                    oneOffParams: {
                        openWhere: where,
                        openParams: params,
                        engine: oneOffs.selectedButton.engine,
                    },
                });
                oneOffs.selectedButton = null;
                return;
            }

            switch (where) {
                case "current": {
                    oneOffs.input.searchMode = searchMode;
                    oneOffs.input.startQuery(startQueryParams);
                    break;
                }
                case "tab": {
                    // We set this.selectedButton when switching tabs. If we entered search
                    // mode preview here, it could be cleared when this.selectedButton calls
                    // setSearchMode.
                    searchMode.isPreview = false;

                    let newTab = oneOffs.input.window.gBrowser.addTrustedTab("about:newtab");
                    oneOffs.input.setSearchMode(searchMode, newTab.linkedBrowser);
                    if (userTypedSearchString) {
                        // Set the search string for the new tab.
                        newTab.linkedBrowser.userTypedValue = oneOffs.input.value;
                    }
                    if (!params?.inBackground) {
                        oneOffs.input.window.gBrowser.selectedTab = newTab;
                        newTab.ownerGlobal.gURLBar.startQuery(startQueryParams);
                    }
                    break;
                }
                default: {
                    oneOffs.input.searchMode = searchMode;
                    oneOffs.input.startQuery(startQueryParams);
                    oneOffs.input.select();
                    break;
                }
            }

            oneOffs.selectedButton = null;
        }
    }

    // Delayed startup
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
