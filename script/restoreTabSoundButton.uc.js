// ==UserScript==
// @name           Restore pre-Proton Tab Sound Button
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Proton makes really big changes to tabs, in particular removing the tab sound button in favor of the overlay button. We can currently restore it to some extent with CSS, but it won't display a tooltip and it won't work when the video playing in the tab is in picture-in-picture mode. This script keeps the new tab tooltip enabled by the pref "browser.proton.places-tooltip.enabled" but allows it to work with the old .tab-icon-sound. So you get the nice parts of the proton tab changes without the second row of text about the audio playing. Instead it will show the mute/unmute tooltip inside the normal tab tooltip. It also changes the tooltip a bit so that it's always anchored to the tab rather than floating around tethered to the exact mouse position. This makes it easier to modify the tooltip appearance without the tooltip getting in your way.
// ==/UserScript==

(async function () {
    let css = `.tab-icon-sound-label,.tab-secondary-label{display:none;}.tab-label-container:not(.proton) + .tab-icon-sound{display:-moz-box;}.tab-icon-sound:not([soundplaying],[muted],[activemedia-blocked],[pictureinpicture]),.tab-icon-sound[pinned]{display:none;}.tab-icon-overlay{display:none;}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    let tabClass = await customElements.whenDefined("tabbrowser-tab");
    eval(
        `gBrowser.createTooltip = function ` +
            gBrowser.createTooltip.toSource().replace(/alignToTab \= false\;\n/g, "")
    );
    Object.defineProperty(tabClass.prototype, "soundPlayingIcon", {
        get() {
            return this.querySelector(".tab-icon-sound");
        },
    });
    gBrowser.tabContainer.addEventListener("click", this, true);
})();
