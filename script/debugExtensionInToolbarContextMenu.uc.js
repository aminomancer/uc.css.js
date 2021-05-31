// ==UserScript==
// @name           Debug Extension in Toolbar Context Menu
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new context menu when right-clicking an add-on's toolbar button, any time the "Manage Extension" and "Remove Extension" items are available. The new "Debug Extension" menu contains 4 items: "Extension Manifest" will open the extension's manifest directly in a new tab. Aside from reading the manifest, from there you can also see the whole contents of the extension by removing "/manifest.json" from the URL. "Popup Document" will open the extension's popup URL (if it has one) in a regular browser window. The popup URL is whatever document it displays in its panel view. "Options Document" will open the document that the extension displays in its submenu on about:addons, also in a regular browser window. Finally, "Inspect Extension" will open a devtools tab targeting the extension background. This is the same page you'd get if you opened about:debugging and clicked the "Inspect" button next to an extension. The menu items' labels are not localized automatically since Firefox doesn't include any similar strings. If you need to change the language or anything, modify the strings below under "static config." As usual, icons for the new menu are included in uc-context-menu-icons.css
// ==/UserScript==

class DebugExtension {
    // you can modify the menu items' labels and access keys here, e.g. if you prefer another language.
    // an access key is the letter highlighted in a menuitem's label.
    // if the letter highlighted is "D" for example, and you press D on your keyboard
    // while the context menu is open, it will automatically select the menu item with that access key.
    // if two menu items have the same access key and are both visible,
    // then instead of selecting one menu item it will just cycle between the two.
    // however, the access key does not need to be a character in the label.
    // if the access key isn't in the label, then instead of underlining the letter in the label,
    // it will add the access key to the end of the label in parentheses.
    // e.g. "Debug Extension (Q)" instead of "_D_ebug Extension".
    static config = {
        menuLabel: "Debug Extension", // menu label
        menuAccessKey: "D",
        // individual menu items
        Manifest: {
            label: "Extension Manifest",
            accesskey: "M",
        },
        Popup: {
            label: "Popup Document",
            accesskey: "P",
        },
        Options: {
            label: "Options Document",
            accesskey: "O",
        },
        Inspector: {
            label: "Inspect Extension",
            accesskey: "I",
        },
    };
    // end user configuration
    static menuitems = ["Manifest", "Popup", "Options", "Inspector"];
    constructor() {
        this.setupCallback();
        this.setupUpdate();
        this.menu = this.makeMenu();
        this.menupopup = this.menu.appendChild(document.createXULElement("menupopup"));
        this.menupopup.addEventListener("popupshowing", this);
        // make a menu item for each type of page
        DebugExtension.menuitems.forEach(
            (type) => (this[`${type}MenuItem`] = this.makeMenuItem(type))
        );
    }
    get toolbarContext() {
        return (
            this._toolbarContext ||
            (this._toolbarContext = document.getElementById("toolbar-context-menu"))
        );
    }
    /**
     * set a bunch of attributes on a node
     * @param {object} node (a DOM node)
     * @param {object} attrs (an object containing properties — keys are turned into attributes on the DOM node)
     */
    setAttributes(node, attrs) {
        for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, val);
    }
    // enable/disable menu items depending on whether the clicked extension has pages available to open.
    handleEvent(e) {
        let id = ToolbarContextMenu._getExtensionId(e.target);
        if (!id) return;
        let extension = WebExtensionPolicy.getByID(id).extension;
        this.PopupMenuItem.disabled = !extension.manifest.browser_action?.default_popup;
        this.OptionsMenuItem.disabled = !extension.manifest.options_ui?.page;
    }
    makeMenu() {
        let menu = document.createXULElement("menu");
        this.setAttributes(menu, {
            class: "customize-context-debugExtension",
            label: DebugExtension.config.menuLabel,
            accesskey: DebugExtension.config.menuAccessKey,
            contexttype: "toolbaritem",
        });
        this.toolbarContext.querySelector(".customize-context-manageExtension").after(menu);
        return menu;
    }
    /**
     * make a menu item that opens a given type of page, with label & accesskey corresponding to those defined in the "config" static property
     * @param {string} type (equal to "Manifest", "Popup", or "Options")
     * @returns a menuitem DOM node
     */
    makeMenuItem(type) {
        let item = document.createXULElement("menuitem");
        this.setAttributes(item, {
            class: `customize-context-open${type}`,
            label: DebugExtension.config[type].label,
            accesskey: DebugExtension.config[type].accesskey,
            oncommand: `ToolbarContextMenu.openExtensionURL(event, this.parentElement, "${type}")`,
            contexttype: "toolbaritem",
        });
        this.menupopup.appendChild(item);
        return item;
    }
    // set the command callback function on a globally accessible object so it can be invoked from oncommand attributes
    setupCallback() {
        ToolbarContextMenu.openExtensionURL = function (event, popup, type) {
            let id = this._getExtensionId(popup); // get the ID for the toolbar button the context menu was opened on
            let extension = WebExtensionPolicy.getByID(id).extension; // this contains information about an extension with a given ID.
            // use extension's principal if it's available.
            let triggeringPrincipal = extension.principal;
            let url;
            // which type of page to open. the "type" value passed is different for each menu item.
            switch (type) {
                case "Manifest":
                    url = extension.baseURL + `manifest.json`;
                    break;
                case "Popup":
                    url = extension.manifest.browser_action?.default_popup;
                    break;
                case "Options":
                    url = extension.manifest.options_ui?.page;
                    break;
                case "Inspector":
                    url = `about:devtools-toolbox?id=${encodeURIComponent(id)}&type=extension`;
                    triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal(); // use the system principal for about:devtools-toolbox
                    break;
            }
            // if the extension's principal isn't available for some reason, make a content principal.
            if (!triggeringPrincipal)
                triggeringPrincipal = Services.scriptSecurityManager.createContentPrincipal(
                    Services.io.newURI(url),
                    {}
                );
            // whether to open in the current tab or a new tab.
            // only opens in the current tab if the current tab is on the new tab page or home page.
            let where = new RegExp(`(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`, "i").test(
                gBrowser.currentURI.spec
            )
                ? "current"
                : "tab";
            openLinkIn(url, where, {
                triggeringPrincipal,
                // only open in the background if the shift key was pressed when the menu item was clicked
                inBackground: event.shiftKey,
            });
        };
    }
    // modify the internal updateExtension function that updates the visibility
    // of the built-in "remove extension," "manage extension" items, etc.
    // based on whether the toolbar button that was clicked is an extension or not
    // so that it also updates the visibility of our menu by the same parameter.
    setupUpdate() {
        eval(
            `ToolbarContextMenu.updateExtension = async function ` +
                ToolbarContextMenu.updateExtension
                    .toSource()
                    .replace(/async updateExtension/, "")
                    .replace(
                        /let separator/,
                        `let debugExtension = popup.querySelector(\".customize-context-debugExtension\");\n    let separator`
                    )
                    .replace(
                        /\[removeExtension, manageExtension,/,
                        `[removeExtension, manageExtension, debugExtension,`
                    )
        );
    }
}

if (gBrowserInit.delayedStartupFinished) new DebugExtension();
else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            new DebugExtension();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
