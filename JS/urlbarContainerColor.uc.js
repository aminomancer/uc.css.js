// ==UserScript==
// @name           Urlbar Container Color Indicator
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Change the background color of the urlbar to match the active tab's
//                 contextual identity (aka multi-account container). Made by request.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  updateUserContextUIIndicator = function () {
    function replaceContainerClass(classType, element, value) {
      let prefix = "identity-" + classType + "-";
      if (value && element.classList.contains(prefix + value)) return;
      for (let className of element.classList)
        if (className.startsWith(prefix)) element.classList.remove(className);
      if (value) element.classList.add(prefix + value);
    }
    let hbox = document.getElementById("userContext-icons");
    let urlbar = document.getElementById("urlbar-input-container");
    let userContextId = gBrowser.selectedBrowser.getAttribute("usercontextid");
    if (!userContextId) {
      replaceContainerClass("color", hbox, "");
      replaceContainerClass("color", urlbar, "");
      urlbar.removeAttribute("contextid");
      hbox.hidden = true;
      return;
    }
    let identity = ContextualIdentityService.getPublicIdentityFromId(userContextId);
    if (!identity) {
      replaceContainerClass("color", hbox, "");
      replaceContainerClass("color", urlbar, "");
      urlbar.removeAttribute("contextid");
      hbox.hidden = true;
      return;
    }
    replaceContainerClass("color", hbox, identity.color);
    replaceContainerClass("color", urlbar, identity.color);
    urlbar.setAttribute("contextid", identity.userContextId);
    let label = ContextualIdentityService.getUserContextLabel(userContextId);
    document.getElementById("userContext-label").setAttribute("value", label);
    hbox.setAttribute("tooltiptext", label);
    let indicator = document.getElementById("userContext-indicator");
    replaceContainerClass("icon", indicator, identity.icon);
    hbox.hidden = false;
  };
  let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
  let uri = Services.io.newURI(
    "data:text/css;charset=UTF=8," +
      encodeURIComponent(
        `#urlbar-input-container[contextid] {background-color: color-mix(in srgb, transparent 75%, var(--identity-tab-color));} #urlbar[open] #urlbar-input-container[contextid] {border-bottom-left-radius: 0; border-bottom-right-radius: 0;} #urlbar[open] > #urlbar-input-container[contextid] ~ .urlbarView > .urlbarView-body-outer > .urlbarView-body-inner {border-color: transparent}`
      )
  );
  if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
  sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
})();
