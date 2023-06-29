// ==UserScript==
// @name           Restore pre-Proton Arrowpanels
// @version        1.3.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
This script will basically restore the arrows at the corner of panels that point at the element to which the panel is anchored. But in order to do that, you also need to install these files from the [resources/script-override][] folder: [panel.js][], [places-menupopup.js][], and [translation-notification.js][]. After downloading them and placing them in your own `resources/script-override/` folder, add the following lines to your [chrome.manifest][] file:

```
override chrome://global/content/elements/panel.js ../resources/script-override/panel.js
override chrome://browser/content/places/places-menupopup.js ../resources/script-override/places-menupopup.js
override chrome://browser/content/translation-notification.js ../resources/script-override/translation-notification.js
```

[resources/script-override]: https://github.com/aminomancer/uc.css.js/tree/master/resources/script-override
[panel.js]: https://github.com/aminomancer/uc.css.js/blob/master/resources/script-override/panel.js
[places-menupopup.js]: https://github.com/aminomancer/uc.css.js/blob/master/resources/script-override/places-menupopup.js
[translation-notification.js]: https://github.com/aminomancer/uc.css.js/blob/master/resources/script-override/translation-notification.js
[chrome.manifest]: https://github.com/aminomancer/uc.css.js/blob/master/utils/chrome.manifest
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/restorePreProtonArrowpanels.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/restorePreProtonArrowpanels.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  (function() {
    let { PopupNotifications } = ChromeUtils.importESModule(
      "resource://gre/modules/PopupNotifications.sys.mjs"
    );
    if (
      PopupNotifications.prototype._showPanel.name ===
      "PopupNotifications_showPanel"
    ) {
      const NOTIFICATION_EVENT_SHOWING = "showing";
      const NOTIFICATION_EVENT_SHOWN = "shown";
      const TELEMETRY_STAT_OFFERED = 0;
      eval(
        `PopupNotifications.prototype._showPanel = function ${PopupNotifications.prototype._showPanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function\s*/, "")
          .replace(/^PopupNotifications_showPanel\s*/, "")
          .replace(/^(.)/, `uc_PopupNotifications_showPanel$1`)
          .replace(/bottomleft/, "bottomcenter")}`
      );
    }
  })();

  (function() {
    let { ExtensionsUI } = ChromeUtils.import(
      "resource:///modules/ExtensionsUI.jsm"
    );
    if (ExtensionsUI.showPermissionsPrompt.name === "showPermissionsPrompt") {
      const DEFAULT_EXTENSION_ICON =
        "chrome://mozapps/skin/extensions/extensionGeneric.svg";
      function getTabBrowser(browser) {
        while (
          browser.ownerGlobal.docShell.itemType !== Ci.nsIDocShell.typeChrome
        ) {
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
        `ExtensionsUI.showPermissionsPrompt = async function ${ExtensionsUI.showPermissionsPrompt
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^showPermissionsPrompt\s*/, "")
          .replace(/^(.)/, `uc_showPermissionsPrompt$1`)
          .replace(/bottomright/, "bottomcenter")}`
      );
      if (
        ExtensionsUI.showDefaultSearchPrompt.name === "showDefaultSearchPrompt"
      ) {
        eval(
          `ExtensionsUI.showDefaultSearchPrompt = async function ${ExtensionsUI.showDefaultSearchPrompt
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^function\s*/, "")
            .replace(/^showDefaultSearchPrompt\s*/, "")
            .replace(/^(.)/, `uc_showDefaultSearchPrompt$1`)
            .replace(/bottomright/, "bottomcenter")}`
        );
      }
    }
  })();

  (function() {
    let { UITour } = ChromeUtils.import("resource:///modules/UITour.jsm");
    if (UITour.showInfo.name === "showInfo") {
      const lazy = {
        log: { warn() {} },
      };
      eval(
        `UITour.showInfo = async function ${UITour.showInfo
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^showInfo\s*/, "")
          .replace(/^(.)/, `uc_showInfo$1`)
          .replace(/bottomright/, "bottomcenter")}`
      );
    }
  })();

  (function() {
    let { CustomizeMode } = ChromeUtils.import(
      "resource:///modules/CustomizeMode.jsm"
    );
    if (
      CustomizeMode.prototype._showDownloadsAutoHidePanel.name ===
      "_showDownloadsAutoHidePanel"
    ) {
      eval(
        `CustomizeMode.prototype._showDownloadsAutoHidePanel = async function ${CustomizeMode.prototype._showDownloadsAutoHidePanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^async\s*/, "")
          .replace(/^function\s*/, "")
          .replace(/^_showDownloadsAutoHidePanel\s*/, "")
          .replace(/^(.)/, `uc_showDownloadsAutoHidePanel$1`)
          .replace(/topleft topright/, "leftcenter topright")
          .replace(/topright topleft/, "rightcenter topleft")}`
      );
    }
  })();

  let dummyNotification = document.createXULElement("notification", {
    is: "translation-notification",
  });
  dummyNotification.remove();

  if (
    window.DownloadsPanel?._openPopupIfDataReady.name ===
    "_openPopupIfDataReady"
  ) {
    eval(
      `DownloadsPanel._openPopupIfDataReady = function ${DownloadsPanel._openPopupIfDataReady
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^_openPopupIfDataReady\s*/, "")
        .replace(/^(.)/, `uc_openPopupIfDataReady$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (window.PanelUI?.showSubView.name === "showSubView") {
    eval(
      `PanelUI.showSubView = async function ${PanelUI.showSubView
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^async\s*/, "")
        .replace(/^function\s*/, "")
        .replace(/^showSubView\s*/, "")
        .replace(/^(.)/, `uc_showSubView$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (
    window.PanelUI?._showNotificationPanel.name === "_showNotificationPanel"
  ) {
    eval(
      `PanelUI._showNotificationPanel = function ${PanelUI._showNotificationPanel
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^_showNotificationPanel\s*/, "")
        .replace(/^(.)/, `uc_showNotificationPanel$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (window.gUnifiedExtensions?.togglePanel.name === "togglePanel") {
    eval(
      `gUnifiedExtensions.togglePanel = async function ${gUnifiedExtensions.togglePanel
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^async\s*/, "")
        .replace(/^function\s*/, "")
        .replace(/^togglePanel\s*/, "")
        .replace(/^(.)/, `uc_togglePanel$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (
    gSharedTabWarning.willShowSharedTabWarning.name ===
    "willShowSharedTabWarning"
  ) {
    eval(
      `gSharedTabWarning.willShowSharedTabWarning = function ${gSharedTabWarning.willShowSharedTabWarning
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^willShowSharedTabWarning\s*/, "")
        .replace(/^(.)/, `uc_willShowSharedTabWarning$1`)
        .replace(/bottomleft/, "bottomcenter")}`
    );
  }

  if (
    window.gProtectionsHandler?.showProtectionsPopup.name ===
    "showProtectionsPopup"
  ) {
    eval(
      `gProtectionsHandler.showProtectionsPopup = function ${gProtectionsHandler.showProtectionsPopup
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^showProtectionsPopup\s*/, "")
        .replace(/^(.)/, `uc_showProtectionsPopup$1`)
        .replace(/bottomleft/, "bottomcenter")}`
    );
  }

  if (window.gIdentityHandler?._openPopup.name === "_openPopup") {
    eval(
      `gIdentityHandler._openPopup = function ${gIdentityHandler._openPopup
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^_openPopup\s*/, "")
        .replace(/^(.)/, `uc_openPopup$1`)
        .replace(/bottomleft/, "bottomcenter")}`
    );
  }

  if (
    window.BrowserPageActions?.togglePanelForAction.name ===
    "togglePanelForAction"
  ) {
    eval(
      `BrowserPageActions.togglePanelForAction = function ${BrowserPageActions.togglePanelForAction
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^togglePanelForAction\s*/, "")
        .replace(/^(.)/, `uc_togglePanelForAction$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (window.BrowserPageActions?.showPanel.name === "showPanel") {
    eval(
      `BrowserPageActions.showPanel = function ${BrowserPageActions.showPanel
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^showPanel\s*/, "")
        .replace(/^(.)/, `uc_showPanel$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  function removeNotificationOnEnd(notification, installs) {
    let count = installs.length;

    function maybeRemove(install) {
      install.removeListener(this);

      if (--count == 0) {
        // Check that the notification is still showing
        let current = PopupNotifications.getNotification(
          notification.id,
          notification.browser
        );
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

  if (
    window.gXPInstallObserver?.showInstallConfirmation.name ===
    "showInstallConfirmation"
  ) {
    eval(
      `gXPInstallObserver.showInstallConfirmation = function ${gXPInstallObserver.showInstallConfirmation
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^function\s*/, "")
        .replace(/^showInstallConfirmation\s*/, "")
        .replace(/^(.)/, `uc_showInstallConfirmation$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  if (window.gXPInstallObserver?.observe.name === "observe") {
    eval(
      `gXPInstallObserver.observe = async function ${gXPInstallObserver.observe
        .toSource()
        .replace(/^\(/, "")
        .replace(/\)$/, "")
        .replace(/^async\s*/, "")
        .replace(/^function\s*/, "")
        .replace(/^observe\s*/, "")
        .replace(/^(.)/, `uc_observe$1`)
        .replace(/bottomright/, "bottomcenter")}`
    );
  }

  eval(
    `StarUI.showEditBookmarkPopup = async function ${StarUI.showEditBookmarkPopup
      .toSource()
      .replace(/^\(/, "")
      .replace(/\)$/, "")
      .replace(/async showEditBookmarkPopup/, "")
      .replace(/async function\s*/, "")
      .replace(/bottomright/, "bottomcenter")}`
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
      .content.getElementById("extension-notification-panel").position =
      "bottomcenter topright";
  } catch (error) {}
  try {
    document
      .getElementById("confirmation-hint-wrapper")
      .content.getElementById("confirmation-hint").position =
      "bottomcenter topright";
  } catch (error) {}
  try {
    document
      .getElementById("pageActionPanelTemplate")
      .content.getElementById("pageActionPanel").position =
      "bottomcenter topright";
  } catch (error) {}
  document.getElementById("appMenu-popup").position = "bottomcenter topright";
  document.getElementById("widget-overflow").position = "bottomcenter topright";
  let uePanel =
    document
      .getElementById("unified-extensions-panel-template")
      ?.content.querySelector("panel") ||
    document.getElementById("unified-extensions-panel");
  if (uePanel) {
    uePanel.position = "bottomcenter topright";
  }
  document.getElementById("sidebarMenu-popup").position = "bottomleft topleft";
  document.getElementById("confirmation-hint").position =
    "bottomcenter topright";

  function init() {
    window.ConfirmationHint = {
      ...window.ConfirmationHint,

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
       *         For getting the message string from confirmationHints.ftl
       * @param  options (object, optional)
       *         An object with the following optional properties:
       *         - event (DOM event): The event that triggered the feedback
       *         - descriptionId (string): message ID of the description text
       *
       */
      show(anchor, messageId, options = {}) {
        this._reset();

        MozXULElement.insertFTLIfNeeded("toolkit/branding/brandings.ftl");
        MozXULElement.insertFTLIfNeeded("browser/confirmationHints.ftl");
        document.l10n.setAttributes(this._message, messageId);

        if (options.descriptionId) {
          document.l10n.setAttributes(this._description, options.descriptionId);
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
    };
  }

  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );
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
  let uri = Services.io.newURI(
    `data:text/css;charset=UTF=8,${encodeURIComponent(css)}`
  );
  if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
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
