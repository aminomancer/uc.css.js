// ==UserScript==
// @name           Restore pre-Proton Arrowpanels
// @version        1.1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    The mother of all proton reversals. This script will
// basically restore the arrows at the corner of panels that point at the
// element to which the panel is anchored.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

// wait for customElements.js to load the scripts. waiting for
// autocomplete-richlistbox-popup because there's a stupid bug that doesn't let
// you call whenDefined on an element that doesn't have a dash in its name,
// unless the code is running in some specific namespace that I have no idea how
// to make my code run in.
(function() {
  customElements.whenDefined("autocomplete-richlistbox-popup").then(() => {
    let spec = customElements.get("panel");

    Object.defineProperty(spec, "inheritedAttributes", {
      enumerable: true,
      get() {
        return {
          ".panel-arrowcontent": "align,dir,orient,pack",
        };
      },
    });
    spec.prototype.connectedCallback = function() {
      // Create shadow DOM lazily if a panel is hidden. It helps to reduce
      // cycles on startup.
      if (!this.hidden) {
        this.ensureInitialized();
      }

      if (this.isArrowPanel) {
        if (!this.hasAttribute("flip")) {
          this.setAttribute("flip", "both");
        }
        if (!this.hasAttribute("side")) {
          this.setAttribute("side", "top");
        }
        this.setAttribute(
          "position",
          this.getAttribute("position")
            ?.replace(/^bottom(right|left)/, "bottomcenter")
            .replace(/^top(left|right)/, "$1center") || "bottomcenter topleft"
        );
        if (!this.hasAttribute("consumeoutsideclicks")) {
          this.setAttribute("consumeoutsideclicks", "false");
        }
      }
    };
    spec.prototype._setSideAttribute = function(event) {
      if (!this.isArrowPanel || !this.anchorNode) {
        return;
      }

      let container = this.shadowRoot.querySelector(".panel-arrowcontainer");
      if (!container) {
        this.shadowRoot.querySelector("slot").replaceWith(
          MozXULElement.parseXULToFragment(
            `<vbox class="panel-arrowcontainer" flex="1">
              <box class="panel-arrowbox" part="arrowbox">
                <image class="panel-arrow" part="arrow" />
              </box>
              <html:slot part="content" />
            </vbox>`
          )
        );
        container = this.shadowRoot.querySelector(".panel-arrowcontainer");
        delete this._scrollBox;
        delete this.__indicatorBar;
        this.initializeAttributeInheritance();
      }

      let arrowbox = this.shadowRoot.querySelector(".panel-arrowbox");

      let arrow = this.shadowRoot.querySelector(".panel-arrow");
      if (arrow) {
        arrow.hidden = !this.anchorNode;
        this.shadowRoot.querySelector(".panel-arrowbox").style.removeProperty("transform");
      }

      let position = event.alignmentPosition;
      let offset = event.alignmentOffset;

      if (position.indexOf("start_") == 0 || position.indexOf("end_") == 0) {
        container.setAttribute("orient", "horizontal");
        arrowbox.setAttribute("orient", "vertical");
        if (position.indexOf("_after") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(0, " + -offset + "px)";

        // The assigned side stays the same regardless of direction.
        let isRTL = window.getComputedStyle(this).direction == "rtl";

        if (position.indexOf("start_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", isRTL ? "left" : "right");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", isRTL ? "right" : "left");
        }
      } else if (position.indexOf("before_") == 0 || position.indexOf("after_") == 0) {
        container.removeAttribute("orient");
        arrowbox.removeAttribute("orient");
        if (position.indexOf("_end") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(" + -offset + "px, 0)";

        if (position.indexOf("before_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", "bottom");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", "top");
        }
      }
    };
    spec.prototype.on_popupshowing = function(event) {
      if (event.target == this) {
        this.panelContent.style.display = "";
      }
      if (this.isArrowPanel && event.target == this) {
        if (this.anchorNode) {
          let anchorRoot =
            this.anchorNode.closest("toolbarbutton, .anchor-root") || this.anchorNode;
          anchorRoot.setAttribute("open", "true");
        }

        let arrow = this.shadowRoot.querySelector(".panel-arrow");
        if (arrow) {
          arrow.hidden = !this.anchorNode;
          this.shadowRoot.querySelector(".panel-arrowbox").style.removeProperty("transform");
        }

        if (this.getAttribute("animate") != "false") {
          this.setAttribute("animate", "open");
          // the animating attribute prevents user interaction during transition
          // it is removed when popupshown fires
          this.setAttribute("animating", "true");
        }

        // set fading
        let fade = this.getAttribute("fade");
        let fadeDelay = 0;
        if (fade == "fast") {
          fadeDelay = 1;
        } else if (fade == "slow") {
          fadeDelay = 4000;
        }

        if (fadeDelay != 0) {
          this._fadeTimer = setTimeout(() => this.hidePopup(true), fadeDelay, this);
        }
      }

      // Capture the previous focus before has a chance to get set inside the panel
      try {
        this._prevFocus = Cu.getWeakReference(document.commandDispatcher.focusedElement);
        if (!this._prevFocus.get()) {
          this._prevFocus = Cu.getWeakReference(document.activeElement);
          return;
        }
      } catch (ex) {
        this._prevFocus = Cu.getWeakReference(document.activeElement);
      }
    };
    for (let popup of document.querySelectorAll(`panel:not([is])`)) {
      popup.connectedCallback?.();
    }
  });

  customElements.whenDefined("places-popup-arrow").then(spec => {
    spec.prototype.connectedCallback = function() {
      if (this.delayConnectedCallback()) {
        return;
      }

      Object.getPrototypeOf(Object.getPrototypeOf(this)).connectedCallback.call(this);
      this.initializeAttributeInheritance();

      this.setAttribute("flip", "both");
      this.setAttribute("side", "top");
      this.setAttribute("position", "bottomcenter topright");
    };
    spec.prototype._setSideAttribute = function(event) {
      if (!this.anchorNode) return;

      let container = this.shadowRoot.querySelector(".panel-arrowcontainer");
      let arrow = this.shadowRoot.querySelector(".panel-arrow");
      if (arrow) {
        this.shadowRoot.querySelector(".panel-arrowbox").style.removeProperty("transform");
        if (!this.anchorNode) {
          arrow.hidden = true;
          return;
        }
        arrow.hidden = false;
      }

      if (!container) {
        this.shadowRoot.querySelector(":host > hbox").replaceWith(
          MozXULElement.parseXULToFragment(
            `<vbox class="panel-arrowcontainer" flex="1">
              <box class="panel-arrowbox" part="arrowbox">
                <image class="panel-arrow" part="arrow" />
              </box>
              <box class="panel-arrowcontent" part="arrowcontent" flex="1">
                <vbox part="drop-indicator-bar" hidden="true">
                  <image part="drop-indicator" />
                </vbox>
                <arrowscrollbox class="menupopup-arrowscrollbox" flex="1" orient="vertical" smoothscroll="false"
                  part="arrowscrollbox content">
                  <html:slot />
                </arrowscrollbox>
              </box>
            </vbox>`
          )
        );
        container = this.shadowRoot.querySelector(".panel-arrowcontainer");
        arrow = this.shadowRoot.querySelector(".panel-arrow");
        delete this._scrollBox;
        delete this.__indicatorBar;
        this.initializeAttributeInheritance();
      }
      let arrowbox = this.shadowRoot.querySelector(".panel-arrowbox");

      let position = event.alignmentPosition;
      let offset = event.alignmentOffset;

      // if this panel has a "sliding" arrow, we may have previously set margins...
      arrowbox.style.removeProperty("transform");
      if (position.indexOf("start_") == 0 || position.indexOf("end_") == 0) {
        container.setAttribute("orient", "horizontal");
        arrowbox.setAttribute("orient", "vertical");
        if (position.indexOf("_after") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(0, " + -offset + "px)";

        // The assigned side stays the same regardless of direction.
        let isRTL = this.matches(":-moz-locale-dir(rtl)");

        if (position.indexOf("start_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", isRTL ? "left" : "right");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", isRTL ? "right" : "left");
        }
      } else if (position.indexOf("before_") == 0 || position.indexOf("after_") == 0) {
        container.removeAttribute("orient");
        arrowbox.removeAttribute("orient");
        if (position.indexOf("_end") > 0) {
          arrowbox.setAttribute("pack", "end");
        } else {
          arrowbox.setAttribute("pack", "start");
        }
        arrowbox.style.transform = "translate(" + -offset + "px, 0)";

        if (position.indexOf("before_") == 0) {
          container.style.MozBoxDirection = "reverse";
          this.setAttribute("side", "bottom");
        } else {
          container.style.removeProperty("-moz-box-direction");
          this.setAttribute("side", "top");
        }
      }

      arrow.hidden = false;
    };
    for (let popup of document.querySelectorAll(`[is="places-popup-arrow"]`)) {
      popup.connectedCallback?.();
    }
  });

  let { PopupNotifications } = ChromeUtils.import("resource://gre/modules/PopupNotifications.jsm");
  if (PopupNotifications.prototype._showPanel.name === "PopupNotifications_showPanel") {
    const NOTIFICATION_EVENT_SHOWING = "showing";
    const NOTIFICATION_EVENT_SHOWN = "shown";
    const TELEMETRY_STAT_OFFERED = 0;
    eval(
      `PopupNotifications.prototype._showPanel = function ` +
        PopupNotifications.prototype._showPanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^PopupNotifications_showPanel\s*/, "")
          .replace(/^(.)/, `uc_PopupNotifications_showPanel$1`)
          .replace(/bottomleft/, "bottomcenter")
    );
  }

  let { ExtensionsUI } = ChromeUtils.import("resource:///modules/ExtensionsUI.jsm");
  if (ExtensionsUI.showPermissionsPrompt.name === "showPermissionsPrompt") {
    const DEFAULT_EXTENSION_ICON = "chrome://mozapps/skin/extensions/extensionGeneric.svg";
    function getTabBrowser(browser) {
      while (browser.ownerGlobal.docShell.itemType !== Ci.nsIDocShell.typeChrome) {
        browser = browser.ownerGlobal.docShell.chromeEventHandler;
      }
      let window = browser.ownerGlobal;
      let viewType = browser.getAttribute("webextension-view-type");
      if (viewType == "sidebar") {
        window = window.browsingContext.topChromeWindow;
      }
      if (viewType == "popup" || viewType == "sidebar") {
        browser = window.gBrowser.selectedBrowser;
      }
      return { browser, window };
    }
    eval(
      `ExtensionsUI.showPermissionsPrompt = async function ` +
        ExtensionsUI.showPermissionsPrompt
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^showPermissionsPrompt\s*/, "")
          .replace(/^(.)/, `uc_showPermissionsPrompt$1`)
          .replace(/bottomright/, "bottomcenter")
    );
    if (ExtensionsUI.showDefaultSearchPrompt.name === "showDefaultSearchPrompt") {
      eval(
        `ExtensionsUI.showDefaultSearchPrompt = async function ` +
          ExtensionsUI.showDefaultSearchPrompt
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^function\s*/, "")
            .replace(/^showDefaultSearchPrompt\s*/, "")
            .replace(/^(.)/, `uc_showDefaultSearchPrompt$1`)
            .replace(/bottomright/, "bottomcenter")
      );
    }
  }

  let { UITour } = ChromeUtils.import("resource:///modules/UITour.jsm");
  if (UITour.showInfo.name === "showInfo") {
    const lazy = {
      log: { warn() {} },
    };
    eval(
      `UITour.showInfo = async function ` +
        UITour.showInfo
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^showInfo\s*/, "")
          .replace(/^(.)/, `uc_showInfo$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  let { CustomizeMode } = ChromeUtils.import("resource:///modules/CustomizeMode.jsm");
  if (CustomizeMode.prototype._showDownloadsAutoHidePanel.name === "_showDownloadsAutoHidePanel") {
    eval(
      `CustomizeMode.prototype._showDownloadsAutoHidePanel = async function ` +
        CustomizeMode.prototype._showDownloadsAutoHidePanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^_showDownloadsAutoHidePanel\s*/, "")
          .replace(/^(.)/, `uc_showDownloadsAutoHidePanel$1`)
          .replace(/topleft topright/, "leftcenter topright")
          .replace(/topright topleft/, "rightcenter topleft")
    );
  }

  customElements.whenDefined("translation-notification").then(spec => {
    if (spec.prototype.init.name === "init") {
      eval(
        `spec.prototype.init = function ` +
          spec.prototype.init
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^function\s*/, "")
            .replace(/^init\s*/, "")
            .replace(/^(.)/, `uc_init$1`)
            .replace(/bottomleft/, "bottomcenter")
      );
    }
  });

  let dummyNotification = document.createXULElement("notification", {
    is: "translation-notification",
  });
  dummyNotification.remove();

  if (DownloadsPanel && DownloadsPanel._openPopupIfDataReady.name === "_openPopupIfDataReady") {
    eval(
      `DownloadsPanel._openPopupIfDataReady = function ` +
        DownloadsPanel._openPopupIfDataReady
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^_openPopupIfDataReady\s*/, "")
          .replace(/^(.)/, `uc_openPopupIfDataReady$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  if (PanelUI && PanelUI.showSubView.name === "showSubView") {
    eval(
      `PanelUI.showSubView = async function ` +
        PanelUI.showSubView
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^showSubView\s*/, "")
          .replace(/^(.)/, `uc_showSubView$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  if (PanelUI && PanelUI._showNotificationPanel.name === "_showNotificationPanel") {
    eval(
      `PanelUI._showNotificationPanel = function ` +
        PanelUI._showNotificationPanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^_showNotificationPanel\s*/, "")
          .replace(/^(.)/, `uc_showNotificationPanel$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  if (gSharedTabWarning.willShowSharedTabWarning.name === "willShowSharedTabWarning") {
    eval(
      `gSharedTabWarning.willShowSharedTabWarning = function ` +
        gSharedTabWarning.willShowSharedTabWarning
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^willShowSharedTabWarning\s*/, "")
          .replace(/^(.)/, `uc_willShowSharedTabWarning$1`)
          .replace(/bottomleft/, "bottomcenter")
    );
  }

  if (gProtectionsHandler.showProtectionsPopup.name === "showProtectionsPopup") {
    eval(
      `gProtectionsHandler.showProtectionsPopup = function ` +
        gProtectionsHandler.showProtectionsPopup
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^showProtectionsPopup\s*/, "")
          .replace(/^(.)/, `uc_showProtectionsPopup$1`)
          .replace(/bottomleft/, "bottomcenter")
    );
  }

  if (gIdentityHandler._openPopup.name === "_openPopup") {
    eval(
      `gIdentityHandler._openPopup = function ` +
        gIdentityHandler._openPopup
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^_openPopup\s*/, "")
          .replace(/^(.)/, `uc_openPopup$1`)
          .replace(/bottomleft/, "bottomcenter")
    );
  }

  if (BrowserPageActions.togglePanelForAction.name === "togglePanelForAction") {
    eval(
      `BrowserPageActions.togglePanelForAction = function ` +
        BrowserPageActions.togglePanelForAction
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^togglePanelForAction\s*/, "")
          .replace(/^(.)/, `uc_togglePanelForAction$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  if (BrowserPageActions.showPanel.name === "showPanel") {
    eval(
      `BrowserPageActions.showPanel = function ` +
        BrowserPageActions.showPanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^showPanel\s*/, "")
          .replace(/^(.)/, `uc_showPanel$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  function removeNotificationOnEnd(notification, installs) {
    let count = installs.length;

    function maybeRemove(install) {
      install.removeListener(this);

      if (--count == 0) {
        // Check that the notification is still showing
        let current = PopupNotifications.getNotification(notification.id, notification.browser);
        if (current === notification) {
          notification.remove();
        }
      }
    }

    for (let install of installs) {
      install.addListener({
        onDownloadCancelled: maybeRemove,
        onDownloadFailed: maybeRemove,
        onInstallFailed: maybeRemove,
        onInstallEnded: maybeRemove,
      });
    }
  }

  if (gXPInstallObserver.showInstallConfirmation.name === "showInstallConfirmation") {
    eval(
      `gXPInstallObserver.showInstallConfirmation = function ` +
        gXPInstallObserver.showInstallConfirmation
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^showInstallConfirmation\s*/, "")
          .replace(/^(.)/, `uc_showInstallConfirmation$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  if (gXPInstallObserver.observe.name === "observe") {
    eval(
      `gXPInstallObserver.observe = function ` +
        gXPInstallObserver.observe
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^observe\s*/, "")
          .replace(/^(.)/, `uc_observe$1`)
          .replace(/bottomright/, "bottomcenter")
    );
  }

  eval(
    `StarUI.showEditBookmarkPopup = async function ` +
      StarUI.showEditBookmarkPopup
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/async showEditBookmarkPopup/, "")
        .replace(/async function\s*/, "")
        .replace(/bottomright/, "bottomcenter")
  );

  gPermissionPanel._popupPosition = "bottomcenter topleft";

  try {
    document
      .getElementById("panicButtonNotificationTemplate")
      .content.getElementById("panic-button-success-notification").position =
      "bottomcenter topright";
  } catch (error) {}
  try {
    document
      .getElementById("extensionNotificationTemplate")
      .content.getElementById("extension-notification-panel").position = "bottomcenter topright";
  } catch (error) {}
  try {
    document
      .getElementById("confirmation-hint-wrapper")
      .content.getElementById("confirmation-hint").position = "bottomcenter topright";
  } catch (error) {}
  try {
    document
      .getElementById("pageActionPanelTemplate")
      .content.getElementById("pageActionPanel").position = "bottomcenter topright";
  } catch (error) {}
  document.getElementById("appMenu-popup").position = "bottomcenter topright";
  document.getElementById("widget-overflow").position = "bottomcenter topright";
  document.getElementById("sidebarMenu-popup").position = "bottomcenter topright";

  function init() {
    ConfirmationHint = {
      _timerID: null,

      /**
       * Shows a transient, non-interactive confirmation hint anchored to an
       * element, usually used in response to a user action to reaffirm that it was
       * successful and potentially provide extra context. Examples for such hints:
       * - "Saved to bookmarks" after bookmarking a page
       * - "Sent!" after sending a tab to another device
       * - "Queued (offline)" when attempting to send a tab to another device
       *   while offline
       *
       * @param  anchor (DOM node, required)
       *         The anchor for the panel.
       * @param  messageId (string, required)
       *         For getting the message string from browser.properties:
       *         confirmationHint.<messageId>.label
       * @param  options (object, optional)
       *         An object with the following optional properties:
       *         - event (DOM event): The event that triggered the feedback.
       *         - hideArrow (boolean): Optionally hide the arrow.
       *         - showDescription (boolean): show description text (confirmationHint.<messageId>.description)
       *
       */
      show(anchor, messageId, options = {}) {
        this._reset();

        this._message.textContent = gBrowserBundle.GetStringFromName(
          `confirmationHint.${messageId}.label`
        );

        if (options.showDescription) {
          this._description.textContent = gBrowserBundle.GetStringFromName(
            `confirmationHint.${messageId}.description`
          );
          this._description.hidden = false;
          this._panel.classList.add("with-description");
        } else {
          this._description.hidden = true;
          this._panel.classList.remove("with-description");
        }

        if (options.hideArrow) {
          this._panel.setAttribute("hidearrow", "true");
        }

        this._panel.setAttribute("data-message-id", messageId);

        // The timeout value used here allows the panel to stay open for
        // 1.5s second after the text transition (duration=120ms) has finished.
        // If there is a description, we show for 4s after the text transition.
        const DURATION = options.showDescription ? 4000 : 1500;
        this._panel.addEventListener(
          "popupshown",
          () => {
            this._animationBox.setAttribute("animate", "true");
            this._timerID = setTimeout(() => {
              this._panel.hidePopup(true);
            }, DURATION + 120);
          },
          { once: true }
        );

        this._panel.addEventListener(
          "popuphidden",
          () => {
            // reset the timerId in case our timeout wasn't the cause of the popup being hidden
            this._reset();
          },
          { once: true }
        );

        this._panel.openPopup(anchor, {
          position: "bottomcenter topleft",
          triggerEvent: options.event,
        });
      },

      _reset() {
        if (this._timerID) {
          clearTimeout(this._timerID);
          this._timerID = null;
        }
        if (this.__panel) {
          this._panel.removeAttribute("hidearrow");
          this._animationBox.removeAttribute("animate");
          this._panel.removeAttribute("data-message-id");
        }
      },

      get _panel() {
        this._ensurePanel();
        return this.__panel;
      },

      get _animationBox() {
        this._ensurePanel();
        delete this._animationBox;
        return (this._animationBox = document.getElementById(
          "confirmation-hint-checkmark-animation-container"
        ));
      },

      get _message() {
        this._ensurePanel();
        delete this._message;
        return (this._message = document.getElementById("confirmation-hint-message"));
      },

      get _description() {
        this._ensurePanel();
        delete this._description;
        return (this._description = document.getElementById("confirmation-hint-description"));
      },

      _ensurePanel() {
        if (!this.__panel) {
          let wrapper = document.getElementById("confirmation-hint-wrapper");
          wrapper.replaceWith(wrapper.content);
          this.__panel = document.getElementById("confirmation-hint");
        }
      },
    };
  }

  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  let css = /* css */ `panel[type="arrow"][side="top"],
  panel[type="arrow"][side="bottom"] {
    margin-inline: -20px;
  }
  panel[type="arrow"][side="left"],
  panel[type="arrow"][side="right"] {
    margin-block: -20px;
  }
  #BMB_bookmarksPopup[side="top"],
  #BMB_bookmarksPopup[side="bottom"] {
    margin-inline: -20px;
  }
  #BMB_bookmarksPopup[side="left"],
  #BMB_bookmarksPopup[side="right"] {
    margin-block: -20px;
  }
  @media (-moz-platform: macos) {
    #BMB_bookmarksPopup[side="top"],
    #BMB_bookmarksPopup[side="bottom"] {
      margin-inline: -17px;
    }
    #BMB_bookmarksPopup[side="left"],
    #BMB_bookmarksPopup[side="right"] {
      margin-block: -17px;
    }
  }
  :is(panel, menupopup)::part(arrow) {
    -moz-context-properties: fill, stroke;
    fill: var(--arrowpanel-background);
    stroke: var(--arrowpanel-border-color);
  }
  :is(panel, menupopup)[side="top"]::part(arrow),
  :is(panel, menupopup)[side="bottom"]::part(arrow) {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="10"><path d="M 0,10 L 10,0 20,10 z" fill="context-stroke"/><path d="M 1,10 L 10,1 19,10 z" fill="context-fill"/></svg>');
    position: relative;
    margin-inline: 10px;
  }
  :is(panel, menupopup)[side="top"]::part(arrow) {
    margin-bottom: -5px;
  }
  :is(panel, menupopup)[side="bottom"]::part(arrow) {
    transform: scaleY(-1);
    margin-top: -5px;
  }
  :is(panel, menupopup)[side="left"]::part(arrow),
  :is(panel, menupopup)[side="right"]::part(arrow) {
    list-style-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"><path d="M 10,0 L 0,10 10,20 z" fill="context-stroke"/><path d="M 10,1 L 1,10 10,19 z" fill="context-fill"/></svg>');
    position: relative;
    margin-block: 10px;
  }
  :is(panel, menupopup)[side="left"]::part(arrow) {
    margin-right: -5px;
  }
  :is(panel, menupopup)[side="right"]::part(arrow) {
    transform: scaleX(-1);
    margin-left: -5px;
  }
  #confirmation-hint[hidearrow]::part(arrowbox) {
    visibility: hidden;
  }`;
  let uri = Services.io.newURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
  if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);

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
