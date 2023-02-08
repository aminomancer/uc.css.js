// ==UserScript==
// @name           Navbar Toolbar Button Slider
// @version        2.9.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
Wrap all toolbar buttons in a scrollable container. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. By default, it wraps all toolbar buttons that come after the urlbar (to the right of the urlbar for left-to-right languages).

You can edit the pref `userChrome.toolbarSlider.wrapButtonsRelativeToUrlbar` in <about:config> to change this: a value of `before` will wrap all buttons that come before the urlbar, and `all` will wrap all buttons.

You can change `userChrome.toolbarSlider.width` to make the container wider or smaller. If you choose 8, the slider will be 8 buttons long. When the window gets *really* small, the slider disappears and the toolbar buttons are placed into the normal widget overflow panel. (this can be disabled with `userChrome.toolbarSlider.collapseSliderOnOverflow`)

You can specify more buttons to exclude from the slider by adding their IDs (in quotes, separated by commas) to `userChrome.toolbarSlider.excludeButtons`. For example you might enter the following if you want those to stay outside of the slider:

```json
["bookmarks-menu-button", "downloads-button"]
```

You can also decide whether to exclude flexible space springs from the slider by toggling `userChrome.toolbarSlider.excludeFlexibleSpace`. By default, springs are excluded. To scroll faster you can add a multiplier right before `scrollByPixels` is called, like `scrollAmount = scrollAmount * 1.5` or something like that.
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/navbarToolbarButtonSlider.uc.js
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/navbarToolbarButtonSlider.uc.js
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

class NavbarToolbarSlider {
  static prefNames = {
    width: "userChrome.toolbarSlider.width",
    exclude: "userChrome.toolbarSlider.excludeButtons",
    springs: "userChrome.toolbarSlider.excludeFlexibleSpace",
    collapse: "userChrome.toolbarSlider.collapseSliderOnOverflow",
    direction: "userChrome.toolbarSlider.wrapButtonsRelativeToUrlbar",
  };
  /**
   * for a given pref branch and name, retrieve the value, irrespective of type
   * @param {object} root (an object implementing interface nsIPrefBranch, e.g. the root branch Services.prefs)
   * @param {string} pref (the pref's name, relative to the branch OR absolute)
   * @returns the pref's value, whatever its type happens to be
   */
  static getPref(root, pref) {
    switch (root.getPrefType(pref)) {
      case root.PREF_BOOL:
        return root.getBoolPref(pref);
      case root.PREF_INT:
        return root.getIntPref(pref);
      case root.PREF_STRING:
        return root.getStringPref(pref);
      default:
        return null;
    }
  }
  /**
   * get an element's x coordinate
   * @param {object} el (a DOM node)
   * @returns the DOM node's x coordinate
   */
  static rectX(el) {
    return el.getBoundingClientRect().x;
  }
  /**
   * get the combined width + margin for an element. used for calculating
   * scroll distances. if we used other methods, we'd miss the margins and end
   * up undershooting distances, which is cumulative. intended for use with
   * elements that have box-sizing = border-box.
   * @param {object} el (a DOM node)
   * @returns the DOM node's total effective width
   */
  static parseWidth(el) {
    let style = window.getComputedStyle(el);
    let width = el.clientWidth;
    let margin = parseFloat(style.marginLeft) + parseFloat(style.marginRight);
    return width + margin;
  }
  /**
   * given a set of DOM nodes, append them to another DOM node
   * @param {object} nodes (an iterable object)
   * @param {object} container (a DOM node)
   */
  static appendLoop(nodes, container) {
    [...nodes].forEach(button => container.appendChild(button));
  }
  /**
   * smoothly scroll a slider so that the passed element ends up as close to the
   * center of the slider as possible. native methods like scrollIntoView would
   * only scroll the slider until the element is visible, which would leave it
   * at the left or right edge of the slider. not something we want for a button
   * that's supposed to be active, in focus.
   * @param {object} el (a DOM node to be scrolled to)
   * @param {object} slider (a DOM node, the inner slider, not the container)
   */
  static smoothCenterScrollTo(el, slider) {
    let container = slider.parentElement;
    let buttonX =
      NavbarToolbarSlider.rectX(el) - NavbarToolbarSlider.rectX(slider);
    let widgetWidth = NavbarToolbarSlider.parseWidth(el);
    let midpoint = container.clientWidth / 2;
    container.scrollTo({
      left: buttonX + widgetWidth / 2 - midpoint,
      behavior: "auto",
    });
  }
  /**
   * for a given node, find its scrollable ancestor and return true if the node is scrolled out of view
   * @param {object} node (the potential anchor node)
   * @param {string} selector (the scrollable ancestor's CSS selector e.g. ".slider-container")
   * @returns {boolean} true if the node is scrolled out of view
   */
  static scrolledOutOfView(node, selector) {
    let scrollBox = node.closest(selector);
    if (!scrollBox) return false;
    let ordinals =
      scrollBox.getAttribute("orient") === "horizontal"
        ? ["left", "right", "width"]
        : ["top", "bottom", "height"];
    let nodeRect = node.getBoundingClientRect();
    let scrollRect = scrollBox.getBoundingClientRect();
    return (
      scrollRect[ordinals[0]] >
        nodeRect[ordinals[0]] + nodeRect[ordinals[2]] / 2 ||
      scrollRect[ordinals[1]] + nodeRect[ordinals[2]] / 2 <
        nodeRect[ordinals[1]]
    );
  }
  constructor() {
    this.outer = document.createXULElement("toolbaritem");
    Object.defineProperty(this.outer, "hidden", {
      get() {
        return this.getAttribute("hidden") === "true";
      },
      set(val) {
        if (val) this.setAttribute("hidden", "true");
        else this.removeAttribute("hidden");
      },
    });
    this.inner = this.outer.appendChild(document.createXULElement("hbox"));
    this.kids = this.inner.children;
    this.navbar = document.getElementById("nav-bar");
    this.cTarget = document.getElementById(
      this.navbar.getAttribute("customizationtarget")
    );
    this.cOverflow = document.getElementById(
      this.navbar.getAttribute("default-overflowtarget")
    );
    this.contextMenu = document.getElementById("toolbar-context-menu");
    this.urlbar = document.getElementById("urlbar-container");
    this.bin = document.getElementById("mainPopupSet");
    this.widgets = this.cTarget.children;
    this.setupPrefs();
    this.registerSheet();
    this.setupScroll();
    this.attachListeners();
    CustomizableUI.addListener(this);
    requestAnimationFrame(() => {
      let array = [...this.widgets].filter(this.filterFn, this);
      if (array.length) this.wrapAll(array, this.inner);
      this.reOrder();
      this.setMaxWidth();
    });
    setTimeout(() => this.handleConfirmationHint(), 100);
  }
  handleEvent(e) {
    switch (e.type) {
      case "popupshowing":
        this.onPopupshowing(e);
        break;
      case "unload":
        removeEventListener("unload", this, false);
        Services.prefs.removeObserver("userChrome.toolbarSlider", this);
        break;
      default:
    }
  }
  observe(sub, _top, pref) {
    let value = NavbarToolbarSlider.getPref(sub, pref);
    const {
      width,
      exclude,
      springs,
      collapse,
      direction,
    } = NavbarToolbarSlider.prefNames;
    switch (pref) {
      case width:
        if (value === null || value <= 0) value = 11;
        this.widthInButtons = value;
        this.setMaxWidth();
        break;
      case collapse:
        if (value === null) value = true;
        this.collapse = value;
        if (value) this.urlbar.style.removeProperty("min-width");
        else this.urlbar.style.minWidth = "revert";
        if (this.outer.ready) {
          if (!value) this.outer.setAttribute("overflows", false);
          else this.outer.removeAttribute("overflows");
          if (this.navbar.getAttribute("overflowing") && !value) {
            this.unCollapse();
          }
        }
        break;
      case direction:
        this.direction = value;
      // fall through...
      case exclude:
      case springs:
        if (this.isOverflowing) break;
        this.unwrapAll();
        let array = [...this.widgets].filter(this.filterFn, this);
        this.wrapAll(array, this.inner);
        this.setMaxWidth(array);
        break;
    }
  }
  attachListeners() {
    addEventListener("unload", this, false);
    Services.prefs.addObserver("userChrome.toolbarSlider", this);
    this.contextMenu.addEventListener("popupshowing", this);
  }
  setupPrefs() {
    const { prefs } = Services;
    const {
      width,
      exclude,
      springs,
      collapse,
      direction,
    } = NavbarToolbarSlider.prefNames;
    if (!prefs.prefHasUserValue(width)) prefs.setIntPref(width, 11);
    if (!prefs.prefHasUserValue(collapse)) prefs.setBoolPref(collapse, true);
    if (!prefs.prefHasUserValue(exclude)) prefs.setStringPref(exclude, "[]");
    if (!prefs.prefHasUserValue(springs)) prefs.setBoolPref(springs, true);
    if (!prefs.prefHasUserValue(direction)) {
      prefs.setStringPref(direction, "after");
    }
    // migrate direction pref to before/after/all syntax, as it used to support left/right values.
    switch (prefs.getStringPref(direction, "after")) {
      case "left":
        prefs.setStringPref(direction, "before");
        break;
      case "right":
        prefs.setStringPref(direction, "after");
        break;
      case "before":
      case "after":
      case "all":
        break;
      default:
        prefs.setStringPref(direction, "after");
        break;
    }
    this.observe(prefs, null, width);
    this.observe(prefs, null, collapse);
    this.direction = prefs.getStringPref(direction, "after");
  }
  get isOverflowing() {
    return !!(this.collapse && this.navbar.getAttribute("overflowing"));
  }
  get cuiArray() {
    // get all the widgets in the nav-bar, filter out any nullish/falsy items,
    // then call the big boy filter. if the global context is a private browsing
    // window, then it will filter out any extension widgets that aren't allowed
    // in privatbrowsing. this is important because every item in the array
    // needs to have a corresponding DOM node for us to remember the DOM order
    // and placwidgets where they belong. if we leave an item in the array that
    // has no DOM node, then insertBefore will put the widget before undefined,
    // which means put it athe very end, which isn't always what we want.
    return CustomizableUI.getWidgetsInArea("nav-bar")
      .filter(Boolean)
      .filter(this.filterFn, this);
  }
  // primary filter function for including/excluding widgets in the slider
  filterFn(item, index, array) {
    // check if window is private and widget is disallowed in private browsing.
    // if so, filter it out.
    if (
      item.showInPrivateBrowsing === false &&
      PrivateBrowsingUtils.isWindowPrivate(window)
    ) {
      return false;
    }
    // exclude urlbar, searchbar, system buttons, and the slider itself.
    switch (item.id) {
      case "wrapper-back-button":
      case "back-button":
      case "wrapper-forward-button":
      case "forward-button":
      case "wrapper-stop-reload-button":
      case "stop-reload-button":
      case "wrapper-urlbar-container":
      case "urlbar-container":
      case "wrapper-search-container":
      case "search-container":
      case "urlbar-search-splitter":
      case "nav-bar-toolbarbutton-slider-container":
        return false;
      default:
        break;
    }
    // exclude spacing springs
    if (
      item.id.includes("customizableui-special-spring") &&
      Services.prefs.getBoolPref(NavbarToolbarSlider.prefNames.springs, true)
    ) {
      return false;
    }
    // exclude buttons defined by user preference
    if (
      JSON.parse(
        Services.prefs.getStringPref(
          NavbarToolbarSlider.prefNames.exclude,
          "[]"
        )
      ).includes(item.id)
    ) {
      return false;
    }
    return this.getRelToUrlbar(index, array);
  }
  getRelToUrlbar(index, array) {
    let urlbarIdx =
      array.indexOf(this.urlbar) > -1
        ? array.indexOf(this.urlbar)
        : array.findIndex(w => w.id === "urlbar-container");
    switch (this.direction) {
      case "after":
        return urlbarIdx < index;
      case "before":
        return urlbarIdx > index;
      case "all":
        return true;
      default:
        return false;
    }
  }
  setMaxWidth(array) {
    if (!this.outer.ready) return;
    let maxWidth = 0;
    let length = this.widthInButtons || 11;
    if (this.kids.length) {
      let arr = array || [...this.kids];
      let widgetList = this.cuiArray;
      if (arr.length < widgetList.length && arr.length < length) {
        // return setTimeout(() => this.setMaxWidth(), 1);
        return requestAnimationFrame(() => this.setMaxWidth());
      }
      if (arr) {
        arr
          .slice(0, length)
          .forEach(el => (maxWidth += NavbarToolbarSlider.parseWidth(el)));
      } else {
        widgetList
          .slice(0, length)
          .forEach(
            w =>
              (maxWidth += NavbarToolbarSlider.parseWidth(
                w.forWindow(window).node
              ))
          );
      }
    } else {
      maxWidth =
        length *
        NavbarToolbarSlider.parseWidth(
          document.getElementById("forward-button")
        );
    }
    this.outer.style.maxWidth = `${maxWidth}px`;
  }
  async unCollapse() {
    await this.navbar.overflowable._moveItemsBackToTheirOrigin(true);
    this.unwrapAll();
    this.wrapAll([...this.widgets].filter(this.filterFn, this), this.inner);
    this.outer.hidden = false;
  }
  onCustomizeStart() {
    let overflown = this.isOverflowing;
    if (!overflown) this.unwrapAll();
    // temporarily move the slider out of the way. we don't want to delete it
    // since we only want to add listeners and observers once per window. the
    // slider needs to be out of the customization target during customization,
    // or else we get a tiny bug where dragging a widget ahead of the empty
    // slider causes the widget to teleport to the end.
    this.bin.appendChild(this.outer);
    this.outer.hidden = overflown;
  }
  onCustomizeEnd() {
    let overflown = this.isOverflowing;
    let array = [...this.widgets].filter(this.filterFn, this);
    if (overflown) {
      array.forEach(button => {
        if (button.getAttribute("overflows") !== "false") {
          this.cOverflow.appendChild(button);
        }
      });
      this.cOverflow.insertBefore(this.outer, this.cOverflow.firstElementChild);
    } else {
      this.wrapAll(array, this.inner);
    }
    this.outer.hidden = overflown;
    this.setMaxWidth();
  }
  onWidgetOverflow(aNode, aContainer) {
    if (aNode.ownerGlobal !== window) return;
    if (aNode === this.outer && aContainer === this.cTarget) {
      [...this.kids].forEach(button => {
        if (button.getAttribute("overflows") === "false") {
          this.cTarget.insertBefore(button, this.outer);
        } else {
          this.cOverflow.appendChild(button);
        }
      });
      this.outer.hidden = true;
    }
  }
  onWidgetUnderflow(aNode, aContainer) {
    if (aNode.ownerGlobal !== window) return;
    if (aNode === this.outer && aContainer === this.cTarget) {
      this.unwrapAll();
      this.wrapAll([...this.widgets].filter(this.filterFn, this), this.inner);
      this.outer.hidden = false;
      this.reOrder();
    }
  }
  onWidgetAfterDOMChange(aNode, aNextNode, aContainer, aWasRemoval) {
    // if the dom change was the removal of a toolbar button node, do nothing,
    // unless we hid it before removal via context menu.
    if (aWasRemoval) {
      if (aNode.hidingBeforeRemoval) {
        aNode.style.removeProperty("visibility");
        aNode.hidingBeforeRemoval = false;
      }
      return;
    }
    // first makes sure that "this" refers to the window where the node was
    // created, otherwise this would run multiple times per-window if you have
    // more than one window open. second makes sure that the node being mutated
    // is actually in the nav-bar, since there are other widget areas. third
    // makes sure we're not in customize mode, since that involves a lot of dom
    // changes and we want to basically pause this whole feature during
    // customize mode. if all are true then we call pickUpOrphans to wrap any
    // widgets that aren't already wrapped.
    if (
      aNode.ownerGlobal === window &&
      aContainer === this.cTarget &&
      !CustomizationHandler.isCustomizing()
    ) {
      this.pickUpOrphans(aNode);
    }
  }
  onWidgetAfterCreation() {
    this.setMaxWidth();
  }
  onWindowClosed(aWindow) {
    // if a window happens to be open to the "customize" page when the window
    // closes, that window won't send an onCustomizeEnd event. so the slider
    // containers in EVERY window would remain unwrapped after the window closes. so
    // when a window closes, we need to check if the window that sent the closed
    // event is in customization. if it is, then we need to call wrapAll in the
    // windows that weren't closed. that's what the 3rd argument here is for.
    if (aWindow === window) {
      CustomizableUI.removeListener(this);
    } else if (aWindow.CustomizationHandler.isCustomizing()) {
      this.wrapAll([...this.widgets].filter(this.filterFn, this), this.inner);
    }
  }
  /**
   * when the context menu is showing, we need to do things differently if it
   * was called on a button inside the slider vs. a button outside of the slider.
   * @param {object} e (event => "popupshowing")
   * @returns (nothing)
   */
  onPopupshowing(e) {
    let popup = e.target;
    let button = this.validWidget(popup);
    let moveToPanel = popup.querySelector(".customize-context-moveToPanel");
    let removeFromToolbar = popup.querySelector(
      ".customize-context-removeFromToolbar"
    );
    if (!(moveToPanel && removeFromToolbar)) return;
    // if the parent element is not the slider, then make the context menu work as normal and bail.
    if (!button || button.parentElement !== this.inner) {
      moveToPanel.setAttribute(
        "oncommand",
        "gCustomizeMode.addToPanel(this.parentNode.triggerNode, 'toolbar-context-menu')"
      );
      removeFromToolbar.setAttribute(
        "oncommand",
        "gCustomizeMode.removeFromArea(this.parentNode.triggerNode, 'toolbar-context-menu')"
      );
      return;
    }
    // if a non-removable system button got into the slider somehow, then disable these commands
    let movable =
      button && button.id && CustomizableUI.isWidgetRemovable(button);
    if (movable) {
      if (CustomizableUI.isSpecialWidget(button.id)) {
        moveToPanel.setAttribute("disabled", true);
      } else {
        moveToPanel.removeAttribute("disabled");
      }
      removeFromToolbar.removeAttribute("disabled");
    } else {
      moveToPanel.setAttribute("disabled", true);
      removeFromToolbar.setAttribute("disabled", true);
    }
    // override the commands
    moveToPanel.setAttribute(
      "oncommand",
      "navbarToolbarSlider.addToPanel(navbarToolbarSlider.validWidget(this.parentNode), 'toolbar-context-menu')"
    );
    removeFromToolbar.setAttribute(
      "oncommand",
      "navbarToolbarSlider.removeFromArea(navbarToolbarSlider.validWidget(this.parentNode), 'toolbar-context-menu')"
    );
  }
  /**
   * sometimes the context menu is invoked on a toolbar button that's not actually
   * a widget. examples are the profiler button, the zoom buttons, or the edit
   * buttons. these are "combined" toolbar buttons, each individual button has its
   * own event listeners, but the actual widget is their container. so if we're
   * dealing with one of those, we need to get its parent element, not it.
   * @param {object} popup (a DOM node, the context menu that was invoked)
   * @returns a DOM node, either the button that was right-clicked or its container
   */
  validWidget(popup) {
    return popup.triggerNode.closest(".chromeclass-toolbar-additional");
  }
  /**
   * temporarily hide the button since CustomizableUI is slow. move the button
   * out of the slider and onto the customization target.
   * @param {object} aNode (the button by which the context menu was triggered)
   */
  onBeforeCommand(aNode) {
    // if the node's already hidden, we don't want to interfere with any native methods.
    if (!aNode.hidden) {
      aNode.style.visibility = "collapse";
      aNode.hidingBeforeRemoval = true;
    }
    // the node must be moved to the customization target, since CustomizableUI
    // expects widgets to be immediate children of a customization target. the
    // slider itself can't be a customization target, since you're not supposed
    // to put a customizable area within a customizable area. I would like to
    // figure out a way to do that some day though, since it would mean we could
    // delete a LOT of the stuff in this script lol.
    this.cTarget.appendChild(aNode);
  }
  /**
   * "pin to overflow menu" => before calling the native method to move it to
   * the overflow panel, hide it and move it to the customization target.
   * @param {object} aNode (the button by which the context menu was triggered)
   * @param {string} aReason (the ID for the context menu that sent the command)
   */
  async addToPanel(aNode, aReason) {
    this.onBeforeCommand(aNode);
    await gCustomizeMode.addToPanel(aNode, aReason);
    this.setMaxWidth();
  }
  /**
   * "remove from toolbar" => same as above, but call the method to remove it instead.
   * @param {object} aNode (the button by which the context menu was triggered)
   * @param {string} aReason (the ID for the context menu that sent the command)
   */
  async removeFromArea(aNode, aReason) {
    this.onBeforeCommand(aNode);
    await gCustomizeMode.removeFromArea(aNode, aReason);
    this.setMaxWidth();
  }
  wrapAll(buttons, container) {
    if (!buttons.length) return;
    let parent = buttons[0].parentElement;
    let { previousElementSibling } = buttons[0];
    NavbarToolbarSlider.appendLoop(buttons, container);
    // we're inserting the container before the urlbar's next sibling, i.e.
    // moving it to the original position of the first button. this way the
    // container wraps the buttons "in place," wherever they happen to be. though
    // for this reason, all the buttons you intend to collect should be
    // consecutive, obviously. they don't need to be, but if they aren't, the
    // slider may change the actual widget order, which persists through sessions.
    if (previousElementSibling) {
      if (previousElementSibling?.nextElementSibling) {
        parent.insertBefore(
          this.outer,
          previousElementSibling.nextElementSibling
        );
      } else {
        parent.appendChild(this.outer);
      }
    } else {
      parent.insertBefore(this.outer, parent.firstElementChild);
    }
  }
  unwrapAll() {
    let orderedWidgets = CustomizableUI.getWidgetsInArea("nav-bar")
      .filter(Boolean)
      .filter(item => !!item.forWindow(window)?.node);
    orderedWidgets.forEach((w, i) => {
      let node = w.forWindow(window)?.node;
      let prevWidget = orderedWidgets[i - 1];
      if (prevWidget) prevWidget.forWindow(window).node.after(node);
      else this.cTarget.appendChild(node);
    });
  }
  // pick up any nodes that belong in the slider but aren't in it.
  pickUpOrphans(aNode) {
    let array = this.cuiArray;
    let container = this.isOverflowing ? this.cOverflow : this.inner;
    array.forEach((item, i) => {
      // check that the node which changed is in the customizable widgets list,
      // since the ordering logic relies on the widgets list. we use forWindow
      // when selecting nodes from the widgets list, since each widget has an
      // instance for every window it's visible in. with multiple windows open,
      // array[0] will return an object with a property "instances" whose value
      // is an array of objects, each of which has a node property referencing
      // the DOM node we actually want. forWindow is just a shortcut to get to
      // the object corresponding to the context we're executing in.
      if (item.id === aNode?.id) {
        // if the node that changed is the last item in the array, meaning it's
        // *supposed* to be the last in order, then we can't use insertBefore()
        // since there's nothing meant to be after it. we can't only use after()
        // either since it won't work for the first node. so we check for its
        // intended position, and if it's the last item, we use the after()
        // method to put it after the node corresponding to the previous widget.
        // for all the other widgets we just insert their nodes before the node
        // corresponding to the next widget.
        if (i + 1 === array?.length) {
          array[i - 1]?.forWindow(window).node.after(aNode);
        } else {
          let next = array[i + 1]?.forWindow(window).node;
          if (next?.parentElement === container) {
            container.insertBefore(aNode, next);
          } else {
            let prev = array[i - 1]?.forWindow(window).node;
            if (prev?.parentElement === container) prev.after(aNode);
          }
        }
      }
    });
  }
  // ensure that the order of DOM nodes in the slider container matches the
  // order of widgets in CustomizableUI. rearrange them in whatever way
  // necessary to adhere to the widget order. this is mainly complicated by the
  // fact that the widget array is full of "empty" slots for uninstalled,
  // disabled, or hidden addons, so it can't 1:1 match the DOM. that's also why
  // we use a Boolean filter every time we use the widget array.
  reOrder() {
    let array = this.cuiArray;
    let container = this.isOverflowing ? this.cOverflow : this.inner;
    // for every valid item in the widgets list...
    array.forEach((item, i) => {
      // if the NODE's next sibling does not match the next WIDGET's node, then
      // we need to move the node to where it belongs. basically the DOM order
      // is supposed to match the widget array's order. an instance of widget 1
      // has a property 'node', let's call it node 1. same for widget 2, call it
      // node 2. node 1's next sibling should be equal to node 2. if node 1's
      // next sibling is actually node 5, then the DOM is out of order relative
      // to the array. so we check each widget's node's next sibling, and if
      // it's not equal to the node of the next widget in the array, we insert
      // the node before the next widget's node.
      if (
        item.forWindow(window).node.nextElementSibling !=
        array[i + 1]?.forWindow(window).node
      ) {
        // if nextElementSibling returns null, then it's the last child of the
        // slider. if that widget is the last in the array, then array[i+1] will
        // return undefined. since null == undefined the if statement will still
        // execute for the last widget. but the following expression says to
        // insert the node before the next widget's node. since there is no next
        // widget, we're telling the engine to insert the node before undefined.
        // which always results in inserting the node at the end. so it ends up
        // where it should be anyway. and this is faster than actually checking
        // if it's the last node for every iteration of the loop.
        container.insertBefore(
          item.forWindow(window)?.node,
          array[i + 1]?.forWindow(window).node
        );
      }
    });
  }
  setupScroll() {
    let { outer, inner } = this;
    // we're listening for changes to the "open" attribute of children of inner
    // (the inner container). when you click a toolbar button that has a popup, it
    // opens the popup and sets the "open" attribute of the button to "true". if
    // you were to scroll the slider container while the popup is open, the popup
    // will move right along with its anchor, the button. this is a problem
    // because some button popups are actually children of the button. meaning
    // mousewheeling with the cursor over the popup would scroll the slider, not
    // the popup. there are other ways to deal with this, but we don't want the
    // slider to scroll at all when the popup is open. because firefox normally
    // blocks scrolling when a menupopup is open. so let's just listen for button
    // nodes having open="true" and set a property on the outer container
    // accordingly. then we can use that prop to enable/disable scrolling.
    this.muObserver = new MutationObserver(() => {
      // if any button has open=true, set outer.open=true, else, outer.open=false.
      outer.open = !!inner.querySelector(`toolbarbutton[open="true"]`);
    });
    // begin observing for changes to the "open" attribute of the slider's toolbar buttons.
    this.muObserver.observe(inner, {
      attributeFilter: ["open"],
      subtree: true,
    });
    for (const [key, val] of Object.entries({
      class: "chromeclass-location slider-container",
      id: "nav-bar-toolbarbutton-slider-container",
      smoothscroll: true,
      clicktoscroll: true,
      orient: "horizontal",
      style:
        "-moz-box-align: stretch; -moz-box-orient: vertical; scrollbar-width: none; box-sizing: border-box; scroll-behavior: smooth; overflow: hidden; transition: max-width 0.2s ease-out;",
    })) {
      outer.setAttribute(key, val);
    }

    if (!this.collapse) outer.setAttribute("overflows", false);
    for (const [key, val] of Object.entries({
      class: "slider-inner-container",
      id: "nav-bar-toolbarbutton-slider",
      style: "-moz-box-flex: 1;",
    })) {
      inner.setAttribute(key, val);
    }
    outer.ready = true;
    outer.smoothScroll = true;
    outer._clickToScroll = true;
    outer._isScrolling = false;
    // these objects hold values used for scrolling
    outer._destination = 0;
    outer._direction = 0;
    outer._prevMouseScrolls = [null, null];
    // these are patterned after the arrowscrollbox functions.
    outer.scrollByPixels = function(left, instant) {
      this.scrollBy({ left, behavior: instant ? "instant" : "auto" });
    };
    // these 2 are just here for future extension
    outer.on_Scroll = function() {
      if (this.open) return;
      this._isScrolling = true;
    };
    outer.on_Scrollend = function() {
      this._isScrolling = false;
      this._destination = 0;
      this._direction = 0;
    };
    // main wheel event callback
    outer.on_Wheel = function(e) {
      // this is what the mutation observer was for. when a toolbar button in
      // the slider has its popup open, we set outer.open = true. so if
      // outer.open = true we don't want to scroll at all. in other words, if a
      // popup for a button in the slider is open, don't do anything.
      if (this.open) return;
      let doScroll = false;
      let instant;
      let scrollAmount = 0;
      // check if the wheel event is mostly vertical (up/down) or mostly horizontal (left/right).
      let isVertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      // if we're scrolling vertically, then use the deltaY as the general delta.
      // if horizontal, then use deltaX instead. you can use this to invert the
      // vertical scrolling direction. just change e.deltaY to -e.deltaY.
      let delta = isVertical ? e.deltaY : e.deltaX;
      // if we're using a trackpad or ball or something that can scroll
      // horizontally and vertically at the same time, we need some extra logic.
      // otherwise it can stutter like crazy. as you see in delta, we want to only
      // use either the deltaY or the deltaX, never both. but if you're scrolling
      // diagonally, that could change very quickly from X to Y to X and so on. so
      // we want to only call scrollBy if the scroll input is consistent in one
      // direction. that's what outer._prevMouseScrolls = [null, null] is for. we
      // want to check that the last 2 scroll events were primarily vertical. if
      // they were, then we'll enable scrolling and set the scroll amount.
      if (this._prevMouseScrolls.every(prev => prev == isVertical)) {
        doScroll = true;
        scrollAmount = delta;
        if (e.deltaMode == e.DOM_DELTA_PIXEL) instant = true;
      }
      if (this._prevMouseScrolls.length > 1) this._prevMouseScrolls.shift();
      this._prevMouseScrolls.push(isVertical);
      // provided we're allowed to scroll, then call scrollByPixels
      // with the values previously returned.
      if (doScroll) {
        let direction = scrollAmount < 0 ? -1 : 1;
        if (e.deltaMode == e.DOM_DELTA_PAGE) {
          scrollAmount *= this.clientWidth;
        } else if (e.deltaMode == e.DOM_DELTA_LINE) {
          let buttons = this.firstElementChild.children.length;
          if (buttons) {
            let lineAmount = this.scrollWidth / buttons;
            let clientSize = this.clientWidth;
            if (Math.abs(scrollAmount * lineAmount) > clientSize) {
              scrollAmount =
                Math.max(1, Math.floor(clientSize / lineAmount)) * direction;
            }
            scrollAmount *= lineAmount;
          } else {
            scrollAmount = 0;
          }
        }
        let startPos = this.scrollLeft;
        /* since we're using smooth scrolling, we check if the event is being
        sent while a scroll animation is already "playing." this will avoid
        stuttering if scrolling quickly (or on a trackpad, methinks) */
        if (!this._isScrolling || this._direction != direction) {
          this._destination = startPos + scrollAmount;
          this._direction = direction;
        } else {
          // We were already in the process of scrolling in this direction
          this._destination = this._destination + scrollAmount;
          scrollAmount = this._destination - startPos;
        }
        // finally do the actual scrolly thing
        this.scrollByPixels(scrollAmount, instant);
      }
      e.stopPropagation();
      e.preventDefault();
    };
    /**
     * called when focusing a toolbar button with tab or arrow keys. by default,
     * this method calls elem.focus() which scrolls the button into view
     * instantly. we modify the function so that it checks if the button is
     * contained inside a toolbar slider. if it is, then we use a custom scroll
     * function that 1) scrolls smoothly, and 2) scrolls forward/backward such
     * that the element ends up in the center of the scrollbar, unless it's
     * already scrolled to the end/beginning. then it calls a special method
     * that focuses without the native automatic instant scroll behavior.
     * @param {object} aButton (a button's DOM node)
     */
    ToolbarKeyboardNavigator._focusButton = function(aButton) {
      aButton.setAttribute("tabindex", "-1");
      let slider = aButton.closest(".slider-inner-container");
      if (slider) {
        NavbarToolbarSlider.smoothCenterScrollTo(aButton, slider);
        Services.focus.setFocus(aButton, Ci.nsIFocusManager.FLAG_NOSCROLL);
      } else {
        aButton.focus();
      }
      aButton.addEventListener("blur", this);
    };
    outer.addEventListener("wheel", outer.on_Wheel);
    outer.addEventListener("scroll", outer.on_Scroll);
    outer.addEventListener("scrollend", outer.on_Scrollend);
  }
  // don't show the confirmation hint on the bookmarks menu
  // or library button if they're scrolled out of view
  handleConfirmationHint() {
    this.handleGSyncHint();
    this.handleStarUIHint();
  }
  handleStarUIHint() {
    // don't change this method if we're using restorePreProtonLibraryButton.uc.js,
    // since that script also changes it
    if ("LibraryUI" in window) return;
    StarUI.showConfirmation = function() {
      const HINT_COUNT_PREF =
        "browser.bookmarks.editDialog.confirmationHintShowCount";
      const HINT_COUNT = Services.prefs.getIntPref(HINT_COUNT_PREF, 0);
      if (HINT_COUNT >= 3) return;
      Services.prefs.setIntPref(HINT_COUNT_PREF, HINT_COUNT + 1);
      let anchor;
      if (window.toolbar.visible) {
        for (let id of ["library-button", "bookmarks-menu-button"]) {
          let element = document.getElementById(id);
          if (
            element &&
            element.getAttribute("cui-areatype") != "panel" &&
            element.getAttribute("overflowedItem") != "true" &&
            isElementVisible(element) &&
            !NavbarToolbarSlider.scrolledOutOfView(element, ".slider-container")
          ) {
            anchor = element;
            break;
          }
        }
      }
      if (!anchor) anchor = document.getElementById("PanelUI-menu-button");
      ConfirmationHint.show(anchor, "confirmation-hint-page-bookmarked");
    };
  }
  handleGSyncHint() {
    if (!window.gSync?._appendSendTabDeviceList) return;
    window.gSync._appendSendTabDeviceList = function(
      targets,
      fragment,
      createDeviceNodeFn,
      url,
      title,
      multiselected,
      isFxaMenu = false
    ) {
      let tabsToSend = multiselected
        ? gBrowser.selectedTabs.map(t => {
            return {
              url: t.linkedBrowser.currentURI.spec,
              title: t.linkedBrowser.contentTitle,
            };
          })
        : [{ url, title }];

      const send = to => {
        Promise.all(
          tabsToSend.map(t =>
            // sendTabToDevice does not reject.
            this.sendTabToDevice(t.url, to, t.title)
          )
        ).then(results => {
          // Show the Sent! confirmation if any of the sends succeeded.
          if (results.includes(true)) {
            // FxA button could be hidden with CSS since the user is logged out,
            // although it seems likely this would only happen in testing...
            let fxastatus = document.documentElement.getAttribute("fxastatus");
            let fxaButton = document.getElementById("fxa-toolbar-menu-button");
            let anchorNode =
              (fxastatus &&
                fxastatus != "not_configured" &&
                fxaButton?.parentNode?.id != "widget-overflow-list" &&
                isElementVisible(fxaButton) &&
                !NavbarToolbarSlider.scrolledOutOfView(
                  fxaButton,
                  ".slider-container"
                ) &&
                fxaButton) ||
              document.getElementById("PanelUI-menu-button");
            ConfirmationHint.show(
              anchorNode,
              "confirmation-hint-send-to-device"
            );
          }
          fxAccounts.flushLogFile();
        });
      };
      const onSendAllCommand = event => {
        send(targets);
      };
      const onTargetDeviceCommand = event => {
        const targetId = event.target.getAttribute("clientId");
        const target = targets.find(t => t.id == targetId);
        send([target]);
      };

      function addTargetDevice(targetId, name, targetType, lastModified) {
        const targetDevice = createDeviceNodeFn(
          targetId,
          name,
          targetType,
          lastModified
        );
        targetDevice.addEventListener(
          "command",
          targetId ? onTargetDeviceCommand : onSendAllCommand,
          true
        );
        targetDevice.classList.add("sync-menuitem", "sendtab-target");
        targetDevice.setAttribute("clientId", targetId);
        targetDevice.setAttribute("clientType", targetType);
        targetDevice.setAttribute("label", name);
        fragment.appendChild(targetDevice);
      }

      for (let target of targets) {
        let type, lastModified;
        if (target.clientRecord) {
          type = Weave.Service.clientsEngine.getClientType(
            target.clientRecord.id
          );
          lastModified = new Date(
            target.clientRecord.serverLastModified * 1000
          );
        } else {
          // For phones, FxA uses "mobile" and Sync clients uses "phone".
          type = target.type == "mobile" ? "phone" : target.type;
          lastModified = target.lastAccessTime
            ? new Date(target.lastAccessTime)
            : null;
        }
        addTargetDevice(target.id, target.name, type, lastModified);
      }

      if (targets.length > 1) {
        // "Send to All Devices" menu item
        const separator = createDeviceNodeFn();
        separator.classList.add("sync-menuitem");
        fragment.appendChild(separator);
        const allDevicesLabel = isFxaMenu
          ? this.fluentStrings.formatValueSync("account-send-to-all-devices")
          : this.fxaStrings.GetStringFromName("sendToAllDevices.menuitem");
        addTargetDevice("", allDevicesLabel, "");

        // "Manage devices" menu item
        const manageDevicesLabel = isFxaMenu
          ? this.fluentStrings.formatValueSync("account-manage-devices")
          : this.fxaStrings.GetStringFromName("manageDevices.menuitem");
        // We piggyback on the createDeviceNodeFn implementation,
        // it's a big disgusting.
        const targetDevice = createDeviceNodeFn(
          null,
          manageDevicesLabel,
          null,
          null
        );
        targetDevice.addEventListener(
          "command",
          () => gSync.openDevicesManagementPage("sendtab"),
          true
        );
        targetDevice.classList.add("sync-menuitem", "sendtab-target");
        targetDevice.setAttribute("label", manageDevicesLabel);
        fragment.appendChild(targetDevice);
      }
    };
  }
  registerSheet() {
    const css = /* css */ `#nav-bar-customization-target>#nav-bar-toolbarbutton-slider-container:first-child,#nav-bar-customization-target>toolbarpaletteitem#nav-bar-toolbarbutton-slider-container:first-child>:is(toolbarbutton,toolbaritem){padding-inline-start:unset;margin-inline-start:calc(var(--toolbar-start-end-padding) - var(--toolbarbutton-outer-padding));}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
      Ci.nsIStyleSheetService
    );
    let uri = makeURI(`data:text/css;charset=UTF=8,${encodeURIComponent(css)}`);
    if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
    sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
  }
}
if (gBrowserInit.delayedStartupFinished) {
  window.navbarToolbarSlider = new NavbarToolbarSlider();
} else {
  let delayedListener = (subject, topic) => {
    if (topic == "browser-delayed-startup-finished" && subject == window) {
      Services.obs.removeObserver(delayedListener, topic);
      window.navbarToolbarSlider = new NavbarToolbarSlider();
    }
  };
  Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
