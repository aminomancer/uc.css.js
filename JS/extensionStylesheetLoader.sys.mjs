// ==UserScript==
// @name           Extension Stylesheet Loader
// @version        1.2.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer
// @long-description
// @description
/*
Allows users to share stylesheets for webextensions without needing to edit the URL. This works by creating an actor in every extension browser that sets an attribute on the root element to expose the addon's ID to user stylesheets. This means we can use the addon's ID instead of `@-moz-document url()`. That is good because addons' URLs are randomly generated upon install, meaning the URLs I specify in [resources/in-content/ext-*.css][in-content] will not be the same as yours, so they will not work for you.

You can also use this in combination with my [debugExtensionInToolbarContextMenu.uc.js][] to add your own style rules for extension content. Once you have that script installed, you can right-click an addon's toolbar button > Debug Extension > Copy ID. Then, in [userContent.css][], add a rule like `:root[uc-extension-id="example@aminomancer"]{color:red}`. Keep in mind, the ID is not the same as the URL. That's why this script is necessary in the first place. URLs are random, unique, and per-install. Conversely, an extension's ID is permanent and universal. If you need to, you can find the ID by navigating to `about:debugging#/runtime/this-firefox` or by using [debugExtensionInToolbarContextMenu.uc.js][].

[in-content]: https://github.com/aminomancer/uc.css.js/tree/master/resources/in-content
[debugExtensionInToolbarContextMenu.uc.js]: https://github.com/aminomancer/uc.css.js#debug-extension-in-toolbar-context-menu
[userContent.css]: https://github.com/aminomancer/uc.css.js/blob/master/userContent.css
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/extensionStylesheetLoader.sys.mjs
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/extensionStylesheetLoader.sys.mjs
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

export class ExtensionStylesheetLoaderChild extends JSWindowActorChild {
  handleEvent(e) {
    let policy = WebExtensionPolicy.getByHostname(
      this.document.location.hostname
    );
    if (policy && policy.id) {
      this.document.documentElement.setAttribute("uc-extension-id", policy.id);
    }
  }
}

if (Services.appinfo.processType === Services.appinfo.PROCESS_TYPE_DEFAULT) {
  let esModuleURI = import.meta.url;
  ChromeUtils.registerWindowActor("ExtensionStylesheetLoader", {
    child: { esModuleURI, events: { DOMDocElementInserted: {} } },
    allFrames: true,
    matches: ["moz-extension://*/*"],
    messageManagerGroups: ["browsers", "webext-browsers", "sidebars"],
  });
}
