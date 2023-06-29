// ==UserScript==
// @name           Show Selected Sidebar in Switcher Panel
// @version        1.0.3
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

(function() {
  const builtInSidebars = ["Bookmarks", "History", "Tabs"];
  function init() {
    for (let type of builtInSidebars) {
      SidebarUI.sidebars.get(
        `view${type}Sidebar`
      ).switcherMenuId = `sidebar-switcher-${type.toLowerCase()}`;
    }

    SidebarUI.selectMenuItem = function selectMenuItem(commandID) {
      for (let [id, { menuId, switcherMenuId, triggerButtonId }] of this
        .sidebars) {
        let menu = document.getElementById(menuId);
        let menuitem = document.getElementById(switcherMenuId);
        let triggerbutton =
          triggerButtonId && document.getElementById(triggerButtonId);
        if (id == commandID) {
          menu.setAttribute("checked", "true");
          menuitem.setAttribute("checked", "true");
          if (triggerbutton) {
            triggerbutton.setAttribute("checked", "true");
            updateToggleControlLabel(triggerbutton);
          }
        } else {
          menu.removeAttribute("checked");
          menuitem.removeAttribute("checked");
          if (triggerbutton) {
            triggerbutton.removeAttribute("checked");
            updateToggleControlLabel(triggerbutton);
          }
        }
      }
    };

    // support icons for the "move sidebar to left" and "move sidebar to right" buttons in
    // the sidebar switcher dropdown menu that appear when you click the sidebar switcher:
    // #sidebar-reverse-position[to-position="left"] {
    //     list-style-image: url(chrome://browser/skin/back.svg);
    // }
    // #sidebar-reverse-position[to-position="right"] {
    //     list-style-image: url(chrome://browser/skin/forward.svg);
    // }
    SidebarUI.showSwitcherPanel = function() {
      this._switcherPanel.addEventListener(
        "popuphiding",
        () => this._switcherTarget.classList.remove("active"),
        { once: true }
      );
      let onRight = this._positionStart == RTL_UI;
      let label = onRight
        ? gNavigatorBundle.getString("sidebar.moveToLeft")
        : gNavigatorBundle.getString("sidebar.moveToRight");
      this._reversePositionButton.setAttribute("label", label);
      this._reversePositionButton.setAttribute(
        "to-position",
        onRight ? "left" : "right"
      );
      this._switcherPanel.hidden = false;
      this._switcherPanel.openPopup(this._switcherTarget);
      this._switcherTarget.classList.add("active");
      this._switcherTarget.setAttribute("aria-expanded", true);
      for (let sidebar of this.sidebars.values()) {
        let menuitem = document.getElementById(sidebar.switcherMenuId);
        menuitem.setAttribute("type", "radio");
      }
    };

    document
      .getElementById("viewSidebarMenu")
      .addEventListener("popupshowing", () => {
        for (let sidebar of SidebarUI.sidebars.values()) {
          let menuitem = document.getElementById(sidebar.menuId);
          menuitem.setAttribute("type", "radio");
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
