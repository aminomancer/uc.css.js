// ==UserScript==
// @name           Toolbox Button
// @version        1.4.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Adds a new toolbar button that 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. Left click will open the toolbox for the active tab, or close it if it's already open. Right click will open the elevated browser toolbox if it's not already open. If it is already open, then instead of trying to start a new process and spawning an irritating dialog, it'll just show a brief notification saying the toolbox is already open. The button also shows a badge while a toolbox window is open. Middle click will toggle the preference for popup auto-hide: `ui.popup.disable_autohide`. This does the same thing as the "Disable Popup Auto-Hide" option in the menu at the top right of the browser toolbox, prevents popups from closing so you can debug them.

If you want to change which mouse buttons execute which functions, search for `userChrome.toolboxButton.mouseConfig` in <about:config>. Change the 0, 1, and 2 values. 0 = left click, 1 = middle, and 2 = right. By default, when you open a browser toolbox window, the script will disable popup auto-hide, and then re-enable it when you close the toolbox. I find that I usually want popup auto-hide disabled when I'm using the toolbox, and never want it disabled when I'm not using the toolbox, so I made it automatic, instead of having to right click and then immediately middle click every time. If you don't like this automatic feature, you can turn it off by setting `userChrome.toolboxButton.popupAutohide.toggle-on-toolbox-launch` to false in about:config.

You can force the browser toolbox to open in multiprocess mode by holding Shift and Accel (Ctrl/Cmd) when you right click (or whatever mouse button you set `browserToolbox` to for `userChrome.toolboxButton.mouseConfig`) the button.

When you middle click, the button will show a notification telling you the current status of popup auto-hide, e.g. "Holding popups open." This is just so that people who use the feature a lot won't lose track of whether it's on or off, and won't need to open a popup and try to close it to test it. The toolbar button also changes appearance while popup auto-hide is disabled. It becomes blue like the downloads button and the icon changes into a popup icon. This change is animated, as long as the user doesn't have reduced motion enabled. All of these notifications use the native confirmation hint custom element, since it looks nice. That's the one that appears when you save a bookmark, `#confirmation-hint`. So you can customize them with that selector.
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/atoolboxButton.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/atoolboxButton.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  // Modify these strings for easy localization. I tried to use built-in strings
  // for this so it would automatically localize itself, but I found that every
  // reference to the "Browser Toolbox" throughout the entire firefox UI is
  // derived from a single message in a single localization file, which doesn't
  // follow the standard format. It can only be parsed by the devtools' own
  // special l10n module, which itself can only be imported by a CJS module.
  // Requiring CJS just for a button seems ridiculous, plus there really aren't
  // any localized strings that work for these confirmation messages anyway, or
  // even the tooltip. So if your UI language isn't English you can modify all the
  // strings created by this script in the following object:
  const l10n = {
    // Confirmation hint. You receive this message when you right click the
    // toolbox button, but a toolbox process for the window is already open. You
    // can only have one toolbox open per-window. So if I have 3 windows open, and
    // I right-click the toolbox button in window 1, then it'll launch a browser
    // toolbox for window 1. If I then right-click the toolbox button in window 2,
    // it'll launch a browser toolbox for window 2. But if I go back to window 1
    // and right-click the toolbox button a second time, it will do nothing except
    // show a brief confirmation hint to explain the lack of action.
    alreadyOpenMsg: "Browser Toolbox is already open.",
    // Confirmation hint. This appears when you first middle-click the toolbox
    // button. It signifies that popups are being kept open. That is, "popup
    // auto-hide" has been temporarily disabled.
    holdingOpenMsg: "Holding popups open.",
    // Confirmation hint. This appears when you middle-click the toolbox button a
    // second time, toggling "popup auto-hide" back on, thereby allowing popups to
    // close on their own.
    lettingCloseMsg: "Letting popups close.",

    bundles: {},
    strings: new Map(),
    getString(name, where) {
      let string = this.strings.get(name);
      if (string) return string;
      string = this.bundles[where].GetStringFromName(name);
      this.strings.set(name, string);
      return string;
    },
    getFluentValue(id, args) {
      return this.fluentStrings.formatValueSync(id, args);
    },
    get defaultLabel() {
      return this.getString("toolbox.label", "toolbox");
    },
    get defaultTooltip() {
      return this.defaultLabel;
    },
  };
  ChromeUtils.defineLazyGetter(l10n.bundles, "menu", () =>
    Services.strings.createBundle("chrome://devtools/locale/menus.properties")
  );
  ChromeUtils.defineLazyGetter(l10n.bundles, "toolbox", () =>
    Services.strings.createBundle("chrome://devtools/locale/toolbox.properties")
  );
  ChromeUtils.defineLazyGetter(
    l10n,
    "fluentStrings",
    () => new Localization(["devtools/client/toolbox.ftl"], true)
  );

  if (
    /^chrome:\/\/browser\/content\/browser.(xul||xhtml)$/i.test(location) &&
    !CustomizableUI.getPlacementOfWidget("toolbox-button", true)
  ) {
    const { loader } = ChromeUtils.importESModule(
      "resource://devtools/shared/loader/Loader.sys.mjs"
    );
    const lazy = {};
    ChromeUtils.defineESModuleGetters(lazy, {
      BrowserToolboxLauncher:
        "resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs",
    });
    for (const [key, val] of Object.entries({
      gDevToolsBrowser:
        "resource://devtools/client/framework/devtools-browser.js",
      Actor: "resource://devtools/shared/protocol/Actor.js",
      dumpn: "resource://devtools/shared/DevToolsUtils.js",
    })) {
      loader.lazyRequireGetter(lazy, key, val, true);
    }

    CustomizableUI.createWidget({
      id: "toolbox-button",
      type: "custom",
      defaultArea: CustomizableUI.AREA_NAVBAR,
      label: l10n.defaultLabel,
      removable: true,
      overflows: true,
      tooltiptext: l10n.defaultTooltip,
      onBuild(aDoc) {
        let CustomHint = {
          ...aDoc.ownerGlobal.ConfirmationHint,

          /**
           * Shows a transient, non-interactive confirmation hint anchored to an
           * element, usually used in response to a user action to reaffirm that
           * it was successful and potentially provide extra context.
           *
           * @param  anchor (DOM node, required)
           *         The anchor for the panel. A value of null will anchor to the
           *         viewpoint (see options.x below)
           * @param  message (string, required)
           *         The message to be shown.
           * @param  options (object, optional)
           *         An object with any number of the following optional properties:
           *         - event (DOM event): The event that triggered the feedback.
           *         - hideArrow (boolean): Optionally hide the arrow.
           *         - hideCheck (boolean): Optionally hide the checkmark.
           *         - description (string): If provided, show a more detailed
           *                                 description/subtitle with the passed text.
           *         - duration (numeric): How long the hint should stick around, in
           *                               milliseconds. Default is 1500 — 1.5 seconds.
           *         - position (string): One of a number of strings representing how the anchor point of the popup
           *                              is aligned relative to the anchor point of the anchor node.
           *                              Possible values for position are:
           *                                  before_start, before_end, after_start, after_end,
           *                                  start_before, start_after, end_before, end_after,
           *                                  overlap, after_pointer
           *                              For example, after_start means the anchor node's bottom left corner will
           *                              be aligned with the popup node's top left corner. overlap means their
           *                              top left corners will be lined up exactly, so they will overlap.
           *         - x (number): Horizontal offset in pixels, relative to the anchor.
           *                       If no anchor is provided, relative to the viewport.
           *         - y (number): Vertical offset in pixels, relative to the anchor. Negative
           *                       values may also be used to move to the left and upwards respectively.
           *                       Unanchored popups may be created by supplying null as the
           *                       anchor node. An unanchored popup appears at the position
           *                       specified by x and y, relative to the viewport of the document
           *                       containing the popup node. (ignoring the anchor parameter)
           *
           */
          show(anchor, message, options = {}) {
            this._reset();

            this._message.removeAttribute("data-l10n-id");
            this._message.textContent = message;

            if (options.description) {
              this._description.removeAttribute("data-l10n-id");
              this._description.textContent = options.description;
              this._description.hidden = false;
              this._panel.classList.add("with-description");
            } else {
              this._description.hidden = true;
              this._panel.classList.remove("with-description");
            }

            if (options.hideArrow) {
              this._panel.setAttribute("hidearrow", "true");
            }

            if (options.hideCheck) {
              this._animationBox.setAttribute("hidden", "true");
              this._panel.setAttribute("data-message-id", "hideCheckHint");
            } else {
              this._animationBox.removeAttribute("hidden");
              this._panel.setAttribute("data-message-id", "checkmarkHint");
            }

            const DURATION = options.duration || 1500;
            this._panel.addEventListener(
              "popupshown",
              () => {
                this._animationBox.setAttribute("animate", "true");
                this._timerID = setTimeout(
                  () => this._panel.hidePopup(true),
                  DURATION + 120
                );
              },
              { once: true }
            );

            this._panel.addEventListener("popuphidden", () => this._reset(), {
              once: true,
            });

            let { position, x, y } = options;
            this._panel.openPopup(null, {
              position,
              triggerEvent: options.event,
            });
            this._panel.moveToAnchor(anchor, position, x, y);
          },

          _reset() {
            if (this._timerID) {
              clearTimeout(this._timerID);
              this._timerID = null;
              this._animationBox.removeAttribute("hidden");
            }
            if (this.__panel) {
              this._panel.removeAttribute("hidearrow");
              this._animationBox.removeAttribute("animate");
              this._panel.removeAttribute("data-message-id");
              this._panel.hidePopup();
            }
          },

          _ensurePanel() {
            if (!this.__panel) {
              // hook into the built-in confirmation hint element
              let wrapper = document.getElementById(
                "confirmation-hint-wrapper"
              );
              wrapper?.replaceWith(wrapper.content);
              this.__panel = ConfirmationHint.__panel =
                document.getElementById("confirmation-hint");
            }
          },
        };

        let toolbarbutton = aDoc.createXULElement("toolbarbutton");
        let badgeStack = aDoc.createXULElement("stack");
        let icon = aDoc.createXULElement("image");
        let label = aDoc.createXULElement("label");
        let badgeLabel = aDoc.createElement("label");
        for (const [key, val] of Object.entries({
          class: "toolbarbutton-1 chromeclass-toolbar-additional",
          badged: true,
          label: l10n.defaultLabel,
          id: "toolbox-button",
          role: "button",
          icon: "toolbox",
          removable: true,
          overflows: true,
          tooltiptext: l10n.defaultTooltip,
        })) {
          toolbarbutton.setAttribute(key, val);
        }

        toolbarbutton.appendChild(badgeStack);
        badgeStack.after(label);
        badgeStack.appendChild(icon);
        icon.after(badgeLabel);
        badgeStack.setAttribute("class", "toolbarbutton-badge-stack");
        icon.setAttribute("class", "toolbarbutton-icon");
        badgeLabel.setAttribute("class", "toolbarbutton-badge");
        for (const [key, val] of Object.entries({
          class: "toolbarbutton-text",
          crop: "right",
          flex: "1",
          value: l10n.defaultLabel,
        })) {
          label.setAttribute(key, val);
        }

        let prefSvc = Services.prefs;
        let defaultPrefs = prefSvc.getDefaultBranch("");
        let obSvc = Services.obs;
        let toolboxBranch = "userChrome.toolboxButton";
        let autoHide = "ui.popup.disable_autohide";
        let autoTogglePopups =
          "userChrome.toolboxButton.popupAutohide.toggle-on-toolbox-launch";
        let mouseConfig = "userChrome.toolboxButton.mouseConfig";

        let onClick = function (e) {
          let { button } = e;
          let accel = e.getModifierState("Accel");
          let shift = e.getModifierState("Shift");
          if (accel) {
            if (button == 2 && !shift) {
              return;
            }
            if (button == 0 && AppConstants.platform == "macosx") {
              button = 2;
              accel = false;
            }
          }
          switch (button) {
            case this.mouseConfig.contentToolbox:
              // toggle the content toolbox
              lazy.gDevToolsBrowser.toggleToolboxCommand(
                aDoc.ownerGlobal.gBrowser
              );
              break;
            case this.mouseConfig.browserToolbox:
              if (lazy.BrowserToolboxLauncher.getBrowserToolboxSessionState()) {
                // check if a browser toolbox window is already open. if so,
                // just show a hint that it's already open.
                CustomHint.show(toolbarbutton, l10n.alreadyOpenMsg, {
                  event: e,
                  hideCheck: true,
                });
              } else {
                // if not, launch a new one.
                lazy.BrowserToolboxLauncher.init({
                  forceMultiprocess: accel && shift,
                });
              }
              break;
            case this.mouseConfig.popupHide:
              CustomHint.show(
                toolbarbutton,
                l10n[this.popupAutoHide ? "lettingCloseMsg" : "holdingOpenMsg"],
                { event: e, hideCheck: this.popupAutoHide }
              );
              // toggle the pref
              prefSvc.setBoolPref(autoHide, !this.popupAutoHide);
              // animate the icon transformation
              this.triggerAnimation();
              break;
            default:
              return;
          }
          e.preventDefault();
        };

        if (AppConstants.platform === "macosx") {
          toolbarbutton.onmousedown = onClick;
          toolbarbutton.onclick = e => {
            if (e.getModifierState("Accel")) return;
            e.preventDefault();
          };
        } else {
          toolbarbutton.onclick = onClick;
        }

        toolbarbutton.triggerAnimation = function () {
          this.addEventListener(
            "animationend",
            () => this.removeAttribute("animate"),
            { once: true }
          );
          this.setAttribute("animate", "true");
        };

        function getPref(root, pref) {
          switch (root.getPrefType(pref)) {
            case root.PREF_BOOL:
              return root.getBoolPref(pref);
            case root.PREF_INT:
              return root.getIntPref(pref);
            case root.PREF_STRING:
              return root.getStringPref(pref);
            default:
              return null;
          }
        }

        function prefObserver(sub, _top, pref) {
          let value = getPref(sub, pref);
          switch (pref) {
            case autoHide:
              if (value === null) value = false;
              toolbarbutton.popupAutoHide = value;
              if (value) {
                // change icon src to popup icon
                toolbarbutton.setAttribute("icon", "autohide");
                // highlight color
                icon.style.fill = "var(--toolbarbutton-icon-fill-attention)";
              } else {
                // change icon src to toolbox icon
                toolbarbutton.setAttribute("icon", "toolbox");
                // un-highlight color
                icon.style.removeProperty("fill");
              }
              break;
            case autoTogglePopups:
              if (value === null) value = true;
              toolbarbutton.autoTogglePopups = value;
              break;
            case mouseConfig:
              if (value === null) {
                value = {
                  contentToolbox: 0,
                  browserToolbox: 2,
                  popupHide: 1,
                };
              }
              toolbarbutton.mouseConfig = JSON.parse(value);
              toolbarbutton.setStrings();
              break;
          }
        }

        // listen for toolboxes opening and closing
        function toolboxObserver(sub, top, _data) {
          // whether a toolbox is open
          let state =
            lazy.BrowserToolboxLauncher.getBrowserToolboxSessionState();
          // set toolbar button's badge content
          badgeLabel.textContent = state ? 1 : "";
          // if toolbox is open and autohide is not already enabled, enable it
          switch (top) {
            case "initial-load":
              return;
            // when a thread is created, set up its destroy method so it will
            // call the observer when it's destroyed. this ensures that if a
            // toolbox is closed while a content toolbox is inspecting the
            // system principal (such as on about:preferences), we will still
            // get notified that the toolbox has closed. otherwise, we wouldn't
            // get notified until the content toolbox also closes.
            case "devtools-thread-ready": {
              let threadActor = sub?.wrappedJSObject;
              if (threadActor) {
                if (threadActor.destroy.name !== "destroyThreadActor") {
                  const STATES = {
                    DETACHED: "detached",
                    EXITED: "exited",
                    RUNNING: "running",
                    PAUSED: "paused",
                  };
                  eval(
                    `threadActor.destroy = function destroyThreadActor ${threadActor.destroy
                      .toString()
                      .replace(/^destroy/, "")
                      .replace(/dumpn/, "lazy.dumpn")
                      .replace(
                        /super\.destroy\(\)/,
                        `lazy.Actor.prototype.destroy.call(this);
                        // this leads back to toolboxObserver in 200ms
                        setTimeout(() => Services.obs.notifyObservers(null, "devtools-thread-destroyed"), 200);`
                      )}`
                  );
                }
              }
              break;
            }
            default:
              break;
          }
          if (!toolbarbutton.autoTogglePopups) return;
          if (state && !toolbarbutton.popupAutoHide) {
            prefSvc.setBoolPref(autoHide, true);
          }
          // if toolbox just closed and autohide is not already disabled, disable it
          else if (!state && toolbarbutton.popupAutoHide) {
            prefSvc.setBoolPref(autoHide, false);
          }
        }

        toolbarbutton.setStrings = function () {
          let hotkey, labelString;
          for (const [key, val] of Object.entries(toolbarbutton.mouseConfig)) {
            if (val === 0) {
              switch (key) {
                case "contentToolbox":
                  labelString = l10n.getString("toolbox.label", "toolbox");
                  hotkey = aDoc.getElementById("key_toggleToolbox");
                  break;
                case "browserToolbox":
                  labelString = l10n.getString(
                    "browserToolboxMenu.label",
                    "menu"
                  );
                  hotkey = aDoc.getElementById("key_browserToolbox");
                  break;
                case "popupHide":
                  labelString = l10n.getFluentValue(
                    "toolbox-meatball-menu-noautohide-label"
                  );
                  break;
              }
            }
          }
          let shortcut = hotkey
            ? ` (${ShortcutUtils.prettifyShortcut(hotkey)})`
            : "";
          toolbarbutton.label = labelString;
          label.value = labelString;
          toolbarbutton.tooltipText = labelString + shortcut;
        };

        // remove this window's observers when the window closes, since observers are global
        function uninit() {
          prefSvc.removeObserver(autoHide, prefObserver);
          prefSvc.removeObserver(toolboxBranch, prefObserver);
          for (const topic of [
            "devtools-thread-ready",
            "devtools-thread-destroyed",
            "devtools:loader:destroy",
          ]) {
            obSvc.removeObserver(toolboxObserver, topic);
          }
          window.removeEventListener("unload", uninit);
        }

        function toolboxInit() {
          prefObserver(prefSvc, null, autoHide);
          prefObserver(prefSvc, null, autoTogglePopups);
          prefObserver(prefSvc, null, mouseConfig);
          toolboxObserver(null, "initial-load");
        }

        defaultPrefs.setBoolPref(autoTogglePopups, true);
        defaultPrefs.setStringPref(
          mouseConfig,
          `{"contentToolbox": 0, "browserToolbox": 2, "popupHide": 1}`
        );
        window.addEventListener("unload", uninit);
        prefSvc.addObserver(autoHide, prefObserver);
        prefSvc.addObserver(toolboxBranch, prefObserver);
        for (const topic of [
          "devtools-thread-ready",
          "devtools-thread-destroyed",
          "devtools:loader:destroy",
        ]) {
          obSvc.addObserver(toolboxObserver, topic);
        }
        if (gBrowserInit.delayedStartupFinished) {
          toolboxInit();
        } else {
          let delayedListener2 = (subject, topic) => {
            if (
              topic == "browser-delayed-startup-finished" &&
              subject == window
            ) {
              obSvc.removeObserver(delayedListener2, topic);
              toolboxInit();
            }
          };
          obSvc.addObserver(
            delayedListener2,
            "browser-delayed-startup-finished"
          );
        }
        return toolbarbutton;
      },
    });
  }

  let styleSvc = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
    Ci.nsIStyleSheetService
  );
  let toolboxCSS = /* css */ `
  .toolbarbutton-1#toolbox-button {
    --uc-toolbox-button: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="context-fill" fill-opacity="context-fill-opacity" width="16" height="16" viewBox="0 0 16 16"><path d="M16,8V6c0-1.105-.895-2-2-2H2C0.895,4,0,4.895,0,6v2h4v1.333H0v5.333c0,.368,.298,.667,.667,.667h14.667 c0.368,0,.667-.298,.667-.667V9.333h-4V8H16z M11.333,10.667H10.6c-.058,.233-.148,.457-.267,.667l0.533,.533L9.933,12.8 L9.4,12.267l-.667,.267v0.8h-1.4V12.6l-.667-.267l-.533,.533l-.933-1l0.533-.533c-.119-.209-.208-.433-.267-.667h-.8 V9.333H5.4C5.458,9.1,5.548,8.876,5.667,8.667L5.133,8.133L6.067,7.2L6.6,7.733l0.667-.267v-.8H8.6V7.4l0.667,.267L9.8,7.133 l0.933,.933L10.2,8.6c0.119,.209,.208,.433,.267,.667h0.867L11.333,10.667L11.333,10.667z"/><circle cx="8" cy="10" r="1.333"/><path d="M6,2h4v1.333h1.333v-2c0-.368-.298-.667-.667-.667H5.333c-.368,0-.667,.298-.667,.667v2H6V2z"/></svg>');
    --uc-autohide-button: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity" viewBox="0 0 16 16"><path d="M5.293.293a1 1 0 011.414 0L8.414 2H13a3 3 0 013 3v8a3 3 0 01-3 3H3a3 3 0 01-3-3V5a3 3 0 013-3h.586L5.293.293zM6 2.414L4.707 3.707A1 1 0 014 4H3c-.545 0-1 .455-1 1v8c0 .545.455 1 1 1h10c.545 0 1-.455 1-1V5c0-.545-.455-1-1-1H8a1 1 0 01-.707-.293L6 2.414z"/></svg>');
    list-style-image: var(--uc-toolbox-button);
    align-items: center;
  }
  .toolbarbutton-1#toolbox-button[icon="autohide"] {
    list-style-image: var(--uc-autohide-button);
  }
  .toolbarbutton-1#toolbox-button .toolbarbutton-badge-stack {
    justify-items: center;
  }
  .toolbarbutton-1#toolbox-button .toolbarbutton-icon {
    height: 16px;
    width: 16px;
    transition: fill 50ms ease-in-out 0s;
    background-image: var(--uc-toolbox-button), var(--uc-autohide-button);
    background-size: 0, 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    .toolbarbutton-1#toolbox-button[animate] .toolbarbutton-icon {
      animation-name: toolboxButtonPulse;
      animation-duration: 200ms;
      animation-iteration-count: 1;
      animation-timing-function: ease-in-out;
    }
  }
  @keyframes toolboxButtonPulse {
    from {
      transform: scale(1);
    }
    40% {
      transform: scale(0.7);
    }
    to {
      transform: scale(1);
    }
  }
  #confirmation-hint[data-message-id="hideCheckHint"] #confirmation-hint-message {
    margin-inline: 0;
  }`;
  let styleURI = makeURI(
    `data:text/css;charset=UTF=8,${encodeURIComponent(toolboxCSS)}`
  );
  if (!styleSvc.sheetRegistered(styleURI, styleSvc.AUTHOR_SHEET)) {
    styleSvc.loadAndRegisterSheet(styleURI, styleSvc.AUTHOR_SHEET);
  }

  let observer = new MutationObserver(() => {
    if (document.getElementById("key_toggleToolbox")) {
      CustomizableUI.getWidget("toolbox-button")
        .forWindow(window)
        .node.setStrings();
      observer.disconnect();
      observer = null;
    }
  });
  observer.observe(document.body, { childList: true });
})();
