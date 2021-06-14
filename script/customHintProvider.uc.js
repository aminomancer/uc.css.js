// ==UserScript==
// @name           Custom Hint Provider
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    A utility script for other scripts to take advantage of. Sets up a global object (on the chrome window) for showing confirmation hints with custom messages. The built-in confirmation hint component can only show a few messages built into the browser's localization system. It only accepts l10n IDs, so if your script wants to show a custom message with some specific string, it won't work. This works just like the built-in confirmation hint, and uses the built-in confirmation hint element, but it accepts an arbitrary string as a parameter. So you can open a confirmation hint with *any* message, e.g. CustomHint.show(anchorNode, "This is my custom message", {hideArrow: true, hideCheck: true, description: "Awesome.", duration: 3000})
// ==/UserScript==

window.CustomHint = {
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
            // hook into the built-in confirmation hint element
            let wrapper = document.getElementById("confirmation-hint-wrapper");
            wrapper?.replaceWith(wrapper.content);
            this.__panel = document.getElementById("confirmation-hint");
            ConfirmationHint.__panel = document.getElementById("confirmation-hint");
        }
    },
};
