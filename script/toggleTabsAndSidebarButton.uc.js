// ==UserScript==
// @name           Toggle Tabs and Sidebar
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new toolbar button that can toggle between hiding tabs and hiding sidebar. Intended for use with tree style tabs, but will work just fine without it. It toggles the sidebar on its own, but it hides tabs by setting an attribute on the document element, which you need to reference in your userChrome.css file, like this: :root[toggle-hidden="tabs"] #TabsToolbar {...}
// ==/UserScript==
(() => {
    function init() {
        if (
            "chrome://browser/content/browser.xul" == location ||
            "chrome://browser/content/browser.xhtml" == location
        )
            try {
                CustomizableUI.createWidget({
                    id: "toggle-tabs-sidebar-button",
                    type: "custom",
                    defaultArea: CustomizableUI.AREA_NAVBAR,
                    onBuild: function (aDoc) {
                        let CustomHint = {
                            _timerID: null,
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
                                    let wrapper = aDoc.getElementById("confirmation-hint-wrapper");
                                    wrapper?.replaceWith(wrapper.content);
                                    this.__panel = aDoc.getElementById("confirmation-hint");
                                    ConfirmationHint.__panel = aDoc.getElementById(
                                        "confirmation-hint"
                                    );
                                }
                            },
                        };
                        let prefSvc = Services.prefs,
                            hideState = "userChrome.toggleTabsOrSidebar.state",
                            positionStart = "sidebar.position_start",
                            tstID = "treestyletab_piro_sakura_ne_jp-sidebar-action",
                            toolbarbutton = aDoc.createXULElement("toolbaritem"),
                            animBox = document.createXULElement("box"),
                            icon = document.createXULElement("image"),
                            label = document.createXULElement("label"),
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
                            },
                            animOptions = { duration: 300, iterations: 1, easing: "ease-in-out" },
                            tabsURL = `chrome://browser/skin/tab.svg`,
                            sidebarLeftURL = `chrome://browser/skin/sidebars.svg`,
                            sidebarRightURL = `chrome://browser/skin/sidebars-right.svg`;
                        toolbarbutton.onclick = (e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            let hasTST = SidebarUI.sidebars.get(tstID);
                            if (prefSvc.getBoolPref(hideState)) {
                                CustomHint.show(animBox, "Hiding sidebar.", {
                                    event: e,
                                    hideCheck: true,
                                });
                                SidebarUI.show(
                                    hasTST
                                        ? tstID
                                        : SidebarUI._box.getAttribute("sidebarcommand") ||
                                              SidebarUI.DEFAULT_SIDEBAR_ID
                                );
                            } else {
                                CustomHint.show(animBox, "Hiding tabs.", {
                                    event: e,
                                    hideCheck: true,
                                });
                                SidebarUI.hide();
                            }
                            prefSvc.setBoolPref(hideState, !prefSvc.getBoolPref(hideState));
                            icon.animate(keyframes, animOptions);
                        };
                        let attr = {
                            id: "toggle-tabs-sidebar-button",
                            class: "toolbarbutton-1 chromeclass-toolbar-additional",
                            label: "Toggle Tabs and Sidebar",
                            tooltiptext: "Switch between hiding tabs and hiding the sidebar",
                            style: "-moz-box-align: center;",
                        };
                        function getPref(root, pref, type) {
                            switch (type) {
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
                        function stateObserver(sub, _top, pref) {
                            try {
                                let type = sub.getPrefType(pref);
                                if (getPref(sub, pref, type)) {
                                    document.documentElement.setAttribute("toggle-hidden", "sidebar");
                                    icon.src = tabsURL;
                                    label.setAttribute("value", "Hide Tabs");
                                    toolbarbutton.setAttribute("label", "Hide Tabs");
                                    toolbarbutton.setAttribute(
                                        "tooltiptext",
                                        "Hide tabs and reveal sidebar"
                                    );
                                } else {
                                    document.documentElement.setAttribute("toggle-hidden", "tabs");
                                    positionObserver(prefSvc, _top, positionStart);
                                    label.setAttribute("value", "Hide Sidebar");
                                    toolbarbutton.setAttribute("label", "Hide Sidebar");
                                    toolbarbutton.setAttribute(
                                        "tooltiptext",
                                        "Hide sidebar and reveal tabs"
                                    );
                                }
                            } catch (e) {}
                        }
                        function positionObserver(sub, _top, pref) {
                            try {
                                let type = sub.getPrefType(pref);
                                icon.src = getPref(sub, pref, type)
                                    ? sidebarLeftURL
                                    : sidebarRightURL;
                            } catch (e) {}
                        }
                        function setBoolPref(pref) {
                            if (!Services.prefs.prefHasUserValue(pref))
                                prefSvc.setBoolPref(pref, false);
                        }
                        function uninit() {
                            prefSvc.removeObserver(hideState, stateObserver);
                            prefSvc.removeObserver(positionStart, positionObserver);
                            window.removeEventListener("unload", uninit, false);
                        }
                        for (const key in attr) toolbarbutton.setAttribute(key, attr[key]);

                        animBox.className = "toolbarbutton-icon";
                        icon.className = "toolbarbutton-animation";
                        icon.src = tabsURL;
                        animBox.style.cssText = `-moz-box-pack: center;`;
                        icon.style.cssText = `height: 16px; width: 16px;`;
                        label.className = "toolbarbutton-text";
                        label.setAttribute("crop", "right");
                        label.setAttribute("flex", "1");
                        label.setAttribute("value", toolbarbutton.getAttribute("label"));
                        toolbarbutton.appendChild(animBox);
                        toolbarbutton.appendChild(label);
                        animBox.appendChild(icon);

                        window.addEventListener("unload", uninit, false);
                        prefSvc.addObserver(hideState, stateObserver);
                        prefSvc.addObserver(positionStart, positionObserver);
                        setBoolPref(hideState);
                        if (gBrowserInit.delayedStartupFinished) {
                            stateObserver(prefSvc, null, hideState);
                        } else {
                            let delayedListener2 = (subject, topic) => {
                                if (
                                    topic == "browser-delayed-startup-finished" &&
                                    subject == window
                                ) {
                                    Services.obs.removeObserver(delayedListener2, topic);
                                    stateObserver(prefSvc, null, hideState);
                                }
                            };
                            Services.obs.addObserver(
                                delayedListener2,
                                "browser-delayed-startup-finished"
                            );
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
