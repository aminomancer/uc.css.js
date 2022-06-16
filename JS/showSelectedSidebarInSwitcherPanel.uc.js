// ==UserScript==
// @name           Show Selected Sidebar in Switcher Panel
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    For some reason, proton removes the checkmark shown on the
// selected sidebar in the sidebar switcher panel. (The one that pops up when
// you click the button at the top of the sidebar) This script simply restores
// the previous behavior of adding the [checked] attribute. On its own it won't
// do anything, since the CSS for adding checkmarks to the menu items has also
// been removed. Download uc-sidebar.css for the actual styling, or read it
// starting around line 120 if you want to make your own styles.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  const builtInSidebars = ["Bookmarks", "History", "Tabs"];
  function init() {
    for (let type of builtInSidebars) {
      SidebarUI.sidebars.get(
        `view${type}Sidebar`
      ).buttonId = `sidebar-switcher-${type.toLowerCase()}`;
    }

    SidebarUI.selectMenuItem = function selectMenuItem(commandID) {
      for (let [id, { menuId, buttonId, triggerButtonId }] of this.sidebars) {
        let menu = document.getElementById(menuId);
        let button = document.getElementById(buttonId);
        let triggerbutton = triggerButtonId && document.getElementById(triggerButtonId);
        if (id == commandID) {
          menu.setAttribute("checked", "true");
          button.setAttribute("checked", "true");
          if (triggerbutton) {
            triggerbutton.setAttribute("checked", "true");
            updateToggleControlLabel(triggerbutton);
          }
        } else {
          menu.removeAttribute("checked");
          button.removeAttribute("checked");
          if (triggerbutton) {
            triggerbutton.removeAttribute("checked");
            updateToggleControlLabel(triggerbutton);
          }
        }
      }
    };
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
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
  }
})();
