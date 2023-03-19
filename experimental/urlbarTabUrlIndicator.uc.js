// ==UserScript==
// @name           Urlbar Tab URL Indicator
// @version        2.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Upon hovering a tab, replace the urlbar's text (at least, appear to do so) with the hovered tab's URL instead of showing a normal tab tooltip. This is actually a mod of the tab tooltip, so the urlbar's text remains intact. If we changed the urlbar's text directly it would massively increase the complexity of the script and make it more prone to bugs or future breakdowns. So instead we just change how the tab tooltip works and looks so that it is indistinguishable from the urlbar's text.
// ==/UserScript==

(function() {
  let bounds = windowUtils.getBoundsWithoutFlushing;
  // stylesheet handles much of the work
  let css = `#tabbrowser-tab-tooltip {
  padding: 0;
  margin: 0;
  font-size: 1.15em;
  background: transparent;
  color: var(--toolbar-field-color);
  border: 0;
  border-radius: revert;
  box-shadow: none !important;
  overflow: hidden;
}
:root[tab-tooltip-visible] .urlbar-input-box input {
  visibility: hidden !important;
}
#tabbrowser-tab-tooltip .places-tooltip-box {
  display: flex;
  align-items: center;
  min-height: 100%;
  padding: revert;
  background: transparent;
  color: inherit;
  border: 0;
  border-radius: revert;
  box-shadow: none !important;
  overflow: hidden;
}
#tabbrowser-tab-tooltip .places-tooltip-title {
  display: none;
}
#tabbrowser-tab-tooltip .places-tooltip-uri {
  color: inherit;
}
.places-tooltip-box[textoverflow="both"] {
  mask-image: linear-gradient(
    to right,
    transparent,
    black 3ch,
    black calc(100% - 3ch),
    transparent
  );
}
.places-tooltip-box[textoverflow="right"] {
  mask-image: linear-gradient(to left, transparent, black 3ch);
}
.places-tooltip-box[textoverflow="left"] {
  mask-image: linear-gradient(to right, transparent, black 3ch);
}`;
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );
  let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
  if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }

  function init() {
    let tabTooltip = document.querySelector("#tabbrowser-tab-tooltip");
    tabTooltip.setAttribute(
      "onpopuphiding",
      `gBrowser.onTabTooltipHiding(event)`
    ); // involved in setting the [tab-tooltip-visible] property on the :root element
    document.querySelector(
      "#tabbrowser-tab-tooltip > description"
    ).style.display = "none"; // hide the pre-modern tooltip label just in case
    document.querySelector("#places-tooltip-insecure-icon").hidden = true; // hide the insecure lock icon

    // make sure the tooltip isn't showing when the urlbar is being interacted with
    [
      "compositionstart",
      "compositionend",
      "dragstart",
      "drop",
      "focus",
      "blur",
      "input",
      "keydown",
      "keyup",
      "overflow",
      "underflow",
      "paste",
      "select",
    ].forEach(ev => gURLBar.addEventListener(ev, () => tabTooltip.hidePopup()));

    [
      "TabOpen",
      "SSTabRestored",
      "TabClose",
      "TabMove",
      "TabSelect",
    ].forEach(ev =>
      gBrowser.tabContainer.addEventListener(ev, () => tabTooltip.hidePopup())
    );

    gBrowser.tabContainer.addEventListener("TabAttrModified", e => {
      if (e.target === tabTooltip.cachedTab) {
        gBrowser.createTooltip({
          stopPropagation() {},
          preventDefault() {},
          target: { triggerNode: e.target },
        });
      }
    });

    function _checkForRtlText(value) {
      return (
        windowUtils.getDirectionFromText(value) == windowUtils.DIRECTION_RTL
      );
    }

    // mask the edges of the tab URL text when it overflows the urlbar input area
    ["overflow", "underflow"].forEach(ev =>
      tabTooltip
        .querySelector(".places-tooltip-box")
        .addEventListener(ev, function(e) {
          switch (e.type) {
            case "overflow":
              this._overflowing = true;
              break;
            case "underflow":
              this._overflowing = false;
              break;
          }
          if (!this._overflowing) {
            this.removeAttribute("textoverflow");
            return;
          }
          let text = tabTooltip.querySelector(".places-tooltip-uri");
          let isRTL = _checkForRtlText(text.value);
          promiseDocumentFlushed(() => {
            if (text && this._overflowing) {
              let side = "both";
              if (isRTL) {
                if (text.scrollLeft == 0) side = "left";
                else if (text.scrollLeft == text.scrollLeftMin) side = "right";
              } else if (text.scrollLeft == 0) {
                side = "right";
              } else if (text.scrollLeft == text.scrollLeftMax) {
                side = "left";
              }
              requestAnimationFrame(() => {
                if (this._overflowing) this.setAttribute("textoverflow", side);
              });
            }
          });
        })
    );

    // removes the [tab-tooltip-visible] property when the tooltip hides
    gBrowser.onTabTooltipHiding = function(e) {
      e.target.removeAttribute("position");
      tabTooltip.cachedTab = null;
      document.documentElement.removeAttribute("tab-tooltip-visible");
    };

    // called when the tooltip opens, e.g., most likely in response to a tab being hovered
    gBrowser.createTooltip = function(event) {
      event.stopPropagation();
      let tooltip = event.target;
      let tab = tooltip.triggerNode?.closest("tab");
      // if there is somehow no tab associated with the tooltip (unlikely),
      // if the hovered tab is the active tab and their URLs match,
      // or if the user is currently typing in the urlbar,
      // bail out of showing the tooltip since it would look identical to the urlbar.
      if (
        !tab ||
        gURLBar.focused ||
        gURLBar.view.isOpen ||
        (tab.selected && gURLBar.getAttribute("pageproxystate") === "valid")
      ) {
        event.preventDefault();
        return;
      }
      tabTooltip.cachedTab = tab;
      // get the height, width, etc. of the urlbar input field
      let inputBounds = bounds(gURLBar.inputField);
      // set the tooltip's width, height, and padding equal to the urlbar input field's
      tooltip.style.height = `${inputBounds.height}px`;
      let textBox = document.querySelector(
        "#tabbrowser-tab-tooltip .places-tooltip-box"
      );
      textBox.style.paddingLeft = getComputedStyle(
        gURLBar.inputField
      ).paddingLeft;
      textBox.style.maxWidth = `${inputBounds.width}px`;
      // this determines how the tooltip is aligned relative to the anchor element
      tooltip.setAttribute("position", "overlap");
      // and this determines the element to which it's anchored.
      // so this results in the tooltip being anchored to the top left corner of the urlbar,
      // with the tooltip's own anchor point being its own top left corner.
      // in other words, the tooltip's top left corner is lined up with the urlbar's top left corner.
      tooltip.moveToAnchor(gURLBar.inputField, "overlap");
      let url = tooltip.querySelector(".places-tooltip-uri");
      let uri =
        tab.linkedBrowser?.currentAuthPromptURI ||
        tab.linkedBrowser?.currentURI;
      try {
        uri = Services.io.createExposableURI(uri);
      } catch (e) {}
      let tempUrl = uri?.spec; // get hovered tab's URL
      // if there is no URL or the tab would show a search placeholder instead,
      // (e.g., on the new tab page) default to showing the tab's title instead.
      if (
        !tempUrl ||
        (isInitialPage(uri) &&
          BrowserUIUtils.checkEmptyPageOrigin(gBrowser.selectedBrowser, uri))
      ) {
        tempUrl = gBrowser.getTabTooltip(tab);
      } else {
        // this is copied from losslessDecodeURI from UrlbarInput.sys.mjs
        try {
          let scheme = uri.scheme;
          let value = uri.displaySpec;
          if (!/%25(?:3B|2F|3F|3A|40|26|3D|2B|24|2C|23)/i.test(value)) {
            let decodeASCIIOnly = !["https", "http", "file", "ftp"].includes(
              scheme
            );
            if (decodeASCIIOnly) {
              value = value.replace(
                /%(2[0-4]|2[6-9a-f]|[3-6][0-9a-f]|7[0-9a-e])/g,
                decodeURI
              );
            } else {
              try {
                value = decodeURI(value).replace(
                  /%(?!3B|2F|3F|3A|40|26|3D|2B|24|2C|23)/gi,
                  encodeURIComponent
                );
              } catch (e) {}
            }
          }
          value = value.replace(
            // eslint-disable-next-line no-control-regex
            /[\u0000-\u001f\u007f-\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u2800\u3000\ufffc]|[\r\n\t]|\u0020(?=\u0020)|\s$/g,
            encodeURIComponent
          );
          value = value.replace(
            // eslint-disable-next-line no-misleading-character-class
            /[\u00ad\u034f\u061c\u06dd\u070f\u115f\u1160\u17b4\u17b5\u180b-\u180e\u200b\u200e\u200f\u202a-\u202e\u2060-\u206f\u3164\u0600-\u0605\u08e2\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufffb]|\ud804[\udcbd\udccd]|\ud80d[\udc30-\udc38]|\ud82f[\udca0-\udca3]|\ud834[\udd73-\udd7a]|[\udb40-\udb43][\udc00-\udfff]|\ud83d[\udd0f-\udd13\udee1]/g,
            encodeURIComponent
          );
          tempUrl = value;
        } catch (ex) {
          tempUrl = "about:blank";
        }

        // if the trim URLs pref is enabled, http:// should be trimmed out of the URL
        if (UrlbarPrefs.get("trimURLs")) {
          tempUrl = BrowserUIUtils.trimURL(tempUrl);
        }
      }
      url.value = tempUrl; // finally set the tooltip's text to the hovered tab's URL
      // set the [tab-tooltip-visible] property when the tooltip appears.
      // importantly, this is how we hide the urlbar when the tooltip is open
      document.documentElement.setAttribute("tab-tooltip-visible", true);
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
