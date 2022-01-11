// required prefs
// disable telemetry since we're modding firefox
user_pref("toolkit.telemetry.enabled", false);
user_pref("browser.discovery.enabled", false);
user_pref("app.shield.optoutstudies.enabled", false);
user_pref("datareporting.healthreport.documentServerURI", "http://%(server)s/healthreport/");
user_pref("datareporting.healthreport.uploadEnabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("browser.crashReports.unsubmittedCheck.autoSubmit2", false);
// allow installing the unsigned search extensions.
// the localized search extensions currently can't be signed because of https://github.com/mozilla/addons-linter/issues/3911
// so to use them, we must disable the signature requirement and go to about:addons > gear icon > install addon from file > find the .zip file
user_pref("xpinstall.signatures.required", false);
user_pref("extensions.autoDisableScopes", 0);
// eliminate some nuisances
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
// make the theme work properly
user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);
user_pref("browser.proton.enabled", true);
user_pref("browser.proton.places-tooltip.enabled", true);
user_pref("layout.css.moz-document.content.enabled", true);
user_pref("layout.css.xul-box-display-values.content.enabled", true);
user_pref("layout.css.xul-display-values.content.enabled", true);
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
// allow stylesheets to modify trees in system pages viewed in regular tabs
user_pref("layout.css.xul-tree-pseudos.content.enabled", true);
// allow the color-mix() CSS function
user_pref("layout.css.color-mix.enabled", true);
// other CSS features
user_pref("layout.css.moz-outline-radius.enabled", true);
// avoid native styling
user_pref("browser.display.windows.non_native_menus", 1);
user_pref("widget.content.allow-gtk-dark-theme", true);
// keep "all tabs" menu available at all times, useful for all tabs menu expansion pack
user_pref("browser.tabs.tabmanager.enabled", true);
// Selection background, among others
user_pref("ui.highlight", "hsla(245, 100%, 66%, .55)");
// Background for selected <option> elements and others
user_pref("ui.selecteditem", "#2F3456");
// Text color for selected <option> elements and others
user_pref("ui.selecteditemtext", "#FFFFFFCC");
// Tooltip colors (only relevant if userChrome.ag.css somehow fails to apply, but doesn't hurt)
user_pref("ui.infotext", "#FFFFFF");
user_pref("ui.infobackground", "#hsl(233, 36%, 11%)");

// REQUIRED on macOS
user_pref("widget.macos.native-context-menus", false);

// recommended prefs
// functionality oriented prefs
user_pref("browser.display.use_system_colors", false);
user_pref("accessibility.mouse_focuses_formcontrol", 0);
user_pref("browser.startup.blankWindow", false);
user_pref("browser.startup.preXulSkeletonUI", false);
user_pref("browser.tabs.tabMinWidth", 90);
user_pref("browser.urlbar.accessibility.tabToSearch.announceResults", false);
user_pref("browser.urlbar.richSuggestions.tail", false);
user_pref("browser.urlbar.searchTips", false);
user_pref("browser.urlbar.trimURLs", false);
user_pref("full-screen-api.transition-duration.enter", "0 0");
user_pref("full-screen-api.transition-duration.leave", "0 0");
user_pref("full-screen-api.warning.delay", -1);
user_pref("full-screen-api.warning.timeout", 0);
user_pref("prompts.contentPromptSubDialog", true);
user_pref("ui.skipNavigatingDisabledMenuItem", 1);
user_pref("ui.prefersReducedMotion", 0);
user_pref("ui.submenuDelay", 100);
user_pref("ui.tooltipDelay", 300);
user_pref("ui.key.menuAccessKeyFocuses", false);

// style oriented prefs
// use GTK style for in-content scrollbars
user_pref("widget.non-native-theme.scrollbar.style", 2);
// set the scrollbar width
user_pref("widget.non-native-theme.win.scrollbar.use-system-size", false);
user_pref("widget.non-native-theme.scrollbar.size.override", 11);
user_pref("widget.non-native-theme.gtk.scrollbar.thumb-size", 0.818);
// set the default background color for color-scheme: dark. see it for example on about:blank
user_pref("browser.display.background_color.dark", "#19191b");
// findbar highlight and selection colors
user_pref("ui.textHighlightBackground", "#7755FF");
user_pref("ui.textHighlightForeground", "#FFFFFF");
user_pref("ui.textSelectBackground", "#FFFFFF");
user_pref("ui.textSelectAttentionBackground", "#FF3388");
user_pref("ui.textSelectAttentionForeground", "#FFFFFF");
user_pref("ui.textSelectDisabledBackground", "#7755FF");
user_pref("ui.textSelectBackgroundAttention", "#FF3388");
user_pref("ui.textSelectBackgroundDisabled", "#7755FF");
// spell check style
user_pref("ui.SpellCheckerUnderline", "#E2467A");
user_pref("ui.SpellCheckerUnderlineStyle", 1);
// IME style (for example when typing pinyin or hangul)
user_pref("ui.IMERawInputBackground", "#000000");
user_pref("ui.IMESelectedRawTextBackground", "#7755FF");
// about:reader dark mode
user_pref("reader.color_scheme", "dark");

// windows font settings - does nothing on macOS or linux
user_pref("gfx.font_rendering.cleartype_params.cleartype_level", 100);
user_pref("gfx.font_rendering.cleartype_params.force_gdi_classic_for_families", "");
user_pref("gfx.font_rendering.cleartype_params.force_gdi_classic_max_size", 6);
user_pref("gfx.font_rendering.cleartype_params.pixel_structure", 1);
user_pref("gfx.font_rendering.cleartype_params.rendering_mode", 5);
user_pref("gfx.font_rendering.directwrite.use_gdi_table_loading", false);

// recommended userChrome... prefs created by the theme or scripts.
// there are many more not included here, to allow a lot more customization.
// these are just the ones I'm pretty certain 90% of users will want.
// see the prefs list at https://github.com/aminomancer/uc.css.js

user_pref("userChrome.tabs.new-loading-spinner-animation", true);
user_pref("userChrome.tabs.pinned-tabs.close-buttons.disabled", true);
user_pref("userChrome.urlbar-results.hide-help-button", true);

// these are more subjective prefs, but they're important ones
// display the all tabs menu in reverse order (newer tabs on top, like history)
// user_pref("userChrome.tabs.all-tabs-menu.reverse-order", true);

// turn bookmarks on the toolbar into small square buttons with only icons, no text
// user_pref("userChrome.bookmarks-toolbar.icons-only", false);

// replace UI font with SF Pro, the system font for macOS.
// recommended for all operating systems, but not required.
// must have the fonts installed. check the repo's readme for more details.
// user_pref("userChrome.css.mac-ui-fonts", true);

// add a drop shadow on menupopup and panel elements (context menus, addons' popup panels, etc.)
// the 8px drop shadow area around the menupopup can't be clicked through.
// this might bother some people so it's disabled by default.
// user_pref("userChrome.css.menupopup-shadows", true);

// custom wikipedia dark mode theme
// user_pref("userChrome.css.wikipedia.dark-theme-enabled", true);
