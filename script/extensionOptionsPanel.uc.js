// ==UserScript==
// @name           Extension Options Panel
// @version        1.4
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script creates a toolbar button that opens a popup panel where extensions can be configured, disabled, uninstalled, etc. Each extension gets its own button in the panel. Clicking an extension's button leads to a subview where you can jump to the extension's options, disable or enable the extension, uninstall it, configure automatic updates, disable/enable it in private browsing, view its source code in whatever program is associated with .xpi files, open the extension's homepage, or copy the extension's ID. Based on a similar script by xiaoxiaoflood, but will not be compatible with xiaoxiaoflood's loader. This one requires fx-autoconfig or Alice0775's loader. It opens a panel instead of a menupopup, for more consistency with other toolbar widgets. There are configuration options directly below.
// ==/UserScript==

class ExtensionOptionsWidget {
    // user configuration. change the value to the right of the colon.
    static config = {
        "Show header": true, // set to false if you don't want the "Extension options" title to be displayed at the top of the panel

        "Show version": false, // show the addon version next to its name in the list

        "Show hidden extensions": false, // show system extensions?

        "Show disabled extensions": true, // show extensions that you've disabled?

        "Show enabled extensions first": true, // show enabled extensions at the top of the list and disabled extensions at the bottom?

        "Addon ID blacklist": [], // put addon IDs in this list, separated by commas, to exclude them from the list, e.g. ["screenshots@mozilla.org", "dark-theme@mozilla.org"]

        "Icon URL": `chrome://browser/content/extension.svg`, // if you want to change the button's icon for some reason, you can replace this string with any URL or data URL that leads to an image.

        // localization strings
        l10n: {
            "Button label": "Extension Options Panel", // what should the button's label be when it's in the overflow panel or customization palette?

            "Button tooltip": "Extension options", // what should the button's tooltip be? I use sentence case since that's the convention.

            "Panel title": "Extension Options", // title shown at the top of the panel (when "Show header" is true)

            "Download Addons label": "Download Addons", // label for the button that appears when you have no addons installed.

            "Addons Page label": "Addons Page", // label for the Addons Page button at the bottom of the panel

            "Addon Options label": "Addon Options", // labels for the addon subview buttons

            "Manage Addon label": "Manage Addon",

            "Enable Addon label": "Enable",

            "Disable Addon label": "Disable",

            "Uninstall Addon label": "Uninstall",

            "View Source label": "View Source",

            "Open Homepage label": "Open Homepage",

            "Copy ID label": "Copy ID",

            "Disable in Private Browsing label": "Disable in Private Browsing",

            "Enable in Private Browsing label": "Enable in Private Browsing",

            "Automatic Updates label": "Automatic Updates:",

            // labels for the automatic update radio buttons
            autoUpdate: {
                "Default label": "Default",

                "On label": "On",

                "Off label": "Off",
            },
        },
    };

    /**
     * create a DOM node with given parameters
     * @param {object} aDoc (which doc to create the element in)
     * @param {string} tag (an HTML tag name, like "button" or "p")
     * @param {object} props (an object containing attribute name/value pairs, e.g. class: ".bookmark-item")
     * @param {boolean} isHTML (if true, create an HTML element. if omitted or false, create a XUL element. generally avoid HTML when modding the UI, most UI elements are actually XUL elements.)
     * @returns the created DOM node
     */
    create(aDoc, tag, props, isHTML = false) {
        let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
        for (let prop in props) {
            el.setAttribute(prop, props[prop]);
        }
        return el;
    }

    /**
     * make a valid ID for a DOM node based on an extension's ID.
     * @param {string} id (an extension's ID)
     * @returns an ID with crap removed so it can be used in a DOM node's ID.
     */
    makeWidgetId(id) {
        id = id.toLowerCase();
        return id.replace(/[^a-z0-9_-]/g, "_");
    }

    // where panelviews are hiding when we're not looking
    get viewCache() {
        return document.getElementById("appMenu-viewCache");
    }

    get toolbarButton() {
        return CustomizableUI.getWidget("eom-button")?.forWindow(window)?.node;
    }

    constructor() {
        XPCOMUtils.defineLazyModuleGetter(
            this,
            "ExtensionPermissions",
            "resource://gre/modules/ExtensionPermissions.jsm"
        );
        this.viewId = "PanelUI-eom";
        this.config = ExtensionOptionsWidget.config;
        let l10n = this.config.l10n;
        if (
            /^chrome:\/\/browser\/content\/browser.(xul||xhtml)$/i.test(location) &&
            !CustomizableUI.getPlacementOfWidget("eom-button", true)
        )
            CustomizableUI.createWidget({
                id: "eom-button",
                viewId: this.viewId,
                type: "view",
                defaultArea: CustomizableUI.AREA_NAVBAR,
                removable: true,
                label: l10n["Button label"],
                tooltiptext: l10n["Button tooltip"],
                // if the button is middle-clicked, open the addons page instead of the panel
                onClick: (event) => {
                    if (event.button == 1) BrowserOpenAddonsMgr("addons://list/extension");
                },
                // create the panelview before the toolbar button
                onBeforeCreated: (aDoc) => {
                    let view = this.create(aDoc, "panelview", {
                        id: this.viewId,
                        class: "PanelUI-subView cui-widget-panelview",
                        flex: "1",
                    });
                    aDoc.getElementById("appMenu-viewCache").appendChild(view);
                    aDoc.defaultView.extensionOptionsPanel.panelview = view;

                    if (this.config["Show header"]) {
                        let header = view.appendChild(
                            this.create(aDoc, "vbox", { id: "eom-mainView-panel-header" })
                        );
                        let heading = header.appendChild(this.create(aDoc, "label"));
                        let label = heading.appendChild(
                            this.create(aDoc, "html:span", {
                                id: "eom-mainView-panel-header-span",
                                role: "heading",
                                "aria-level": "1",
                            })
                        );
                        label.textContent = l10n["Panel title"];
                        view.appendChild(document.createXULElement("toolbarseparator"));
                    }

                    view.appendChild(
                        this.create(aDoc, "vbox", {
                            id: view.id + "-body",
                            class: "panel-subview-body",
                        })
                    );
                },
                // populate the panel before it's shown
                onViewShowing: (event) => {
                    if (
                        event.originalTarget ===
                        event.target.ownerGlobal.extensionOptionsPanel.panelview
                    )
                        event.target.ownerGlobal.extensionOptionsPanel.getAddonsAndPopulate(event);
                },
                // delete the panel if the widget node is destroyed
                onDestroyed: (aDoc) => {
                    let view = aDoc.getElementById(this.viewId);
                    if (view) {
                        CustomizableUI.hidePanelForNode(view);
                        view.remove();
                    }
                },
            });
        this.loadStylesheet(); // load the stylesheet
    }

    /**
     * grab all addons and populate the panel with them.
     * @param {object} e (a ViewShowing event)
     */
    getAddonsAndPopulate(e) {
        AddonManager.getAddonsByTypes(["extension"]).then((addons) =>
            this.populatePanelBody(e, addons)
        );
    }

    /**
     * create everything inside the panel
     * @param {object} e (a ViewShowing event - its target is the panelview node)
     * @param {array} addons (an array of addons)
     */
    populatePanelBody(e, addons) {
        let prevState;
        let view = e?.target || this.panelview;
        let body = view.querySelector(".panel-subview-body");
        let l10n = this.config.l10n;
        let enabledFirst = this.config["Show enabled extensions first"];
        let showVersion = this.config["Show version"];
        let showDisabled = this.config["Show disabled extensions"];
        let blackListArray = this.config["Addon ID blacklist"];

        // clear all the panel items and subviews before rebuilding them.
        while (body.hasChildNodes()) body.removeChild(body.firstChild);
        Array.from(this.viewCache.children).forEach((panel) => {
            if (panel.id.includes("PanelUI-eom-addon-")) panel.remove();
        });

        // all addons...
        addons
            .sort((a, b) => {
                // get sorted by enabled state...
                let ka = (enabledFirst ? (a.isActive ? "0" : "1") : "") + a.name.toLowerCase();
                let kb = (enabledFirst ? (b.isActive ? "0" : "1") : "") + b.name.toLowerCase();
                return ka < kb ? -1 : 1;
            })
            .forEach((addon) => {
                // then get excluded if config wills it...
                if (
                    !blackListArray.includes(addon.id) &&
                    (!addon.hidden || this.config["Show hidden extensions"]) &&
                    (!addon.userDisabled || showDisabled)
                ) {
                    // then get built into subviewbuttons...
                    if (showDisabled && enabledFirst && prevState && addon.isActive != prevState)
                        body.appendChild(document.createXULElement("toolbarseparator"));
                    prevState = addon.isActive;

                    let subviewbutton = this.create(document, "toolbarbutton", {
                        label: addon.name + (showVersion ? " " + addon.version : ""),
                        class: "subviewbutton subviewbutton-iconic subviewbutton-nav eom-addon-button",
                        oncommand: "extensionOptionsPanel.showSubView(event, this)",
                        "widget-type": "view",
                        "data-extensionid": addon.id,
                    });
                    // set the icon using CSS variables and list-style-image so that user stylesheets can override the icon URL.
                    subviewbutton.style.setProperty(
                        "--extension-icon",
                        `url(${addon.iconURL || this.config["Icon URL"]})`
                    );
                    subviewbutton._Addon = addon;

                    this.setDisableStyle(subviewbutton, addon, false);

                    body.appendChild(subviewbutton);
                    this.buildSubView(addon, subviewbutton); // and subviews...
                }
            });

        // if no addons are shown, display a "Download Addons" button that leads to AMO.
        let getAddonsButton = this.create(document, "toolbarbutton", {
            id: "eom-get-addons-button",
            class: "subviewbutton subviewbutton-iconic",
            label: l10n["Download Addons label"],
            image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 68 68" style="border-radius:3px"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M0 0v68h68V0H0zm61.8 49H49.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h3.9v6.4H30.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h5.6v6.4h-18v-6.4h3.9V26H7.5v-6.4h12.3V24c1.8-3.1 4.8-5 8.9-5 4.2 0 8.1 2 9.5 6.3 1.6-3.9 4.9-6.3 9.5-6.3 5.3 0 10.1 3.2 10.1 10.1v13.5h4V49z"/></svg>`,
            oncommand: `switchToTabHavingURI(Services.urlFormatter.formatURLPref("extensions.getAddons.link.url"), true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });`,
        });
        body.appendChild(getAddonsButton);
        getAddonsButton.hidden = body.children.length > 1;

        // make a footer button that leads to about:addons
        if (view.querySelector("#eom-allAddonsButton")) return;
        view.appendChild(document.createXULElement("toolbarseparator"));
        view.appendChild(
            this.create(document, "toolbarbutton", {
                label: l10n["Addons Page label"],
                id: "eom-allAddonsButton",
                class: "subviewbutton subviewbutton-iconic panel-subview-footer-button",
                image: this.config["Icon URL"],
                oncommand: `BrowserOpenAddonsMgr("addons://list/extension")`,
            })
        );
    }

    /**
     * show the subview for a given extension
     * @param {object} event (a triggering command/click event)
     * @param {object} anchor (the subviewbutton that was clicked — dictates the title of the subview)
     */
    showSubView(event, anchor) {
        if (!("_Addon" in anchor)) return;
        PanelUI.showSubView(
            "PanelUI-eom-addon-" + this.makeWidgetId(anchor._Addon.id),
            anchor,
            event
        );
    }

    /**
     * for a given addon, build a panel subview
     * @param {object} addon (an addon object provided by the AddonManager, with all the data we need)
     */
    buildSubView(addon) {
        let l10n = this.config.l10n;
        let view = this.create(document, "panelview", {
            id: "PanelUI-eom-addon-" + this.makeWidgetId(addon.id), // turn the extension ID into a DOM node ID
            flex: "1",
            class: "PanelUI-subView cui-widget-panelview",
        });
        document.createXULElement("panelview");
        this.viewCache.appendChild(view); // put it in the panel view cache, showSubView will pull it out later

        // create options button
        if (addon.optionsURL) {
            let optionsButton = this.create(document, "toolbarbutton", {
                label: l10n["Addon Options label"],
                class: "subviewbutton",
            });
            optionsButton.addEventListener("command", (e) => this.openAddonOptions(addon));
            view.appendChild(optionsButton);
        } else {
            let manageButton = this.create(document, "toolbarbutton", {
                label: l10n["Manage Addon label"],
                class: "subviewbutton",
            });
            manageButton.addEventListener("command", (e) =>
                BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent(addon.id))
            );
            view.appendChild(manageButton);
        }

        // allow automatic updates
        if (!!(addon.permissions & AddonManager.PERM_CAN_UPGRADE)) {
            let updates = this.create(document, "hbox", {
                id: "eom-allow-auto-updates",
                align: "center",
                class: "subviewbutton",
            });
            let updatesLabel = this.create(document, "label", {
                id: "eom-allow-auto-updates-desc",
                class: "toolbarbutton-text",
                flex: 1,
            });
            updatesLabel.value = l10n["Automatic Updates label"];
            let updatesGroup = this.create(document, "radiogroup", {
                id: "eom-allow-auto-updates-group",
                value: addon.applyBackgroundUpdates,
                closemenu: "none",
                orient: "horizontal",
                "aria-labelledby": "eom-allow-auto-updates-desc",
            });
            updatesGroup.addEventListener(
                "command",
                (e) => (addon.applyBackgroundUpdates = e.target.value)
            );
            let setDefault = this.create(document, "radio", {
                label: l10n.autoUpdate["Default label"],
                class: "subviewradio",
                value: 1,
            });
            let on = this.create(document, "radio", {
                label: l10n.autoUpdate["On label"],
                class: "subviewradio",
                value: 2,
            });
            let off = this.create(document, "radio", {
                label: l10n.autoUpdate["Off label"],
                class: "subviewradio",
                value: 0,
            });

            [setDefault, on, off].forEach((node) => updatesGroup.appendChild(node));
            updates.appendChild(updatesLabel);
            updates.appendChild(updatesGroup);
            view.appendChild(updates);
        }

        // allow in private browsing
        if (
            addon.incognito != "not_allowed" &&
            !!(addon.permissions & AddonManager.PERM_CAN_CHANGE_PRIVATEBROWSING_ACCESS)
        ) {
            let setButtonState = async (addon, node) => {
                let perms = await this.ExtensionPermissions.get(addon.id);
                let isAllowed = perms.permissions.includes("internal:privateBrowsingAllowed");
                node.permState = isAllowed;
                node.setAttribute(
                    "label",
                    isAllowed
                        ? l10n["Disable in Private Browsing label"]
                        : l10n["Enable in Private Browsing label"]
                );
            };
            let policy = WebExtensionPolicy.getByID(addon.id);

            let privateButton = this.create(document, "toolbarbutton", {
                class: "subviewbutton",
                closemenu: "none",
            });
            setButtonState(addon, privateButton);
            privateButton.addEventListener("command", (_e) => {
                this.ExtensionPermissions[privateButton.permState ? "remove" : "add"](
                    addon.id,
                    {
                        permissions: ["internal:privateBrowsingAllowed"],
                        origins: [],
                    },
                    policy && policy.extension
                );
                setButtonState(addon, privateButton);
            });
            view.appendChild(privateButton);
        }

        // disable button
        let disableButton = this.create(document, "toolbarbutton", {
            label: addon.userDisabled ? l10n["Enable Addon label"] : l10n["Disable Addon label"],
            class: "subviewbutton",
            closemenu: "none",
            oncommand: `PanelMultiView.forNode(this.parentElement).node.panelMultiView.goBack()`,
        });
        disableButton.addEventListener("command", (e) => {
            addon.userDisabled ? addon.enable() : addon.disable();
            this.getAddonsAndPopulate();
        });
        view.appendChild(disableButton);

        // uninstall button, and so on...
        if (!addon.isSystem && !addon.isBuiltin && !addon.temporarilyInstalled) {
            let uninstallButton = this.create(document, "toolbarbutton", {
                label: l10n["Uninstall Addon label"],
                class: "subviewbutton",
            });
            uninstallButton.addEventListener("command", (e) => {
                if (Services.prompt.confirm(null, null, `Delete ${addon.name} permanently?`))
                    addon.pendingOperations & AddonManager.PENDING_UNINSTALL
                        ? addon.cancelUninstall()
                        : addon.uninstall();
            });
            view.appendChild(uninstallButton);

            let viewSrcButton = this.create(document, "toolbarbutton", {
                label: l10n["View Source label"],
                class: "subviewbutton",
            });
            viewSrcButton.addEventListener("command", (e) => this.openArchive(addon));
            view.appendChild(viewSrcButton);
        }

        if (addon.homepageURL || addon.supportURL) {
            let homePageButton = this.create(document, "toolbarbutton", {
                label: l10n["Open Homepage label"],
                class: "subviewbutton",
            });
            homePageButton.addEventListener("command", (e) => {
                switchToTabHavingURI(addon.homepageURL || addon.supportURL, true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });
            });
            view.appendChild(homePageButton);
        }

        let copyIdButton = this.create(document, "toolbarbutton", {
            label: l10n["Copy ID label"],
            class: "subviewbutton panel-subview-footer-button",
        });
        copyIdButton.addEventListener("command", (e) =>
            Cc["@mozilla.org/widget/clipboardhelper;1"]
                .getService(Ci.nsIClipboardHelper)
                .copyString(addon.id)
        );
        view.appendChild(copyIdButton);
    }

    /**
     * for a given subviewbutton-addon pair, decide whether the button should be styled as a disabled button
     * @param {object} subviewbutton (an addon button in the list)
     * @param {object} addon (an addon object from AddonManager)
     */
    setDisableStyle(subviewbutton, addon) {
        let cls = subviewbutton.classList;
        if (addon.operationsRequiringRestart) {
            if (addon.userDisabled && addon.isActive) cls.add("disabling");
            else if (!addon.userDisabled && !addon.isActive) cls.add("enabling");
        }
        if (!addon.isActive) cls.add("disabled");
        if (!addon.optionsURL) cls.add("noOptions");
    }

    /**
     * open a given addon's options page
     * @param {object} addon (an addon object)
     */
    openAddonOptions(addon) {
        if (!addon.isActive || !addon.optionsURL) return;

        switch (Number(addon.optionsType)) {
            case 5:
                BrowserOpenAddonsMgr(
                    "addons://detail/" + encodeURIComponent(addon.id) + "/preferences"
                );
                break;
            case 3:
                switchToTabHavingURI(addon.optionsURL, true);
                break;
            case 1:
                let windows = Services.wm.getEnumerator(null);
                while (windows.hasMoreElements()) {
                    let win2 = windows.getNext();
                    if (win2.closed) continue;
                    if (win2.document.documentURI == addon.optionsURL) {
                        win2.focus();
                        return;
                    }
                }
                let features = "chrome,titlebar,toolbar,centerscreen";
                if (Services.prefs.getBoolPref("browser.preferences.instantApply"))
                    features += ",dialog=no";
                openDialog(addon.optionsURL, addon.id, features);
        }
    }

    /**
     * open a given addon's source xpi file
     * @param {object} addon (an addon object)
     */
    openArchive(addon) {
        let dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
        dir.append("extensions");
        dir.append(addon.id + ".xpi");
        dir.launch();
    }

    // generate and load a stylesheet
    loadStylesheet() {
        let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
            Ci.nsIStyleSheetService
        );
        let uri = makeURI(
            "data:text/css;charset=UTF=8," +
                encodeURIComponent(
                    `#eom-button{list-style-image:url('${this.config["Icon URL"]}');}#eom-mainView-panel-header{padding:8px 4px 4px 4px;min-height:44px;-moz-box-pack:center;-moz-box-align:center;}#eom-mainView-panel-header-span{font-weight:600;display:inline-block;text-align:center;overflow-wrap:break-word;}.eom-addon-button{list-style-image:var(--extension-icon);}#PanelUI-eom{min-width:30em;}#PanelUI-eom .disabled label{opacity:.6;font-style:italic;}#eom-allow-auto-updates{padding-block:4px;}#eom-allow-auto-updates .radio-check{margin-block:0;}#eom-allow-auto-updates label{padding-bottom:1px;}#eom-allow-auto-updates-desc{margin-inline-end:8px;}#eom-allow-auto-updates .subviewradio{margin:0;margin-inline:2px;padding:0;background:none!important;}#eom-allow-auto-updates .radio-label-box{margin-inline-start:0;padding-block:0;}`
                )
        );
        if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }
}

window.extensionOptionsPanel = new ExtensionOptionsWidget();
