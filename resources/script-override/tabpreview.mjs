// ==UserScript==
// @name           tabpreview.mjs
// @version        1.0.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Modifications to the tab preview card, in line with the old
// modifications to the tab tooltip. Instead of showing the "MUTE" and "CLOSE
// TAB" tooltips as labels inside the tab, show them in the preview card. This
// was done for the tab tooltip to keep the tab label all on one line. Since the
// tab preview card replaces the tooltip, we need to do the same thing to the
// preview card.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

import { html } from "chrome://global/content/vendor/lit.all.mjs";
import { MozLitElement } from "chrome://global/content/lit-utils.mjs";

var { XPCOMUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/XPCOMUtils.sys.mjs"
);

const TAB_PREVIEW_USE_THUMBNAILS_PREF =
  "browser.tabs.cardPreview.showThumbnails";

/**
 * Detailed preview card that displays when hovering a tab
 *
 * @property {MozTabbrowserTab} tab - the tab to preview
 * @fires TabPreview#previewhidden
 * @fires TabPreview#previewshown
 * @fires TabPreview#previewThumbnailUpdated
 */
export default class TabPreview extends MozLitElement {
  static properties = {
    tab: { type: Object },

    _previewIsActive: { type: Boolean, state: true },
    _previewDelayTimeout: { type: Number, state: true },
    _previewDelayTimeoutActive: { type: Boolean, state: true },
    _displayTitle: { type: String, state: true },
    _displayURI: { type: String, state: true },
    _displayImg: { type: Object, state: true },

    overCloseButton: { type: Boolean },
    overPlayingIcon: { type: Boolean },
    audioMuted: { type: Boolean },
  };

  constructor() {
    super();
    XPCOMUtils.defineLazyPreferenceGetter(
      this,
      "_prefPreviewDelay",
      "ui.tooltip.delay_ms"
    );
    XPCOMUtils.defineLazyPreferenceGetter(
      this,
      "_prefDisplayThumbnail",
      TAB_PREVIEW_USE_THUMBNAILS_PREF,
      false
    );
    this._previewDelayTimeoutActive = true;
  }

  // render this inside a <panel>
  createRenderRoot() {
    if (!document.createXULElement) {
      console.error(
        "Unable to create panel: document.createXULElement is not available"
      );
      return super.createRenderRoot();
    }
    this.attachShadow({ mode: "open" });
    this.panel = document.createXULElement("panel");
    this.panel.setAttribute("id", "tabPreviewPanel");
    this.panel.setAttribute("noautofocus", true);
    this.panel.setAttribute("norolluponanchor", true);
    this.panel.setAttribute("consumeoutsideclicks", "never");
    this.panel.setAttribute("rolluponmousewheel", "true");
    this.panel.setAttribute("level", "parent");
    this.panel.setAttribute("position", "after_start");
    this.panel.setAttribute("exportparts", "arrowbox, arrow, content");
    this.shadowRoot.append(this.panel);
    return this.panel;
  }

  get previewCanShow() {
    return this._previewIsActive && this.tab;
  }

  get thumbnailCanShow() {
    return (
      this.previewCanShow &&
      this._prefDisplayThumbnail &&
      !this.tab.selected &&
      this._displayImg
    );
  }

  getPrettyURI(uri) {
    try {
      const url = new URL(uri);
      return `${url.hostname}`.replace(/^w{3}\./, "");
    } catch {
      return uri;
    }
  }

  handleEvent(e) {
    switch (e.type) {
      case "TabSelect": {
        this.requestUpdate();
        break;
      }
      case "popuphidden": {
        this.previewHidden();
        break;
      }
    }
  }

  showPreview() {
    this.panel.openPopup(this.tab, {
      position: "after_start",
      isContextMenu: false,
    });
    window.addEventListener("TabSelect", this);
    this.panel.addEventListener("popuphidden", this);
  }

  hidePreview() {
    this.panel.hidePopup();
  }

  previewHidden() {
    window.removeEventListener("TabSelect", this);
    this.panel.removeEventListener("popuphidden", this);

    /**
     * @event TabPreview#previewhidden
     * @type {CustomEvent}
     */
    this.dispatchEvent(new CustomEvent("previewhidden"));
  }

  resetDelay() {
    this._previewDelayTimeoutActive = true;
  }

  setLabels() {
    let { tab } = this;
    let { gBrowser } = window;

    let id, args, raw;
    let { linkedBrowser } = tab;
    const contextTabInSelection = gBrowser.selectedTabs.includes(tab);
    const tabCount = contextTabInSelection ? gBrowser.selectedTabs.length : 1;
    if (this.overCloseButton) {
      id = "tabbrowser-close-tabs-tooltip";
      args = { tabCount };
    } else if (this.overPlayingIcon) {
      args = { tabCount };
      if (contextTabInSelection) {
        id = this.audioMuted
          ? "tabbrowser-unmute-tab-audio-tooltip"
          : "tabbrowser-mute-tab-audio-tooltip";
        const keyElem = document.getElementById("key_toggleMute");
        args.shortcut = window.ShortcutUtils.prettifyShortcut(keyElem);
      } else if (tab.hasAttribute("activemedia-blocked")) {
        id = "tabbrowser-unblock-tab-audio-tooltip";
      } else {
        id = this.audioMuted
          ? "tabbrowser-unmute-tab-audio-background-tooltip"
          : "tabbrowser-mute-tab-audio-background-tooltip";
      }
    } else {
      raw = gBrowser.getTabTooltip(tab, true);
    }
    let localized = {};
    if (raw) {
      localized.label = raw;
    } else if (id) {
      let [msg] = gBrowser.tabLocalization.formatMessagesSync([{ id, args }]);
      localized.value = msg.value;
      if (msg.attributes) {
        for (let attr of msg.attributes) localized[attr.name] = attr.value;
      }
    }
    this._displayTitle = localized.label ?? "";
    let tabURL = linkedBrowser?.currentURI?.spec;
    if (
      tab.getAttribute("customizemode") === "true" ||
      tab._fullLabel === tabURL
    ) {
      this._displayURI = "";
      return;
    }
    this._displayURI = document.createXULElement("hbox");
    this._displayURI.setAttribute("class", "tab-preview-uri");
    let desc = document.createXULElement("description");
    desc.setAttribute("class", "uri-element");
    desc.setAttribute("crop", "center");
    desc.value = tabURL.replace(/^https?:\/\/(www\.)?/, "");
    this._displayURI.appendChild(desc);
  }

  // compute values derived from tab element
  willUpdate(changedProperties) {
    if (
      changedProperties.has("tab") ||
      changedProperties.has("overCloseButton") ||
      changedProperties.has("overPlayingIcon") ||
      changedProperties.has("audioMuted")
    ) {
      if (!this.tab) {
        this._displayTitle = "";
        this._displayURI = "";
        this._displayImg = null;
        return;
      }
      this.setLabels();
      if (changedProperties.has("tab")) {
        this._displayImg = null;
        let { tab } = this;
        window.tabPreviews.get(this.tab).then(el => {
          if (this.tab == tab) {
            this._displayImg = el;
          }
        });
      }
    }
  }

  updated(changedProperties) {
    if (changedProperties.has("tab")) {
      // handle preview delay
      clearTimeout(this._previewDelayTimeout);
      if (!this.tab) {
        this._previewIsActive = false;
      } else {
        this._previewDelayTimeout = setTimeout(
          () => {
            this._previewIsActive = true;
            this._previewDelayTimeoutActive = false;
          },
          this._previewDelayTimeoutActive ? this._prefPreviewDelay : 0
        );
      }
    }
    if (changedProperties.has("_previewIsActive")) {
      if (!this._previewIsActive) {
        this.hidePreview();
      }
    }
    if (
      (changedProperties.has("tab") ||
        changedProperties.has("_previewIsActive")) &&
      this.previewCanShow
    ) {
      this.updateComplete.then(() => {
        if (this.panel.state == "open" || this.panel.state == "showing") {
          this.panel.moveToAnchor(this.tab, "after_start");
        } else {
          this.showPreview();
        }

        this.dispatchEvent(
          /**
           * @event TabPreview#previewshown
           * @type {CustomEvent}
           * @property {object} detail
           * @property {MozTabbrowserTab} detail.tab - the tab being previewed
           */
          new CustomEvent("previewshown", {
            detail: { tab: this.tab },
          })
        );
      });
    }
    if (changedProperties.has("_displayImg")) {
      this.updateComplete.then(() => {
        /**
         * fires when the thumbnail for a preview is loaded
         * and added to the document.
         *
         * @event TabPreview#previewThumbnailUpdated
         * @type {CustomEvent}
         */
        this.dispatchEvent(new CustomEvent("previewThumbnailUpdated"));
      });
    }
  }

  render() {
    return html`
      <link
        rel="stylesheet"
        type="text/css"
        href="chrome://browser/content/tabpreview/tabpreview.css" />
      <div class="tab-preview-container">
        <div class="tab-preview-text-container">
          <div class="tab-preview-title">${this._displayTitle}</div>
          ${this._displayURI}
        </div>
        ${this.thumbnailCanShow
          ? html`
              <div class="tab-preview-thumbnail-container">
                ${this._displayImg}
              </div>
            `
          : ""}
      </div>
    `;
  }
}
customElements.define("tab-preview", TabPreview);
