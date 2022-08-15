////// ⚠️ REQUIRED PREFS

//// disable telemetry since we're modding firefox
user_pref("toolkit.telemetry.enabled", false);
user_pref("browser.discovery.enabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("datareporting.healthreport.documentServerURI", "http://%(server)s/healthreport/");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
//// make the theme work properly
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.proton.places-tooltip.enabled", true);
user_pref("layout.css.moz-document.content.enabled", true);
//// eliminate the blank white window during startup
user_pref("browser.startup.blankWindow", false);
user_pref("browser.startup.preXulSkeletonUI", false);
////
// required for icons with data URLs
user_pref("svg.context-properties.content.enabled", true);
// required for acrylic gaussian blur
user_pref("layout.css.backdrop-filter.enabled", true);
// prevent bugs that would otherwise be caused by the custom scrollbars in the user-agent sheet
user_pref("layout.css.cached-scrollbar-styles.enabled", false);
// enable browser dark mode
user_pref("ui.systemUsesDarkTheme", 1);
// enable content dark mode
user_pref("layout.css.prefers-color-scheme.content-override", 0);
// allow the color-mix() CSS function
user_pref("layout.css.color-mix.enabled", true);
// other CSS features
user_pref("layout.css.moz-outline-radius.enabled", true);
//// avoid native styling
user_pref("browser.display.windows.non_native_menus", 1);
user_pref("widget.content.allow-gtk-dark-theme", true);
////
// keep "all tabs" menu available at all times, useful for all tabs menu expansion pack
user_pref("browser.tabs.tabmanager.enabled", true);
// disable urlbar result group labels since we don't use them
user_pref("browser.urlbar.groupLabels.enabled", false);
// corresponds to the system color Highlight
user_pref("ui.highlight", "hsl(250, 100%, 60%)");
// Background for selected <option> elements and others
user_pref("ui.selecteditem", "#2F3456");
// Text color for selected <option> elements and others
user_pref("ui.selecteditemtext", "#FFFFFFCC");
//// Tooltip colors (only relevant if userChrome.ag.css somehow fails to apply, but doesn't hurt)
user_pref("ui.infotext", "#FFFFFF");
user_pref("ui.infobackground", "#hsl(233, 36%, 11%)");
////

// ⚠️ REQUIRED on macOS
user_pref("widget.macos.native-context-menus", false);
