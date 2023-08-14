// ==UserScript==
// @name           Bookmarks Popup Mods
// @version        1.2.3
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Implement smooth scrolling for all bookmarks popups that are tall enough to scroll. Add special click functions to their scroll buttons — hovering a scroll button will scroll at a constant rate, as normal. (though faster than vanilla) But clicking a scroll button will immediately jump to the top/bottom of the list.

This script no longer styles the scroll buttons, since I now style all arrowscrollbox scrollbuttons equally with [arrowscrollbox.css][]. To do that requires [chrome.manifest][]. That file replaces the built-in arrowscrollbox.css with my version that makes the scrollbuttons look a lot prettier. If you want to customize them, just edit arrowscrollbox.css. This script still adds custom classes though, in case you want to use them to style the elements in userChrome.css.

[arrowscrollbox.css]: https://github.com/aminomancer/uc.css.js/blob/master/resources/layout/arrowscrollbox.css
[chrome.manifest]: https://github.com/aminomancer/uc.css.js/blob/master/utils/chrome.manifest
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarksPopupShadowRoot.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarksPopupShadowRoot.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        main
// ==/UserScript==

(function () {
  const bookmarksPopupShadowRoot = {
    handleEvent(e) {
      if (!e.target.getAttribute("placespopup") || !e.target.scrollBox) return;
      if (!e.target.getAttribute("uc-init")) {
        setTimeout(() => {
          this.checkPopups(e.target);
        }, 0);
      }
      let { scrollbox } = e.target.scrollBox;
      let height = window.screen.availHeight;
      e.target.scrollBox.parentElement?.classList.toggle(
        "BMBsmallContentBox",
        scrollbox.scrollTopMax < height && scrollbox.clientHeight < height
      );
    },

    checkPopups(popup) {
      popup.setAttribute("uc-init", true);
      this.setUpScroll(popup);
    },

    setUpScroll(popup) {
      popup.scrollBox.parentElement.classList.add("BMB-special-innerbox");
      popup.scrollBox.smoothScroll = true;
      popup.scrollBox._scrollIncrement = 150;
      popup.scrollBox._scrollButtonUp.classList.add(
        "BMB-special-scrollbutton-up"
      );
      popup.scrollBox._scrollButtonDown.classList.add(
        "BMB-special-scrollbutton-down"
      );
      popup.scrollBox._onButtonMouseOver = function _onButtonMouseOver(index) {
        if (
          this._ensureElementIsVisibleAnimationFrame ||
          this._arrowScrollAnim.requestHandle
        ) {
          return;
        }
        if (this._clickToScroll) this._continueScroll(index);
        else this._startScroll(index);
      };
      popup.scrollBox._onButtonMouseOut = function _onButtonMouseOut() {
        if (
          this._ensureElementIsVisibleAnimationFrame ||
          this._arrowScrollAnim.requestHandle
        ) {
          return;
        }
        if (this._clickToScroll) this._pauseScroll();
        else this._stopScroll();
      };
      popup.scrollBox._scrollButtonDown.onclick = function scrollToBottom() {
        bookmarksPopupShadowRoot.scrollByIndex(
          popup.scrollBox,
          popup.children.length
        );
      };
      popup.scrollBox._scrollButtonUp.onclick = function scrollToTop() {
        bookmarksPopupShadowRoot.scrollByIndex(
          popup.scrollBox,
          -popup.children.length
        );
      };
    },

    scrollByIndex(box, index, aInstant) {
      if (index == 0) return;
      var rect = box.scrollClientRect;
      var [start, end] = box.startEndProps;
      var x = index > 0 ? rect[end] + 1 : rect[start] - 1;
      var nextElement = box._elementFromPoint(x, index);
      if (!nextElement) return;
      var targetElement;
      if (box.isRTLScrollbox) index *= -1;
      while (index < 0 && nextElement) {
        if (box._canScrollToElement(nextElement)) targetElement = nextElement;
        nextElement = nextElement.previousElementSibling;
        index++;
      }
      while (index > 0 && nextElement) {
        if (box._canScrollToElement(nextElement)) targetElement = nextElement;
        nextElement = nextElement.nextElementSibling;
        index--;
      }
      if (!targetElement || !box._canScrollToElement(targetElement)) return;
      box._stopScroll();
      let animFrame = window.requestAnimationFrame(() => {
        targetElement.scrollIntoView({
          block: "nearest",
          behavior: aInstant ? "instant" : "auto",
        });
        box._ensureElementIsVisibleAnimationFrame = 0;
        box._arrowScrollAnim.requestHandle = 0;
      });
      box._ensureElementIsVisibleAnimationFrame = animFrame;
      box._arrowScrollAnim.requestHandle = animFrame;
    },
    init() {
      addEventListener("popupshowing", this, true);
      CustomizableUI.removeListener(this);
    },
  };

  if (gBrowserInit.delayedStartupFinished) {
    bookmarksPopupShadowRoot.init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        bookmarksPopupShadowRoot.init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
