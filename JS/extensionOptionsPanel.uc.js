// ==UserScript==
// @name           Extension Options Panel
// @version        1.8.7
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script creates a toolbar button that opens a popup panel
// where extensions can be configured, disabled, uninstalled, etc. Each
// extension gets its own button in the panel. Clicking an extension's button
// leads to a subview where you can jump to the extension's options, disable or
// enable the extension, uninstall it, configure automatic updates,
// disable/enable it in private browsing, view its source code in whatever
// program is associated with .xpi files, open the extension's homepage, or copy
// the extension's ID. The panel can also be opened from the App Menu, using the
// built-in "Add-ons and themes" button. Since v1.8, themes will also be listed
// in the panel. Hovering a theme will show a tooltip with a preview/screenshot
// of the theme, and clicking the theme will toggle it on or off. There are
// several translation and configuration options directly below.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class ExtensionOptionsWidget {
  // user configuration. change the value to the right of the colon.
  static config = {
    "Replace addons button": true, // this script replaces the "Add-ons & Themes" button in the app menu with an "Extensions" button that opens our new panel instead of opening about:addons. set to false if you want to leave this button alone

    "Show header": true, // set to false if you don't want the "Add-on options" title to be displayed at the top of the panel

    "Show version": false, // show the addon version next to its name in the list

    "Show addon messages": true, // about:addons shows you when an addon has a warning or error, e.g. it's unsigned or blocked. if this is set to true, we'll show the same information in the panel

    "Show theme preview tooltips": true, // when hovering a theme in the panel, a preview/screenshot of the theme will be displayed in a tooltip, if possible. this depends on the add-on author.

    "Show hidden extensions": false, // show system extensions?

    "Show disabled extensions": true, // show extensions that you've disabled?

    "Show enabled extensions first": true, // show enabled extensions at the top of the list and disabled extensions at the bottom?

    "Addon ID blacklist": [], // put addon IDs in this list, separated by commas, to exclude them from the list, e.g. ["screenshots@mozilla.org", "dark-theme@mozilla.org"]

    "Icon URL": `chrome://mozapps/skin/extensions/extension.svg`, // if you want to change the button's icon for some reason, you can replace this string with any URL or data URL that leads to an image.

    // localization strings
    l10n: {
      "Button label": "Add-ons and themes", // what should the button's label be when it's in the overflow panel or customization palette?

      "Button tooltip": "Add-ons and themes", // what should the button's tooltip be? I use sentence case since that's the convention.

      "Panel title": "Add-ons and themes", // title shown at the top of the panel (when "Show header" is true)

      "Download addons label": "Download add-ons", // label for the button that appears when you have no addons installed.

      "Addons page label": "Add-ons page", // label for the about:addons button at the bottom of the panel

      "Addon options label": "Extension options", // labels for the addon subview buttons

      "Manage addon label": "Manage add-on",

      "Enable addon label": "Enable",

      "Disable addon label": "Disable",

      "Uninstall addon label": "Uninstall",

      "View source label": "View source",

      "Manage shortcuts label": "Manage shortcuts",

      "Open homepage label": "Open homepage",

      "Copy ID label": "Copy ID",

      "Automatic updates label": "Automatic updates:",

      // labels for the automatic update radio buttons
      autoUpdate: {
        "Default label": "Default",

        "On label": "On",

        "Off label": "Off",
      },

      "Run in private windows label": "Run in private windows:",

      // labels for the run in private windows radio buttons
      runInPrivate: {
        "Allow label": "Allow",

        "Don't allow label": "Don't allow",
      },

      // labels for addon buttons that have a warning or error,
      // e.g. addon automatically disabled because it's on a blocklist or unsigned
      addonMessages: {
        "Blocked": "Blocked",

        "Signature required": "Signature required",

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
   * @param {object} props (an object containing attribute name/value pairs,
   *                       e.g. class: ".bookmark-item")
   * @param {boolean} isHTML (if true, create an HTML element. if omitted or
   *                         false, create a XUL element. generally avoid HTML
   *                         when modding the UI, most UI elements are actually
   *                         XUL elements.)
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
    for (let [name, value] of Object.entries(props)) {
      if (value) el.setAttribute(name, value);
      else el.removeAttribute(name);
    }
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
    // Add-ons without an "isCorrectlySigned" property are correctly signed as
    // they aren't the correct type for signing.
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

  /**
   * find an addon's screenshot url. prefer 680x92.
   * @param {object} addon (an Addon object)
   * @returns {string} url
   */
  getScreenshotUrlForAddon(addon) {
    if (addon.id == "default-theme@mozilla.org") {
      return "chrome://mozapps/content/extensions/default-theme/preview.svg";
    }
    const builtInThemePreview = this.BuiltInThemes.previewForBuiltInThemeId(addon.id);
    if (builtInThemePreview) return builtInThemePreview;
    let { screenshots } = addon;
    if (!screenshots || !screenshots.length) return null;
    let screenshot = screenshots.find(s => s.width === 680 && s.height === 92);
    if (!screenshot) screenshot = screenshots[0];
    return screenshot.url;
  }

  // where panelviews are hiding when we're not looking
  viewCache(doc) {
    return doc.getElementById("appMenu-viewCache");
  }

  constructor() {
    XPCOMUtils.defineLazyModuleGetters(this, {
      ExtensionPermissions: "resource://gre/modules/ExtensionPermissions.jsm",
      BuiltInThemes: "resource:///modules/BuiltInThemes.jsm",
    });
    XPCOMUtils.defineLazyGetter(this, "extBundle", function() {
      return Services.strings.createBundle("chrome://global/locale/extensions.properties");
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
    ) {
      CustomizableUI.createWidget({
        id: "eom-button",
        viewId: this.viewId,
        type: "view",
        defaultArea: CustomizableUI.AREA_NAVBAR,
        removable: true,
        label: l10n["Button label"],
        tooltiptext: l10n["Button tooltip"],
        // if the button is middle-clicked, open the addons page instead of the panel
        onClick: event => {
          if (event.button == 1) {
            event.target.ownerGlobal.BrowserOpenAddonsMgr("addons://list/extension");
          }
        },
        // create the panelview before the toolbar button
        onBeforeCreated: aDoc => {
          let eop = aDoc.defaultView.extensionOptionsPanel;
          if (!eop) return;
          let view = eop.create(aDoc, "panelview", {
            id: eop.viewId,
            class: "PanelUI-subView cui-widget-panelview",
            flex: "1",
            style: "min-width:30em",
          });
          aDoc.getElementById("appMenu-viewCache").appendChild(view);
          aDoc.defaultView.extensionOptionsPanel.panelview = view;

          if (eop.config["Show header"]) {
            let header = view.appendChild(
              eop.create(aDoc, "vbox", { id: "eom-mainView-panel-header" })
            );
            let heading = header.appendChild(eop.create(aDoc, "label"));
            let label = heading.appendChild(
              eop.create(aDoc, "html:span", {
                id: "eom-mainView-panel-header-span",
                role: "heading",
                "aria-level": "1",
              })
            );
            label.textContent = l10n["Panel title"];
            view.appendChild(aDoc.createXULElement("toolbarseparator"));
          }

          view.appendChild(
            eop.create(aDoc, "vbox", {
              id: view.id + "-body",
              class: "panel-subview-body",
            })
          );

          // create the theme preview tooltip
          if (eop.config["Show theme preview tooltips"]) {
            aDoc
              .getElementById("mainPopupSet")
              .appendChild(
                aDoc.defaultView.MozXULElement.parseXULToFragment(
                  `<tooltip id="eom-theme-preview-tooltip" noautohide="true" orient="vertical" onpopupshowing="extensionOptionsPanel.onTooltipShowing(event);"><vbox id="eom-theme-preview-box"><html:img id="eom-theme-preview-canvas"></html:img></vbox></tooltip>`
                )
              );
          }

          eop.fluentSetup(aDoc).then(() => eop.swapAddonsButton(aDoc));
        },
        // populate the panel before it's shown
        onViewShowing: event => {
          if (event.originalTarget === event.target.ownerGlobal.extensionOptionsPanel?.panelview) {
            event.target.ownerGlobal.extensionOptionsPanel.getAddonsAndPopulate(event);
          }
        },
        // delete the panel if the widget node is destroyed
        onDestroyed: aDoc => {
          let view = aDoc.getElementById(aDoc.defaultView.extensionOptionsPanel?.viewId);
          if (view) {
            aDoc.defaultView.CustomizableUI.hidePanelForNode(view);
            view.remove();
          }
        },
      });
    }
    this.loadStylesheet(); // load the stylesheet
  }

  // grab localized strings for the extensions button and disabled/enabled extensions headings
  async fluentSetup(aDoc) {
    aDoc.ownerGlobal.MozXULElement.insertFTLIfNeeded("toolkit/about/aboutAddons.ftl");
    let [extensions, themes, enabled, disabled, privateHelp] = await aDoc.l10n.formatValues([
      "addon-category-extension",
      "addon-category-theme",
      "extension-enabled-heading",
      "extension-disabled-heading",
      "addon-detail-private-browsing-help",
    ]);
    privateHelp = privateHelp.replace(/\s*\<.*\>$/, "");
    this.aboutAddonsStrings = { extensions, themes, enabled, disabled, privateHelp };
  }

  /**
   * this script changes the built-in "Add-ons & themes" button in the app menu
   * to open our new panel instead of opening about:addons
   * @param {object} aDoc (the document our widget has been created within)
   */
  swapAddonsButton(aDoc) {
    if (!this.config["Replace addons button"]) return;
    let win = aDoc.defaultView;
    win.PanelUI._initialized || win.PanelUI.init(shouldSuppressPopupNotifications);
    this.setAttributes(
      win.PanelUI.mainView.querySelector("#appMenu-extensions-themes-button") ||
        win.PanelUI.mainView.querySelector("#appMenu-addons-button"),
      {
        command: 0,
        key: 0,
        shortcut: 0,
        class: "subviewbutton subviewbutton-nav",
        oncommand: "PanelUI.showSubView('PanelUI-eom', this);",
        closemenu: "none",
      }
    );
  }

  /**
   * grab all addons and populate the panel with them.
   * @param {object} e (a ViewShowing event)
   */
  async getAddonsAndPopulate(e) {
    let extensions = await AddonManager.getAddonsByTypes(["extension"]);
    let themes = await AddonManager.getAddonsByTypes(["theme"]);
    this.populatePanelBody(e, { extensions, themes });
  }

  /**
   * create everything inside the panel
   * @param {object} e (a ViewShowing event - its target is the panelview node)
   * @param {array} addons (an object containing arrays for different addon
   *                       types e.g. extensions, themes)
   */
  populatePanelBody(e, addons) {
    let prevState;
    let { extensions, themes } = addons;
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
    while (body.hasChildNodes()) body.firstChild.remove();
    [...this.viewCache(doc).children].forEach(panel => {
      if (panel.id.includes("PanelUI-eom-addon-")) panel.remove();
    });
    let appMenuMultiView = win.PanelMultiView.forNode(PanelUI.multiView);
    if (win.PanelMultiView.forNode(view.closest("panelmultiview")) === appMenuMultiView) {
      [...appMenuMultiView._viewStack.children].forEach(panel => {
        if (panel.id !== view.id && panel.id.includes("PanelUI-eom-addon-")) panel.remove();
      });
    }

    // extensions...
    let enabledSubheader = body.appendChild(
      this.create(doc, "h2", { class: "subview-subheader" }, true)
    );
    enabledSubheader.textContent = this.aboutAddonsStrings[showDisabled ? "enabled" : "extensions"];
    extensions
      .sort((a, b) => {
        // get sorted by enabled state...
        let ka = (enabledFirst ? Number(!a.isActive) : "") + a.name.toLowerCase();
        let kb = (enabledFirst ? Number(!b.isActive) : "") + b.name.toLowerCase();
        return ka < kb ? -1 : 1;
      })
      .forEach(addon => {
        // then get excluded if config wills it...
        if (
          !blackListArray.includes(addon.id) &&
          (!addon.hidden || this.config["Show hidden extensions"]) &&
          (!addon.userDisabled || showDisabled)
        ) {
          // then get built into subviewbuttons and corresponding subviews...
          if (showDisabled && enabledFirst && prevState && addon.isActive != prevState) {
            body.appendChild(doc.createXULElement("toolbarseparator"));
            let disabledSubheader = body.appendChild(
              this.create(doc, "h2", { class: "subview-subheader" }, true)
            );
            disabledSubheader.textContent = this.aboutAddonsStrings.disabled;
          }
          prevState = addon.isActive;

          let subviewbutton = body.appendChild(
            this.create(doc, "toolbarbutton", {
              label: addon.name + (showVersion ? " " + addon.version : ""),
              class: "subviewbutton subviewbutton-iconic subviewbutton-nav eom-addon-button",
              oncommand: "extensionOptionsPanel.showSubView(event, this)",
              closemenu: "none",
              "addon-type": "extension",
              "data-extensionid": addon.id,
            })
          );
          if (!addon.isActive) subviewbutton.classList.add("disabled");
          // set the icon using CSS variables and list-style-image so that user stylesheets can override the icon URL.
          subviewbutton.style.setProperty(
            "--extension-icon",
            `url(${addon.iconURL || this.config["Icon URL"]})`
          );
          subviewbutton._Addon = addon;

          if (this.config["Show addon messages"]) this.setAddonMessage(doc, subviewbutton, addon);
        }
      });

    // themes...
    let themesSeparator = body.appendChild(doc.createXULElement("toolbarseparator"));
    let themesSubheader = body.appendChild(
      this.create(doc, "h2", { class: "subview-subheader" }, true)
    );
    themesSubheader.textContent = this.aboutAddonsStrings.themes;
    themes.forEach(addon => {
      if (
        !blackListArray.includes(addon.id) &&
        (!addon.hidden || this.config["Show hidden extensions"]) &&
        (!addon.userDisabled || showDisabled)
      ) {
        let subviewbutton = body.appendChild(
          this.create(doc, "toolbarbutton", {
            label: addon.name + (showVersion ? " " + addon.version : ""),
            class: "subviewbutton subviewbutton-iconic eom-addon-button",
            closemenu: "none",
            "addon-type": "theme",
            "data-extensionid": addon.id,
          })
        );
        subviewbutton.addEventListener("command", async e => {
          await addon[addon.userDisabled ? "enable" : "disable"]();
          subviewbutton.parentElement
            .querySelectorAll(`.eom-addon-button[addon-type="theme"]`)
            .forEach(btn => {
              btn.classList[btn._Addon?.isActive ? "remove" : "add"]("disabled");
              this.setAddonMessage(doc, btn, btn._Addon);
            });
        });
        if (!addon.isActive) subviewbutton.classList.add("disabled");
        subviewbutton.style.setProperty(
          "--extension-icon",
          `url(${addon.iconURL || this.config["Icon URL"]})`
        );
        subviewbutton._Addon = addon;

        this.setAddonMessage(doc, subviewbutton, addon);
      }
    });

    // if no addons are shown, display a "Download Addons" button that leads to AMO.
    let getAddonsButton = body.appendChild(
      this.create(doc, "toolbarbutton", {
        id: "eom-get-addons-button",
        class: "subviewbutton subviewbutton-iconic",
        label: l10n["Download addons label"],
        image: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 68 68" style="border-radius:3px"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M0 0v68h68V0H0zm61.8 49H49.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h3.9v6.4H30.5V32.4c0-5.1-1.7-7-5-7-4 0-5.6 2.9-5.6 6.9v10.2h5.6v6.4h-18v-6.4h3.9V26H7.5v-6.4h12.3V24c1.8-3.1 4.8-5 8.9-5 4.2 0 8.1 2 9.5 6.3 1.6-3.9 4.9-6.3 9.5-6.3 5.3 0 10.1 3.2 10.1 10.1v13.5h4V49z"/></svg>`,
        oncommand: `switchToTabHavingURI(Services.urlFormatter.formatURLPref("extensions.getAddons.link.url"), true, {
                    inBackground: false,
                    triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal(),
                });`,
      })
    );

    let hasExtensions = !!body.querySelector(`.eom-addon-button[addon-type="extension"]`);
    let hasThemes = !!body.querySelector(`.eom-addon-button[addon-type="theme"]`);
    getAddonsButton.hidden = hasExtensions || hasThemes;
    if (!hasExtensions) {
      enabledSubheader.remove();
      themesSeparator.remove();
    }
    if (!hasThemes) {
      themesSubheader.remove();
      themesSeparator.remove();
    }

    // make a footer button that leads to about:addons
    if (view.querySelector("#eom-allAddonsButton")) return;
    view.appendChild(doc.createXULElement("toolbarseparator"));
    view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Addons page label"],
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
   * for a given button made for an addon, find out if it has a message
   * (blocked, unverified, etc.) and if so, display it
   * @param {object} doc (the document we're localizing)
   * @param {object} subviewbutton (an addon button in the panel)
   * @param {object} addon (an Addon object)
   */
  async setAddonMessage(doc, subviewbutton, addon) {
    const l10n = this.config.l10n;
    const { name } = addon;
    const { STATE_BLOCKED, STATE_SOFTBLOCKED } = Ci.nsIBlocklistService;
    const formatString = (type, args) => {
      return new Promise(resolve => {
        doc.l10n
          .formatMessages([{ id: `details-notification-${type}`, args }])
          .then(msg => resolve(msg[0].value));
      });
    };

    let message = null;
    if (addon.blocklistState === STATE_BLOCKED) {
      message = {
        label: l10n.addonMessages.Blocked,
        detail: await formatString("blocked", { name }),
        type: "error",
      };
    } else if (this.isDisabledUnsigned(addon)) {
      message = {
        label: l10n.addonMessages["Signature Required"],
        detail: await formatString("unsigned-and-disabled", { name }),
        type: "error",
      };
    } else if (
      !addon.isCompatible &&
      (AddonManager.checkCompatibility || addon.blocklistState !== STATE_SOFTBLOCKED)
    ) {
      message = {
        label: l10n.addonMessages.Incompatible,
        detail: await formatString("incompatible", {
          name,
          version: Services.appinfo.version,
        }),
        type: "warning",
      };
    } else if (!this.isCorrectlySigned(addon)) {
      message = {
        label: l10n.addonMessages.Unverified,
        detail: await formatString("unsigned", { name }),
        type: "warning",
      };
    } else if (addon.blocklistState === STATE_SOFTBLOCKED) {
      message = {
        label: l10n.addonMessages.Insecure,
        detail: await formatString("softblocked", { name }),
        type: "warning",
      };
    }
    if (
      this.config["Show theme preview tooltips"] &&
      addon.type === "theme" &&
      (!message || message.type !== "error")
    ) {
      message = message ?? {};
      message.detail = "";
      message.tooltip = "eom-theme-preview-tooltip";
      message.preview = this.getScreenshotUrlForAddon(addon);
      if (addon.isActive) {
        message.label = null;
        message.checked = true;
      }
    }
    if (subviewbutton._addonMessage) {
      subviewbutton.removeAttribute("message-type");
      subviewbutton.removeAttribute("tooltiptext");
      subviewbutton.removeAttribute("tooltip");
      subviewbutton.removeAttribute("enable-checked");
      subviewbutton.querySelector(".eom-message-label")?.remove();
      delete subviewbutton._addonMessage;
    }
    if (message) {
      subviewbutton.setAttribute("message-type", message?.type);
      subviewbutton.setAttribute("tooltiptext", message?.detail);
      if (message.tooltip) subviewbutton.setAttribute("tooltip", message.tooltip);
      if (message.checked) subviewbutton.setAttribute("enable-checked", true);
      if (message.label) {
        subviewbutton.appendChild(
          this.create(document, "h", {
            class: "toolbarbutton-text eom-message-label",
          })
        ).textContent = `(${message.label})`;
      }
    }
    subviewbutton._addonMessage = message;
  }

  /**
   * show the subview for a given extension
   * @param {object} event (a triggering command/click event)
   * @param {object} anchor (the subviewbutton that was clicked —
   *                        dictates the title of the subview)
   */
  showSubView(event, anchor) {
    if (!("_Addon" in anchor)) return;
    this.buildSubView(anchor, anchor._Addon);
    event.target.ownerGlobal.PanelUI?.showSubView(
      "PanelUI-eom-addon-" + this.makeWidgetId(anchor._Addon.id),
      anchor,
      event
    );
  }

  /**
   * for a given addon, build a panel subview
   * @param {object} subviewbutton (the button you click to enter the subview,
   *                               corresponding to the addon)
   * @param {object} addon (an addon object provided by the AddonManager,
   *                       with all the data we need)
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
        label: l10n["Addon options label"],
        class: "subviewbutton",
      })
    );
    optionsButton.addEventListener("command", e => this.openAddonOptions(addon, win));

    // manage button, when no options page exists
    let manageButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Manage addon label"],
        class: "subviewbutton",
      })
    );
    manageButton.addEventListener("command", e =>
      win.BrowserOpenAddonsMgr("addons://detail/" + encodeURIComponent(addon.id))
    );

    // disable button
    let disableButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: addon.userDisabled ? l10n["Enable addon label"] : l10n["Disable addon label"],
        class: "subviewbutton",
        closemenu: "none",
      })
    );
    disableButton.addEventListener("command", async e => {
      if (addon.userDisabled) {
        await addon.enable();
        disableButton.setAttribute("label", l10n["Disable addon label"]);
      } else {
        await addon.disable();
        disableButton.setAttribute("label", l10n["Enable addon label"]);
      }
      this.getAddonsAndPopulate();
    });

    // uninstall button, and so on...
    let uninstallButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Uninstall addon label"],
        class: "subviewbutton",
      })
    );
    uninstallButton.addEventListener("command", e => {
      if (win.Services.prompt.confirm(null, null, `Delete ${addon.name} permanently?`)) {
        addon.pendingOperations & win.AddonManager.PENDING_UNINSTALL
          ? addon.cancelUninstall()
          : addon.uninstall();
      }
    });

    // allow automatic updates radio group
    let updates = view.appendChild(
      this.create(doc, "hbox", {
        id: "eom-allow-auto-updates",
        class: "subviewbutton eom-radio-hbox",
        align: "center",
      })
    );
    let updatesLabel = updates.appendChild(
      this.create(doc, "label", {
        id: "eom-allow-auto-updates-label",
        class: "toolbarbutton-text eom-radio-label",
        flex: 1,
        wrap: true,
      })
    );
    updatesLabel.textContent = l10n["Automatic updates label"];
    let updatesGroup = updates.appendChild(
      this.create(doc, "radiogroup", {
        id: "eom-allow-auto-updates-group",
        class: "eom-radio-group",
        value: addon.applyBackgroundUpdates,
        closemenu: "none",
        orient: "horizontal",
        "aria-labelledby": "eom-allow-auto-updates-label",
      })
    );
    updatesGroup.addEventListener("command", e => (addon.applyBackgroundUpdates = e.target.value));
    updatesGroup.appendChild(
      this.create(doc, "radio", {
        label: l10n.autoUpdate["Default label"],
        class: "subviewradio",
        value: 1,
      })
    );
    updatesGroup.appendChild(
      this.create(doc, "radio", {
        label: l10n.autoUpdate["On label"],
        class: "subviewradio",
        value: 2,
      })
    );
    updatesGroup.appendChild(
      this.create(doc, "radio", {
        label: l10n.autoUpdate["Off label"],
        class: "subviewradio",
        value: 0,
      })
    );

    // run in private windows radio group
    let setPrivateState = async (addon, node) => {
      let perms = await this.ExtensionPermissions.get(addon.id);
      let isAllowed = perms.permissions.includes("internal:privateBrowsingAllowed");
      node.permState = isAllowed;
      node.value = isAllowed ? 1 : 0;
    };
    let privateWindows = view.appendChild(
      this.create(doc, "hbox", {
        id: "eom-run-in-private",
        class: "subviewbutton eom-radio-hbox",
        align: "center",
      })
    );
    let privateLabel = privateWindows.appendChild(
      this.create(doc, "label", {
        id: "eom-run-in-private-label",
        class: "toolbarbutton-text eom-radio-label",
        flex: 1,
        wrap: true,
        tooltiptext: this.aboutAddonsStrings.privateHelp,
      })
    );
    privateLabel.textContent = l10n["Run in private windows label"];
    let privateGroup = privateWindows.appendChild(
      this.create(doc, "radiogroup", {
        id: "eom-run-in-private-group",
        class: "eom-radio-group",
        closemenu: "none",
        orient: "horizontal",
        "aria-labelledby": "eom-run-in-private-label",
      })
    );
    privateGroup.addEventListener("command", async () => {
      let extension = this.extensionForAddonId(addon.id);
      await this.ExtensionPermissions[privateGroup.permState ? "remove" : "add"](
        addon.id,
        {
          permissions: ["internal:privateBrowsingAllowed"],
          origins: [],
        },
        extension
      );
      setPrivateState(addon, privateGroup);
    });
    privateGroup.appendChild(
      this.create(doc, "radio", {
        label: l10n.runInPrivate["Allow label"],
        class: "subviewradio",
        value: 1,
      })
    );
    privateGroup.appendChild(
      this.create(doc, "radio", {
        label: l10n.runInPrivate["Don't allow label"],
        class: "subviewradio",
        value: 0,
      })
    );
    setPrivateState(addon, privateGroup);

    // manage shortcuts
    let shortcutsButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Manage shortcuts label"],
        class: "subviewbutton",
      })
    );
    shortcutsButton.addEventListener("command", () =>
      win.BrowserOpenAddonsMgr("addons://shortcuts/shortcuts")
    );

    let viewSrcButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["View source label"],
        class: "subviewbutton",
      })
    );
    viewSrcButton.addEventListener("command", () => this.openArchive(addon));

    let homePageButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Open homepage label"],
        class: "subviewbutton",
      })
    );
    homePageButton.addEventListener("command", () => {
      win.switchToTabHavingURI(addon.homepageURL || addon.supportURL, true, {
        inBackground: false,
        triggeringPrincipal: win.Services.scriptSecurityManager.getSystemPrincipal(),
      });
    });

    let copyIdButton = view.appendChild(
      this.create(doc, "toolbarbutton", {
        label: l10n["Copy ID label"],
        class: "subviewbutton panel-subview-footer-button",
      })
    );
    copyIdButton.addEventListener("command", () => {
      win.Cc["@mozilla.org/widget/clipboardhelper;1"]
        .getService(win.Ci.nsIClipboardHelper)
        .copyString(addon.id);
      let PMV = view.panelMultiView && win.PanelMultiView.forNode(view.panelMultiView);
      if (PMV) {
        let panel = PMV._panel;
        if (panel && PMV._getBoundsWithoutFlushing(panel.anchorNode)?.width) {
          win.CustomHint?.show(panel.anchorNode, "Copied");
        }
      }
    });

    view.addEventListener("ViewShowing", () => {
      optionsButton.hidden = !addon.optionsURL;
      manageButton.hidden = !!addon.optionsURL;
      updates.hidden = !(addon.permissions & win.AddonManager.PERM_CAN_UPGRADE);
      updatesGroup.setAttribute("value", addon.applyBackgroundUpdates);
      privateWindows.hidden = !(
        addon.incognito != "not_allowed" &&
        !!(addon.permissions & win.AddonManager.PERM_CAN_CHANGE_PRIVATEBROWSING_ACCESS)
      );
      setPrivateState(addon, privateGroup);
      shortcutsButton.hidden = !this.extensionForAddonId(addon.id)?.shortcuts?.manifestCommands
        ?.size;
      disableButton.setAttribute(
        "label",
        addon.userDisabled ? l10n["Enable addon label"] : l10n["Disable addon label"]
      );
      uninstallButton.hidden = viewSrcButton.hidden =
        addon.isSystem || addon.isBuiltin || addon.temporarilyInstalled;
      homePageButton.hidden = !(addon.homepageURL || addon.supportURL);
    });
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
        if (win.Services.prefs.getBoolPref("browser.preferences.instantApply")) {
          features += ",dialog=no";
        }
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

  onTooltipShowing(e) {
    let anchor = e.target.triggerNode ? e.target.triggerNode.closest(".eom-addon-button") : null;
    let message = anchor._addonMessage;
    let img = e.target.querySelector("#eom-theme-preview-canvas");
    img.src = message?.preview || "";
    if (!anchor || !message?.preview) {
      e.preventDefault();
      return;
    }
    e.target.setAttribute("position", "after_start");
    e.target.moveToAnchor(anchor, "after_start");
  }

  // generate and load a stylesheet
  loadStylesheet() {
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = makeURI(
      "data:text/css;charset=UTF=8," +
        encodeURIComponent(
          /*css*/
          `#eom-button {
    list-style-image: url('${this.config["Icon URL"]}');
}
#eom-mainView-panel-header {
    padding: 8px 4px 4px 4px;
    min-height: 44px;
    -moz-box-pack: center;
    -moz-box-align: center;
}
#eom-mainView-panel-header-span {
    font-weight: 600;
    display: inline-block;
    text-align: center;
    overflow-wrap: break-word;
}
.panel-header ~ #eom-mainView-panel-header,
.panel-header ~ #eom-mainView-panel-header + toolbarseparator {
    display: none;
}
.eom-addon-button {
    list-style-image: var(--extension-icon);
}
#${this.viewId} {
    min-height: 400px;
    min-width: 27em;
}
#${this.viewId} .disabled label {
    opacity: 0.6;
    font-style: italic;
}
#${this.viewId} .eom-message-label {
    opacity: 0.6;
    margin-inline-start: 8px;
    font-style: italic;
}
.eom-addon-button[message-type="warning"] {
    background-color: var(--eom-warning-bg, hsla(48, 100%, 66%, 0.15));
}
.eom-addon-button[message-type="warning"]:not([disabled], [open], :active):is(:hover) {
    background-color: var(
        --eom-warning-bg-hover,
        color-mix(in srgb, currentColor 8%, hsla(48, 100%, 66%, 0.18))
    );
}
.eom-addon-button[message-type="warning"]:not([disabled]):is([open], :hover:active) {
    background-color: var(
        --eom-warning-bg-active,
        color-mix(in srgb, currentColor 15%, hsla(48, 100%, 66%, 0.2))
    );
}
.eom-addon-button[message-type="error"] {
    background-color: var(--eom-error-bg, hsla(2, 100%, 66%, 0.15));
}
.eom-addon-button[message-type="error"]:not([disabled], [open], :active):is(:hover) {
    background-color: var(
        --eom-error-bg-hover,
        color-mix(in srgb, currentColor 8%, hsla(2, 100%, 66%, 0.18))
    );
}
.eom-addon-button[message-type="error"]:not([disabled]):is([open], :hover:active) {
    background-color: var(
        --eom-error-bg-active,
        color-mix(in srgb, currentColor 15%, hsla(2, 100%, 66%, 0.2))
    );
}
.eom-radio-hbox {
    padding-block: 4px;
}
.eom-radio-hbox .radio-check {
    margin-block: 0;
}
.eom-radio-hbox label {
    padding-bottom: 1px;
}
.eom-radio-label {
    margin-inline-end: 8px;
}
.eom-radio-hbox .subviewradio {
    margin: 0;
    margin-inline: 2px;
    padding: 0;
    background: none !important;
}
.eom-radio-hbox .radio-label-box {
    margin: 0;
    padding: 0;
}
.eom-radio-label[tooltiptext] {
    cursor: help;
}
.eom-addon-button[enable-checked]::after {
    -moz-context-properties: fill, fill-opacity;
    content: url(chrome://global/skin/icons/check.svg);
    fill: currentColor;
    fill-opacity: 0.6;
    display: block;
    margin-inline-start: 10px;
}
#eom-theme-preview-tooltip {
    appearance: none;
    padding: 0;
    border-radius: var(--arrowpanel-border-radius, 8px);
    overflow: hidden;
    border: 1px solid var(--arrowpanel-border-color);
    background: var(--arrowpanel-border-color);
}`
        )
    );
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

window.extensionOptionsPanel = new ExtensionOptionsWidget();
