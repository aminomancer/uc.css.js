// ==UserScript==
// @name           Debug Extension in Toolbar Context Menu
// @version        1.4.5
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Adds a new context menu when right-clicking an add-on's button in the toolbar or urlbar, any time the "Manage Extension" and "Remove Extension" items are available. The new "Debug Extension" menu contains several items: "Extension Manifest" opens the extension's manifest directly in a new tab. Aside from reading the manifest, from there you can also view the whole contents of the extension within Firefox by removing `/manifest.json` from the URL.

In the "View Documents" submenu there are several options for viewing, debugging and modding an addon's main HTML contents.

* "Browser Action" opens the extension's toolbar button popup URL (if it has one) in a regular browser window. The popup URL is whatever document it displays in its panel view, the popup that opens when you click the addon's toolbar button. This is the one you're most likely to want to modify with CSS.
* "Page Action" opens the extension's page action popup URL in the same manner. A page action is an icon on the right side of the urlbar whose behavior is specific to the page in the active tab.
* "Sidebar Action" opens the extension's sidebar document, so this would let you debug Tree Style Tab for example.
* "Extension Options" opens the document that the extension uses for configuration, also in a regular browser window. This could be the page that displays in its submenu on about:addons, or a separate page.
* "Inspect Extension" opens a devtools tab targeting the extension background. This is the same page you'd get if you opened about:debugging and clicked the "Inspect" button next to an extension.
* "View Source" opens the addon's .xpi archive.
* As you'd expect, "Copy ID" copies the extension's ID to your clipboard.
* "Copy URL" copies the extension's base URL, so it can be used in CSS rules like `@-moz-document`.

The menu items' labels are not localized automatically since Firefox doesn't include any similar strings. If you need to change the language or anything, modify the strings in the script under `config`. As usual, icons for the new menu are included in [uc-context-menu-icons.css][]

[uc-context-menu-icons.css]: https://github.com/aminomancer/uc.css.js/blob/master/uc-context-menu-icons.css
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/debugExtensionInToolbarContextMenu.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/debugExtensionInToolbarContextMenu.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class DebugExtension {
  // you can modify the menu items' labels and access keys here, e.g. if you
  // prefer another language. an access key is the letter highlighted in a
  // menuitem's label. if the letter highlighted is "D" for example, and you
  // press D on your keyboard while the context menu is open, it will
  // automatically select the menu item with that access key. if two menu items
  // have the same access key and are both visible, then instead of selecting
  // one menu item it will just cycle between the two. however, the access key
  // does not need to be a character in the label. if the access key isn't in
  // the label, then instead of underlining the letter in the label, it will add
  // the access key to the end of the label in parentheses.
  // e.g. "Debug Extension (Q)" instead of "_D_ebug Extension".
  config = {
    menuLabel: "Debug Extension", // menu label
    menuAccessKey: "D",
    // individual menu items
    Manifest: {
      label: "Extension Manifest",
      accesskey: "M",
    },
    ViewDocs: {
      label: "View Documents",
      accesskey: "D",
    },
    BrowserAction: {
      label: "Browser Action",
      accesskey: "B",
    },
    PageAction: {
      label: "Page Action",
      accesskey: "P",
    },
    SidebarAction: {
      label: "Sidebar Action",
      accesskey: "S",
    },
    Options: {
      label: "Extension Options",
      accesskey: "O",
    },
    Inspector: {
      label: "Inspect Extension",
      accesskey: "I",
    },
    ViewSource: {
      label: "View Source",
      accesskey: "V",
    },
    CopyID: {
      label: "Copy ID",
      accesskey: "C",
    },
    CopyURL: {
      label: "Copy URL",
      accesskey: "U",
    },
  };
  actionTypes = ["BrowserAction", "PageAction", "SidebarAction", "Options"];
  constructor() {
    this.setupUpdate();
    this.toolbarContext = document.getElementById("toolbar-context-menu");
    this.overflowContext = document.getElementById(
      "customizationPanelItemContextMenu"
    );
    this.pageActionContext = document.getElementById("pageActionContextMenu");
    this.toolbarMenu = this.makeMainMenu(this.toolbarContext);
    this.toolbarMenupopup = this.toolbarMenu.appendChild(
      document.createXULElement("menupopup")
    );
    this.toolbarMenupopup.addEventListener("popupshowing", this);
    this.overflowMenu = this.makeMainMenu(this.overflowContext);
    this.overflowMenupopup = this.overflowMenu.appendChild(
      document.createXULElement("menupopup")
    );
    this.overflowMenupopup.addEventListener("popupshowing", this);
    this.pageActionMenu = this.makeMainMenu(this.pageActionContext);
    this.pageActionMenupopup = this.pageActionMenu.appendChild(
      document.createXULElement("menupopup")
    );
    this.pageActionMenupopup.addEventListener("popupshowing", this);
    // make a menu item for each type of page within each context
    [
      "Manifest",
      { name: "ViewDocs", children: this.actionTypes },
      "Inspector",
      "ViewSource",
      "CopyID",
      "CopyURL",
    ].forEach(type =>
      ["toolbar", "overflow", "pageAction"].forEach(context => {
        if (typeof type === "string") {
          this.makeMenuitem(type, this[`${context}Menupopup`]);
        } else if (typeof type === "object") {
          this.makeMenu(type, this[`${context}Menupopup`]);
        }
      })
    );
  }
  /**
   * set a bunch of attributes on a node
   * @param {object} element (a DOM node)
   * @param {object} attrs (an object containing properties — keys are turned into attributes on the DOM node)
   */
  maybeSetAttributes(element, attrs) {
    for (let [name, value] of Object.entries(attrs)) {
      if (value === void 0) element.removeAttribute(name);
      else element.setAttribute(name, value);
    }
  }
  // enable/disable menu items depending on whether the clicked extension has pages available to open.
  handleEvent(e) {
    if (e.target !== e.currentTarget) return;
    let popup = e.target;
    let id = this.getExtensionId(popup);
    if (!id) return;
    let extension = WebExtensionPolicy.getByID(id).extension;
    let actions = new Map();
    for (let type of this.actionTypes) {
      actions.set(type, this.getActionURL(extension, type));
    }
    if (popup.className.includes("Submenu-Popup")) {
      actions.forEach((url, type) => {
        popup.querySelector(`.customize-context-${type}`).disabled = !url;
      });
    } else {
      popup.querySelector(".customize-context-ViewDocs-Submenu").disabled = [
        ...actions.values(),
      ].every(url => !url);
      popup.querySelector(".customize-context-ViewSource").disabled =
        extension.addonData.isSystem ||
        extension.addonData.builtIn ||
        extension.addonData.temporarilyInstalled;
    }
  }
  makeMainMenu(popup) {
    let menu = document.createXULElement("menu");
    this.maybeSetAttributes(menu, {
      class: "customize-context-debugExtension",
      label: this.config.menuLabel,
      accesskey: this.config.menuAccessKey,
      contexttype: popup === this.pageActionContext ? void 0 : "toolbaritem",
    });
    popup
      .querySelector(
        popup === this.pageActionContext
          ? ".manageExtensionItem"
          : ".customize-context-manageExtension"
      )
      .after(menu);
    return menu;
  }
  /**
   * make a menu item that opens a given type of page, with label & accesskey
   * corresponding to those defined in the "config" property
   * @param {string} type (which menuitem to make)
   * @param {object} popup (where to put the menuitem)
   * @returns a menuitem DOM node
   */
  makeMenuitem(type, popup) {
    let item = document.createXULElement("menuitem");
    this.maybeSetAttributes(item, {
      class: `customize-context-${type}`,
      label: this.config[type].label,
      accesskey: this.config[type].accesskey,
      oncommand: `debugExtensionMenu.onCommand(event, this.parentElement, "${type}")`,
      contexttype: popup.closest("#pageActionContextMenu")
        ? void 0
        : "toolbaritem",
    });
    popup.appendChild(item);
    return item;
  }
  /**
   * make a submenu in a given popup
   * @param {string} type (which menu to make)
   * @param {object} popup (where to put the menuitem)
   * @returns a menu DOM node
   */
  makeMenu(type, popup) {
    let { name, children } = type;
    if (!name || !children) return;
    let menu = document.createXULElement("menu");
    this.maybeSetAttributes(menu, {
      class: `customize-context-${name}-Submenu`,
      label: this.config[name].label,
      accesskey: this.config[name].accesskey,
      contexttype: popup.closest("#pageActionContextMenu")
        ? void 0
        : "toolbaritem",
    });
    let menupopup = menu.appendChild(document.createXULElement("menupopup"));
    menupopup.className = `customize-context-${name}-Submenu-Popup`;
    menupopup.addEventListener("popupshowing", this);
    children.forEach(item => this.makeMenuitem(item, menupopup));
    popup.appendChild(menu);
    return menu;
  }
  // get the ID for the button the context menu was opened on
  getExtensionId(popup) {
    return popup.closest("#pageActionContextMenu")
      ? BrowserPageActions.actionForNode(popup.triggerNode).extensionID
      : ToolbarContextMenu._getExtensionId(popup);
  }
  matchesActionNode(elt) {
    return (
      elt.localName === "toolbarbutton" ||
      elt.localName === "toolbaritem" ||
      elt.localName === "toolbarpaletteitem" ||
      elt.classList?.contains("urlbar-page-action")
    );
  }
  getActionNode(elt) {
    while (elt && !this.matchesActionNode(elt)) {
      if (elt.parentNode.localName === "toolbar") return null;
      elt = elt.parentNode;
    }
    return elt;
  }
  // get the URL for a given type of extension page, e.g. the popup that appears
  // when you click the addon's toolbar button, or the addon's sidebar panel.
  getActionURL(extension, type = this.actionTypes[0]) {
    if (!extension) return;
    let url;
    let { global } = extension.apiManager;
    let { manifest } = extension;
    switch (type) {
      case "BrowserAction":
        url =
          manifest.browser_action?.default_popup ||
          global.browserActionFor(extension)?.action.globals.popup;
        break;
      case "PageAction":
        url =
          manifest.page_action?.default_popup ||
          global.pageActionFor(extension)?.action.globals.popup;
        break;
      case "SidebarAction":
        url =
          manifest.sidebar_action?.default_panel ||
          global.sidebarActionFor(extension)?.globals.panel;
        break;
      case "Options":
        url = manifest.options_ui?.page;
        break;
      default:
    }
    return url;
  }
  // click callback
  onCommand(event, popup, type) {
    let id = this.getExtensionId(popup);
    if (!id) return;
    // this contains information about an extension with a given ID.
    let extension = WebExtensionPolicy.getByID(id).extension;
    // use extension's principal if it's available.
    let triggeringPrincipal = extension.principal;
    let url;
    // which type of page to open. the "type" value passed is different for each menu item.
    switch (type) {
      case "Manifest":
        url = `${extension.baseURL}manifest.json`;
        break;
      case "BrowserAction":
      case "PageAction":
      case "SidebarAction":
      case "Options":
        url = this.getActionURL(extension, type);
        break;
      case "Inspector":
        url = `about:devtools-toolbox?id=${encodeURIComponent(
          id
        )}&type=extension`;
        // use the system principal for about:devtools-toolbox
        triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
        break;
      case "ViewSource":
        this.openArchive(id);
        return;
      case "CopyID":
      case "CopyURL":
        Cc["@mozilla.org/widget/clipboardhelper;1"]
          .getService(Ci.nsIClipboardHelper)
          .copyString(type === "CopyID" ? id : extension.baseURL);
        let actionNode = this.getActionNode(popup.triggerNode);
        if (
          actionNode &&
          windowUtils.getBoundsWithoutFlushing(actionNode)?.width
        ) {
          window.CustomHint?.show(actionNode, "Copied");
        }
        return;
    }
    if (!url) return;
    // if the extension's principal isn't available for some reason, make a content principal.
    if (!triggeringPrincipal) {
      triggeringPrincipal = Services.scriptSecurityManager.createContentPrincipal(
        Services.io.newURI(url),
        {}
      );
    }
    // whether to open in the current tab or a new tab. only opens in the
    // current tab if the current tab is on the new tab page or home page.
    let where = new RegExp(
      `(${BROWSER_NEW_TAB_URL}|${HomePage.get(window)})`,
      "i"
    ).test(gBrowser.currentURI.spec)
      ? "current"
      : "tab";
    openLinkIn(url, where, {
      triggeringPrincipal,
      // only open in the background if the shift key was pressed when the menu item was clicked
      inBackground: event.shiftKey,
    });
  }
  /**
   * open a given addon's source xpi file
   * @param {string} id (an addon's ID)
   */
  openArchive(id) {
    let dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
    dir.append("extensions");
    dir.append(`${id}.xpi`);
    dir.launch();
  }
  // modify the internal functions that updates the visibility of the built-in
  // "remove extension," "manage extension" items, etc. that's based on whether
  // the button that was clicked is an extension or not, so it also updates the
  // visibility of our menu by the same parameter.
  setupUpdate() {
    eval(
      `ToolbarContextMenu.updateExtension = async function ${ToolbarContextMenu.updateExtension
        .toSource()
        .replace(/async updateExtension/, "")
        .replace(
          /let separator/,
          `let debugExtension = popup.querySelector(\".customize-context-debugExtension\");\n    let separator`
        )
        .replace(
          /\[removeExtension, manageExtension,/,
          `[removeExtension, manageExtension, debugExtension,`
        )}`
    );
    eval(
      `BrowserPageActions.onContextMenuShowing = async function ${BrowserPageActions.onContextMenuShowing
        .toSource()
        .replace(/async onContextMenuShowing/, "")
        .replace(
          /(let removeExtension.*);/,
          `$1, debugExtension = popup.querySelector(".customize-context-debugExtension");`
        )
        .replace(/(removeExtension.hidden =)/, `$1 debugExtension.hidden =`)}`
    );
  }
}

if (gBrowserInit.delayedStartupFinished) {
  window.debugExtensionMenu = new DebugExtension();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.debugExtensionMenu = new DebugExtension();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
