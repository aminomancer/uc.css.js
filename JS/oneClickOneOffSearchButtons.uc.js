// ==UserScript==
// @name           One-click One-off Search Buttons
// @version        1.8.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Restore old behavior for one-off search engine buttons. It
// used to be that, if you entered a search term in the url bar, clicking a
// search engine button would immediately execute a search with that engine.
// This was changed in an update so that clicking the buttons only changes the
// "active" engine — you still have to press enter to actually execute the
// search. You also used to be able to advance through your one-off search
// engine buttons by pressing left/right arrow keys. Until recently these
// functions could be overridden with a preference in about:config, but those
// settings were removed, e.g. browser.urlbar.update2.disableOneOffsHorizontalKeyNavigation.
// This script restores the old functionality. If you want to restore the
// one-click functionality but don't want the horizontal key navigation, go to
// about:config and toggle this custom setting to false:
// userChrome.urlbar.oneOffs.keyNavigation. This script also has some
// conditional functions to work together with scrollingOneOffs.uc.js. They
// don't require each other at all, but they heavily improve each other both
// functionally and visually. Changing search engines with the arrow keys will
// scroll the one-offs container to keep the selected one-off button in view.
// And exiting the query in any way will automatically scroll back to the
// beginning of the one-offs container, so that it's reset for the next time you
// use it. It's hard to explain exactly what's going on so for now I'll just say
// to try them out yourself. The script also hides the one-off search settings
// button, but this can be turned off in about:config with
// userChrome.urlbar.oneOffs.hideSettingsButton.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  // change this in about:config if you don't want the arrow keys
  // to switch between one-off search engine buttons.
  const keyNavPref = "userChrome.urlbar.oneOffs.keyNavigation";
  // change this in about:config if you don't want to disable the search settings button.
  const hideSettingsPref = "userChrome.urlbar.oneOffs.hideSettingsButton";
  // change this in about:config if you want arrow keys to ONLY cycle through
  // urlbar results, rather than cycling through search engines and urlbar
  // results. e.g. if you press arrow up after clicking the urlbar, normally it
  // would select the last search engine rather than the last urlbar result. if
  // this pref is set to true it will skip all the search engines and just go
  // straight to the urlbar results.
  const skipOneOffsPref = "userChrome.urlbar.oneOffs.skipOneOffsOnArrowKey";

  const prefsvc = Services.prefs;
  const branch = "userChrome.urlbar.oneOffs";

  function init() {
    let oneOffs = gURLBar.view.oneOffSearchButtons;
    let searchbar = document.getElementById("PopupSearchAutoComplete");
    let searchbarOneOffs = searchbar.oneOffButtons;
    let handler = {
      handleEvent(e) {
        if (e.type === "unload") {
          window.removeEventListener("unload", this);
          prefsvc.removeObserver(branch, this);
        }
      },
      observe(sub, _top, pref) {
        switch (pref) {
          case keyNavPref:
            searchbarOneOffs.disableOneOffsHorizontalKeyNavigation = oneOffs.disableOneOffsHorizontalKeyNavigation = !sub.getBoolPref(
              pref
            );
            break;
          case hideSettingsPref:
            toggleSettingsButton(sub.getBoolPref(pref));
            break;
          case skipOneOffsPref:
            toggleKeyNavCallback(sub.getBoolPref(pref));
            break;
        }
      },
      attachListeners() {
        window.addEventListener("unload", this);
        prefsvc.addObserver(branch, this);
        this.observe(prefsvc, null, keyNavPref);
        this.observe(prefsvc, null, hideSettingsPref);
        this.observe(prefsvc, null, skipOneOffsPref);
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
        SearchOneOffs.prototype.getSelectableButtons = function() {
          return [...this.buttons.querySelectorAll(".searchbar-engine-one-off-item")];
        };
        for (let instance of [oneOffs, searchbarOneOffs]) {
          instance.settingsButton.style.display = "none";
        }
      } else {
        SearchOneOffs.prototype.getSelectableButtons = function(aIncludeNonEngineButtons) {
          const buttons = [...this.buttons.querySelectorAll(".searchbar-engine-one-off-item")];
          if (aIncludeNonEngineButtons) buttons.push(this.settingsButton);
          return buttons;
        };
        for (let instance of [oneOffs, searchbarOneOffs]) {
          instance.settingsButton.style.removeProperty("display");
        }
      }
    }
    function toggleKeyNavCallback(disable) {
      if (disable) {
        const lazy = { UrlbarUtils };
        eval(
          `gURLBar.view.controller.handleKeyNavigation = function ` +
            gURLBar.view.controller.handleKeyNavigation
              .toSource()
              .replace(/(this\.\_lastQueryContextWrapper)/, `$1 && this.allowOneOffKeyNav`)
        );
      } else {
        delete gURLBar.view.controller.handleKeyNavigation;
      }
    }

    oneOffs.slider = oneOffs.buttons.parentElement;
    searchbarOneOffs.slider = searchbarOneOffs.buttons.parentElement;
    oneOffs.handleSearchCommand = function(event, searchMode) {
      if (
        this.selectedButton == this.view.oneOffSearchButtons.settingsButton ||
        this.selectedButton.classList.contains("searchbar-engine-one-off-add-engine")
      ) {
        this.input.controller.engagementEvent.discard();
        this.selectedButton.doCommand();
        this.selectedButton = null;
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
        if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue) {
          this.slider.scrollTo(0, 0);
        }
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
      if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue) {
        this.slider.scrollTo(0, 0);
      }
    };
    oneOffs.scrollToButton = function(el) {
      if (!el) el = oneOffs.buttons.firstElementChild;
      let { slider } = this;
      if (!slider) return;
      let buttonX = rectX(el) - rectX(slider.firstElementChild);
      let buttonWidth = parseWidth(el);
      let midpoint = slider.clientWidth / 2;
      slider.scrollTo({
        left: buttonX + buttonWidth / 2 - midpoint,
        behavior: "auto",
      });
    };
    oneOffs.advanceSelection = function(aForward, aIncludeNonEngineButtons, aWrapAround) {
      let buttons = this.getSelectableButtons(aIncludeNonEngineButtons);
      let index;
      if (this.selectedButton) {
        let inc = aForward ? 1 : -1;
        let oldIndex = buttons.indexOf(this.selectedButton);
        index = (oldIndex + inc + buttons.length) % buttons.length;
        if (!aWrapAround && ((aForward && index <= oldIndex) || (!aForward && oldIndex <= index))) {
          index = -1;
        }
      } else {
        index = aForward ? 0 : buttons.length - 1;
      }
      this.selectedButton = index < 0 ? null : buttons[index];
      if (this.canScroll) {
        if (this.selectedButton) this.scrollToButton(this.selectedButton);
        else this.slider.scrollTo(0, 0);
      }
    };
    oneOffs.onViewOpen = function onViewOpen() {
      this._on_popupshowing();
      if (this.canScroll && !gURLBar.searchMode && !this.window.gBrowser.userTypedValue) {
        this.slider.scrollTo(0, 0);
      }
    };
    oneOffs.onViewClose = function onViewClose() {
      this._on_popuphidden();
      if (this.canScroll && !gURLBar.searchMode) this.slider.scrollTo(0, 0);
    };
    Object.defineProperty(oneOffs, "query", {
      set(val) {
        this._query = val;
        if (this.isViewOpen) {
          let isOneOffSelected =
            this.selectedButton &&
            this.selectedButton.classList.contains("searchbar-engine-one-off-item") &&
            !(this.selectedButton == this.settingsButton && this.hasAttribute("is_searchbar"));
          if (this.selectedButton && !isOneOffSelected) this.selectedButton = null;
          if (this.canScroll && !gURLBar.searchMode) this.slider.scrollTo(0, 0);
        }
      },
      get() {
        return this._query;
      },
    });
    if (SearchOneOffs.prototype._handleKeyDown.name) {
      eval(
        `SearchOneOffs.prototype._handleKeyDown = function ` +
          SearchOneOffs.prototype._handleKeyDown
            .toSource()
            .replace(/_handleKeyDown/, "")
            .replace(/this\.selectedButton &&\n\s*this\.selectedButton\.engine &&\n\s*/g, "")
      );
    }
    handler.attachListeners();
  }

  [
    { token: keyNavPref, default: true },
    { token: hideSettingsPref, default: true },
    { token: skipOneOffsPref, default: false },
  ].forEach(pref => {
    // create prefs early if they don't exist
    if (!prefsvc.prefHasUserValue(pref.token)) prefsvc.setBoolPref(pref.token, pref.default);
  });

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
