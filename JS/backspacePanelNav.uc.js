// ==UserScript==
// @name           Backspace Panel Navigation
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Press backspace to navigate back/forward in popup panels.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    function init() {
        let appMenu = PanelView.forNode(PanelUI.mainView);
        Object.getPrototypeOf(appMenu).keyNavigation = function (event) {
            if (!this.active) return;
            let focus = this.document.activeElement;
            if (
                focus &&
                !(this.node.compareDocumentPosition(focus) & Node.DOCUMENT_POSITION_CONTAINED_BY)
            )
                focus = null;
            if (focus && (focus.tagName == "browser" || focus.tagName == "iframe")) return;
            let stop = () => {
                event.stopPropagation();
                event.preventDefault();
            };
            let tabOnly = () => {
                return focus && this._isNavigableWithTabOnly(focus);
            };
            let isContextMenuOpen = () => {
                if (!focus) return false;
                let contextNode = focus.closest("[context]");
                if (!contextNode) return false;
                let context = contextNode.getAttribute("context");
                if (!context) return false;
                let popup = this.document.getElementById(context);
                return popup && popup.state == "open";
            };
            let keyCode = event.code;
            switch (keyCode) {
                case "ArrowDown":
                case "ArrowUp":
                    if (tabOnly()) break;
                case "Tab": {
                    if (
                        isContextMenuOpen() ||
                        (focus && focus.localName == "menulist" && focus.open)
                    )
                        break;
                    stop();
                    let isDown = keyCode == "ArrowDown" || (keyCode == "Tab" && !event.shiftKey);
                    let button = this.moveSelection(isDown, keyCode != "Tab");
                    Services.focus.setFocus(button, Services.focus.FLAG_BYKEY);
                    break;
                }
                case "Home":
                    if (tabOnly() || isContextMenuOpen()) break;
                    stop();
                    this.focusFirstNavigableElement(true);
                    break;
                case "End":
                    if (tabOnly() || isContextMenuOpen()) break;
                    stop();
                    this.focusLastNavigableElement(true);
                    break;
                case "Backspace":
                    if (tabOnly() || isContextMenuOpen()) break;
                    stop();
                    if (PanelMultiView.forNode(this.node.panelMultiView).openViews.length > 1)
                        this.node.panelMultiView.goBack();
                    else PanelMultiView.forNode(this.node.panelMultiView).hidePopup();
                    break;
                case "ArrowLeft":
                case "ArrowRight": {
                    if (tabOnly() || isContextMenuOpen()) break;
                    stop();
                    if (
                        (!this.window.RTL_UI && keyCode == "ArrowLeft") ||
                        (this.window.RTL_UI && keyCode == "ArrowRight")
                    ) {
                        this.node.panelMultiView.goBack();
                        break;
                    }
                    let button = this.selectedElement;
                    if (!button || !button.classList.contains("subviewbutton-nav")) break;
                }
                case "Space":
                case "NumpadEnter":
                case "Enter": {
                    if (tabOnly() || isContextMenuOpen()) break;
                    let button = this.selectedElement;
                    if (!button) break;
                    stop();
                    this._doingKeyboardActivation = true;
                    let commandEvent = event.target.ownerDocument.createEvent("xulcommandevent");
                    commandEvent.initCommandEvent(
                        "command",
                        true,
                        true,
                        event.target.ownerGlobal,
                        0,
                        event.ctrlKey,
                        event.altKey,
                        event.shiftKey,
                        event.metaKey,
                        0,
                        null,
                        0
                    );
                    button.dispatchEvent(commandEvent);
                    let dispEvent = new event.target.ownerGlobal.MouseEvent("mousedown", {
                        bubbles: true,
                    });
                    button.dispatchEvent(dispEvent);
                    dispEvent = new event.target.ownerGlobal.MouseEvent("click", {
                        bubbles: true,
                    });
                    button.dispatchEvent(dispEvent);
                    this._doingKeyboardActivation = false;
                    break;
                }
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
