// ==UserScript==
// @name           App Menu about:config Button
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds an about:config shortcut button to the main app menu panel, under the built-in Settings button. It can open the built-in about:config page, or it can open the old-school about:config page with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. To use that with fx-autoconfig, download ONLY the profile/chrome/utils/aboutconfig folder and place it inside your profile/chrome/resources folder. Then open config.xhtml and find & replace "userchromejs" with "userchrome" and save. Now "chrome://userchrome/content/aboutconfig/config.xhtml" should be the correct URL. By default the script will open to that link, so if you don't have that module installed the button will open to a blank page. If you can't get the module to work or if you just prefer Firefox's built-in page, you can change the constant on line 10 below to "about:config" and it'll open to the same page you'd get if you typed about:config in the address bar. (the URL must be in quotes) That said, typing about:config is already easy enough. The reason I made this script was to make a clean shortcut to reach the old-school page, and in a more central location than a bookmark. FYI I added an icon for this button (and for all the other main app menu buttons too) in uc-app-menu.css
// ==/UserScript==

(function () {
    // begin user configuration
    window.preferredAboutConfigURL = "chrome://userchrome/content/aboutconfig/config.xhtml"; // replace with "about:config" if you prefer the built-in page
    // end user configuration

    async function createButton() {
        const configStrings = await new Localization(["toolkit/about/config.ftl"], true); // get fluent file for AboutConfig page
        const advancedPrefsLabel = await configStrings.formatValue(["about-config-page-title"]); // localize the "Advanced Preferences" string
        const { mainView } = PanelUI;
        const doc = mainView.ownerDocument;
        const settingsButton = PanelUI.protonAppMenuEnabled // if proton is enabled, the buttons used are entirely different nodes
            ? doc.getElementById("appMenu-settings-button")
            : doc.getElementById("appMenu-preferences-button");
        const prefsButton = doc.createXULElement("toolbarbutton");

        for (const [key, val] of Object.entries({
            id: "appMenu-advanced-settings-button",
            class: "subviewbutton",
            label: advancedPrefsLabel,
            oncommand: `openTrustedLinkIn(preferredAboutConfigURL, gBrowser.currentURI.spec === AboutNewTab.newTabURL || gBrowser.currentURI.spec === HomePage.get(window) ? "current" : "tab")`,
        }))
            prefsButton.setAttribute(key, val);

        settingsButton.after(prefsButton); // place after the built-in "Settings" button
    }

    function init() {
        PanelMultiView.getViewNode(document, "appMenu-multiView").addEventListener(
            "ViewShowing",
            createButton,
            { once: true }
        );
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
