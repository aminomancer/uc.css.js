// ==UserScript==
// @name           Fix Titlebar Button Tooltips
// @version        1.1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Since bug 1718629 (https://bugzilla.mozilla.org/show_bug.cgi?id=1718629),
// Firefox has tried to make the titlebar buttons (window controls) function
// more like native controls. In doing so, it allows the OS to draw tooltips for
// these buttons. So it prevents itself from showing redundant tooltips. That
// means we can't style the titlebar buttons' tooltips, they don't obey
// preferences, they disappear after 5 seconds on Windows, and they don't appear
// at all in fullscreen mode. Personally I would not be a fan of this change
// even if I didn't heavily customize Firefox's tooltips, because no matter
// what, OS tooltips are not going to be consistent with Firefox's tooltips, for
// reasons I mentioned. But in any case, we can fix this issue with JavaScript.
// It's caused by the titlebar-btn attribute. But removing that programmatically
// won't work because it's parsed by a C++ component when the buttons are
// connected. It's already too late by the time the script is running. So we
// need to recreate the DOM nodes without this attribute.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  // This is a setting you can use to disable Windows 11's Snap Layouts popup
  // from appearing when you hover over the Maximize button. It has no effect on
  // other operating systems. By default, if you use this on Windows 11, it will
  // only show Firefox tooltips on the Close and Minimize buttons, in order to
  // allow Windows 11 to show a Snap Layouts popup on the Maximize/Restore
  // buttons. But if you don't care about Snap Layouts and you just want a
  // normal Firefox tooltip (a markup element, styled by CSS) that says
  // "Maximize" or "Restore Down", then you can change the setting below from
  // `false` to `true`.
  const disableSnapLayouts = false;

  const lazy = {};
  XPCOMUtils.defineLazyModuleGetter(
    lazy,
    "WindowsVersionInfo",
    "resource://gre/modules/components-utils/WindowsVersionInfo.jsm"
  );
  const { buildNumber } = lazy.WindowsVersionInfo.get();
  const isWin11 = !disableSnapLayouts && AppConstants.platform === "win" && buildNumber >= 22000;
  let markup = `<hbox class="titlebar-buttonbox-container" skipintoolbarset="true">
  <hbox class="titlebar-buttonbox titlebar-color">
    <toolbarbutton class="titlebar-button titlebar-min"
                oncommand="window.minimize();"
                data-l10n-id="browser-window-minimize-button"
                />
    <toolbarbutton class="titlebar-button titlebar-max"
                oncommand="window.maximize();"
                ${isWin11 ? 'titlebar-btn="max"' : ""}
                data-l10n-id="browser-window-maximize-button"
                />
    <toolbarbutton class="titlebar-button titlebar-restore"
                oncommand="window.fullScreen ? BrowserFullScreen() : window.restore();"
                ${isWin11 ? 'titlebar-btn="max"' : ""}
                data-l10n-id="browser-window-restore-down-button"
                />
    <toolbarbutton class="titlebar-button titlebar-close"
                command="cmd_closeWindow"
                data-l10n-id="browser-window-close-button"
                />
  </hbox>
</hbox>`;
  let boxes = document.querySelectorAll(".titlebar-buttonbox-container");
  boxes.forEach(box => box.replaceWith(MozXULElement.parseXULToFragment(markup)));
})();
