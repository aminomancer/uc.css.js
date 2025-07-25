// ==UserScript==
// @name           Bookmark TinyURL
// @version        1.0.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Add a context menu item for tabs to create a tinyurl bookmark for all selected tabs and place it in the default bookmarks folder. Requires a TinyURL API key to be set in the environment variable `TINYURL_API_KEY`.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarkTinyUrl.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/bookmarkTinyUrl.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class BookmarkTinyURL {
  constructor() {
    this.apiKey = Services.env.get("TINYURL_API_KEY");
    this.l10n = {
      singular_label: "Bookmark Tab on TinyURL",
      // #n is dynamically replaced with the number of tabs selected when
      // multiple tabs are selected.
      plural_label: "Bookmark #n Tabs on TinyURL",
    };
    this.addContextMenuItem();
  }

  async getTinyURL(url) {
    // Bulk api doesn't work, maybe premium feature only. So you're probably
    // rate limited. I've tried this with 10 at a time and it works, so idk.
    let response = await fetch(
      `https://api.tinyurl.com/create?api_token=${this.apiKey}`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, domain: "tinyurl.com", expires_at: null }),
      }
    );
    let json = await response.json();
    if (json.errors.length) {
      return {};
    }
    let { tiny_url, alias } = json.data;
    return { tiny_url, alias };
  }

  async getUniquePages(tabs) {
    let uniquePages = {};
    let URIs = [];
    for (let tab of tabs) {
      let browser = tab.linkedBrowser;
      let fullUri = browser.currentURI;
      let { tiny_url, alias } = await this.getTinyURL(fullUri.spec);
      if (!tiny_url) {
        console.error(`Failed to create TinyURL for ${fullUri.spec}`);
        continue;
      }
      let uri = Services.io.createExposableURI(Services.io.newURI(tiny_url));
      let { spec } = uri;
      if (!(spec in uniquePages)) {
        uniquePages[spec] = null;
        URIs.push({ uri, title: alias });
      }
    }
    return URIs;
  }

  async tinyURLBookmarkTabs() {
    const contextTabInSelection = gBrowser.selectedTabs.includes(
      TabContextMenu.contextTab
    );
    const tabs = contextTabInSelection
      ? gBrowser.selectedTabs
      : [gBrowser.selectedTab];
    const pages = await this.getUniquePages(tabs);
    if (!BookmarkingUI._pendingUpdate) {
      const parentGuid = await PlacesUIUtils.defaultParentGuid;
      if (!!BookmarkingUI.starAnimBox && !(BookmarkingUI._itemGuids.size > 0)) {
        document
          .getElementById("star-button-animatable-box")
          .addEventListener(
            "animationend",
            () => BookmarkingUI.star.removeAttribute("animate"),
            { once: true }
          );
        BookmarkingUI.star.setAttribute("animate", "true");
      }
      for (let { uri, title } of pages) {
        try {
          let url = new URL(uri.spec);
          let info = { url, parentGuid, title };
          info.guid = await PlacesTransactions.NewBookmark(info).transact();
        } catch (e) {
          console.error(`Failed to bookmark TinyURL for ${uri.spec}`, e);
        }
      }
      gURLBar.handleRevert();
      StarUI.showConfirmation();
    }
  }

  addContextMenuItem() {
    if (!this.apiKey) {
      console.error("No TinyURL API key found in environment variables.");
      return;
    }
    this.context = document.getElementById("tabContextMenu");
    this.menuitem = document.createXULElement("menuitem");
    this.menuitem.setAttribute("label", this.l10n.singular_label);
    this.menuitem.setAttribute("id", "context-bookmarkTinyURL");
    this.menuitem.addEventListener("command", this);
    this.context.querySelector("#context_bookmarkTab").after(this.menuitem);
    this.context.addEventListener("popupshowing", this);
  }

  handleEvent(e) {
    switch (e.type) {
      case "command":
        this.tinyURLBookmarkTabs();
        break;
      case "popupshowing": {
        if (e.target !== this.context) return;
        const contextTabInSelection = gBrowser.selectedTabs.includes(
          TabContextMenu.contextTab
        );
        const tabs = contextTabInSelection
          ? gBrowser.selectedTabs
          : [gBrowser.selectedTab];
        this.menuitem.setAttribute(
          "label",
          tabs.length > 1
            ? this.l10n.plural_label.replace("#n", tabs.length.toLocaleString())
            : this.l10n.singular_label
        );
        break;
      }
    }
  }
}
