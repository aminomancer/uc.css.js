// ==UserScript==
// @name           oneClickOneOffSearchButtons.uc.js
// @homepage       https://github.com/aminomancer
// @description    Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until recently these functions could be overridden with a preference in about:config, but those settings were removed, e.g. browser.urlbar.update2.disableOneOffsHorizontalKeyNavigation. This script restores the old functionality. If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: userChrome.urlbar.update2.disableOneOffsHorizontalKeyNavigation
// @author         aminomancer
// ==/UserScript==

(() => {
    function init() {
        const prefsvc = Services.prefs;
        const keyNavPref = "userChrome.urlbar.update2.disableOneOffsHorizontalKeyNavigation";
        let oneOffs = gURLBar.view.oneOffSearchButtons;
        let keyNav = true;
        let handler = {
            handleEvent(e) {
                if (!gURLBar.view.isOpen || oneOffs.selectedButton || !keyNav) return;
                if (!oneOffs.input.value || oneOffs.input.getAttribute("pageproxystate") === "valid") return;
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
            observe(_sub, _top, pref) {
                if (prefsvc.getBoolPref(pref)) {
                    oneOffs.disableOneOffsHorizontalKeyNavigation = false;
                    keyNav = true;
                } else {
                    oneOffs.disableOneOffsHorizontalKeyNavigation = true;
                    keyNav = false;
                }
            },
            async prefSet(pref, val) {
                return prefsvc.setBoolPref(pref, val); // but you promised~...
            },
            async setKeyNavPref() {
                try {
                    this.observe(null, null, keyNavPref); // will reliably throw if the pref hasn't already been made, so we can use try/catch like if/else
                } catch (e) {
                    await this.prefSet(keyNavPref, true); // create the pref if it doesn't already exist...
                    this.observe(null, null, keyNavPref); // then pass the new pref to the function
                }
            },
            attachListeners() {
                window.addEventListener("unload", this.destroyListeners, false);
                prefsvc.addObserver(keyNavPref, this);
                gURLBar.inputField.addEventListener("keydown", this, false);
            },
            destroyListeners() {
                window.removeEventListener("unload", this.destroyListeners, false);
                prefsvc.removeObserver(keyNavPref, this);
                gURLBar.inputField.removeEventListener("keydown", this, false);
            },
        };
        gURLBar.view.oneOffSearchButtons.handleSearchCommand = function handleSearchCommand(event, searchMode) {
            // The settings button is a special case. Its action should be executed
            // immediately.
            if (
              this.selectedButton == this.view.oneOffSearchButtons.settingsButtonCompact
            ) {
              this.input.controller.engagementEvent.discard();
              this.selectedButton.doCommand();
              return;
            }
        
            // We allow autofill in local but not remote search modes.
            let startQueryParams = {
              allowAutofill:
                !searchMode.engineName &&
                searchMode.source != UrlbarUtils.RESULT_SOURCE.SEARCH,
              event,
            };
        
            let userTypedSearchString =
              this.input.value && this.input.getAttribute("pageproxystate") != "valid";
            let engine = Services.search.getEngineByName(searchMode.engineName);
        
            let { where, params } = this._whereToOpen(event);
        
            // Some key combinations should execute a search immediately. We handle
            // these here, outside the switch statement.
            if (
              userTypedSearchString &&
              engine
            ) {
              this.input.handleNavigation({
                event,
                oneOffParams: {
                  openWhere: where,
                  openParams: params,
                  engine: this.selectedButton.engine,
                },
              });
              this.selectedButton = null;
              return;
            }
        
            // Handle opening search mode in either the current tab or in a new tab.
            switch (where) {
              case "current": {
                this.input.searchMode = searchMode;
                this.input.startQuery(startQueryParams);
                break;
              }
              case "tab": {
                // We set this.selectedButton when switching tabs. If we entered search
                // mode preview here, it could be cleared when this.selectedButton calls
                // setSearchMode.
                searchMode.isPreview = false;
        
                let newTab = this.input.window.gBrowser.addTrustedTab("about:newtab");
                this.input.setSearchMode(searchMode, newTab.linkedBrowser);
                if (userTypedSearchString) {
                  // Set the search string for the new tab.
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
          }

        handler.setKeyNavPref();
        handler.attachListeners();
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
