// ==UserScript==
// @name           Extension Options Panel
// @version        1.7
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script creates a toolbar button that opens a popup panel where extensions can be configured, disabled, uninstalled, etc. Each extension gets its own button in the panel. Clicking an extension's button leads to a subview where you can jump to the extension's options, disable or enable the extension, uninstall it, configure automatic updates, disable/enable it in private browsing, view its source code in whatever program is associated with .xpi files, open the extension's homepage, or copy the extension's ID. The panel can also be opened from the App Menu, since the built-in "Add-ons and themes" button is replaced with an "Extensions" button that opens the panel, which in turn has an equivalent button inside it. Based on a similar script by xiaoxiaoflood, but will not be compatible with xiaoxiaoflood's loader. This one requires fx-autoconfig or Alice0775's loader. It opens a panel instead of a menupopup, for more consistency with other toolbar widgets. There are configuration options directly below.
// ==/UserScript==

class ExtensionOptionsWidget {
    // user configuration. change the value to the right of the colon.
    static config = {
        "Replace addons button": true, // this script replaces the "Addons & Themes" button in the app menu with an "Extensions" button that opens our new panel instead of opening about:addons. set to false if you want to leave this button alone

        "Show header": true, // set to false if you don't want the "Extension options" title to be displayed at the top of the panel

        "Show version": false, // show the addon version next to its name in the list

        "Show addon messages": true, // about:addons shows you when an addon has a warning or error, e.g. it's unsigned or blocked. if this is set to true, we'll show the same information in the panel

        "Show hidden extensions": false, // show system extensions?

        "Show disabled extensions": true, // show extensions that you've disabled?

        "Show enabled extensions first": true, // show enabled extensions at the top of the list and disabled extensions at the bottom?

        "Addon ID blacklist": [], // put addon IDs in this list, separated by commas, to exclude them from the list, e.g. ["screenshots@mozilla.org", "dark-theme@mozilla.org"]

        "Icon URL": `chrome://mozapps/skin/extensions/extension.svg`, // if you want to change the button's icon for some reason, you can replace this string with any URL or data URL that leads to an image.

        // localization strings
        l10n: {
            "Button label": "Extension Options", // what should the button's label be when it's in the overflow panel or customization palette?

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

            "Manage Shortcuts label": "Manage Shortcuts",

            "Open Homepage label": "Open Homepage",

            "Copy ID label": "Copy ID",

            "Disable in Private Browsing label": "Disable in Private Windows",

            "Enable in Private Browsing label": "Enable in Private Windows",

            "Automatic Updates label": "Automatic Updates:",

            // labels for the automatic update radio buttons
            autoUpdate: {
                "Default label": "Default",

                "On label": "On",

                "Off label": "Off",
            },

            // labels for addon buttons that have a warning or error,
            // e.g. addon automatically disabled because it's on a blocklist or unsigned
            addonMessages: {
                "Blocked": "Blocked",

                "Signature Required": "Signature Required",

                "Incompatible": "Incompatible",

                "Unverified": "Unverified",

                "Insecure": "Insecure",
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
        for (let prop in props) el.setAttribute(prop, props[prop]);
        return el;
    }

    /**
     * set or remove multiple attributes for a given node
     * @param {object} el (a DOM node)
     * @param {object} props (an object of attribute name/value pairs)
     * @returns the DOM node
     */
    setAttributes(el, props) {
        for (let [name, value] of Object.entries(props))
            if (value) el.setAttribute(name, value);
            else el.removeAttribute(name);
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

    /**
     * for a given addon ID, get the Extension object from the addon policy
     * @param {string} id (an addon's ID)
     * @returns the Extension object
     */
    extensionForAddonId(id) {
        let policy = WebExtensionPolicy.getByID(id);
        return policy && policy.extension;
    }

    /**
     * find out if an addon has a valid signature
     * @param {object} addon (an Addon object, retrieved by AddonManager.getAddonsByTypes)
     * @returns true if signed, false if unsigned or invalid
     */
    isCorrectlySigned(addon) {
        // Add-ons without an "isCorrectlySigned" property are correctly signed as they aren't the correct type for signing.
        return addon.isCorrectlySigned !== false;
    }

    /**
     * find out if an addon has been automatically disabled from the xpi database
     * because it lacked a valid signature and user had xpinstall.signatures.required = true
     * @param {object} addon (an Addon object)
     * @returns true if the addon was auto-disabled
     */
    isDisabledUnsigned(addon) {
        let signingRequired =
            addon.type == "locale" ? this.LANGPACKS_REQUIRE_SIGNING : this.REQUIRE_SIGNING;
        return signingRequired && !this.isCorrectlySigned(addon);
    }

    // where panelviews are hiding when we're not looking
    viewCache(doc) {
        return doc.getElementById("appMenu-viewCache");
    }

    constructor() {
        XPCOMUtils.defineLazyModuleGetter(
            this,
            "ExtensionPermissions",
            "resource://gre/modules/ExtensionPermissions.jsm"
        );
        XPCOMUtils.defineLazyGetter(this, "extBundle", function () {
            return Services.strings.createBundle(
                "chrome://mozapps/locale/extensions/extensions.properties"
            );
        });
        XPCOMUtils.defineLazyPreferenceGetter(
            this,
            "REQUIRE_SIGNING",
            "xpinstall.signatures.required",
            false
        );
        XPCOMUtils.defineLazyPreferenceGetter(
            this,
            "LANGPACKS_REQUIRE_SIGNING",
            "extensions.langpacks.signatures.required",
            false
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
                        style: "min-width:30em",
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

                    if (this.config["Replace addons button"]) this.swapAddonsButton(aDoc);
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
     * this script replaces the built-in "Addons & Themes" button in the app menu
     * with a new "Extensions" button that opens our new panel instead of opening about:addons
     * @param {object} aDoc (the document our widget has been created within)
     */
    async swapAddonsButton(aDoc) {
        let win = aDoc.defaultView;
        this.aboutAddonsL10n = await new Localization(["toolkit/about/aboutAddons.ftl"], true);
        win.PanelUI._initialized || win.PanelUI.init(shouldSuppressPopupNotifications);
        this.setAttributes(
            win.PanelUI.mainView.querySelector("#appMenu-extensions-themes-button") ||
                win.PanelUI.mainView.querySelector("#appMenu-addons-button"),
            {
                "data-l10n-id": 0,
                command: 0,
                key: 0,
                shortcut: 0,
                class: "subviewbutton subviewbutton-nav",
                oncommand: "PanelUI.showSubView('PanelUI-eom', this);",
                closemenu: "none",
                label: await this.aboutAddonsL10n.formatValue(["addon-category-extension"]),
            }
        );
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
        let win = view.ownerGlobal;
        let doc = win.document;
        let body = view.querySelector(".panel-subview-body");
        let l10n = this.config.l10n;
        let enabledFirst = this.config["Show enabled extensions first"];
        let showVersion = this.config["Show version"];
        let showDisabled = this.config["Show disabled extensions"];
        let blackListArray = this.config["Addon ID blacklist"];

        // clear all the panel items and subviews before rebuilding them.
        while (body.hasChildNodes()) body.removeChild(body.firstChild);
        Array.from(this.viewCache(doc).children).forEach((panel) => {
            if (panel.id.includes("PanelUI-eom-addon-")) panel.remove();
        });
        let appMenuMultiView = win.PanelMultiView.forNode(PanelUI.multiView);
        if (win.PanelMultiView.forNode(view.closest("panelmultiview")) === appMenuMultiView)
            Array.from(appMenuMultiView._viewStack.children).forEach((panel) => {
                if (panel.id !== view.id && panel.id.includes("PanelUI-eom-addon-")) panel.remove();
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
                    // then get built into subviewbuttons and corresponding subviews...
                    if (showDisabled && enabledFirst && prevState && addon.isActive != prevState)
                        body.appendChild(doc.createXULElement("toolbarseparator"));
                    prevState = addon.isActive;

                    let subviewbutton = body.appendChild(
                        this.create(doc, "toolbarbutton", {
                            label: addon.name + (showVersion ? " " + addon.version : ""),
                            class: "subviewbutton subviewbutton-iconic subviewbutton-nav eom-addon-button",
                            oncommand: "extensionOptionsPanel.showSubView(event, this)",
                            closemenu: "none",
                            "data-extensionid": addon.id,
                        })
                    );
                    // set the icon using CSS variables and list-style-image so that user stylesheets can override the icon URL.
                    subviewbutton.style.setProperty(
                        "--extension-icon",
                        `url(${addon.iconURL || this.config["Icon URL"]})`
                    );
                    subviewbutton._Addon = addon;

                    this.setDisableStyle(subviewbutton, addon);
                    if (this.config["Show addon messages"])
                        this.setAddonMessage(subviewbutton, addon);
                    this.buildSubView(subviewbutton, addon);
                }
            });

        // if no addons are shown, display a "Download Addons" button that leads to AMO.
        let getAddonsButton = body.appendChild(
            this.create(doc, "toolbarbutton", {
                id: "eom-get-addons-button",
                class: "subviewbutton subviewbutton-iconic",
                label: l10n["Download Addons label"],
                image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 68 68" style="border-radius:3px"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M0 0v68h68V0H0zm61.8 49H49.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h3.9v6.4H30.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h5.6v6.4h-18v-6.4h3.9V26H7.5v-6.4h12.3V24c1.8-3.1 4.8-5 8.9-5 4.2 0 8.1 2 9.5 6.3 1.6-3.9 4.9-6.3 9.5-6.3 5.3 0 10.1 3.2 10.1 10.1v13.5h4V49z"/></svg>`,
                oncommand: `switchToTabHavingURI(Services.urlFormatter.formatURLPref("extensions.getAddons.link.url"), true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });`,
            })
        );
        getAddonsButton.hidden = body.children.length > 1;

        // make a footer button that leads to about:addons
        if (view.querySelector("#eom-allAddonsButton")) return;
        view.appendChild(doc.createXULElement("toolbarseparator"));
        view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Addons Page label"],
                id: "eom-allAddonsButton",
                class: "subviewbutton subviewbutton-iconic panel-subview-footer-button",
                image: this.config["Icon URL"],
                key: "key_openAddons",
                shortcut: win.ShortcutUtils.prettifyShortcut(win.key_openAddons),
                oncommand: `BrowserOpenAddonsMgr("addons://list/extension")`,
            })
        );
    }

    /**
     * for a given button made for an addon, find out if it has a message (blocked, unverified, etc.) and if so, display it
     * @param {object} subviewbutton (an addon button in the panel)
     * @param {object} addon (an Addon object)
     */
    setAddonMessage(subviewbutton, addon) {
        const l10n = this.config.l10n;
        const { name } = addon;
        const appName = gBrandBundle.GetStringFromName("brandShortName");
        const { STATE_BLOCKED, STATE_SOFTBLOCKED } = Ci.nsIBlocklistService;
        const formatString = (name, args) =>
            this.extBundle.formatStringFromName(`details.notification.${name}`, args, args.length);

        let message = null;
        if (addon.blocklistState === STATE_BLOCKED)
            message = {
                label: l10n.addonMessages["Blocked"],
                detail: formatString("blocked", [name]),
                type: "error",
            };
        else if (this.isDisabledUnsigned(addon))
            message = {
                label: l10n.addonMessages["Signature Required"],
                detail: formatString("unsignedAndDisabled", [name, appName]),
                type: "error",
            };
        else if (
            !addon.isCompatible &&
            (AddonManager.checkCompatibility || addon.blocklistState !== STATE_SOFTBLOCKED)
        )
            message = {
                label: l10n.addonMessages["Incompatible"],
                detail: formatString("incompatible", [name, appName, Services.appinfo.version]),
                type: "warning",
            };
        else if (!this.isCorrectlySigned(addon))
            message = {
                label: l10n.addonMessages["Unverified"],
                detail: formatString("unsigned", [name, appName]),
                type: "warning",
            };
        else if (addon.blocklistState === STATE_SOFTBLOCKED)
            message = {
                label: l10n.addonMessages["Insecure"],
                detail: formatString("softblocked", [name]),
                type: "warning",
            };
        if (subviewbutton._addonMessage) {
            subviewbutton.removeAttribute("message-type");
            subviewbutton.removeAttribute("tooltiptext");
            subviewbutton.querySelector(".eom-message-label")?.remove();
            delete subviewbutton._addonMessage;
        }
        if (message) {
            subviewbutton.setAttribute("message-type", message?.type);
            subviewbutton.setAttribute("tooltiptext", message?.detail);
            subviewbutton.appendChild(
                this.create(document, "h", {
                    class: "toolbarbutton-text eom-message-label",
                })
            ).textContent = `(${message.label})`;
        }
        subviewbutton._addonMessage = message;
    }

    /**
     * show the subview for a given extension
     * @param {object} event (a triggering command/click event)
     * @param {object} anchor (the subviewbutton that was clicked — dictates the title of the subview)
     */
    showSubView(event, anchor) {
        if (!("_Addon" in anchor)) return;
        event.target.ownerGlobal.PanelUI?.showSubView(
            "PanelUI-eom-addon-" + this.makeWidgetId(anchor._Addon.id),
            anchor,
            event
        );
    }

    /**
     * for a given addon, build a panel subview
     * @param {object} subviewbutton (the button you click to enter the subview, corresponding to the addon)
     * @param {object} addon (an addon object provided by the AddonManager, with all the data we need)
     */
    buildSubView(subviewbutton, addon) {
        let l10n = this.config.l10n;
        let win = subviewbutton.ownerGlobal;
        let doc = win.document;
        let view = this.viewCache(doc).appendChild(
            this.create(doc, "panelview", {
                id: "PanelUI-eom-addon-" + this.makeWidgetId(addon.id), // turn the extension ID into a DOM node ID
                flex: "1",
                class: "PanelUI-subView cui-widget-panelview",
            })
        );

        // create options button
        let optionsButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Addon Options label"],
                class: "subviewbutton",
            })
        );
        optionsButton.addEventListener("command", (e) => this.openAddonOptions(addon, win));

        // manage button, when no options page exists
        let manageButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Manage Addon label"],
                class: "subviewbutton",
            })
        );
        manageButton.addEventListener("command", (e) =>
            win.BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent(addon.id))
        );

        // disable button
        let disableButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: addon.userDisabled
                    ? l10n["Enable Addon label"]
                    : l10n["Disable Addon label"],
                class: "subviewbutton",
                closemenu: "none",
            })
        );
        disableButton.addEventListener("command", (e) => {
            if (addon.userDisabled) {
                addon.enable();
                disableButton.setAttribute("label", l10n["Disable Addon label"]);
            } else {
                addon.disable();
                disableButton.setAttribute("label", l10n["Enable Addon label"]);
            }
        });

        // uninstall button, and so on...
        let uninstallButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Uninstall Addon label"],
                class: "subviewbutton",
            })
        );
        uninstallButton.addEventListener("command", (e) => {
            if (win.Services.prompt.confirm(null, null, `Delete ${addon.name} permanently?`))
                addon.pendingOperations & win.AddonManager.PENDING_UNINSTALL
                    ? addon.cancelUninstall()
                    : addon.uninstall();
        });

        // allow automatic updates
        let updates = this.create(doc, "hbox", {
            id: "eom-allow-auto-updates",
            align: "center",
            class: "subviewbutton",
        });
        let updatesLabel = this.create(doc, "label", {
            id: "eom-allow-auto-updates-desc",
            class: "toolbarbutton-text",
            flex: 1,
            wrap: true,
        });
        updatesLabel.textContent = l10n["Automatic Updates label"];
        let updatesGroup = this.create(doc, "radiogroup", {
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
        let setDefault = this.create(doc, "radio", {
            label: l10n.autoUpdate["Default label"],
            class: "subviewradio",
            value: 1,
        });
        let on = this.create(doc, "radio", {
            label: l10n.autoUpdate["On label"],
            class: "subviewradio",
            value: 2,
        });
        let off = this.create(doc, "radio", {
            label: l10n.autoUpdate["Off label"],
            class: "subviewradio",
            value: 0,
        });

        [setDefault, on, off].forEach((node) => updatesGroup.appendChild(node));
        updates.appendChild(updatesLabel);
        updates.appendChild(updatesGroup);
        view.appendChild(updates);

        // allow in private browsing
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
        let privateButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                class: "subviewbutton",
                closemenu: "none",
            })
        );
        setButtonState(addon, privateButton);
        privateButton.addEventListener("command", async (_e) => {
            let extension = this.extensionForAddonId(addon.id);
            await this.ExtensionPermissions[privateButton.permState ? "remove" : "add"](
                addon.id,
                {
                    permissions: ["internal:privateBrowsingAllowed"],
                    origins: [],
                },
                extension
            );
            setButtonState(addon, privateButton);
        });

        let shortcutsButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Manage Shortcuts label"],
                class: "subviewbutton",
            })
        );
        shortcutsButton.addEventListener("command", (e) =>
            win.BrowserOpenAddonsMgr("addons://shortcuts/shortcuts")
        );

        let viewSrcButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["View Source label"],
                class: "subviewbutton",
            })
        );
        viewSrcButton.addEventListener("command", (e) => this.openArchive(addon));

        let homePageButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Open Homepage label"],
                class: "subviewbutton",
            })
        );
        homePageButton.addEventListener("command", (e) => {
            win.switchToTabHavingURI(addon.homepageURL || addon.supportURL, true, {
                inBackground: false,
                triggeringPrincipal: win.Services.scriptSecurityManager.getSystemPrincipal(),
            });
        });

        let copyIdButton = view.appendChild(
            this.create(doc, "toolbarbutton", {
                label: l10n["Copy ID label"],
                class: "subviewbutton panel-subview-footer-button",
                closemenu: "none",
            })
        );
        copyIdButton.addEventListener("command", (e) => {
            win.Cc["@mozilla.org/widget/clipboardhelper;1"]
                .getService(win.Ci.nsIClipboardHelper)
                .copyString(addon.id);
            win.CustomHint?.show(copyIdButton, "Copied");
        });

        view.addEventListener("ViewShowing", (e) => {
            optionsButton.hidden = !addon.optionsURL;
            manageButton.hidden = !!addon.optionsURL;
            updates.hidden = !(addon.permissions & win.AddonManager.PERM_CAN_UPGRADE);
            updatesGroup.setAttribute("value", addon.applyBackgroundUpdates);
            privateButton.hidden = !(
                addon.incognito != "not_allowed" &&
                !!(addon.permissions & win.AddonManager.PERM_CAN_CHANGE_PRIVATEBROWSING_ACCESS)
            );
            setButtonState(addon, privateButton);
            shortcutsButton.hidden = !this.extensionForAddonId(addon.id).shortcuts?.manifestCommands
                ?.size;
            disableButton.setAttribute(
                "label",
                addon.userDisabled ? l10n["Enable Addon label"] : l10n["Disable Addon label"]
            );
            uninstallButton.hidden = viewSrcButton.hidden =
                addon.isSystem || addon.isBuiltin || addon.temporarilyInstalled;
            homePageButton.hidden = !(addon.homepageURL || addon.supportURL);
        });
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
     * @param {object} win (the window from which this was invoked)
     */
    openAddonOptions(addon, win) {
        if (!addon.isActive || !addon.optionsURL) return;

        switch (Number(addon.optionsType)) {
            case 5:
                win.BrowserOpenAddonsMgr(
                    "addons://detail/" + win.encodeURIComponent(addon.id) + "/preferences"
                );
                break;
            case 3:
                win.switchToTabHavingURI(addon.optionsURL, true);
                break;
            case 1:
                let windows = win.Services.wm.getEnumerator(null);
                while (windows.hasMoreElements()) {
                    let win2 = windows.getNext();
                    if (win2.closed) continue;
                    if (win2.document.documentURI == addon.optionsURL) {
                        win2.focus();
                        return;
                    }
                }
                let features = "chrome,titlebar,toolbar,centerscreen";
                if (win.Services.prefs.getBoolPref("browser.preferences.instantApply"))
                    features += ",dialog=no";
                win.openDialog(addon.optionsURL, addon.id, features);
        }
    }

    /**
     * open a given addon's source xpi file in the user's associated program, e.g. 7-zip
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
                    `#eom-button{list-style-image:url('${this.config["Icon URL"]}');}#eom-mainView-panel-header{padding:8px 4px 4px 4px;min-height:44px;-moz-box-pack:center;-moz-box-align:center;}#eom-mainView-panel-header-span{font-weight:600;display:inline-block;text-align:center;overflow-wrap:break-word;}.panel-header ~ #eom-mainView-panel-header,.panel-header ~ #eom-mainView-panel-header + toolbarseparator{display:none;}.eom-addon-button{list-style-image:var(--extension-icon);}#PanelUI-eom .disabled label{opacity:.6;font-style:italic;}#PanelUI-eom .eom-message-label{opacity:.6;margin-inline-start:8px;font-style:italic;}.eom-addon-button[message-type="warning"]{background-color:var(--eom-warning-bg,hsla(48,100%,66%,.15));}.eom-addon-button[message-type="warning"]:not([disabled],[open],:active):is(:hover){background-color:var(--eom-warning-bg-hover,color-mix(in srgb,currentColor 8%,hsla(48,100%,66%,.18)));}.eom-addon-button[message-type="warning"]:not([disabled]):is([open],:hover:active){background-color:var(--eom-warning-bg-active,color-mix(in srgb,currentColor 15%,hsla(48,100%,66%,.2)));}.eom-addon-button[message-type="error"]{background-color:var(--eom-error-bg,hsla(2,100%,66%,.15));}.eom-addon-button[message-type="error"]:not([disabled],[open],:active):is(:hover){background-color:var(--eom-error-bg-hover,color-mix(in srgb,currentColor 8%,hsla(2,100%,66%,.18)));}.eom-addon-button[message-type="error"]:not([disabled]):is([open],:hover:active){background-color:var(--eom-error-bg-active,color-mix(in srgb,currentColor 15%,hsla(2,100%,66%,.2)));}#eom-allow-auto-updates{padding-block:4px;}#eom-allow-auto-updates .radio-check{margin-block:0;}#eom-allow-auto-updates label{padding-bottom:1px;}#eom-allow-auto-updates-desc{margin-inline-end:8px;}#eom-allow-auto-updates .subviewradio{margin:0;margin-inline:2px;padding:0;background:none!important;}#eom-allow-auto-updates .radio-label-box{margin-inline-start:0;padding-block:0;}`
                )
        );
        if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }
}

window.extensionOptionsPanel = new ExtensionOptionsWidget();
