// ==UserScript==
// @name           One-click One-off Search Buttons
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until recently these functions could be overridden with a preference in about:config, but those settings were removed, e.g. browser.urlbar.update2.disableOneOffsHorizontalKeyNavigation. This script restores the old functionality. If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: userChrome.urlbar.oneOffs.keyNavigation. This script also has some conditional functions to work together with scrollingOneOffs.uc.js. They don't require each other at all, but they heavily improve each other both functionally and visually. Changing search engines with the arrow keys will scroll the one-offs container to keep the selected one-off button in view. And exiting the query in any way will automatically scroll back to the beginning of the one-offs container, so that it's reset for the next time you use it. It's hard to explain exactly what's going on so for now I'll just say to try them out yourself. The script also hides the one-off search settings button, but this can be turned off in about:config with userChrome.urlbar.oneOffs.hideSettingsButton.
// ==/UserScript==

(() => {
    function init() {
        const prefsvc = Services.prefs;
        const keyNavPref = "userChrome.urlbar.oneOffs.keyNavigation"; // change this in about:config if you don't want the arrow keys to switch between one-off search engine buttons.
        const hideSettingsPref = "userChrome.urlbar.oneOffs.hideSettingsButton"; // change this in about:config if you don't want to disable the search settings button.
        const branch = "userChrome.urlbar.oneOffs";
        let oneOffs = gURLBar.view.oneOffSearchButtons;
        let keyNav = true;
        let handler = {
            handleEvent(e) {
                if (e.type === "unload") {
                    window.removeEventListener("unload", this, false);
                    prefsvc.removeObserver(branch, this);
                    gURLBar.inputField.removeEventListener("keydown", this, false);
                    return;
                }
                if (!gURLBar.view.isOpen || oneOffs.selectedButton || !keyNav) return;
                if (
                    !oneOffs.input.value ||
                    oneOffs.input.getAttribute("pageproxystate") === "valid"
                )
                    return;
                if (e.keyCode === KeyboardEvent.DOM_VK_LEFT) {
                    oneOffs.advanceSelection(false, oneOffs.compact, true);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
                if (e.keyCode === KeyboardEvent.DOM_VK_RIGHT) {
                    oneOffs.advanceSelection(true, oneOffs.compact, true);
                    e.preventDefault();
                    e.stopImmediatePropagation();
                }
            },
            observe(sub, _top, pref) {
                if (pref.includes("keyNavigation")) {
                    if (sub.getBoolPref(pref)) {
                        oneOffs.disableOneOffsHorizontalKeyNavigation = false;
                        keyNav = true;
                    } else {
                        oneOffs.disableOneOffsHorizontalKeyNavigation = true;
                        keyNav = false;
                    }
                } else if (pref.includes("hideSettingsButton"))
                    toggleSettingsButton(sub.getBoolPref(pref));
            },
            setPrefs() {
                if (!prefsvc.prefHasUserValue(keyNavPref)) prefsvc.setBoolPref(keyNavPref, true);
                else this.observe(prefsvc, null, keyNavPref);
                if (!prefsvc.prefHasUserValue(hideSettingsPref))
                    prefsvc.setBoolPref(hideSettingsPref, true);
                else this.observe(prefsvc, null, hideSettingsPref);
            },
            attachListeners() {
                window.addEventListener("unload", this, false);
                prefsvc.addObserver(branch, this);
                gURLBar.inputField.addEventListener("keydown", this, false);
            },
        };

        function rectX(el) {
            return el.getBoundingClientRect().x;
        }

        function parseWidth(el) {
            let style = window.getComputedStyle(el),
                width = el.clientWidth,
                margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight),
                padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight),
                border = parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
            return width + margin + padding + border;
        }

        function toggleSettingsButton(hide) {
            if (hide) {
                oneOffs.getSelectableButtons = function getSelectableButtons(
                    aIncludeNonEngineButtons
                ) {
                    let buttons = [];
                    for (
                        let oneOff = this.buttons.firstElementChild;
                        oneOff;
                        oneOff = oneOff.nextElementSibling
                    )
                        buttons.push(oneOff);

                    if (aIncludeNonEngineButtons) {
                        for (
                            let addEngine = this.addEngines.firstElementChild;
                            addEngine;
                            addEngine = addEngine.nextElementSibling
                        )
                            buttons.push(addEngine);
                    }
                    return buttons;
                };
                oneOffs.settingsButtonCompact.style.display = "none";
                oneOffs.settingsButton.style.display = "none";
            } else {
                oneOffs.getSelectableButtons = Object.getPrototypeOf(
                    gURLBar.view.oneOffSearchButtons
                ).getSelectableButtons;
                oneOffs.settingsButtonCompact.style.removeProperty("display");
                oneOffs.settingsButton.style.removeProperty("display");
            }
        }

        oneOffs.handleSearchCommand = function handleSearchCommand(event, searchMode) {
            if (this.selectedButton == this.view.oneOffSearchButtons.settingsButtonCompact) {
                this.input.controller.engagementEvent.discard();
                this.selectedButton.doCommand();
                return;
            }

            let startQueryParams = {
                allowAutofill:
                    !searchMode.engineName && searchMode.source != UrlbarUtils.RESULT_SOURCE.SEARCH,
                event,
            };

            let userTypedSearchString =
                this.input.value && this.input.getAttribute("pageproxystate") != "valid";
            let engine = Services.search.getEngineByName(searchMode.engineName);

            let { where, params } = this._whereToOpen(event);

            if (userTypedSearchString && engine) {
                this.input.handleNavigation({
                    event,
                    oneOffParams: {
                        openWhere: where,
                        openParams: params,
                        engine: this.selectedButton.engine,
                    },
                });
                this.selectedButton = null;
                if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue)
                    this.container.scrollTo(0, 0);
                return;
            }

            switch (where) {
                case "current": {
                    this.input.searchMode = searchMode;
                    this.input.startQuery(startQueryParams);
                    break;
                }
                case "tab": {
                    searchMode.isPreview = false;
                    let newTab = this.input.window.gBrowser.addTrustedTab("about:newtab");
                    this.input.setSearchMode(searchMode, newTab.linkedBrowser);
                    if (userTypedSearchString) {
                        newTab.linkedBrowser.userTypedValue = this.input.value;
                    }
                    if (!params?.inBackground) {
                        this.input.window.gBrowser.selectedTab = newTab;
                        newTab.ownerGlobal.gURLBar.startQuery(startQueryParams);
                    }
                    break;
                }
                default: {
                    this.input.searchMode = searchMode;
                    this.input.startQuery(startQueryParams);
                    this.input.select();
                    break;
                }
            }
            this.selectedButton = null;
            if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue)
                this.container.scrollTo(0, 0);
        };

        oneOffs.scrollToButton = function scrollToButton(el) {
            let slider = el.parentElement;
            let buttonX = rectX(el) - rectX(slider);
            let midpoint = this.container.clientWidth / 2;
            this.container.scrollTo({
                left: buttonX - midpoint,
                behavior: "auto",
            });
        };

        oneOffs.advanceSelection = function advanceSelection(
            aForward,
            aIncludeNonEngineButtons,
            aWrapAround
        ) {
            let buttons = this.getSelectableButtons(aIncludeNonEngineButtons);
            let index;
            if (this.selectedButton) {
                let inc = aForward ? 1 : -1;
                let oldIndex = buttons.indexOf(this.selectedButton);
                index = (oldIndex + inc + buttons.length) % buttons.length;
                if (
                    !aWrapAround &&
                    ((aForward && index <= oldIndex) || (!aForward && oldIndex <= index))
                )
                    index = -1;
            } else index = aForward ? 0 : buttons.length - 1;
            this.selectedButton = index < 0 ? null : buttons[index];
            if (this.canScroll)
                if (this.selectedButton) this.scrollToButton(this.selectedButton);
                else this.container.scrollTo(0, 0);
        };

        oneOffs.onViewOpen = function onViewOpen() {
            this._on_popupshowing();
            if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue)
                this.container.scrollTo(0, 0);
        };

        oneOffs.onViewClose = function onViewClose() {
            this._on_popuphidden();
            if (this.canScroll && !gURLBar.searchMode) this.container.scrollTo(0, 0);
        };

        Object.defineProperty(oneOffs, "query", {
            set: function (val) {
                this._query = val;
                if (this.isViewOpen) {
                    let isOneOffSelected =
                        this.selectedButton &&
                        this.selectedButton.classList.contains("searchbar-engine-one-off-item");
                    if (this.selectedButton && !isOneOffSelected) this.selectedButton = null;
                    if (this.canScroll && !gURLBar.searchMode) this.container.scrollTo(0, 0);
                }
            },
            get: function () {
                return this._query;
            },
        });

        handler.attachListeners();
        handler.setPrefs();
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
