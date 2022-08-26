// ==UserScript==
// @name           Hit Enter in Urlbar to Refresh
// @version        1.0.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Due to Firefox's named anchor navigation system, you can't
// always refresh a page by clicking the urlbar and hitting Enter. If there's a
// hash mark `#` in the URL, Firefox interprets this as a URL fragment and tries
// to navigate between anchors within the document, by setting the scroll
// position and not reloading the document. This works great when clicking links
// on pages that link to other parts of the page, and when typing new fragments
// after the hash in the URL. But what if you just want to reload the page? If
// there is no hash, then hitting Enter will always reload the page. But if
// there is a hash, hitting Enter will not reload the page, even though the
// current URL is the same as the typed URL. Bug 1766145 on Bugzilla may resolve
// that problem, but in the meantime, this script will work. With this
// installed, hitting Enter in the urlbar when the typed value is the same as
// the current browser's URL will cause a page reload. If you change the value
// in the urlbar at all, this won't have any effect. It only comes into play
// when the URL values are 100% identical. This just ensures that if you click
// into the urlbar and hit Enter, without doing anything else, it will always
// work the same — whether there's a hash in the URL or not.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function() {
  function init() {
    let source = gURLBar._loadURL.toSource();
    if (source.startsWith("(function")) return;
    eval(
      `gURLBar._loadURL = function ` +
        source
          .replace(
            /(SitePermissions\.clearTemporaryBlockPermissions\(browser\)\;)/,
            `$1\n        params.isReload = true;`
          )
          .replace(
            /(this\.window\.openTrustedLinkIn\(url, openUILinkWhere, params\);)/,
            `if (params.isReload) {\n        delete params.isReload;\n        this.openLinkWithForceReload(url, params);\n      } else {\n        $1\n      }`
          )
    );
    /**
     * Open a url in the current tab and ensure it reloads rather than anchor navigation.
     *
     * @param {string} url
     *   The URL to open.
     * @param {object} params
     *   The parameters related to how and where the result will be opened.
     *   Further supported paramters are listed in utilityOverlay.js#openUILinkIn.
     */
    gURLBar.openLinkWithForceReload = function(url, params = {}) {
      if (!url) {
        return;
      }
      if (!params.triggeringPrincipal) {
        params.triggeringPrincipal = Services.scriptSecurityManager.getSystemPrincipal();
      }
      params.fromChrome = params.fromChrome ?? true;

      let aAllowThirdPartyFixup = params.allowThirdPartyFixup;
      let aPostData = params.postData;
      let aReferrerInfo = params.referrerInfo
        ? params.referrerInfo
        : new this.window.ReferrerInfo(Ci.nsIReferrerInfo.EMPTY, true, null);
      let aAllowInheritPrincipal = !!params.allowInheritPrincipal;
      let aForceAllowDataURI = params.forceAllowDataURI;
      let aIsPrivate = params.private;
      let aAllowPopups = !!params.allowPopups;
      let aUserContextId = params.userContextId;
      let aIndicateErrorPageLoad = params.indicateErrorPageLoad;
      let aPrincipal = params.originPrincipal;
      let aStoragePrincipal = params.originStoragePrincipal;
      let aTriggeringPrincipal = params.triggeringPrincipal;
      let aCsp = params.csp;
      let aForceAboutBlankViewerInCurrent = params.forceAboutBlankViewerInCurrent;
      let aResolveOnContentBrowserReady = params.resolveOnContentBrowserCreated;

      let w = this.window;

      function useOAForPrincipal(principal) {
        if (principal && principal.isContentPrincipal) {
          let attrs = {
            userContextId: aUserContextId,
            privateBrowsingId: aIsPrivate || (w && PrivateBrowsingUtils.isWindowPrivate(w)),
            firstPartyDomain: principal.originAttributes.firstPartyDomain,
          };
          return Services.scriptSecurityManager.principalWithOA(principal, attrs);
        }
        return principal;
      }
      aPrincipal = useOAForPrincipal(aPrincipal);
      aStoragePrincipal = useOAForPrincipal(aStoragePrincipal);
      aTriggeringPrincipal = useOAForPrincipal(aTriggeringPrincipal);

      w.focus();

      let uriObj;
      let targetBrowser = params.targetBrowser || w.gBrowser.selectedBrowser;
      try {
        uriObj = Services.io.newURI(url);
      } catch (e) {}

      let flags = Ci.nsIWebNavigation.LOAD_FLAGS_IS_REFRESH;
      if (aAllowThirdPartyFixup) {
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_THIRD_PARTY_FIXUP;
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_FIXUP_SCHEME_TYPOS;
      }
      if (!aAllowInheritPrincipal) {
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_DISALLOW_INHERIT_PRINCIPAL;
      }
      if (aAllowPopups) {
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_ALLOW_POPUPS;
      }
      if (aIndicateErrorPageLoad) {
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_ERROR_LOAD_CHANGES_RV;
      }
      if (aForceAllowDataURI) {
        flags |= Ci.nsIWebNavigation.LOAD_FLAGS_FORCE_ALLOW_DATA_URI;
      }
      let { URI_INHERITS_SECURITY_CONTEXT } = Ci.nsIProtocolHandler;
      if (
        aForceAboutBlankViewerInCurrent &&
        (!uriObj || this.window.doGetProtocolFlags(uriObj) & URI_INHERITS_SECURITY_CONTEXT)
      ) {
        targetBrowser.createAboutBlankContentViewer(aPrincipal, aStoragePrincipal);
      }

      targetBrowser.loadURI(url, {
        triggeringPrincipal: aTriggeringPrincipal,
        csp: aCsp,
        flags,
        referrerInfo: aReferrerInfo,
        postData: aPostData,
        userContextId: aUserContextId,
      });
      if (aResolveOnContentBrowserReady) {
        aResolveOnContentBrowserReady(targetBrowser);
      }

      let focusUrlBar = w.document.activeElement == w.gURLBar.inputField && w.isBlankPageURL(url);
      if (
        !params.avoidBrowserFocus &&
        !focusUrlBar &&
        targetBrowser == w.gBrowser.selectedBrowser
      ) {
        targetBrowser.focus();
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
