// ==UserScript==
// @name           Add [open] Status to Urlbar Notification Icons
// @version        1.1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    This sets an attribute on the buttons in
// #notification-popup-box based on whether their popups are open or closed.
// That way we can set their fill-opacity to 1 when they're open, like we do
// already with the other icons in #identity-box. This also sets a variable
// --uc-panel-top-offset on the panel so you can adjust its top margin. The
// offset will be equal to the difference between the anchor node's height and
// 16px (the default icon height). So if the popup notification opens in the
// urlbar, the offset will be 0. But the popup notification can also open on the
// app menu button in the navbar (for example for rare contextual feature
// recommendations, which you can test in about:newtab#devtools if you enable
// browser.newtabpage.activity-stream.asrouter.devtoolsEnabled) whose height is
// equal to the navbar height. So the popup notification needs to have a
// variable top margin for it to be positioned consistently regardless of anchor
// node. I implement that like this:
// #notification-popup {
//   margin-top: calc(-1px - var(--uc-panel-top-offset, 0px)) !important;
// }
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class PopupNotificationHandler {
  constructor() {
    this.panel = document.getElementById("notification-popup");
    this.panel.addEventListener("popupshowing", this);
    this.panel.addEventListener("popuphiding", this);
  }
  handleEvent(e) {
    if (e.originalTarget === this.panel) {
      let { anchorNode } = this.panel;
      if (e.type === "popupshowing") {
        anchorNode.setAttribute("open", true);
        let offset = 0;
        if (anchorNode.localName === "toolbarbutton") {
          offset =
            (windowUtils.getBoundsWithoutFlushing(anchorNode).height - 16) / 2;
        }
        this.panel.style.setProperty("--uc-panel-top-offset", offset + "px");
      } else {
        anchorNode.removeAttribute("open");
        this.panel.style.removeProperty("--uc-panel-top-offset");
      }
    }
  }
}

if (gBrowserInit.delayedStartupFinished) {
  new PopupNotificationHandler();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      new PopupNotificationHandler();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
