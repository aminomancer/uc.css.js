// ==UserScript==
// @name           Toolbox Button
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new toolbar button that 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. Left click will open the toolbox for the active tab, or close it if it's already open. Right click will open the elevated browser toolbox if it's not already open. If it is already open, then instead of trying to start a new process and spawning an irritating dialog, it'll just show a brief notification saying the toolbox is already open. The button also shows a badge while a toolbox window is open. Middle click will toggle the preference for popup auto-hide: "ui.popup.disable_autohide". This does the same thing as the "Disable Popup Auto-Hide" option in the menu at the top right of the browser toolbox, prevents popups from closing so you can debug them. By default, when you open a browser toolbox window, the script will disable popup auto-hide, and then re-enable it when you close the toolbox. I find that I usually want popup auto-hide disabled when I'm using the toolbox, and never want it disabled when I'm not using the toolbox, so I made it automatic, instead of having to right click and then immediately middle click every time. If you don't like this automatic feature, you can turn it off by setting "userChrome.toolboxButton.popupAutohide.toggle-on-toolbox-launch" to false in about:config. When you middle click, the button will show a notification telling you the current status of popup auto-hide, e.g. "Holding popups open." This is just so that people who use the feature a lot won't lose track of whether it's on or off, and won't need to open a popup and try to close it to test it. (The toolbar button also changes appearance while popup auto-hide is disabled. It becomes blue like the downloads button and the icon changes into a popup icon — be sure to grab the icons from the resources folder, look for toolbox.svg and command-noautohide.svg) All of these notifications use the native confirmation hint custom element, since it looks nice. That's the one that appears when you save a bookmark, #confirmation-hint. So you can style them with that selector. This script needs a CSS rule in your userChrome.css: #confirmation-hint[data-message-id="hideCheckHint"] #confirmation-hint-message {margin-inline: 0 !important;} Otherwise the padding will be a little off for the message popup that says "Browser Toolbox is already open." I could have added this rule with javascript instead, but there's an internal CSS file that does exactly the opposite, 7px. Using !important in an inline style or overriding it with javascript just seems dirty. The icons for this button are in the resources folder on my repo: look for toolbox.svg and command-noautohide.svg. You'll need to recreate the folder structure for the URLs to work. If you can't use fx-autoconfig for whatever reason, you can try changing the URLs in this script. Take the icons and put them wherever you can access them. I don't recommend trying to load them using relative URLs, but it is possible. I'd recommend just using fx-autoconfig instead, so you can download the entire resources folder and put it in your chrome folder.
// ==/UserScript==

// Modify these strings for easy localization. I tried to use built-in strings for this so it would automatically localize itself, but I found that every reference to the "Browser Toolbox" throughout the entire firefox UI is derived from a single message in a single localization file, which doesn't follow the standard format. It can only be parsed by the devtools' own special l10n module, which itself can only be imported by a CJS module. Requiring CJS just for a button seems ridiculous, plus there really aren't any localized strings that work for these confirmation messages anyway, or even the tooltip. So if your UI language isn't English you can modify all the strings created by this script in the following object:
const toolboxButtonL10n = {
    buttonLabel: "Browser Toolbox", // The label of the button. Only appears in the overflow menu and the customize menu, unless you have toolbar button labels enabled.
    buttonTooltip: "Open Content/Browser Toolbox", // The button's tooltip. Appears on hover.
    alreadyOpenMsg: "Browser Toolbox is already open.", // Confirmation hint. You receive this message when you right click the toolbox button, but a toolbox process for the window is already open. You can only have one toolbox open per-window. So if I have 3 windows open, and I right-click the toolbox button in window 1, then it'll launch a browser toolbox for window 1. If I then right-click the toolbox button in window 2, it'll launch a browser toolbox for window 2. But if I go back to window 1 and right-click the toolbox button a second time, it will do nothing except show a brief confirmation hint to explain the lack of action.
    holdingOpenMsg: "Holding popups open.", // Confirmation hint. This appears when you first middle-click the toolbox button. It signifies that popups are being kept open. That is, "popup auto-hide" has been temporarily disabled.
    lettingCloseMsg: "Letting popups close.", // Confirmation hint. This appears when you middle-click the toolbox button a second time, toggling "popup auto-hide" back on, thereby allowing popups to close on their own.
};

(() => {
    function init() {
        let toolbox = ChromeUtils.import(
            "resource://devtools/client/framework/browser-toolbox/Launcher.jsm"
        ).BrowserToolboxLauncher;

        if (
            "chrome://browser/content/browser.xul" == location ||
            "chrome://browser/content/browser.xhtml" == location
        )
            try {
                CustomizableUI.createWidget({
                    id: "toolbox-button",
                    type: "custom",
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    label: toolboxButtonL10n.buttonLabel,
                    removable: true,
                    overflows: true,
                    tooltiptext: toolboxButtonL10n.buttonTooltip,
                    onBuild: function (aDoc) {
                        let CustomHint = {
                            _timerID: null,

                            /**
                             * Shows a transient, non-interactive confirmation hint anchored to an
                             * element, usually used in response to a user action to reaffirm that it was
                             * successful and potentially provide extra context.
                             *
                             * @param  anchor (DOM node, required)
                             *         The anchor for the panel.
                             * @param  message (string, required)
                             *         The message to be shown.
                             * @param  options (object, optional)
                             *         An object with the following optional properties:
                             *         - event (DOM event): The event that triggered the feedback.
                             *         - hideArrow (boolean): Optionally hide the arrow.
                             *         - hideCheck (boolean): Optionally hide the checkmark.
                             *         - description (string): Show description text.
                             *         - duration (numeric): How long the hint should stick around.
                             *
                             */
                            show(anchor, message, options = {}) {
                                this._reset();

                                this._message.textContent = message;

                                if (options.description) {
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
                                } else this._panel.setAttribute("data-message-id", "checkmarkHint");

                                const DURATION = options.duration || 1500;
                                this._panel.addEventListener(
                                    "popupshown",
                                    () => {
                                        this._animationBox.setAttribute("animate", "true");
                                        this._timerID = setTimeout(() => {
                                            this._panel.hidePopup(true);
                                            this._animationBox.removeAttribute("hidden");
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
                                    this._animationBox.removeAttribute("hidden");
                                }
                                if (this.__panel) {
                                    this._panel.removeAttribute("hidearrow");
                                    this._animationBox.removeAttribute("animate");
                                    this._panel.removeAttribute("data-message-id");
                                    this._panel.hidePopup();
                                }
                            },

                            get _panel() {
                                this._ensurePanel();
                                return this.__panel;
                            },

                            get _animationBox() {
                                this._ensurePanel();
                                delete this._animationBox;
                                return (this._animationBox = aDoc.getElementById(
                                    "confirmation-hint-checkmark-animation-container"
                                ));
                            },

                            get _message() {
                                this._ensurePanel();
                                delete this._message;
                                return (this._message = aDoc.getElementById(
                                    "confirmation-hint-message"
                                ));
                            },

                            get _description() {
                                this._ensurePanel();
                                delete this._description;
                                return (this._description = aDoc.getElementById(
                                    "confirmation-hint-description"
                                ));
                            },

                            _ensurePanel() {
                                if (!this.__panel) {
                                    // hook into the built-in confirmation hint element
                                    let wrapper = aDoc.getElementById("confirmation-hint-wrapper");
                                    wrapper?.replaceWith(wrapper.content);
                                    this.__panel = aDoc.getElementById("confirmation-hint");
                                    ConfirmationHint.__panel = aDoc.getElementById(
                                        "confirmation-hint"
                                    );
                                }
                            },
                        };

                        let toolbarbutton = aDoc.createXULElement("toolbarbutton"),
                            badgeStack = aDoc.createXULElement("stack"),
                            icon = aDoc.createXULElement("image"),
                            label = aDoc.createXULElement("label"),
                            badgeLabel = aDoc.createElement("label");
                        for (const [key, val] of Object.entries({
                            class: "toolbarbutton-1 chromeclass-toolbar-additional",
                            badged: true,
                            label: toolboxButtonL10n.buttonLabel,
                            id: "toolbox-button",
                            role: "button",
                            removable: true,
                            overflows: true,
                            tooltiptext: toolboxButtonL10n.buttonTooltip,
                            style: "-moz-box-align: center;",
                        }))
                            toolbarbutton.setAttribute(key, val);

                        let noAutoHideURL = `chrome://userchrome/content/devtools/command-noautohide.svg`;
                        let toolboxURL = `chrome://userchrome/content/skin/toolbox.svg`;

                        toolbarbutton.appendChild(badgeStack);
                        badgeStack.after(label);
                        badgeStack.appendChild(icon);
                        icon.after(badgeLabel);
                        badgeStack.setAttribute("class", "toolbarbutton-badge-stack");
                        icon.setAttribute("class", "toolbarbutton-icon");
                        icon.setAttribute("label", toolboxButtonL10n.buttonLabel);
                        icon.src = toolboxURL;
                        icon.style.cssText = `height: 16px; width: 16px; transition: fill 50ms ease-in-out 0s;`;
                        badgeLabel.setAttribute("class", "toolbarbutton-badge");
                        badgeStack.style.MozBoxPack = "center";
                        for (const [key, val] of Object.entries({
                            class: "toolbarbutton-text",
                            crop: "right",
                            value: toolboxButtonL10n.buttonLabel,
                            flex: "1",
                        }))
                            label.setAttribute(key, val);

                        let prefSvc = Services.prefs,
                            obSvc = Services.obs,
                            autoHide = "ui.popup.disable_autohide",
                            autoTogglePopups =
                                "userChrome.toolboxButton.popupAutohide.toggle-on-toolbox-launch",
                            animOptions = { duration: 300, iterations: 1, easing: "ease-in-out" },
                            keyframes = {
                                transform: [
                                    "scale(100%)",
                                    "scale(60%)",
                                    "scale(80%)",
                                    "scale(100%)",
                                    "scale(130%)",
                                    "scale(100%)",
                                ],
                                offset: [0, 0.05, 0.1, 0.2, 0.4, 1],
                            };

                        toolbarbutton.onclick = (e) => {
                            if (e.getModifierState("Accel")) return;
                            switch (e.button) {
                                case 0:
                                    e.target.ownerDocument.defaultView.key_toggleToolbox.click(); // toggle the content toolbox
                                    break;
                                case 2:
                                    toolbox.getBrowserToolboxSessionState() // check if a browser toolbox window is already open
                                        ? CustomHint.show(
                                              toolbarbutton,
                                              toolboxButtonL10n.alreadyOpenMsg,
                                              { event: e, hideCheck: true }
                                          ) // if so, just show a hint that it's already open
                                        : e.target.ownerDocument.defaultView.key_browserToolbox.click(); // if not, launch a new one
                                    break;
                                case 1:
                                    prefSvc.getBoolPref(autoHide) // check autohide pref state to dictate hint content
                                        ? CustomHint.show(
                                              toolbarbutton,
                                              toolboxButtonL10n.lettingCloseMsg,
                                              {
                                                  event: e,
                                                  hideCheck: true,
                                              }
                                          )
                                        : CustomHint.show(
                                              toolbarbutton,
                                              toolboxButtonL10n.holdingOpenMsg,
                                              {
                                                  event: e,
                                              }
                                          );
                                    prefSvc.setBoolPref(autoHide, !prefSvc.getBoolPref(autoHide)); // toggle the pref
                                    icon.animate(keyframes, animOptions); // animate the icon transformation
                                    break;
                                default:
                                    return;
                            }
                            e.preventDefault();
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
                            switch (pref) {
                                case autoHide:
                                    if (getPref(sub, pref)) {
                                        icon.src = noAutoHideURL; // change icon src to popup icon
                                        icon.style.fill =
                                            "var(--toolbarbutton-icon-fill-attention)"; // highlight color
                                    } else {
                                        icon.src = toolboxURL; // change icon src to toolbox icon
                                        icon.style.removeProperty("fill"); // un-highlight color
                                    }
                                    break;
                                case autoTogglePopups:
                                    toolbarbutton.autoTogglePopups = getPref(sub, pref);
                                    break;
                            }
                        }

                        /**
                         * listen for toolboxes opening and closing
                         */
                        function toolboxObserver(sub, _top, _data) {
                            let state = toolbox.getBrowserToolboxSessionState(); // whether a toolbox is open
                            badgeLabel.textContent = state ? 1 : ""; // set toolbar button's badge content
                            // if toolbox is open and autohide is not already enabled, enable it
                            if (sub === "initial-load" || !toolbarbutton.autoTogglePopups) return;
                            if (state && !prefSvc.getBoolPref(autoHide))
                                prefSvc.setBoolPref(autoHide, true);
                            // if toolbox just closed and autohide is not already disabled, disable it
                            else if (!state && prefSvc.getBoolPref(autoHide))
                                prefSvc.setBoolPref(autoHide, false);
                        }

                        /**
                         * remove this window's observers when the window closes, since observers are global
                         */
                        function uninit() {
                            prefSvc.removeObserver(autoHide, prefObserver);
                            prefSvc.removeObserver(autoTogglePopups, prefObserver);
                            obSvc.removeObserver(toolboxObserver, "devtools:loader:destroy");
                            obSvc.removeObserver(toolboxObserver, "devtools-thread-ready");
                            window.removeEventListener("unload", uninit, false);
                        }

                        function toolboxInit() {
                            prefObserver(prefSvc, null, autoHide);
                            prefObserver(prefSvc, null, autoTogglePopups);
                            toolboxObserver("initial-load");
                        }

                        if (!prefSvc.prefHasUserValue(autoTogglePopups))
                            prefSvc.setBoolPref(autoTogglePopups, true);
                        window.addEventListener("unload", uninit, false);
                        prefSvc.addObserver(autoHide, prefObserver); // listen for pref changes
                        prefSvc.addObserver(autoTogglePopups, prefObserver);
                        obSvc.addObserver(toolboxObserver, "devtools:loader:destroy"); // listen for toolbox process closing
                        obSvc.addObserver(toolboxObserver, "devtools-thread-ready"); // listen for toolbox process launching
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
                            obSvc.addObserver(delayedListener2, "browser-delayed-startup-finished");
                        }
                        return toolbarbutton;
                    },
                });
            } catch (e) {}
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
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
