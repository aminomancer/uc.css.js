// ==UserScript==
// @name           Search Mode Indicator Icons
// @version        1.3
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Automatically replace the urlbar's identity icon with the current search engine's icon. This also adds an [engine] attribute to the identity icon so you can customize the icons yourself if you don't like a search engine's icon, or want to adjust its dimensions. If you have google set to "goo" and type in goo then hit spacebar, the identity icon will change to a google icon. And it'll also gain an attribute reflecting that, so you can change its icon further with a CSS rule like: #identity-icon[engine="Tabs"] {list-style-image: url("chrome://browser/skin/tab.svg") !important;} This doesn't change anything about the layout so you may want to tweak some things in your stylesheet. For example I have mine set up so the tracking protection icon disappears while the user is typing in the urlbar, and so a little box appears behind the identity icon while in one-off search mode. This way the icon appears to the left of the label, like it does on about:preferences and other UI pages.
// ==/UserScript==

(() => {
    function init() {
        const defaultIcon = `chrome://global/skin/icons/search-glass.svg`;
        const searchModeIndicatorFocused = gURLBar._searchModeIndicatorTitle;
        const urlbar = gURLBar.textbox;
        const identityIcon = gURLBar._identityBox.firstElementChild;
        const oneOffs = gURLBar.view.oneOffSearchButtons;
        const buttons = oneOffs.buttons;

        // use an author sheet to set the identity icon equal to the search engine icon when in search mode
        function registerSheet() {
            let css = `#urlbar[searchmode=""][pageproxystate="invalid"] #identity-box > #identity-icon-box > #identity-icon, #urlbar[searchmode=""][pageproxystate="valid"] #identity-box > #identity-icon-box > #identity-icon, #urlbar[searchmode=""] #identity-icon-box > #identity-icon, #urlbar[pageproxystate="invalid"] #identity-box > #identity-icon-box[engine] > #identity-icon, #urlbar[pageproxystate="valid"] #identity-box > #identity-icon-box[engine] > #identity-icon, #urlbar #identity-icon-box[engine] > #identity-icon {list-style-image: var(--search-engine-icon, url("${defaultIcon}"));}`;
            let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            );
            let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        }

        async function searchModeCallback(mus, _observer) {
            for (let mu of mus) {
                // since we're listening to the whole urlbar, check that the target is one of the things we actually care about. alternatively we could have set more specific nodes to observe and made multiple observers but i think that's clunkier.
                if (
                    mu.target === searchModeIndicatorFocused ||
                    mu.target === urlbar ||
                    buttons.contains(mu.target)
                ) {
                    // a string representing the current engine
                    // if the indicator label has any text, use that (this is almost always the case when we're actually in search mode)
                    let engineStr = searchModeIndicatorFocused.textContent || null;

                    // if not, then it's possible we're in switchtab mode, which you may never run into depending on your prefs. if certain prefs are enabled, then you'll occasionally get regular search results telling you to switch tabs. so we'll honor that, but the browser also overrides the action of these results when holding down shift or ctrl. (that's what "actionoverride" represents) so we're going to honor that and only use the Tabs string if we're explicitly in search mode, or if we're in switchtab mode and not holding down a modifier key. for any other case, we just remove the engine attribute, which can be styled by :not([engine]).
                    let switchTab;
                    if (!engineStr)
                        switchTab =
                            urlbar.getAttribute("actiontype") === "switchtab" &&
                            urlbar.getAttribute("actionoverride") !== "true";
                    if (switchTab) engineStr = "Tabs";

                    // now actually set the attribute equal to the temporary string
                    if (engineStr === null) identityIcon.removeAttribute("engine");
                    else identityIcon.setAttribute("engine", engineStr);

                    let url;
                    // in switchtab mode we'll use the tab icon
                    if (switchTab) url = `chrome://browser/skin/tab.svg`;
                    // built-in engines don't have icons or engine names, they just have integer sources.
                    // the icons are defined in browser.css so we'll use those icons.
                    else if (gURLBar.searchMode?.source) {
                        let { BOOKMARKS, HISTORY, TABS } = UrlbarUtils.RESULT_SOURCE;
                        switch (gURLBar.searchMode.source) {
                            case BOOKMARKS:
                                url = `chrome://browser/skin/bookmark.svg`;
                                break;
                            case HISTORY:
                                url = `chrome://browser/skin/history.svg`;
                                break;
                            case TABS:
                                url = `chrome://browser/skin/tab.svg`;
                                break;
                        }
                    }
                    if (!url) {
                        let engines = await Services.search.getVisibleEngines();
                        // set a variable var(--search-engine-icon) equal to the engine's icon, as a fallback if the user doesn't have CSS for the engine.
                        // we prefer to set the icon with CSS because it allows the user to adjust it and use a better icon than might be included with the engine.
                        // so use the [engine="engine name"] attribute wherever possible, but the following will handle any situations where you don't have a rule for the engine.
                        let filterFn = gURLBar.searchMode?.engineName
                            ? (engine) => engine._name === gURLBar.searchMode?.engineName
                            : (engine) => engine._name === searchModeIndicatorFocused.textContent;
                        let engine = engines.find(filterFn);
                        // use the default icon if there is still no engine.
                        url = (engine && engine._iconURI?.spec) || defaultIcon;
                    }
                    // set a CSS property instead of setting icon directly so user can modify it with userChrome.css
                    urlbar.style.setProperty("--search-engine-icon", `url("${url}")`);
                }
            }
        }

        registerSheet();
        new MutationObserver(searchModeCallback).observe(urlbar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["actiontype", "searchmode", "actionoverride"],
        });
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
