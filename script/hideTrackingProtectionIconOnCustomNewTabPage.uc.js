// ==UserScript==
// @name           Hide Tracking Protection Icon on Custom New Tab Page
// @homepage       https://github.com/aminomancer
// @description    By default, Firefox hides the tracking protection while 1) the current tab is open to the default new tab page or default home page; or 2) the user is typing into the url bar. Hiding the icon while the user is typing is unnecessary, since although "pageproxystate" has changed, the content principal is still the same and clicking the tracking protection icon to open the popup still works. Opening the popup while pageproxystate is invalid still loads the tracking details and options for the current content URI. But hiding the icon on the new tab page or home page is necessary, because the tracking protection icon is hidden on about:blank. If you use an extension to set a custom new tab page, you will see the tracking protection icon briefly disappear when opening a new tab, before reappearing as the custom new tab page loads. That is because about:blank loads before the custom new tab page loads. So the icon is hidden and unhidden in the span of a hundred milliseconds or so. This looks very ugly, so my stylesheet has always prevented the tracking protection icon from being hidden on any page, including about:blank. That way at least it doesn't disappear. But this isn't a great solution, because there are a number of pages for which the tracking protection icon does nothing. The protection handler can't handle internal pages, for example. Previously I just disabled pointer events on the icon when it was supposed to be hidden. But I think this script is a better solution. If this script is not installed, my theme will default to those older methods I just mentioned. But if the script is installed, it will restore the built-in behavior of hiding the tracking protection icon on internal pages, only it will also hide the icon on the user's custom new tab page and home page. The icon will still be visible if you're on a valid webpage, (anything but about, chrome, and resource URIs) even if you begin typing in the urlbar.
// @author         aminomancer
// ==/UserScript==

(function () {
    function init() {
        gProtectionsHandler.onLocationChange = function onLocationChange() {
            if (this._showToastAfterRefresh) {
                this._showToastAfterRefresh = false;

                // We only display the toast if we're still on the same page.
                if (
                    this._previousURI == gBrowser.currentURI.spec &&
                    this._previousOuterWindowID == gBrowser.selectedBrowser.outerWindowID
                ) {
                    this.showProtectionsPopup({
                        toast: true,
                    });
                }
            }

            // Reset blocking and exception status so that we can send telemetry
            this.hadShieldState = false;

            // Don't deal with about:, file: etc.
            if (
                !ContentBlockingAllowList.canHandle(gBrowser.selectedBrowser) ||
                gBrowser.currentURI.spec === HomePage.get(window) ||
                gBrowser.currentURI.spec === AboutNewTab.newTabURL
            ) {
                // We hide the icon and thus avoid showing the doorhanger, since
                // the information contained there would mostly be broken and/or
                // irrelevant anyway.
                this._trackingProtectionIconContainer.hidden = true;
                return;
            }
            this._trackingProtectionIconContainer.hidden = false;

            // Check whether the user has added an exception for this site.
            this.hasException = ContentBlockingAllowList.includes(gBrowser.selectedBrowser);

            if (this._protectionsPopup) {
                this._protectionsPopup.toggleAttribute("hasException", this.hasException);
            }
            this.iconBox.toggleAttribute("hasException", this.hasException);

            // Add to telemetry per page load as a baseline measurement.
            this.fingerprintersHistogramAdd("pageLoad");
            this.cryptominersHistogramAdd("pageLoad");
            this.shieldHistogramAdd(0);
        };
    }

    document.documentElement.setAttribute("hide-tp-icon-on-ntp", true);

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
