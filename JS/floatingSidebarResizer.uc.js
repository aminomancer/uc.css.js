// ==UserScript==
// @name           Floating Sidebar Resizer
// @version        1.3.4
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
A floating sidebar that you can still resize. The default sidebar in firefox is nice, it can move from the left side to the right side and you can resize it. But it squeezes the browser content area out of the way. That might be desirable for some people. That way the entire contents of the page are still visible when the sidebar is open.

That works well with responsive page layouts but doesn't work well with elements that try to preserve some explicit aspect ratio. It also doesn't look very aesthetic when you open the sidebar and the entire page makes this jarring transformation as everything shifts left or right to make way for the sidebar. By default when you open the sidebar, it pushes the whole content area to the side, which changes the content area width:height ratio. So the player setup needs to resize the video element, resulting in a letterbox effect.

It's easy enough to make the sidebar "float" over the content though. You can do it with pure CSS. The major downside is that you lose the ability to resize the sidebar. You'd have to set the width manually. That's because the native implementation of resizing relies on the old-school proprietary `-moz-box` spec. The space within `#browser` is finite and the moz-boxes inside it fill that space based on some CSS rules. The resizing is actually handled by the separator, which is a totally independent element.

So within `#browser` you have a layout like `content | separator | sidebar`. And moving the separator defines how big the sidebar and content area are, but this only works _because_ they can't occupy the same space. To make the sidebar float over the content area you need to change its display and position rules, which means the separator no longer packs right next to the sidebar.

It's sort of like plucking the sidebar out of the flexbox. The separator moves all the way to the end of the screen and the content area expands to fill that space. So the separator becomes useless and we lose the ability to resize the sidebar. So the main thing this does is add a resizer to the sidebar. It doesn't make the sidebar float by itself. That's what [uc-sidebar.css][] is for.

[uc-sidebar.css]: https://github.com/aminomancer/uc.css.js/blob/master/uc-sidebar.css
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/floatingSidebarResizer.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/floatingSidebarResizer.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(() => {
  function startup() {
    // outer box
    let box = window.SidebarController._box;
    let prefsvc = Services.prefs;
    // boolean pref: whether sidebar is on the left or right side of the browser content area.
    let anchor = "sidebar.position_start";
    // string pref: we set this so we can remember user's sidebar width when
    // rebooting or opening a new window.
    let widthPref = "userChrome.floating-sidebar.width";
    // invisible little bar by which to drag the sidebar to resize it
    let resizer = document.createElement("div");
    let frame = false;
    let startWidth;
    let startX;

    function initDrag(e) {
      // this is not directly visible since the element has no background or
      // content. this just means that while you're clicking+dragging the
      // resizer, its width expands to double the size of the sidebar.
      resizer.style.width = "200%";
      // we want the resizer to expand massively in both directions.
      resizer.style.marginInline = "-100%";
      startX = e.screenX;
      startWidth = parseInt(
        document.defaultView.getComputedStyle(box).width,
        10
      );
      document.documentElement.addEventListener("mousemove", doDrag, true);
      document.documentElement.addEventListener("mouseup", stopDrag);
    }

    function doDrag(e) {
      // throttling, since mousemove events can fire way faster than even
      // a 144Hz monitor can render frames.
      if (frame) return;
      frame = true;
      requestAnimationFrame(() => {
        if (window.SidebarController._positionStart) {
          box.style.width = `${startWidth + e.screenX - startX}px`;
        } else {
          box.style.width = `${startWidth - e.screenX + startX}px`;
        }
        frame = false;
      });
    }

    function stopDrag(_e) {
      // this is the neutral/idle size. when you're not clicking/dragging,
      // it's just a 4px vertical "border"
      resizer.style.width = "4px";
      // remove the -100% margin-inline rule we set while dragging.
      resizer.style.removeProperty("margin-inline");
      document.documentElement.removeEventListener("mousemove", doDrag, true);
      document.documentElement.removeEventListener("mouseup", stopDrag);
      // now that we've stopped moving the mouse, permanently record the
      // sidebar width so we can restore from it later.
      prefsvc.setStringPref(widthPref, box.style.width);
    }

    function alignObserve(_sub, _top, pref) {
      // we want the resizer to go on the left side of the sidebar when
      // the sidebar is on the right side of the window, and vice versa.
      if (prefsvc.getBoolPref(pref)) resizer.style.right = "0";
      else resizer.style.removeProperty("right");
    }

    function exitSideBar(e) {
      if (e.code === "Escape") {
        if (e.repeat || e.shiftKey || e.altKey || e.ctrlKey || this.hidden) {
          return;
        }
        window.SidebarController.toggle();
        e.preventDefault();
      }
    }

    function domSetup() {
      resizer.style.cssText =
        "display: inline-block; height: 100%; position: absolute; width: 4px; cursor: ew-resize;";
      box.appendChild(resizer);
      box.style.minWidth = "18em";
      box.style.maxWidth = "100%";
      try {
        box.style.width = prefsvc.getStringPref(widthPref);
      } catch (e) {
        box.style.width = "18em";
      }
      if (prefsvc.getBoolPref(anchor)) resizer.style.right = "0";
    }

    function attachListeners() {
      resizer.addEventListener("mousedown", initDrag);
      window.addEventListener("unload", uninit);
      prefsvc.addObserver(anchor, alignObserve);
      box.addEventListener("keypress", exitSideBar, true);
    }

    function uninit() {
      window.removeEventListener("unload", uninit);
      prefsvc.removeObserver(anchor, alignObserve);
    }

    // remove old preference
    prefsvc.clearUserPref("userChrome.floating-sidebar.hotkey");
    domSetup();
    attachListeners();
  }

  // wait until components are initialized so we can access window.SidebarController
  if (gBrowserInit.delayedStartupFinished) {
    startup();
  } else {
    let delayedListener = (subject, topic) => {
      if (topic == "browser-delayed-startup-finished" && subject == window) {
        Services.obs.removeObserver(delayedListener, topic);
        startup();
      }
    };
    Services.obs.addObserver(
      delayedListener,
      "browser-delayed-startup-finished"
    );
  }
})();
