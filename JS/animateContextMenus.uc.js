// ==UserScript==
// @name           Animate Context Menus
// @version        1.0.4
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Give all context menus the same opening animation that panel popups like the app menu have — the menu slides down 70px and fades in opacity at the same time. It's a cool effect that doesn't trigger a reflow since it uses transform, but it does repaint the menu, so I wouldn't recommend using this on weak hardware.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/animateContextMenus.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/animateContextMenus.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        *
// ==/UserScript==

class AnimateContextMenus {
  constructor() {
    document.documentElement.setAttribute("animate-menupopups", true);
    addEventListener("popupshowing", this);
    addEventListener("popupshown", this);
    addEventListener("popuphidden", this);
    let css = `:root[animate-menupopups]
  :not(menulist)
  > menupopup:not([position], [type="arrow"], [animate="false"]) {
  opacity: 0;
  transform: translateY(-70px) scaleX(0.95) scaleY(0.5);
  transform-origin: top;
  transition-property: transform, opacity;
  transition-duration: 0.18s, 0.18s;
  transition-timing-function: var(--animation-easing-function, cubic-bezier(0.07, 0.95, 0, 1)),
    ease-out;
  transform-style: flat;
  backface-visibility: hidden;
}
:root[animate-menupopups]
  :not(menulist)
  > menupopup:not([position], [type="arrow"])[animate][animate="open"] {
  opacity: 1;
  transition-duration: 0.18s, 0.18s;
  transform: none !important;
  transition-timing-function: var(--animation-easing-function, cubic-bezier(0.07, 0.95, 0, 1)),
    ease-in-out;
}
:root[animate-menupopups]
  :not(menulist)
  > menupopup:not([position], [type="arrow"])[animate][animate="cancel"] {
  transform: none;
}
:root[animate-menupopups] :not(menulist) > menupopup:not([position], [type="arrow"])[animating] {
  pointer-events: none;
}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = Services.io.newURI(
      `data:text/css;charset=UTF=8,${encodeURIComponent(css)}`
    );
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) {
      sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    }
  }
  handleEvent(e) {
    if (e.target.tagName !== "menupopup") return;
    if (e.target.hasAttribute("position")) return;
    if (e.target.getAttribute("type") == "arrow") return;
    if (e.target.parentElement) {
      if (e.target.parentElement.tagName == "menulist") return;
    }
    if (
      e.target.shadowRoot &&
      e.target.shadowRoot.firstElementChild.classList.contains(
        "panel-arrowcontainer"
      )
    ) {
      return;
    }
    this[`on_${e.type}`](e);
  }
  on_popupshowing(e) {
    if (e.target.getAttribute("animate") != "false") {
      e.target.setAttribute("animate", "open");
      e.target.setAttribute("animating", "true");
    }
  }
  on_popupshown(e) {
    e.target.removeAttribute("animating");
  }
  on_popuphidden(e) {
    if (e.target.getAttribute("animate") != "false") {
      e.target.removeAttribute("animate");
    }
  }
}

new AnimateContextMenus();
