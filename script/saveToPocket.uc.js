// ==UserScript==
// @name           saveToPocket.uc.js
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    The browser context menu has a button to save the current page to Pocket. By default, this opens a page action panel in the urlbar which tells you the page was saved and gives you an option to remove it or view the list of saved pages. This script overrides the saving function so that, rather than opening a panel, it immediately saves the link to Pocket and only creates a brief confirmation hint that fades after a few seconds. The confirmation hint is of the same type as the hint that pops up when you save a bookmark. It also turns the Pocket button red, the same as saving to Pocket does without the script.
// ==/UserScript==

let pocketCustomHint = {
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
            triggerEvent: null,
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
            let wrapper = document.getElementById("confirmation-hint-wrapper");
            wrapper?.replaceWith(wrapper.content);
            this.__panel = document.getElementById("confirmation-hint");
            ConfirmationHint.__panel = document.getElementById("confirmation-hint");
        }
    },
};

(function () {
    function init() {
        let pocketUI = pktUI;
        Pocket.savePage = function savePage(browser, url, title) {
            if (this.pageAction) {
                pktApi.addLink(url, {
                    title: title,
                    success: (resolve) => {
                        let button = document.getElementById(this.pageAction.anchorIDOverride);
                        if (button.hidden) button = document.getElementById("pageActionButton");
                        pocketCustomHint.show(button, "Saved to Pocket.");
                        if (browser === gBrowser.selectedBrowser)
                            document
                                .getElementById(this.pageAction.anchorIDOverride)
                                .setAttribute("pocketed", true);
                    },
                });
            }
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
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
