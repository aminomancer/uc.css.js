// ==UserScript==
// @name           Misc. Mods
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Various tiny mods not worth making separate scripts for. Read the comments inside the script for details.
// ==/UserScript==


(function () {
    function init() {
        // by default the bookmarks toolbar unhides itself when you use the edit bookmark panel and select the bookmarks toolbar as the bookmark's folder. this is super annoying so I'm completely turning it off.
        gEditItemOverlay._autoshowBookmarksToolbar = function () {};
        // on macOS the arrow keyboard shortcuts (cmd+shift+pgup) "wrap" relative to the tab bar, so moving the final tab right will move it to the beginning of the tab bar. for some reason this is turned off on linux and windows. I'm turning it on.
        gBrowser.arrowKeysShouldWrap = true;
        // for some reason, when you open the downloads panel it automatically focuses the first element, which is the footer if you don't have any downloads. this is inconsistent with other panels, and a little annoying imo. it's not a big deal but one of firefox's biggest problems compared to other browsers is a general lack of consistency. so I think removing this whole behavior would probably be wise, but for now I'll just stop it from focusing the *footer*, but still allow it to focus the first download item if there are any.
        eval(
            `DownloadsPanel._focusPanel = function ` +
                DownloadsPanel._focusPanel.toSource().replace(/DownloadsFooter\.focus\(\)\;/, ``)
        );
    }

    if (gBrowserInit.delayedStartupFinished) init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
