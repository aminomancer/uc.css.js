// ==UserScript==
// @name          searchModeIndicatorIcons.uc.js
// @namespace     https://github.com/aminomancer/uc.css.js
// @homepage      https://github.com/aminomancer/uc.css.js/blob/master/script/searchModeIndicatorIcons.uc.js
// @description   A way to put dynamic icons in the urlbar reflecting the current search engine. Automatically add indicator attributes to the identity icon in the urlbar in response to changing one-off search engines. If you have google set to "goo" and type in goo then hit spacebar, the identity icon will gain an attribute reflecting that, so you can change its icon accordingly with a CSS rule like : #identity-icon[engine="Tabs"] {list-style-image: url("chrome://browser/skin/tab.svg") !important;} Doesn't change anything else about the layout so you may want to tweak some things in your stylesheet. For example I have mine set up so the tracking protection icon disappears while the user is typing in the urlbar, and so a little box appears behind the identity icon while in one-off search mode. This way the icon appears to the left of the label, like it does on about:preferences and other UI pages. I recommend testing my stylesheets so you can see it and get an idea of what you can do, since it's not easily described in words.
// @version       2.0 => now that i've decided it's safe, this version uses attributes instead of classes. so that means you don't need to change the script or restart the browser if you add a new search engine. you just need to add a rule for [engine="your new engine"] to your stylesheet, which can be done in the browser toolbox without restarting.
// ==/UserScript==

(function () {
    const searchModeIndicatorFocused = this.gURLBar._searchModeIndicatorTitle,
        urlbar = this.gURLBar.textbox,
        identityIcon = this.gURLBar._identityBox.firstChild,
        buttons = this.gURLBar.view.oneOffSearchButtons.buttons,
        observer = new MutationObserver(searchModeCallback),
        options = {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["actiontype", "searchmode", "actionoverride"],
        };

    function searchModeCallback(mus, _observer) {
        for (let mu of mus) {
            // since we're listening to the whole urlbar, check that the target is one of the things we actually care about. alternatively we could have set more specific nodes to observe and made multiple observers but i think that's clunkier.
            if (mu.target === searchModeIndicatorFocused || mu.target === urlbar || buttons.contains(mu.target)) {
                let engineStr = // a string representing the current engine
                    searchModeIndicatorFocused.textContent || // if the indicator label has any text, use that (this is almost always the case when we're actually in search mode)
                    (urlbar.getAttribute("actiontype") === "switchtab" && urlbar.getAttribute("actionoverride") !== "true" ? "Tabs" : "Other"); // if not, then it's possible we're in switchtab mode, which you may never run into depending on your prefs. if certain prefs are enabled, then you'll occasionally get regular search results telling you to switch tabs. so we'll honor that, but the browser also overrides the action of these results when holding down shift or ctrl. (that's what "actionoverride" represents) so we're going to honor that and only use the Tabs string if we're explicitly in search mode, or if we're in switchtab mode and not holding down a modifier key. for any other case, we just use a placeholder string "Other" which can be styled. just make sure to use [pageproxystate="invalid"] or you'll fuck up the actual security identity icons. (the ones that look like locks)
                identityIcon.setAttribute("engine", engineStr); // now actually set the attribute equal to the temporary string
            }
        }
    }

    observer.observe(urlbar, options);
})();
