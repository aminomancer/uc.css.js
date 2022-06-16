// ==UserScript==
// @name           Tooltip Shadow Support
// @version        1.0.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    This script makes it easier to add box shadows and borders to
// tooltips without messing up some specific tooltips. Some tooltips have an
// awkward structure, where multiple descriptions exist within a single
// container, with display: -moz-popup. This means the tooltip is displayed
// within a restricted popup area with dimensions equal to the container, and
// overflow completely hidden. Box shadows on the container therefore won't be
// visible, since they'll fall outside of the popup box — you'd have to use a
// window shadow instead, but those can't be styled in a precise way. In
// tooltips with only 1 label we can just make the container transparent and put
// the background and box shadow on the label element. That way there can still
// be room within the popup for the box shadow to be visible. A box shadow with
// a 5px radius can fit well within a container with ~7px padding. Tooltips with
// a more elaborate structure with containers within containers, e.g. the tab
// tooltip, don't have this problem at all. But tooltips like the back and
// forward buttons' can only be given a shadow if you give each label a
// background color, and try to position and size them so that they perfectly
// overlap and create the illusion of being one element. But if you also want
// rounded corners and borders, that won't be an option. A good way to fix this
// is just to put the tooltips inside of another container, so that's what this
// script does. Because generic tooltips are native-anonymous, they don't
// inherit variables from the main window. So you have to edit userChrome.ag.css
// directly for some things. If you want to disable the borders, 1) don't use
// this script, and 2) go to about:config and set
// userChrome.css.remove-tooltip-borders to true.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
  function create(aDoc, tag, props, isHTML = false) {
    let el = isHTML ? aDoc.createElement(tag) : aDoc.createXULElement(tag);
    for (let prop in props) el.setAttribute(prop, props[prop]);
    return el;
  }
  function addShadowSupport(tip) {
    let box = create(document, "vbox", {
      id: tip.id + "-box",
      class: "uc-tooltip-box",
      flex: 1,
    });
    [...tip.children].forEach(elt => box.appendChild(elt));
    tip.appendChild(box);
    tip.setAttribute("shadow-support", true);
  }
  [
    document.getElementById("back-button-tooltip"),
    document.getElementById("forward-button-tooltip"),
  ].forEach(addShadowSupport);
  document.documentElement.setAttribute("tooltip-shadow-support", true);
})();
