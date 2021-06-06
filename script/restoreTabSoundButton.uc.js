// ==UserScript==
// @name           Restore pre-Proton Tab Sound Button
// @version        2.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Proton makes really big changes to tabs, in particular removing the tab sound button in favor of the overlay button and a whole row of text. This script keeps the new tab tooltip enabled by the pref "browser.proton.places-tooltip.enabled" but allows it to work with the old .tab-icon-sound. So you get the nice parts of the proton tab changes without the second row of text about the audio playing. Instead it will show the mute/unmute tooltip inside the normal tab tooltip. It also changes the tooltip a bit so that it's always anchored to the tab rather than floating around tethered to the exact mouse position. This makes it easier to modify the tooltip appearance without the tooltip getting in your way. This script *requires* that you either 1) use my theme, complete with chrome.manifest and the resources folder, or 2) download resources/script-override/tabMods.uc.js and put it in the same location in your chrome folder, then edit your utils/chrome.manifest file to add the following line (without the "//"):
// override chrome://browser/content/tabbrowser-tab.js ../resources/tabMods.uc.js
// ==/UserScript==

(async function () {
    let css = `.tab-icon-sound-label,.tab-secondary-label{display:none;}.tab-icon-sound{display:-moz-box;}.tab-icon-sound:not([soundplaying],[muted],[activemedia-blocked],[pictureinpicture]),.tab-icon-sound[pinned]{display:none;}.tab-icon-overlay{display:none;}`;
    let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(Ci.nsIStyleSheetService);
    let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
    if (!sss.sheetRegistered(uri, sss.AUTHOR_SHEET))
        sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
    eval(
        `gBrowser.createTooltip = function ` +
            gBrowser.createTooltip
                .toSource()
                .replace(/alignToTab \= false\;\n/g, "")
                .replace(
                    /if \(tab\.mOverCloseButton\) \{[^{}]*\}/gs,
                    `if (tab.mOverCloseButton) {
                        let shortcut = ShortcutUtils.prettifyShortcut(key_close);
                        label = PluralForm.get(affectedTabsLength, gTabBrowserBundle.GetStringFromName("tabs.closeTabs.tooltip"))
                            .replace("#1", affectedTabsLength);
                        if (contextTabInSelection && shortcut) {
                            if (label.includes("%S")) label = label.replace("%S", shortcut);
                            else label = label + " (" + shortcut + ")";
                        }
                    }`
                )
                .replace(/tab\.selected/, `contextTabInSelection`)
    );
})();
