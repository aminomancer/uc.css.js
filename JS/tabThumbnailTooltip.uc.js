// ==UserScript==
// @name           Tab Thumbnail Tooltip
// @version        1.0.7
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Show a large thumbnail image to preview tab content when hovering a tab.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabThumbnailTooltip.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/tabThumbnailTooltip.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class TabThumbnail {
  // user preferences. add these in about:config if you want them to persist
  // between script updates without having to reapply them.
  static config = {
    // Thumbnail width, in pixels (can override with CSS too)
    "Preview width": Services.prefs.getIntPref(
      "tabThumbnailTooltip.previewWidth",
      320
    ),

    // Thumbnail height
    "Preview height": Services.prefs.getIntPref(
      "tabThumbnailTooltip.previewHeight",
      180
    ),

    // How often to refresh the thumbnail, in milliseconds
    "Update interval": Services.prefs.getIntPref(
      "tabThumbnailTooltip.updateInterval",
      30
    ),

    // Set an upper limit on the number of characters shown in the tooltip's label
    // when a thumbnail is showing. If a tab has an extremely long title (say you
    // searched a really long string on Google), it may wind up wrapping onto many
    // lines in the tooltip. This can be mitigated by setting a character limit.
    // If the limit is 100, then the first 50 characters and the last 49
    // characters will be shown, and … will be shown in between. For example, a
    // limit of 30 will yield: "Lorem ipsum dol…id est laborum". When a preview
    // thumbnail is not showing (e.g. for unloaded tabs), this setting will be
    // ignored. If you set this to 0 or -1, there will be no limit at all.
    "Max label character limit": Services.prefs.getIntPref(
      "tabThumbnailTooltip.maxLabelCharacterLimit",
      100
    ),

    // The character(s) to be shown in the middle of the label if it overflows
    // the limit set above. If the character limit above is set to 0 or -1, this
    // setting will have no effect. Wrap in backticks `
    "Overflow terminal character": Services.prefs.getStringPref(
      "tabThumbnailTooltip.overflowTerminalCharacter",
      `…`
    ),
  };
  get tooltip() {
    return (
      this._tooltip ||
      (this._tooltip = document.getElementById("tabThumbTooltip"))
    );
  }
  get tabLabel() {
    return (
      this._tabLabel ||
      (this._tabLabel = this.tooltip.querySelector("#tabThumbLabel"))
    );
  }
  get thumbBox() {
    return (
      this._thumbBox ||
      (this._thumbBox = this.tooltip.querySelector("#tabThumbBox"))
    );
  }
  constructor() {
    this._updateTimer = null;
    this.config = TabThumbnail.config;
    const markup =
      /* html */
      `<tooltip
  id="tabThumbTooltip"
  noautohide="true"
  orient="vertical"
  onpopupshowing="ucTabThumbnail.onPopupShowing();"
  onpopuphiding="ucTabThumbnail.onPopupHiding();"
  hide-thumbnail="true"
  style="visibility: collapse">
  <vbox id="tabThumbBox">
    <vbox id="tabThumbLabelBox">
      <description id="tabThumbLabel" class="tooltip-label"/>
    </vbox>
    <toolbarseparator/>
    <html:div id="tabThumbCanvas"></html:div>
  </vbox>
</tooltip>`;
    this.registerSheet();
    document
      .getElementById("mainPopupSet")
      .appendChild(MozXULElement.parseXULToFragment(markup));
    gBrowser.tabContainer.tooltip = "tabThumbTooltip";
    addEventListener("unload", () => this.cancelTimer(), false);
  }
  async onPopupShowing() {
    let ready = await this.showPreview();
    if (ready) {
      this.tooltip.style.removeProperty("visibility");
    }
    return ready;
  }
  onPopupHiding() {
    this.tooltip.style.setProperty("visibility", "collapse");
    this.cancelTimer();
  }
  async showPreview(update) {
    let tab = this.tooltip.triggerNode?.closest(".tabbrowser-tab");
    if (!tab) return false;
    if (!update) {
      this.tooltip.setAttribute("position", "after_start");
      this.tooltip.moveToAnchor(tab, "after_start");
    }
    const { config } = this;
    let label = gBrowser.getTabTooltip(tab);
    let canvas = PageThumbs.createCanvas(window);
    let browser = tab.linkedBrowser;
    let pending = tab.hasAttribute("pending") || !browser.browsingContext;
    let docURI = pending
      ? browser?.currentURI
      : browser?.documentURI || browser?.currentURI;
    let url = docURI?.spec;
    let isBlank = !url || url === "about:blank";
    if (isBlank || pending) {
      this.tabLabel.textContent = label;
      this.tooltip.setAttribute("hide-thumbnail", "true");
    } else {
      let limit = config["Max label character limit"];
      if (limit > 0 && label.length > limit) {
        let terminal = config["Overflow terminal character"] || "…";
        label = `${label.substring(0, limit / 2)}${terminal}${label.substring(
          label.length + terminal.length - limit / 2,
          label.length
        )}`;
      }
      this.tabLabel.textContent = label;
      await PageThumbs.captureToCanvas(
        browser,
        canvas,
        {
          backgroundColor: getComputedStyle(this.thumbBox).getPropertyValue(
            "background-color"
          ),
          fullScale: true,
          fullViewport: true,
        },
        true
      );
      document.mozSetImageElement("tabThumbImageCanvas", canvas);
      this.tooltip.removeAttribute("hide-thumbnail");
    }
    if (config["Update interval"] > 0) {
      this._updateTimer = setTimeout(
        () =>
          requestIdleCallback(() =>
            requestAnimationFrame(() => this.showPreview(true))
          ),
        config["Update interval"]
      );
    }
    return true;
  }
  cancelTimer() {
    if (this._updateTimer) {
      clearTimeout(this._updateTimer);
      this._updateTimer = null;
    }
  }
  registerSheet() {
    const { config } = this;
    const css =
      /* css */
      `#tabThumbTooltip {
  --tab-thumb-shadow-size: 6px;
  --thumb-border-radius: calc(var(--arrowpanel-border-radius, 7px) - 3px);
  appearance: none;
  background: transparent;
  border: none;
  padding: var(--tab-thumb-shadow-size);
  -moz-box-layout: initial;
}
#tabThumbTooltip[position] {
  margin-inline-start: calc(-1 * var(--tab-thumb-shadow-size));
  margin-block-start: calc(-1 * var(--tab-thumb-shadow-size));
}
#tabThumbBox {
  padding: 5px;
  background: var(--arrowpanel-background);
  color: var(--arrowpanel-color);
  border: 1px solid transparent;
  border-radius: var(--arrowpanel-border-radius);
  box-shadow: 0 2px var(--tab-thumb-shadow-size) rgba(58,57,68,.2);
}
#tabThumbTooltip[hide-thumbnail] #tabThumbBox {
  border-radius: max(3px, var(--thumb-border-radius));
}
#tabThumbLabelBox {
  max-width: ${config["Preview width"]}px;
  text-overflow: ellipsis;
  overflow: hidden;
}
#tabThumbLabel {
  margin-inline: 5px;
  font-weight: 600;
}
#tabThumbTooltip:not([hide-thumbnail]) #tabThumbLabel {
  text-align: center;
}
#tabThumbBox > toolbarseparator {
  appearance: none;
  min-height: 0;
  border-top: 1px solid var(--panel-separator-color);
  border-bottom: none;
  margin: var(--panel-separator-margin);
  margin-inline: 0;
  padding: 0;
}
#tabThumbCanvas {
  border-radius: max(3px, var(--thumb-border-radius));
  border: 1px solid var(--arrowpanel-border-color);
  width: ${config["Preview width"]}px;
  height: ${config["Preview height"]}px;
  min-width: ${config["Preview width"]}px;
  min-height: ${config["Preview height"]}px;
  max-width: ${config["Preview width"]}px;
  max-height: ${config["Preview height"]}px;
  background-image: -moz-element(#tabThumbImageCanvas);
  background-repeat: no-repeat;
  background-size: cover;
}
#tabThumbTooltip[hide-thumbnail] #tabThumbCanvas,
#tabThumbTooltip[hide-thumbnail] #tabThumbBox > toolbarseparator {
  display: none;
}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}

if (gBrowserInit.delayedStartupFinished) {
  window.ucTabThumbnail = new TabThumbnail();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.ucTabThumbnail = new TabThumbnail();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
