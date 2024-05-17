// ==UserScript==
// @name           Show Selected Sidebar in Switcher Panel
// @version        1.0.6
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
Proton removes the checkmark shown on the selected sidebar in the sidebar switcher panel (the one that pops up when you click the button at the top of the sidebar). This script simply restores the previous behavior of adding the `checked` attribute. On its own it won't do anything, since the CSS for adding checkmarks to the menu items has also been removed. You'll need [uc-sidebar.css][] and the radio icon from the [resources][] folder for the actual styling, or you can just read it starting around [line 120][] if you want to make your own styles.

[uc-sidebar.css]: https://github.com/aminomancer/uc.css.js/blob/master/uc-sidebar.css
[resources]: https://github.com/aminomancer/uc.css.js/tree/master/resources
[line 120]: https://github.com/aminomancer/uc.css.js/blob/master/uc-sidebar.css#L120
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/showSelectedSidebarInSwitcherPanel.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/showSelectedSidebarInSwitcherPanel.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  function init() {
    window.SidebarController.sidebars.forEach((sidebar, id) => {
      let type = id.match(/view(\w+)Sidebar/)?.[1];
      if (
        type &&
        !sidebar.hasOwnProperty("extensionId") &&
        !sidebar.hasOwnProperty("switcherMenuId")
      ) {
        sidebar.switcherMenuId = `sidebar-switcher-${type.toLowerCase()}`;
      }
    });

    if (window.SidebarController.selectMenuItem.name === "selectMenuItem") {
      eval(
        `window.SidebarController.selectMenuItem = function ${window.SidebarController.selectMenuItem
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function[^\S\r\n]*/, "")
          .replace(/^selectMenuItem[^\S\r\n]*/, "")
          .replace(/^(.)/, `uc_selectMenuItem$1`)
          .replace(
            /{ menuId, triggerButtonId }/,
            "{ menuId, switcherMenuId, triggerButtonId }"
          )
          .replace(
            /(let menu = document\.getElementById\(menuId\);)/,
            `$1
            let menuitem = document.getElementById(switcherMenuId);`
          )
          .replace(
            /(menu\.setAttribute\("checked", "true"\);)/,
            `$1
            menuitem?.setAttribute("checked", "true");`
          )
          .replace(
            /(menu\.removeAttribute\("checked"\);)/,
            `$1
            menuitem?.removeAttribute("checked");`
          )}`
      );
    }

    // support icons for the "move sidebar to left" and "move sidebar to right" buttons in
    // the sidebar switcher dropdown menu that appear when you click the sidebar switcher:
    // #sidebar-reverse-position[to-position="left"] {
    //     list-style-image: url(chrome://browser/skin/back.svg);
    // }
    // #sidebar-reverse-position[to-position="right"] {
    //     list-style-image: url(chrome://browser/skin/forward.svg);
    // }
    if (
      window.SidebarController.showSwitcherPanel.name === "showSwitcherPanel"
    ) {
      eval(
        `window.SidebarController.showSwitcherPanel = function ${window.SidebarController.showSwitcherPanel
          .toSource()
          .replace(/^\(/, "")
          .replace(/\)$/, "")
          .replace(/^function[^\S\r\n]*/, "")
          .replace(/^showSwitcherPanel[^\S\r\n]*/, "")
          .replace(/^(.)/, `uc_showSwitcherPanel$1`)
          .replace(
            /(this\._switcherPanel\.hidden = false;)/,
            `$1
            this._reversePositionButton.setAttribute(
              "to-position",
              this._positionStart == RTL_UI ? "left" : "right"
            );
            for (let sidebar of this.sidebars.values()) {
              document.getElementById(sidebar.switcherMenuId)?.setAttribute("type", "radio");
            }`
          )}`
      );
    }

    document
      .getElementById("viewSidebarMenu")
      .addEventListener("popupshowing", () => {
        for (let sidebar of window.SidebarController.sidebars) {
          document
            .getElementById(sidebar.menuId)
            ?.setAttribute("type", "radio");
        }
      });
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
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
