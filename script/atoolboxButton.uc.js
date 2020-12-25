// ==UserScript==
// @name           Toolbox Button
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new toolbar button that 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click.
// Left click will open the toolbox for the active tab, or close it if it's already open.
// Right click will open the elevated browser toolbox if it's not already open.
// If it is already open, then instead of trying to start a new process and spawning an irritating dialog, it'll just show a brief notification saying the toolbox is already open.
// Middle click will toggle the preference for popup auto-hide: ui.popup.disable_autohide
// This does the same thing as the "Disable Popup Auto-Hide" option in the menu at the top right of the browser toolbox...
// except it will also show a notification telling you the current status of that preference, e.g. "Holding popups open."
// This is just so that people who use the feature a lot won't lose track of whether it's on or off, and won't need to open a context menu to test it.
// All of these notifications use the native confirmation hint custom element, since it looks nice.
// That's the one that appears when you save a bookmark, #confirmation-hint. So you can style them with that selector.
// This script needs a CSS rule in your userChrome.css: #confirmation-hint[data-message-id="hideCheckHint"] #confirmation-hint-message {margin-inline: 0;}
// Otherwise the padding will be a little off for the message popup that says "Browser Toolbox is already open."
// I could have added this rule with javascript instead, but there's an internal CSS file that does exactly the opposite, 7px.
// Using !important in an inline style or overriding it with javascript just seem dirty.
// Besides that, it should work out of the box on any setup.
// You can use this code to make your own little notifications, via CustomHint.show(anchor, message, options)
// In this case we're anchoring to the toolbar button but you can anchor to any node in the browser.
// hideArrow will remove the arrow pointing to the anchor, and hideCheck will remove the checkmark animation.
// description will add a more detailed description (in addition to the message) and duration will change how long the notification lasts.
// This is all modeled on the native class ConfirmationHint, (look in browser.js) we could have even extended it I guess.
// We couldn't use it explicitly since it only accepts messages as items in browser.properties, which rules out custom messages.
// ==/UserScript==
(function () {
    var CustomHint = {
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
            return (this._animationBox = document.getElementById("confirmation-hint-checkmark-animation-container"));
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
                ConfirmationHint.__panel = document.getElementById("confirmation-hint");
            }
        },
    };

    if ("chrome://browser/content/browser.xul" == location || "chrome://browser/content/browser.xhtml" == location)
        try {
            CustomizableUI.createWidget({
                id: "toolbox-button",
                type: "custom",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                onBuild: function (aDoc) {
                    var toolbarbutton = aDoc.createElementNS("http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul", "toolbarbutton");
                    toolbarbutton.onclick = (e) => {
                        switch (e.button) {
                            case 0:
                                key_toggleToolbox.click(), e.preventDefault();
                                break;
                            case 2:
                                if (
                                    ChromeUtils.import(
                                        "resource://devtools/client/framework/browser-toolbox/Launcher.jsm"
                                    ).BrowserToolboxLauncher.getBrowserToolboxSessionState() === false
                                ) {
                                    key_browserToolbox.click(), e.preventDefault();
                                } else {
                                    CustomHint.show(toolbarbutton, "Browser Toolbox already open.", { event: e, hideCheck: true });
                                }
                                e.preventDefault();
                                break;
                            case 1:
                                Services.prefs.getBoolPref("ui.popup.disable_autohide")
                                    ? CustomHint.show(toolbarbutton, "Letting popups close.", { event: e })
                                    : CustomHint.show(toolbarbutton, "Holding popups open.", { event: e });
                                Services.prefs.setBoolPref("ui.popup.disable_autohide", !Services.prefs.getBoolPref("ui.popup.disable_autohide"));
                                break;
                            default:
                                break;
                        }
                    };
                    var attr = {
                        id: "toolbox-button",
                        class: "toolbarbutton-1 chromeclass-toolbar-additional",
                        label: "Browser Toolbox",
                        tooltiptext: "Open Content/Browser Toolbox",
                        style: `list-style-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' x='0px' y='0px' viewBox='0 0 512 512' xml:space='preserve' width='512' height='512'><path fill='context-fill' fill-opacity='context-fill-opacity' d='M512,256v-64c0-35.346-28.654-64-64-64H64c-35.346,0-64,28.654-64,64v64h128v42.667H0v170.667 c0,11.782,9.551,21.333,21.333,21.333h469.333c11.782,0,21.333-9.551,21.333-21.333V298.667H384V256H512z M362.667,341.333H339.2 c-1.87,7.463-4.74,14.639-8.533,21.333l17.067,17.067L317.867,409.6L300.8,392.533l-21.333,8.533v25.6h-44.8V403.2l-21.333-8.533 l-17.067,17.067l-29.867-32l17.067-17.067c-3.793-6.694-6.664-13.87-8.533-21.333h-25.6v-42.667H172.8 c1.87-7.463,4.74-14.639,8.533-21.333l-17.067-17.067l29.867-29.867l17.067,17.067l21.333-8.533v-25.6H275.2V236.8l21.333,8.533 l17.067-17.067l29.867,29.867L326.4,275.2c3.793,6.694,6.664,13.87,8.533,21.333h27.733V341.333z'/><circle fill='context-fill' fill-opacity='context-fill-opacity' cx='256' cy='320' r='42.667'/><path fill='context-fill' fill-opacity='context-fill-opacity' d='M192,64h128v42.667h42.667v-64c0-11.782-9.551-21.333-21.333-21.333H170.667c-11.782,0-21.333,9.551-21.333,21.333v64 H192V64z'/></svg>")`,
                    };
                    for (var l in attr) toolbarbutton.setAttribute(l, attr[l]);
                    return toolbarbutton;
                },
            });
        } catch (e) {}
})();
