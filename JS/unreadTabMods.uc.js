// ==UserScript==
// @name           Unread Tab Mods
// @version        1.2.7
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Modifies some javascript methods so that unread tabs can be styled in CSS, and (optionally) adds new items to the tab context menu so you can manually mark tabs as read or unread.

Normally when you open a new tab without it being selected, it gains the attribute `notselectedsinceload` which could be used to style it. But this attribute doesn't go away when you select the tab, so it doesn't actually mean "unread." It doesn't go away until you navigate to a new page in the tab. But we can change this so it will go away immediately as soon as you click it or otherwise select it.

Also, normally the attribute isn't added until web progress has finished, so unread tab styling won't be applied until after it's finished loading a bit. This doesn't look as good so we're also changing it to add the attribute as soon as the tab is created.

So now all you need to do to style unread tabs is add something like this to your userchrome.css file:

```css
.tabbrowser-tab[notselectedsinceload]:not([pending]),
.tabbrowser-tab[notselectedsinceload][pending][busy] {
  font-style: italic !important;
}
```

If you use [duskFox][] (the theme on my repo) you will already have this CSS so there's no need to add it.

[duskFox]: https://github.com/aminomancer/uc.css.js
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/unreadTabMods.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/unreadTabMods.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  /**
   * set the "notselectedsinceload" attribute and the _notselectedsinceload property on a tab.
   * @param {object} tab (a tab whose attribute to change)
   * @param {boolean} on (whether to set the attribute to true or remove it)
   */
  function modulateAttr(tab, on = false) {
    tab._notselectedsinceload = on;
    on
      ? tab.setAttribute("notselectedsinceload", on)
      : tab.removeAttribute("notselectedsinceload");
    gBrowser._tabAttrModified(tab, ["notselectedsinceload"]);
  }
  class UnreadTabsBase {
    // user preferences and localization. change the strings to match your
    // lanugage. write #1 where the number of tabs should go in the sentence.
    static config = {
      // if set to true, add "Mark Tab as Read" and "Mark Tab as Unread"
      // to the tab context menu when appropriate.
      "Add Context Menu Items": true,

      // the "Mark Tab as Read" context menu label when only one tab is invoked.
      "Mark Tab as Read Label": "Mark Tab as Read",

      // the "Mark Tab as Unread" context menu label when only one tab is invoked.
      "Mark Tab as Unread Label": "Mark Tab as Unread",

      // when tabs are multiselected and the tab you right-clicked is one of the
      // selected tabs, the context menu will mark multiple tabs instead of just
      // one. make sure it still has "#1", that gets replaced dynamically with
      // the number of tabs that will be marked. so if you're gonna change the
      // label for your language, be sure to put #1 where the number should go.
      // for example 見られるようにマーク#1タブ or Marquer #1 onglets comme lu.
      "Mark Multiple Tabs as Read Label": "Mark #1 Tabs as Read",

      // just like the one above but for marking tabs as unread.
      "Mark Multiple Tabs as Unread Label": "Mark #1 Tabs as Unread",
    };
    constructor() {
      if (
        gBrowser.tabContainer._handleTabSelect.name !== "uc_handleTabSelect"
      ) {
        gBrowser.tabContainer._ensureTabIsVisible = function ensureTabIsVisible(
          tab,
          shouldScrollInstantly = false
        ) {
          let arrowScrollbox = tab.closest("arrowscrollbox");
          if (arrowScrollbox.overflowing) {
            arrowScrollbox.ensureElementIsVisible(tab, shouldScrollInstantly);
          }
        };
        eval(
          `gBrowser.tabContainer._handleTabSelect = function ${gBrowser.tabContainer._handleTabSelect
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^_handleTabSelect\s*/, "")
            .replace(/^function\s*/, "")
            .replace(/^(.)/, `uc_handleTabSelect $1`)
            .replace(/#ensureTabIsVisible/, "_ensureTabIsVisible")
            .replace(
              /selectedTab\._notselectedsinceload = false;/,
              "modulateAttr(selectedTab);"
            )}`
        );
      }

      if (gBrowser.tabContainer._handleNewTab.name !== "uc_handleNewTab") {
        eval(
          `gBrowser.tabContainer._handleNewTab = function ${gBrowser.tabContainer._handleNewTab
            .toSource()
            .replace(/^\(/, "")
            .replace(/\)$/, "")
            .replace(/^_handleNewTab\s*/, "")
            .replace(/^function\s*/, "")
            .replace(/^(.)/, `uc_handleNewTab $1`)
            .replace(
              /\n(\s*)(this\._notifyBackgroundTab\(tab\);)/,
              "\n$1modulateAttr(tab, true);\n$1$2"
            )}`
        );
      }

      if (UnreadTabsBase.config["Add Context Menu Items"]) {
        this.makeMenuItems(this.tabContext);
      }
    }

    get tabContext() {
      return (
        this._tabContext ||
        (this._tabContext = document.getElementById("tabContextMenu"))
      );
    }

    handleEvent(e) {
      let tab = TabContextMenu.contextTab;
      let tabs = tab.multiselected ? gBrowser.selectedTabs : [tab];
      let unreadTabs = this.unreadTabs(tabs);
      let readTabs = this.readTabs(tabs);

      if (unreadTabs.length) this.markAsReadMenuitem.hidden = false;
      else this.markAsReadMenuitem.hidden = true;
      if (readTabs.length) this.markAsUnreadMenuitem.hidden = false;
      else this.markAsUnreadMenuitem.hidden = true;
      this.markAsReadMenuitem.setAttribute(
        "label",
        unreadTabs.length > 1
          ? UnreadTabsBase.config["Mark Multiple Tabs as Read Label"].replace(
              "#1",
              unreadTabs.length.toLocaleString()
            )
          : UnreadTabsBase.config["Mark Tab as Read Label"]
      );
      this.markAsUnreadMenuitem.setAttribute(
        "label",
        readTabs.length > 1
          ? UnreadTabsBase.config["Mark Multiple Tabs as Unread Label"].replace(
              "#1",
              readTabs.length.toLocaleString()
            )
          : UnreadTabsBase.config["Mark Tab as Unread Label"]
      );
    }

    unreadTabs(tabs) {
      return tabs.filter(aTab => {
        return !(
          aTab.getAttribute("pending") ||
          !aTab.getAttribute("notselectedsinceload") ||
          aTab.selected
        );
      });
    }

    readTabs(tabs) {
      return tabs.filter(aTab => {
        return !(
          aTab.getAttribute("pending") ||
          aTab.getAttribute("notselectedsinceload") ||
          aTab.selected
        );
      });
    }

    _onCommand(mode = false) {
      let tab = TabContextMenu.contextTab;
      if (tab.multiselected) {
        gBrowser.selectedTabs.forEach(aTab => {
          if (aTab.getAttribute("pending") || aTab.selected) return;
          modulateAttr(aTab, mode);
        });
      } else {
        if (tab.getAttribute("pending") || tab.selected) return;
        modulateAttr(tab, mode);
      }
    }

    makeMenuItems(context) {
      this.markAsReadMenuitem = document.createXULElement("menuitem");
      this.markAsReadMenuitem.setAttribute(
        "label",
        UnreadTabsBase.config["Mark Tab as Read Label"]
      );
      this.markAsReadMenuitem.setAttribute("id", "context-markAsRead");
      this.markAsReadMenuitem.addEventListener("command", () =>
        this._onCommand()
      );
      context
        .querySelector("#context_duplicateTabs")
        .after(this.markAsReadMenuitem);

      this.markAsUnreadMenuitem = document.createXULElement("menuitem");
      this.markAsUnreadMenuitem.setAttribute(
        "label",
        UnreadTabsBase.config["Mark Tab as Unread Label"]
      );
      this.markAsUnreadMenuitem.setAttribute("id", "context-markAsUnread");
      this.markAsUnreadMenuitem.addEventListener("command", () =>
        this._onCommand(true)
      );
      this.markAsReadMenuitem.after(this.markAsUnreadMenuitem);

      context.addEventListener("popupshowing", this);
    }
  }

  function init() {
    window.unreadTabMods = new UnreadTabsBase();
  }

  document.documentElement.setAttribute("italic-unread-tabs", true);

  if (gBrowserInit.delayedStartupFinished) {
    init();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        init();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
