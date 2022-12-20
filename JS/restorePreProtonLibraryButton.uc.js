// ==UserScript==
// @name           Restore pre-Proton Library Button
// @version        1.2.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    The library toolbar button used to have an animation that
// played when a bookmark was added. It's another casualty of the proton
// updates. This script restores the library button animation in its entirety,
// with one small change. The library animation always looked just a tiny bit
// off for certain window scaling factors — the animation would appear about
// half a pixel from where the static icon is, causing it to appear to move when
// the animation finishes. In order to fix this in my version of the animation,
// I added some constants at the top of the script (allowScalingFix and
// forceScalingFix) that will adjust the icon if enabled. I don't know exactly
// which scaling factors or OSes have this problem, but 150% scaling on Windows
// 10 definitely has it. So by default the script will only enable the scaling
// fix if the OS is Windows and the scaling factor is 1.5. However, if you
// notice that you have the scaling bug too, you can toggle "forceScalingFix" to
// true and it will adjust the icon regardless of your OS or scaling factor.
// Conversely, if you're using 150% scaling on Windows but for whatever reason
// the scaling fix is making it look worse somehow, toggling "allowScalingFix"
// to false will turn the feature off entirely. This version of the script
// requires fx-autoconfig, userChrome.au.css, and the resources folder from my repo.
// If you don't want to use all that stuff, grab the standalone version instead.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  const allowScalingFix = true;
  const forceScalingFix = false;
  class LibraryUIBase {
    constructor() {
      if (
        allowScalingFix &&
        (forceScalingFix ||
          (window.devicePixelRatio === 1.5 && this.OS === "WINNT"))
      ) {
        this.libButtonFragOrNode.setAttribute(
          "scaling",
          window.devicePixelRatio
        );
      }
      this._libraryButtonAnimationEndListeners = {};
      this._windowResizeRunning = false;
      this.animBox = document.createXULElement("box");
      this.animImg = document.createXULElement("image");
      this.animBox.id = "library-animatable-box";
      this.animBox.className = "toolbarbutton-animatable-box";
      this.animImg.className = "toolbarbutton-animatable-image";
      this.animBox.appendChild(this.animImg);
      document.getElementById("nav-bar").appendChild(this.animBox);
    }

    get OS() {
      return Services.appinfo.OS;
    }

    get libButtonFragOrNode() {
      return CustomizableUI.getWidget("library-button").forWindow(window).node;
    }

    triggerLibraryAnimation(animation) {
      let libraryButton = document.getElementById("library-button");
      if (
        !libraryButton ||
        libraryButton.getAttribute("cui-areatype") == "panel" ||
        libraryButton.getAttribute("overflowedItem") == "true" ||
        !libraryButton.closest("#nav-bar") ||
        !window.toolbar.visible ||
        gReduceMotion
      ) {
        return false;
      }

      let navBar = document.getElementById("nav-bar");
      let iconBounds = window.windowUtils.getBoundsWithoutFlushing(
        libraryButton.icon
      );
      let libraryBounds = window.windowUtils.getBoundsWithoutFlushing(
        libraryButton
      );

      this.animBox.style.setProperty(
        "--library-button-height",
        `${libraryBounds.height}px`
      );
      this.animBox.style.setProperty("--library-icon-x", `${iconBounds.x}px`);
      if (navBar.hasAttribute("brighttext")) {
        this.animBox.setAttribute("brighttext", "true");
      } else {
        this.animBox.removeAttribute("brighttext");
      }

      this.animBox.removeAttribute("fade");
      libraryButton.setAttribute("animate", animation);
      this.animBox.setAttribute("animate", animation);
      if (!this._libraryButtonAnimationEndListeners[animation]) {
        this._libraryButtonAnimationEndListeners[animation] = event => {
          this._libraryButtonAnimationEndListener(event, animation);
        };
      }
      this.animBox.addEventListener(
        "animationend",
        this._libraryButtonAnimationEndListeners[animation]
      );
      window.addEventListener("resize", this);
      return true;
    }

    _libraryButtonAnimationEndListener(aEvent, animation) {
      if (aEvent.animationName.startsWith(`library-${animation}-animation`)) {
        this.animBox.setAttribute("fade", "true");
      } else if (aEvent.animationName == `library-${animation}-fade`) {
        this.animBox.removeEventListener(
          "animationend",
          window.LibraryUI._libraryButtonAnimationEndListeners[animation]
        );
        this.animBox.removeAttribute("animate");
        this.animBox.removeAttribute("fade");
        window.removeEventListener("resize", this);
        let libraryButton = document.getElementById("library-button");
        libraryButton.removeAttribute("animate");
      }
    }

    handleEvent(aEvent) {
      if (this._windowResizeRunning) return;
      this._windowResizeRunning = true;
      requestAnimationFrame(() => {
        let libraryButton = document.getElementById("library-button");
        if (
          !libraryButton ||
          libraryButton.getAttribute("cui-areatype") == "panel" ||
          libraryButton.getAttribute("overflowedItem") == "true" ||
          !libraryButton.closest("#nav-bar")
        ) {
          return;
        }

        let iconBounds = window.windowUtils.getBoundsWithoutFlushing(
          libraryButton.icon
        );
        this.animBox.style.setProperty("--library-icon-x", `${iconBounds.x}px`);
        this._windowResizeRunning = false;
      });
    }
  }

  /**
   * return whether node's nearest scrollable ancestor is scrolled out of view
   * @param {object} node (the potential anchor node)
   * @returns {boolean} true if the node is scrolled out of view
   */
  function scrolledOutOfView(node) {
    let scrollBox = node.closest(".slider-container, arrowscrollbox");
    if (!scrollBox) return false;
    let ordinals =
      scrollBox.getAttribute("orient") === "horizontal"
        ? ["left", "right", "width"]
        : ["top", "bottom", "height"];
    let nodeRect = node.getBoundingClientRect();
    let scrollRect = scrollBox.getBoundingClientRect();
    return (
      scrollRect[ordinals[0]] >
        nodeRect[ordinals[0]] + nodeRect[ordinals[2]] / 2 ||
      scrollRect[ordinals[1]] + nodeRect[ordinals[2]] / 2 <
        nodeRect[ordinals[1]]
    );
  }

  function init() {
    window.LibraryUI = new LibraryUIBase();

    StarUI.showConfirmation = function showConfirmation() {
      let animationTriggered = window.LibraryUI.triggerLibraryAnimation(
        "bookmark"
      );
      const HINT_COUNT_PREF =
        "browser.bookmarks.editDialog.confirmationHintShowCount";
      const HINT_COUNT = Services.prefs.getIntPref(HINT_COUNT_PREF, 0);
      if (animationTriggered && HINT_COUNT >= 3) return;
      Services.prefs.setIntPref(HINT_COUNT_PREF, HINT_COUNT + 1);

      let anchor;
      if (window.toolbar.visible) {
        for (let id of ["library-button", "bookmarks-menu-button"]) {
          let element = document.getElementById(id);
          if (
            element &&
            element.getAttribute("cui-areatype") != "panel" &&
            element.getAttribute("overflowedItem") != "true" &&
            isElementVisible(element) &&
            !scrolledOutOfView(element)
          ) {
            anchor = element;
            break;
          }
        }
      }

      if (!anchor) anchor = document.getElementById("PanelUI-menu-button");
      ConfirmationHint.show(anchor, "confirmation-hint-page-bookmarked");
    };
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
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
