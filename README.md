# **uc.css.js**

My personal Firefox theme/layout, plus some privileged scripts to add new behaviors and functions.

<a href="https://youtu.be/BAuABH13ytM">
<i>Click any of the gifs for a more thorough video preview of the theme and some of the major scripts.</i>
<br/>
<p></p>
<img src="preview/prev-window-small.webp">
<br/>
<p></p>
<img src="preview/prev-navbar.gif"/>
<br/>
<p></p>
<img src="preview/prev-search.gif"/>
</a>
<br/>
<p></p>

For best results, set density mode to `Normal` and theme to `Dark` in the customization menu. (right click on the navbar and click "Customize Toolbar...") I strongly recommend using this on [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) and updating the theme at least weekly. To that end, you might find it easier to clone the repo to your chrome folder so you can pull updates quickly. I also recommend setting the following prefs in about:config. These are in alphabetical order, not in order of importance. Several are optional, but the notes column highlights any that are required.<details><summary>***Click for a full list.***</summary>
| Pref&nbsp;name 	| Type 	| Value 	| Notes&nbsp;(optional&nbsp;unless&nbsp;otherwise&nbsp;noted) 	|
|-	|-	|-	|-	|
| browser.anchor_color 	| String 	| `#5311ff` 	|  	|
| browser.visited_color 	| String 	| `#753afc` 	|  	|
| browser.display.focus_ring_style 	| Number 	| 0 	|  	|
| browser.display.focus_ring_width 	| Number 	| 0 	|  	|
| *browser.proton.contextmenus.enabled* 	| Boolean 	| true 	| The stylesheets have fallback options if these prefs are disabled. But the fallback styles are not regularly updated. So I strongly recommend enabling all of the proton prefs 	|
| *browser.proton.doorhangers.enabled* 	| Boolean 	| true 	|  	|
| *browser.proton.enabled* 	| Boolean 	| true 	|  	|
| *browser.proton.modals.enabled* 	| Boolean 	| true 	|  	|
| *browser.proton.places-tooltip.enabled* 	| Boolean 	| true 	|  	|
| browser.startup.blankWindow 	| Boolean 	| false 	| These two settings eliminate the blank white window during startup 	|
| browser.startup.preXulSkeletonUI 	| Boolean 	| false 	|  	|
| browser.tabs.tabMinWidth 	| Number 	| 90 	| User preference, but mine is 90 	|
| browser.tabs.tabmanager.enabled 	| Boolean 	| true 	| Enables "all tabs menu" 	|
| browser.urlbar.accessibility.tabToSearch.announceResults 	| Boolean 	| false 	|  	|
| browser.urlbar.richSuggestions.tail 	| Boolean 	| false 	|  	|
| browser.urlbar.searchTips 	| Boolean 	| false 	|  	|
| browser.urlbar.trimURLs 	| Boolean 	| false 	|  	|
| dom.forms.selectSearch 	| Boolean 	| true 	|  	|
| findbar.highlightAll 	| Boolean 	| true 	| Stylesheet eliminates some rarely used findbar buttons. So I leave this set to true 	|
| findbar.matchdiacritics 	| Number 	| 2 	|  	|
| gfx.font_rendering.cleartype_params.cleartype_level 	| Number 	| 100 	| These settings are a major improvement to text rendering on Windows. I don't think they do anything on mac/linux 	|
| gfx.font_rendering.cleartype_params.force_gdi_classic_for_families 	| String 	| `<empty>` 	| Leave the value completely empty 	|
| gfx.font_rendering.cleartype_params.force_gdi_classic_max_size 	| Number 	| 6 	|  	|
| gfx.font_rendering.cleartype_params.pixel_structure 	| Number 	| 1 	|  	|
| gfx.font_rendering.cleartype_params.rendering_mode 	| Number 	| 5 	|  	|
| gfx.font_rendering.directwrite.use_gdi_table_loading 	| Boolean 	| false 	|  	|
| *gfx.webrender.svg-images* 	| Boolean 	| true 	|  	|
| *layout.css.backdrop-filter.enabled* 	| Boolean 	| true 	| Required for the acrylic/glass gaussian blur effect 	|
| *layout.css.cached-scrollbar-styles.enabled* 	| Boolean 	| false 	| Sort of required for userChrome.as.css 	|
| *layout.css.moz-document.content.enabled* 	| Boolean 	| true 	| Required 	|
| reader.color_scheme 	| String 	| `dark` 	|  	|
| mousewheel.autodir.enabled 	| Boolean 	| true 	| Allow mousewheel ⇅ to scroll ⇄-only scrollboxes 	|
| *svg.context-properties.content.enabled* 	| Boolean 	| true 	| Required for making some icons white 	|
| *toolkit.legacyUserProfileCustomizations.stylesheets* 	| Boolean 	| true 	| Required, of course 	|
| ui.IMERawInputBackground 	| String 	| `#000000` 	| This affects the appearance of IME overlays. e.g. when typing Hangul or Pinyin 	|
| ui.IMESelectedRawTextBackground 	| String 	| `#7755FF` 	|  	|
| ui.key.menuAccessKeyFocuses 	| Boolean 	| false 	| Disable alt-key opening menubar if you use my alt+M hotkey 	|
| ui.SpellCheckerUnderline 	| String 	| `#E2467A` 	|  	|
| ui.prefersReducedMotion 	| Number 	| 0 	|  	|
| ui.submenuDelay 	| Number 	| 100 	| These aren't required, but feel more responsive imo 	|
| ui.tooltipDelay 	| Number 	| 100 	|  	|
| ui.skipNavigatingDisabledMenuItem 	| Number 	| 1 	| When focusing menuitems with arrow keys, skip disabled items 	|
| ui.SpellCheckerUnderlineStyle 	| Number 	| 1 	| Use dotted underline for spell checker 	|
| *ui.systemUsesDarkTheme* 	| Number 	| 1 	| Currently required; working on a light mode 	|
| ui.textHighlightBackground 	| String 	| `#7755FF` 	| These prefs control the appearance of text highlighted by the findbar. I choose white text on purple/pink background 	|
| ui.textHighlightForeground 	| String 	| `#FFFFFF` 	|  	|
| ui.textSelectBackground 	| String 	| `#FFFFFF` 	|  	|
| ui.textSelectBackgroundAttention 	| String 	| `#FF3388` 	|  	|
| ui.textSelectBackgroundDisabled 	| String 	| `#000000` 	|  	|
| ui.textSelectForegroundAttention 	| String 	| `#000000` 	|  	|
| ui.textSelectForegroundCustom 	| String 	| `#7755FF` 	|  	|
| userChrome... 	|  	|  	| Several of my scripts use custom prefs beginning with `userChrome` for user customization. See the individual script files for details 	|
| userChrome.bookmarks-toolbar.icons-only 	| Boolean 	| false 	| If true, bookmark buttons in the toolbar are just square icons 	|
| userChrome.css.mac-ui-fonts 	| Boolean 	| true 	| Replace UI font with SF Pro. Requires a local copy of [SF Pro Display Regular](https://developer.apple.com/fonts/) 	|
| userChrome.tabs.all-tabs-menu.reverse-order 	| Boolean 	| true 	| Display all tabs menu in reverse order (newer tabs on top, like history) 	|
| userChrome.tabs.new-loading-spinner-animation 	| Boolean 	| true 	| Replace the tab loading throbber with a spinning animation 	|
| userChrome.tabs.pinned-tabs.close-buttons.disabled 	| Boolean 	| true 	| This controls whether close buttons are shown on pinned tabs 	|
| userChrome.tabs.rounded-outer-corners.disabled 	| Boolean 	| false 	| This controls whether tabs have rounded bottom corners<br/><img src="preview/prev-tabcorners.webp" width="100%"/> 	|
| userChrome.urlbar.hide-bookmarks-button-on-system-pages 	| Boolean 	| true 	| Hides the urlbar's bookmark button on system pages & new tab page 	|
| userChrome.urlbar-results.disable_animation 	| Boolean 	| false 	| Toggle to `true` if you don't want urlbar animations 	|
| widget.content.allow-gtk-dark-theme 	| Boolean 	| true 	| Makes Linux theming more consistent 	|
| widget.disable-native-theme-for-content 	| Boolean 	| true 	| Enables Firefox's custom appearance for elements like checkboxes. Skips the "native" appearance given by the OS stylesheets. 	|
</details>

This theme requires more technical setup than most because it changes a lot of lower-level stuff like javascript methods and icon/animation source code, but if you follow the instructions fully it'll work for anyone on any modern desktop OS, regardless of background knowledge. It requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) to register the icon package. This *specific* loader is required for most of my scripts too. Some other scripts are not compatible with it, but I can port them so feel free to post an issue/discussion on here to make a request.

Download the [resources](/resources) folder and place it in your `chrome` folder — fx-autoconfig will automatically register it to the path `chrome://userchrome/content/`. [Release packages](/../../releases/) are available as a courtesy, but since the theme and scripts are updated on a daily basis to keep up with Nightly, the latest release package may not be completely up to date. If you want the very latest stylesheets/scripts, you should either [clone the repo](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository-from-github/cloning-a-repository) directly to your profile's `chrome` folder, (use [GitHub Desktop](https://desktop.github.com/) if all of this sounds like gibberish to you) or download individual folders with [GitZip](https://addons.mozilla.org/en-US/firefox/addon/gitzip/) or [Refined GitHub](https://addons.mozilla.org/en-US/firefox/addon/refined-github-/).

For extra completeness, I also strongly recommend downloading [utils/chrome.manifest](/utils/chrome.manifest) to deal with some of the trickier icons. Replace the file from fx-autoconfig with mine. This will strictly redirect some `chrome://` URIs from the vanilla icons to icons from this theme, so the changes will apply globally, even in markup. This makes it *much* easier to change icons, and makes it possible to customize some icons that would be simply impossible to change otherwise. By default, fx-autoconfig expects scripts to be in folder called `JS`, whereas mine are in `script`. Replacing the manifest with mine changes this, so make sure your script folder is called `script`.

The `userContent.css` file handles stuff like the devtools, some UI pages and context menus, plaintext pages, browser background color while pages are loading, and the built-in HTML video player. It also includes some site-specific changes like my personal dark mode layout for Wikipedia, and colors for [Dark Reader's](https://addons.mozilla.org/en-US/firefox/addon/darkreader/) popup. The Firefox UI is increasingly integrated with content browsers. Sometimes you're looking at a content browser and you don't even realize it. For example, several modal dialogs that appear to be part of the parent process are actually content. So `userContent.css` isn't required for the rest of the theme to work, but without it you'll find some elements look inconsistent with the theme, and it also takes care of some issues that make the fabled global dark mode harder to realize.

`userChrome.css` doesn't require any fonts, but `userContent.css` uses [Overpass](https://fonts.google.com/specimen/Overpass) and [Overpass Mono](https://fonts.google.com/specimen/Overpass+Mono) for plaintext files and the picture-in-picture button. Since they're free and show up frequently, it makes sense to install them locally rather than use webfont. If you already have a `userContent` file, I'd suggest changing its name and adding `@import url(personal-userContent.css)` to the 2nd line of the theme's [userContent](/userContent.css) file.

If you want the functional features [shown in the video](https://youtu.be/BAuABH13ytM), you'll need to install some of the scripts. The stylesheets do not strictly require installing any scripts, but some scripts are designed to solve problems that CSS can't, so I recommend reading the full list of [script descriptions](#script-descriptions). Since the theme itself already requires fx-autoconfig, installing the scripts doesn't require any extra time or setup. Most scripts do not require installing the CSS theme either, but the few exceptions are noted in the descriptions and at the top of each script file. Instructions and explanations for the scripts are [below](#installation).

Most of the important colors can be changed in [uc-low-globals.css](resources/layout/uc-low-globals.css), [uc-globals.css](/uc-globals.css) and [uc-variables.css](/uc-variables.css). Changing the hues is easy, but at the moment I wouldn't recommend trying to convert it to a "light" color scheme. Also, instead of modifying uc-globals and uc-variables directly, it'll be easier to make your own stylesheet that overrides the variables. Then you can just add `@import url(uc-overrides.css);` to the end of [userChrome.css](/userChrome.css) and after the `@import` statements in [userContent.css](/userContent.css) and [userChrome.as.css](/userChrome.as.css).

<h2><b>Scripts:</b></h2>

The files in the script folder are not content scripts like you'd load in Tampermonkey. They're meant to execute in the same context as Firefox's internal scripts. They're scripts for the Firefox frontend itself rather than for webpages. This is sort of analogous to gaining "privileges" to modify your UI document directly. With CSS alone you can only do so much. Even a lot of features that appear to be purely visual may require JavaScript, like the search engine icons shown in the GIF above.

They need to be loaded by an autoconfig script loader. I recommend [**fx-autoconfig by MrOtherGuy**](https://github.com/MrOtherGuy/fx-autoconfig) which is extremely robust. Some of my scripts are not fully compatible with loaders other than MrOtherGuy's. In particular, most will be incompatible with xiaoxiaoflood's loader, and a few will be incompatible with Alice0775's loader.

<h3><b>Installation:</b></h3>

You first need to find your Firefox installation folder. On Windows that's `C:/Program Files/Firefox/`. On Linux it should be `usr/lib/firefox/`. On macOS this is more complicated. You need to open the application file itself, probably in `Macintosh HD/Applications/`. It's the file you double-click to open Firefox, but it's actually a package, not a binary. If you right click it, there will be an option in the context menu labeled "Show Package Contents." Clicking this takes you to the root directory. So whichever OS you're on, you should end up with...
1) &nbsp; a file called `config.js` in your Firefox installation's root directory;
2) &nbsp; a folder called `defaults` in the root directory;
3) &nbsp; a folder called `pref` inside that `defaults` folder;
4) &nbsp; a file called `config-prefs.js` inside that `pref` folder;
5) &nbsp; a `JS` folder in your profile's chrome folder;
6) &nbsp; a `utils` folder in your `chrome` folder, containing `chrome.manifest` and `boot.jsm`;

*If you're using my **theme**, (the CSS files) you should also have a `resources` folder in your `chrome` folder, containing all the icons, and you should rename the `JS` folder to `script`.

You may already have a file called `channel-prefs.js` inside the `pref` folder. This is unrelated, so leave it alone.

If you're using fx-autoconfig like I recommended, then your scripts should go in the `JS` folder by default. (or `script` folder if you're using my theme) You can actually rename the folder to anything you want, as long as you edit the 2nd line in [utils/chrome.manifest](/utils/chrome.manifest) to reflect the new folder name. Any agent sheets or author sheets (files ending in .as.css or .au.css) should go in the `chrome` folder with your regular stylesheets.

<h3><b>Usage:</b></h3>

After you've installed the files, the script loader will locate any scripts you place in the proper folder that end in .uc.js. Once you have all this set up you can download scripts, put them in the correct folder for your script loader, restart, and you should see the changes immediately. When updating scripts, be sure to clear your startup cache. With fx-autoconfig, you can click "Tools" in the menubar, then "userScripts," then "Restart now!" and it will clear the startup cache as it restarts. Without fx-autoconfig, there are still methods you can use from the browser console but they will cause Firefox to restart with the devtools still open, which is unstable. Instead, I'd recommend going to `about:profiles` and click the "Open Folder" button in your profile's local directory row. Then quit Firefox, and in the local directory delete the folder labeled `startupCache` before restarting the browser.

In the main directory on this repo you might notice two files: [userChrome.as.css](/userChrome.as.css) and [userChrome.au.css](/userChrome.au.css). The *"as"* is an abbreviation for user *agent sheet*, and *"au"* is an abbreviation for *author sheet*. They're used for rules that would not work if we put them in `userChrome.css`. But Firefox will not load these stylesheets on its own. These are loaded by the [Agent/Author Sheet Loader](#agentauthor-sheet-loader). The script does the same general thing as two of the files included with fx-autoconfig, but if you want the stylesheets to work in the devtools, (e.g. for context menus) you need the script from my repo. And since you don't want to load duplicate stylesheets, delete the scripts included in fx-autoconfig's JS folder.

These agent/author sheets handle some of the most common and problematic elements like tooltips, scrollbars, etc. The main purposes for using special stylesheets are 1) to use CSS syntax that is forbidden to user sheets, such as the `::part(...)` pseudo-element; 2) to style native-anonymous content like default tooltips or scrollbars; or 3) to override the vanilla style rules without needing to use the `!important` tag. In particular, we can use the author sheet to make (or revert) general rules without affecting more specific rules in the built-in stylesheets, or dealing with a bunch of style conflicts and cascading confusion.

Firefox is updated every night, so my theme and scripts are updated on a regular basis to ensure compatibility with the latest build from [mozilla-central](https://hg.mozilla.org/mozilla-central/), which is distributed through the [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) branch. If you update Firefox and a script stops working, or your UI suddenly looks ugly, check the repo before you file a bug report or complain that something's broken. Compare the `@version` number at the top of a given file to the version of your copy. If you're sure you have the latest version, then remove it for now and wait a day or two. I use this theme and almost all of the scripts myself, and I use Firefox Nightly on a daily basis, so it's not like I'm going to leave something in my setup broken for longer than a day or two.

If your problem is still not fixed after a couple days, or you think it might just be a detail I overlooked, (everyone has unique browsing habits, Firefox has a lot of interfaces that some users may never see, myself included) feel free to post in the [Issues](/../../issues/) or [Discussions](/../../discussions/) section. But please don't bother complaining if you're not using the Nightly branch. In order to make this work for the latest version of Firefox, I have no choice but to potentially make it incompatible with older versions of Firefox, stable or not. Just like Firefox updates can break our mods, updating our mods to keep up with Firefox can break them in older versions. I have no plans to make a second version for any Firefox version other than the latest Nightly release.

<h4><b>Styling Browser Toolbox Windows:</b></h4>

There's another script called [Browser Toolbox Stylesheet Loader](#browser-toolbox-stylesheet-loader) which is necessary if you want the theme to apply to elements in browser toolbox windows. My theme mainly uses this to make all context menus and scrollbars in the devtools consistent with the context menus and scrollbars in the main chrome window. It doesn't load a special stylesheet like the other module, it just loads userChrome and userContent.css into the devtools.

But by itself it doesn't do anything. It only works in conjunction with modifications I made to fx-autoconfig. I won't upload the modified script loader since it's not my original work, but you can either 1) follow the instructions below to modify it yourself; or 2) just copy all the contents of your chrome folder into `{your profile folder}/chrome_debugger_profile/chrome/`.

The problem with copying everything to `chrome_debugger_profile` is that you may need to reset the debugger profile from time to time. That's why I worked out a method for dynamically loading the main profile's scripts and stylesheets into toolbox processes without modifying the debugger profile.

<details><summary><i><b>Here's how if you want to do the same: (it's pretty fast)</b></i></summary>

1. Download and install [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) as normal.
2. Open `config.js` from your Firefox installation folder, in a text editor.
3. After line 8, (after it says `Components;`) add some new lines and paste this: 
```
function traverseToMainProfile(str) {
    let dir = Cc["@mozilla.org/file/directory_service;1"]
        .getService(Ci.nsIProperties)
        .get(str, Ci.nsIFile);
    if (!dir.exists()) {
        let toAddChrome = false;
        while (dir.target.includes("chrome_debugger_profile")) {
            dir = dir.parent;
            toAddChrome = true;
        }
        if (toAddChrome) dir.append("chrome");
    }
    return dir;
}
```
4. Then replace the entire next line of code (the one that starts with `let cmanifest`) with this:
```
let cmanifest = traverseToMainProfile('UChrm');
```
5. Now save `config.js` and exit.
6. Go back to your `chrome` folder, and open `boot.jsm` from the `utils` folder.
7. Go to the end of line 57 and hit enter twice to make two new lines, so you should now be at line 59.
8. Paste this:
```
function traverseToMainProfile(str){
  let dir = Services.dirsvc.get(str,Ci.nsIFile);
  if (!dir.exists()) {
    let toAddChrome = false;
    while (dir.target.includes('chrome_debugger_profile')) {
      dir = dir.parent;
      toAddChrome = true;
    }
    if (toAddChrome) dir.append('chrome');
  }
  return dir;
}
```
9. Go to what should now be line 79 (used to be line 66, this line starts with `BASE_FILEURI:`) and replace the entire line with this:
```
BASE_FILEURI: Services.io.getProtocolHandler('file').QueryInterface(Ci.nsIFileProtocolHandler).getURLSpecFromDir(traverseToMainProfile('UChrm')),
```
10. Go to what should now be line 83 (used to be line 70), this line starts with `get chromeDir()`) and replace the entire line with this:
```
get chromeDir() {return traverseToMainProfile('UChrm')},
```
11. Save `boot.jsm` and exit.
12. That's it! The scripts that are in your main profile folder should now run in browser toolbox windows, even though they're not in the `chrome_debugger_profile` folder. Make sure you download the [Browser Toolbox Stylesheet Loader](#browser-toolbox-stylesheet-loader) so stylesheets will be loaded too.
</details>
<br/>

<h3><b>Script descriptions:</b></h3>
(<i>Click a script's name to download it</i>)

####   [about:cfg](/script/aboutCfg.uc.js):
Registers the old-school about:config page to the URL `about:cfg`. Intended for use with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. That module restores the old pre-87 about:config page, but gives it a long-winded URL like `chrome://userchromejs/content/aboutconfig/config.xhtml` which takes a lot longer to type in and doesn't look very elegant. This script finds the URL for that module and registers it to an about: URL so it counts as a chrome UI page. We're not just faking it, this makes it a bona-fide about: page. That means you can navigate to it by just typing about:cfg in the urlbar, and also means the identity icon will show it as a secure system page rather than a local file. It even means about:cfg will show up on the about:about page! For instructions on installing earthlng's aboutconfig module for [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig), please see the next script description below.<p>There's a config setting in the script if you want to change the "cfg" in about:cfg to something else. This script has only been tested with fx-autoconfig, but it may work with xiaoxiaoflood's loader. I don't think it will work with Alice0775's loader but I haven't tested it. This is fully compatible with [App Menu about:config Button](#app-menu-aboutconfig-button). (the next script down) That button will automatically navigate to about:cfg if this script is installed. I recommend editing the `config.xhtml` file in earthlng's module to remove line 13: `title="about:config"`. This line sets the tab's title to about:config, which isn't necessary or desirable since we're fundamentally changing the URL to about:cfg. Without the title attribute, Firefox will automatically set the title to the tab's URL, which (with this script) is about:cfg. Another minor improvement is to add this to line 20, after the `<window>` element: `<html:link rel="icon" href="chrome://branding/content/about-logo.svg"/>`. This will add a Firefox logo favicon to the tab instead of the default globe favicon.</p>

####   [App Menu about:config Button](/script/appMenuAboutConfigButton.uc.js):
Adds an about:config shortcut button to the main app menu panel, under the built-in Settings button. It can open the built-in about:config page, or it can open the old-school about:config page with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. <details><summary><i><b>To use earthlng's about:config page with fx-autoconfig...</b></i></summary><p>download ONLY the profile/chrome/utils/aboutconfig folder and place it inside your profile/chrome/resources folder. Then open `config.xhtml` and find & replace "userchromejs" with "userchrome" and save. Now `chrome://userchrome/content/aboutconfig/config.xhtml` should be the correct URL, and the script will find it there. If it's not present there or at `chrome://userchromejs/content/aboutconfig/config.xhtml` (the default if you only use earthlng's module without fx-autoconfig) or `chrome://userchromejs/content/aboutconfig/aboutconfig.xhtml`, (the default for xiaoxiaoflood's version) then the script will use the vanilla "about:config" URL instead.</p><p>If you can't get the module to work or if you just prefer Firefox's built-in page, you can change the constant on line 12 of my script to "about:config" and it'll open to the same page you'd get if you typed about:config in the address bar. If you do use earthlng's module and the script just can't find the URL because you have an unorthodox setup or something, you can type the exact URL there to fix it. Make sure the URL is within the quotes. FYI I added an icon for this button (and for all the other main app menu buttons too) in [uc-app-menu.css](/uc-app-menu.css)</p></details>

####   [App Menu Mods](/script/appMenuMods.uc.js):
Makes some minor modifications to the app menu. (the popup opened by clicking the hamburger button on the far right of the navbar) Currently, it changes the "Add-ons and Themes" button to say "Extensions" (or whatever the equivalent is in your language, since the strings are localized automatically) and it adds a separator under the "Manage Account" button in the profile/account panel. I'll continue adding more mods to this script as I think of them.

####   [All Tabs Menu Expansion Pack](/script/allTabsMenuExpansionPack.uc.js):
<details><summary>This script adds several new features to the "all tabs menu" to help it catch up to the functionality of the regular tabs bar. <i><b>Click here for details.</b></i></summary>

1. Allows you to drag and drop tabs in the all tabs menu.
2. Adds an animated close button for every tab in this menu.
3. Allows you to multiselect tabs in the all tabs menu and close an unlimited number of tabs at once without closing/blurring the popup.
4. Significantly improves the mute/unmute button by making it work like the mute button in the tabs bar used to work.
    - If you only have one tab selected, it mutes/unmutes that tab.
    - If you have multiple tabs selected, it mutes/unmutes all of them.
    - This also adds a tooltip to the mute button.
5. By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute `pending="true"` which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me.
    - This script adds the same functionality to the all tabs menu, but does not add "pending" styling to regular tabs since it's outside the scope of this project. To do it yourself just add a rule like `.tabbrowser-tab .tab-content{opacity:.6;}`
    - If you use [Unread Tab Mods](/script/unreadTabMods.uc.js), this integrates with it to make unread tabs display with italic text.
6. Adds color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can differentiate them from normal tabs.
7. Includes a preference (`userChrome.tabs.all-tabs-menu.reverse-order`) that lets you reverse the order of the tabs so that newer tabs are displayed on top rather than on bottom.
8. Modifies the all tabs button's tooltip to display the number of tabs as well as the shortcut to open the all tabs menu, Ctrl+Shift+Tab.
9. And a few other subtle improvements.

All the relevant CSS for this script is already included in and loaded by the script. It's designed to look consistent with my theme as well as with the latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in here, or the end of uc-tabs-bar.css on my repo.
</details>

####   [Toolbox Button](/script/atoolboxButton.uc.js):
Adds a new toolbar button for devtools features. Probably the single most valuable file on this repo, in my opinion. 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. (mouse buttons can be configured by preference) By default, it also disables popup auto-hide when you open a toolbox window, and re-enables it when you close the toolbox. (there's a pref to disable this feature)<p>The icon changes to show whether popup auto-hide is enabled or disabled, and a badge on the button shows whether any toolbox windows are open. Middle-clicking to toggle popup auto-hide also shows a brief confirmation hint, to make it easier to keep track of the state of the preference. See the description at the top of the file for details about usage, configuration, and localization.</p><details><summary><i><b>Click here for a preview of the toolbox button's middle click function.</b></i></summary><a href="https://youtu.be/BAuABH13ytM"><img src="preview/prev-popup-autohide.webp"/></a></details>

####   [Backspace Panel Navigation](/script/backspacePanelNav.uc.js):
Press backspace to navigate back/forward in popup panels. (e.g. the main hamburger menu, the history toolbar button popup, the "all tabs" menu, etc.) If a subview is open, backspace will go back to the previous view. If the mainview is open, pressing backspace will close the popup the same way pressing escape would.

####   [Better "Save to Pocket"](/script/betterSaveToPocket.uc.js):
*Doesn't work since 91*: The Pocket page action was removed, so this script has nothing to improve. I can recreate the page action but since everything's in constant flux right now, I'm gonna hold off a while. The browser context menu has a button to save the current page to Pocket. By default, this opens a page action panel in the urlbar which tells you the page was saved and gives you an option to remove it or view the list of saved pages. This script overrides the saving function so that, rather than opening a panel, it immediately saves the link to Pocket and only creates a brief confirmation hint that fades after a few seconds. The confirmation hint is of the same type as the hint that pops up when you save a bookmark. It also turns the Pocket button red, the same as saving to Pocket does without the script.

####   [Bookmarks Popup Mods](/script/bookmarksPopupShadowRoot.uc.js):
Implement smooth scrolling for all bookmarks popups that are tall enough to scroll. Add unique classes to their shadow parts so they can be styled selectively in CSS. Add special click functions to their scroll buttons — hovering a scroll button will scroll at a constant rate, as normal. (though faster than vanilla) But clicking a scroll button will immediately jump to the top/bottom of the list. Combined with [uc-bookmarks.css](/uc-bookmarks.css), overhauls the appearance of the scroll buttons.

####   [Bookmarks Menu & Button Shortcuts](/script/bookmarksMenuAndButtonShortcuts.uc.js):
Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason.

####   [Clear Downloads Panel Button](/script/clearDownloadsButton.uc.js):
Place a "Clear Downloads" button in the downloads panel, right next to the "Show all downloads" button.

####   [Copy Current URL Hotkey](/script/copyCurrentUrlHotkey.uc.js):
Adds a new hotkey (Ctrl+Alt+C by default) that copies whatever is in the urlbar, even when it's not in focus. Key and modifiers are configurable in the script file.

####   [Custom Hint Provider](/script/customHintProvider.uc.js):
A utility script for other scripts to take advantage of. Sets up a global object (on the chrome window) for showing confirmation hints with custom messages. The built-in confirmation hint component can only show a few messages built into the browser's localization system. This script works just like the built-in confirmation hint, and uses the built-in confirmation hint element, but it accepts any arbitrary string as a parameter. So you can open a confirmation hint with *any* message, e.g. `CustomHint.show(anchorNode, "This is my custom message", {hideArrow: true, hideCheck: true, description: "Awesome.", duration: 3000})`</p><p>This script is entirely optional — some of my scripts take advantage of it, if it's present, but will not break if it's not present. My scripts that *require* it come with their own independent version of it built-in. It doesn't do anything on its own, it's sort of a micro-library. You may as well download it if you use any of my scripts, since it can't hurt anything and will provide useful feedback for some of my scripts. I'm uploading it as a separate component so other developers can use it, and to avoid adding too much redundant code in my other scripts.

####   [Debug Extension in Toolbar Context Menu](/script/debugExtensionInToolbarContextMenu.uc.js):
Adds a new context menu when right-clicking an add-on's toolbar button, any time the "Manage Extension" and "Remove Extension" items are available. The new "Debug Extension" menu contains 4 items: "Extension Manifest" will open the extension's manifest directly in a new tab. Aside from reading the manifest, from there you can also see the whole contents of the extension by removing "/manifest.json" from the URL. "Popup Document" will open the extension's popup URL (if it has one) in a regular browser window. The popup URL is whatever document it displays in its panel view. "Options Document" will open the document that the extension displays in its submenu on about:addons, also in a regular browser window. Finally, "Inspect Extension" will open a devtools tab targeting the extension background. This is the same page you'd get if you opened about:debugging and clicked the "Inspect" button next to an extension.</p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/prev-debug-ext.webp" width="386"/></details>

####   [Extension Options Panel](/script/extensionOptionsPanel.uc.js):
This script creates a toolbar button that opens a popup panel where extensions can be configured, disabled, uninstalled, etc. Each extension gets its own button in the panel. Clicking an extension's button leads to a subview where you can jump to the extension's options, disable or enable the extension, uninstall it, configure automatic updates, disable/enable it in private browsing, view its source code in whatever program is associated with .xpi files, open the extension's homepage, or copy the extension's ID. Based on a [similar script](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js) by xiaoxiaoflood, but will not be compatible with xiaoxiaoflood's loader. This one requires fx-autoconfig or Alice0775's loader. It opens a panel instead of a menupopup, for more consistency with other toolbar widgets. The script can be configured by editing the values in `static config` on line 11.</p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/prev-ext-opt-panel.webp"/></details>

####   [Eyedropper Button](/script/eyedropperButton.uc.js):
Adds a toolbar button that implements the color picker without launching the devtools or opening any popups. That is, you can click the button and then immediately click anywhere inside the content window to copy the color of that pixel to your clipboard. Similar to the menu item in the "More Tools" and "Tools > Browser Tools" menus, only this one can be placed directly on your toolbar. The color format is determined by `devtools.defaultColorUnit`. For example, changing this preference to "hsl" will give you results like `hsl(25, 75%, 50%)`. The script also adds a customizable hotkey that does the same thing — by default, it's Ctrl+Shift+Y (or Cmd+Shift+Y on macOS)

####   [Mini Findbar Matches Label](/script/findbarMatchesLabel.uc.js):
Makes the label for findbar matches way more concise, miniaturizes the "Match Case" and "Whole Words" buttons, and also adds a ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some CSS from [uc-findbar.css](/uc-findbar.css) or at least some tinkering with your own styles. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes ctrl+F more of a findbar toggle than a key that strictly opens the findbar.

####   [Floating Sidebar Resizer](/script/floatingSidebarResizer.uc.js):
[uc-sidebar.css](/uc-sidebar.css) makes the sidebar float over the content without flexing it, but that changes the way sidebar resizing works. This script is required to make the floating sidebar resizable. It also optionally improves the hotkeys a little bit so that ctrl+B (or cmd+B) toggles the sidebar on/off instead of exclusively opening the bookmarks sidebar. Instead the hotkey to jump to the bookmarks sidebar has been remapped to ctrl+shift+B. This key combination normally toggles the bookmarks toolbar on and off, but I figured it was worth replacing, since you probably either never use the bookmarks toolbar, or keep it open it all the time. Whereas the sidebar is something you're going to want to turn off when you're done using it, since it takes up a lot of space. My stylesheet makes the bookmarks toolbar hide automatically and only show when the nav-bar is being hovered, so a hotkey isn't really necessary. (bookmarks toolbar hiding is further enhanced with [Fullscreen Nav-bar](#fullscreen-nav-bar), FYI)

####   [Fluent Reveal Tabs](/script/fluentRevealTabs.uc.js):
Adds a pretty visual effect to tabs similar to the spotlight gradient effect on Windows 10's start menu tiles. When hovering a tab, a subtle radial gradient is applied under the mouse. Also applies to tabs in the "All tabs menu," and is fully compatible with my All Tabs Menu Expansion Pack. User configuration is towards the top of the script. Inspired by this [proof of concept](https://www.reddit.com/r/FirefoxCSS/comments/ng5lnt/proof_of_concept_legacy_edge_like_interaction/), and built on a modified version of [this library](https://github.com/d2phap/fluent-reveal-effect).

####   [Fluent Reveal Navbar Buttons](/script/fluentRevealNavbar.uc.js):
Adds the same Windows 10-style effect to navbar buttons. When hovering over or near a button, a subtle radial gradient is applied to every button in the vicinity the mouse. This is compatible with [Fluent Reveal Tabs](#fluent-reveal-tabs) so you can use both if you want. The navbar button version has more of a performance hit. I wouldn't recommend using it on weaker hardware if your setup is already pretty heavy with scripts, CSS animations/transitions, or other stateful modifications. </p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/fluent-reveal-navbar.webp"/></details>

####   [Full Screen Hotkey](/script/fullscreenHotkey.uc.js):
All this does is remap the fullscreen shortcut key from F11 to Ctrl+E, since I use F11 for other purposes.

####   [Fullscreen Nav-bar](/script/fullscreenNavBar.uc.js):
In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. Those are posted here in my stylesheets but you can also do your own thing with this script by using selectors like `box[popup-status="true"] > #navigator-toolbox > whatever`<p>Without this script, there also isn't any good way to pass information to findbars or sidebars about whether the nav-bar is hovered/focused or popups are open. For the floating findbar and sidebar to work seamlessly, they need to be aware of information like that so they can move up and down in fullscreen when the navbar is hidden/shown. But they're not in the same ancestral chain as the navbar or the popups' anchors, so that information needs to be added to some high-level element with a script, like the parent of `#navigator-toolbox`. So we can style anything the navbar or the browser container according to `[popup-status]` and `[urlbar-status]`. We also use this to automatically fade/reveal the bookmarks toolbar.</p>

####   [Hide Tracking Protection Icon on Custom New Tab Page](/script/hideTrackingProtectionIconOnCustomNewTabPage.uc.js):
Hide the url bar's tracking protection icon on the home page and new tab page, even if they are custom pages added by extensions. This and [Search Mode Indicator Icons](#search-mode-indicator-icons) are both strongly recommended if you use my CSS theme. <details><summary>***More details...***</summary><p>By default, Firefox hides the tracking protection while 1) the current tab is open to the default new tab page or default home page; or 2) the user is typing into the url bar. Hiding the icon while the user is typing is unnecessary, since although `pageproxystate` has changed, the content principal is still the same and clicking the tracking protection icon to open the popup still works. Opening the popup while `pageproxystate` is invalid still loads the tracking details and options for the current content URI. But hiding the icon on the new tab page or home page is necessary, because the tracking protection icon is hidden on `about:blank`.</p><p>If you use an extension to set a custom new tab page, you will see the tracking protection icon briefly disappear when opening a new tab, before reappearing as the custom new tab page loads. That is because `about:blank` loads before the custom new tab page loads. So the icon is hidden and unhidden in the span of a hundred milliseconds or so. This looks very ugly, so my stylesheet has always prevented the tracking protection icon from being hidden on any page, including `about:blank`. That way at least it doesn't disappear. But this isn't a great solution, because there are a number of pages for which the tracking protection icon does nothing. The protection handler can't handle internal pages, for example.</p><p>Previously I just disabled pointer events on the icon when it was supposed to be hidden. But I think this script is a better solution. If this script is not installed, my theme will default to those older methods I just mentioned. But if the script is installed, it will restore the built-in behavior of hiding the tracking protection icon on internal pages, only it will also hide the icon on the user's custom new tab page and home page. The icon will still be visible if you're on a valid webpage, (web or extension content, not local or system content) even if you begin typing in the urlbar.</p></details>

####   [Let Ctrl+W Close Pinned Tabs](/script/letCtrlWClosePinnedTabs.uc.js):
The name should say it all, this just removes the "feature" that prevents you from closing pinned tabs with the Ctrl+W/Cmd+W shortcut.

####   [Min Browser Nav-bar](/script/minBrowserNavbar.uc.js):
Made by request. This script isn't part of the main theme (I don't use it myself) but it is fully compatible with it. It makes the Firefox navbar UI more like [Min Browser](https://minbrowser.org/) by hiding the main toolbar until the selected tab is clicked. The idle state is such that only the tab bar is visible at the top. Clicking the selected tab will automatically open the urlbar and focus the input area, while hiding the tab bar. It's essentially like the tab bar gets replaced by the urlbar (and other toolbar buttons) when the currently-open tab is clicked. When the urlbar area is un-focused, whether by clicking outside of it or by executing a search or URL navigation, the urlbar is automatically hidden again and replaced by the tab bar. Opening a new (blank) tab will also select the urlbar. <details><summary><i><b>More details...</b></i></summary><p>Clicking and dragging tabs, and closing tabs with middle click, are still allowed. In order to preserve functionality, some new buttons have been added to the tab bar: back/forward/reload navigation buttons, and min/max/close buttons. Speaking of which, this handles all 3 size modes: normal, maximized, and fullscreen.</p><p>In order to fully emulate Min Browser, the script closes the urlbar results whenever a different tab is clicked. However, this behavior can be disabled by toggling `userChrome.minBrowser.resetOnBlur` in about:config. In order to make everything look right, the tab bar and nav bar are given the same height, which is defined by a variable. This variable can also be changed by editing `userChrome.minBrowser.toolbarHeight` in about:config.</p><p>I've set up the styling so that it should be as versatile as possible, working with the default layout, the proton layout, and probably most user layouts. Still, you may need to set the colors yourself. For instance, by default the backgrounds of the tab bar and the navbar are different colors. If you want them to be the same color, you'll need to handle that yourself — I wouldn't change something like that in this script, or I'd end up making it unusable for some people.</p><p>
And if you have a lot of your own customizations, you'll probably need to make some changes, either in your own userChrome.css or by editing the stylesheet embedded in this script (search "const css").</p></details>

####   [Multi-line Urlbar Results](/script/multiLineUrlbarResults.uc.js):
When a urlbar result's title overflows off the results panel, this moves its URL to a second line, underneath the title. Results that aren't overflowing are still single lines. This could be done without javascript, but I wanted the URL to be lined up with the title, not with the favicon. This requires some CSS from the end of [uc-urlbar-results.css](/uc-urlbar-results.css).

####   [Nav-bar Toolbar Button Slider](/script/navbarToolbarButtonSlider.uc.js):
My masterpiece, wrap all toolbar buttons after `#urlbar-container` in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. This is meant to replace the widget overflow button that appears to the right of your other toolbar buttons when you have too many to display all at once. Instead of clicking to open a dropdown that has the rest of your toolbar buttons, you can just place all of them in a little horizontal scrollbox. Better yet, you can scroll through them with mousewheel up/down, just like the tab bar. When the window gets *really* small, the slider disappears and the toolbar buttons are placed into the normal widget overflow panel. This script has 3 user preferences, so check the description in the script file for details. This and the toolbox button have been the most valuable for me personally.

####   [One-click One-off Search Buttons](/script/oneClickOneOffSearchButtons.uc.js):
Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until 2021 these functions could be overridden with a preference in about:config, but those settings were removed. This script restores the old functionality. <details><summary>***More details...***</summary><p>If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: `userChrome.urlbar.oneOffs.keyNavigation`. The script also hides the one-off search settings button, but this can be turned off in about:config with `userChrome.urlbar.oneOffs.hideSettingsButton`.</p><p>This script also has some conditional functions to work together with [Scrolling Search One-offs](#scrolling-search-one-offs). They don't require each other at all, but they heavily improve each other both functionally and visually. Changing search engines with the arrow keys will scroll the one-offs container to keep the selected one-off button in view. And exiting the query in any way will automatically scroll back to the beginning of the one-offs container, so that it's reset for the next time you use it. It's hard to explain exactly what's going on under the hood when you combine the two, so for now I'll just say to try them out yourself.</p></details>

####   [Open Link in Unloaded Tab (context menu item)](/script/openLinkInUnloadedTab.uc.js):
Add a new menu item to context menus prompted by right/accel-clicking on links or other link-like affordances. The menu item will open the link in a new background tab without loading the page. So the tab will start unloaded or "discarded." The context menu entry appears in the content area context menu when right-clicking a link; and in every menu where bookmarks, history, and synced tabs can be interacted with — sidebar, menubar, toolbar, toolbar button popup, and library window. Has one user configuration preference: `userChrome.openLinkInUnloadedTab.use_link_text_as_tab_title_when_unknown`.

####   [Private Tabs](/script/privateTabs.uc.js):
An fx-autoconfig port of [Private Tab](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js) by xiaoxiaoflood. Adds buttons and menu items allowing you to open a "private tab" in nearly any circumstance in which you'd be able to open a normal tab. Instead of opening a link in a private window, you can open it in a private tab instead. This will use a special container and prevent history storage, depending on user configuration. You can also toggle tabs back and forth between private and normal mode. This script adds two hotkeys: Ctrl+alt+P to open a new private tab, and ctrl+alt+T to toggle private mode for the active tab. These hotkeys can be configured along with several other options at the top of the script file.

####   [Private Window Homepage](/script/privateWindowHomepage.uc.js):
By default, private windows are opened to about:privatebrowsing, regardless of your homepage or new tab page preferences. This script simply removes part of a built-in function that manually sets the URL to about:privatebrowsing. So with this script installed, private windows will behave like ordinary windows in this (and only this) respect.

####   [Remove Search Engine Alias Formatting](/script/removeSearchEngineAliasFormatting.uc.js):
Depending on your settings you might have noticed that typing a search engine alias (e.g. "goo" for Google) causes some special formatting to be applied to the text you input in the url bar. This is a trainwreck because the formatting is applied using the selection controller, not via CSS, meaning you can't change it in your stylesheets. It's blue by default, and certainly doesn't match my personal theme very well. This script just prevents the formatting from ever happening at all.

####   [Restore pre-Proton Tab Sound Button](/script/restoreTabSoundButton.uc.js):
Proton removes the tab sound button and (imo) makes the tab sound tooltip look silly. This fully restores both, but requires some extra steps, and doesn't restore the tab sound button's CSS styles, since there's no reason to use a script to load ordinary CSS. If you want to use my sound icon styles, see [uc-tabs.css](/uc-tabs.css#L503). This script *requires* that you either 1) use my theme, complete with [chrome.manifest](/utils/chrome.manifest) and the [resources](/resources) folder, or 2) download [this file](/resources/script-override/tabMods.uc.js) and put it in `<your profile>/chrome/resources/script-override/`, then edit the [utils/chrome.manifest](/utils/chrome.manifest) file that comes with fx-autoconfig to add the following line (at the bottom):<p>`override chrome://browser/content/tabbrowser-tab.js ../resources/tabMods.uc.js`</p><p>For those who are curious, this will override the tab markup template and some methods relevant to the sound & overlay icons. We can't use a normal script to do this because, by the time a script can change anything, browser.xhtml has already loaded tabbrowser-tab.js, the tab custom element has already been defined, and tabs have already been created with the wrong markup. This wasn't required in the past because `.tab-icon-sound` wasn't fully removed, just hidden. But as of June 06, 2021, the sound button is entirely gone in vanilla Firefox 91. So [tabMods.uc.js](/resources/script-override/tabMods.uc.js) restores the markup and class methods; [restoreTabSoundButton.uc.js](/script/restoreTabSoundButton.uc.js) restores the tooltip; and [uc-tabs.css](/uc-tabs.css#L503) rebuilds the visual appearance.</p><details><summary>If you don't use my theme, restoring the sound button will also require some CSS. <i><b>Click to expand...</b></i></summary>
```
.tab-icon-sound {
    margin-inline-start: -16px;
    width: 16px;
    height: 16px;
    padding: 0;
    -moz-context-properties: fill;
    fill: currentColor;
    border-radius: 50%;
    list-style-image: none;
    background-repeat: no-repeat;
}
.tab-icon-sound[soundplaying],
.tab-icon-sound[pictureinpicture][soundplaying]:hover {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="context-fill" viewBox="0 0 16 16"><path d="M8.587 2.354L5.5 5H4.191A2.191 2.191 0 002 7.191v1.618A2.191 2.191 0 004.191 11H5.5l3.17 2.717a.2.2 0 00.33-.152V2.544a.25.25 0 00-.413-.19zM11.575 3.275a.5.5 0 00-.316.949 3.97 3.97 0 010 7.551.5.5 0 00.316.949 4.971 4.971 0 000-9.449z"/><path d="M13 8a3 3 0 00-2.056-2.787.5.5 0 10-.343.939A2.008 2.008 0 0112 8a2.008 2.008 0 01-1.4 1.848.5.5 0 00.343.939A3 3 0 0013 8z"/></svg>');
    background-size: 12px;
    background-position: 1.2px center;
    margin-inline-start: 1px;
}
.tab-icon-sound[muted],
.tab-icon-sound[pictureinpicture][muted]:hover {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="context-fill" viewBox="0 0 16 16"><path d="M13 8a2.813 2.813 0 00-.465-1.535l-.744.744A1.785 1.785 0 0112 8a2.008 2.008 0 01-1.4 1.848.5.5 0 00.343.939A3 3 0 0013 8z"/><path d="M13.273 5.727A3.934 3.934 0 0114 8a3.984 3.984 0 01-2.742 3.775.5.5 0 00.316.949A4.985 4.985 0 0015 8a4.93 4.93 0 00-1.012-2.988zM8.67 13.717a.2.2 0 00.33-.152V10l-2.154 2.154zM14.707 1.293a1 1 0 00-1.414 0L9 5.586V2.544a.25.25 0 00-.413-.19L5.5 5H4.191A2.191 2.191 0 002 7.191v1.618a2.186 2.186 0 001.659 2.118l-2.366 2.366a1 1 0 101.414 1.414l12-12a1 1 0 000-1.414z"/></svg>');
    background-size: 12px;
    background-position: 1.2px center;
    margin-inline-start: 1px;
}
.tab-icon-sound[activemedia-blocked] {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12"><path fill="context-fill" d="M2.128.13A.968.968 0 00.676.964v10.068a.968.968 0 001.452.838l8.712-5.034a.968.968 0 000-1.676L2.128.13z"/></svg>');
    background-size: 8px;
    background-position: 4.5px center;
    margin-inline-start: 1px;
}
.tab-icon-sound[pictureinpicture] {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 625.8 512"><path fill="context-fill" fill-opacity="context-fill-opacity" d="M568.9 0h-512C25.6 0 0 25 0 56.3v398.8C0 486.4 25.6 512 56.9 512h512c31.3 0 56.9-25.6 56.9-56.9V56.3C625.8 25 600.2 0 568.9 0zm-512 425.7V86c0-16.5 13.5-30 30-30h452c16.5 0 30 13.5 30 30v339.6c0 16.5-13.5 30-30 30h-452c-16.5.1-30-13.4-30-29.9zM482 227.6H314.4c-16.5 0-30 13.5-30 30v110.7c0 16.5 13.5 30 30 30H482c16.5 0 30-13.5 30-30V257.6c0-16.5-13.5-30-30-30z"/></svg>');
    background-size: 12px;
    background-position: center;
    border-radius: revert;
    margin-inline-start: 1px;
}
.tab-icon-sound[pictureinpicture]:-moz-locale-dir(rtl) {
    transform: scaleX(-1);
}
.tab-icon-sound[soundplaying]:not(:hover),
.tab-icon-sound[muted]:not(:hover),
.tab-icon-sound[activemedia-blocked]:not(:hover) {
    opacity: 0.8;
}
.tab-icon-sound[soundplaying-scheduledremoval]:not([muted], :hover),
.tab-icon-overlay[soundplaying-scheduledremoval]:not([muted], :hover) {
    transition: opacity 0.3s linear var(--soundplaying-removal-delay);
    opacity: 0;
}
.tab-icon-sound-label,
.tab-secondary-label {
    display: none !important;
}
.tab-icon-sound {
    display: -moz-box !important;
}
.tab-icon-sound:not([soundplaying], [muted], [activemedia-blocked], [pictureinpicture]),
.tab-icon-sound[pinned] {
    display: none;
}
.tab-icon-overlay {
    display: none !important;
}
.tab-close-button {
    padding: 2px !important;
    width: 16px !important;
    height: 16px !important;
}
.tabbrowser-tab:hover .tab-icon-stack > :not(.tab-close-button),
.tabbrowser-tab:not(:hover) .tab-close-button {
    visibility: collapse;
}
.tabbrowser-tab {
    --tab-label-mask-size: 2em !important;
}
```
</details>

####   [Restore pre-Proton Downloads Button](/script/restorePreProtonDownloadsButton.uc.js):
Restores the pre-proton downloads button icons and animations. I kept the new progress animation, but I made it thicker. If you use my theme or my icons you'll definitely want this for the sake of consistency. If you don't use my theme or icons but you still want the old downloads button back, download the [*standalone*](/script/restorePreProtonDownloadsButton-standalone.uc.js) version instead. The standalone version has the stylesheet and icons built-in, so doesn't require anything else except a script loader. This version requires [userChrome.au.css](/userChrome.au.css) and the [resources/downloads](/resources/downloads) folder.

####   [Restore pre-Proton Library Button](/script/restorePreProtonLibraryButton.uc.js):
The library toolbar button used to have an animation that played when a bookmark was added. It's another casualty of the proton updates. This script restores the library button animation in its entirety, with one minor improvement. The library animation always looked just a tiny bit off for certain window scaling factors — the animation would appear about half a pixel from where the static icon is, causing it to appear to move when the animation finishes. The script can fix this, so see the description at the top of the file for details on enabling the scaling fix. This version of the script requires fx-autoconfig, [userChrome.au.css](/userChrome.au.css) and the [resources/skin](/resources/skin) folder. If you don't want to download those files, grab the [*standalone*](/script/restorePreProtonLibraryButton-standalone.uc.js) version instead.

####   [Restore pre-Proton Star Button](/script/restorePreProtonStarButton.uc.js):
The bookmark page action button used to have a pretty cool starburst animation. That's been removed but it's not too difficult to restore. The main version of this script requires fx-autoconfig, [userChrome.au.css](/userChrome.au.css), and the [resources](/resources) folder from my repo. If you don't want to use all that stuff, grab the [*standalone*](/script/restorePreProtonStarButton-standalone.uc.js) version instead. If you use the standalone version, you won't need any additional CSS or icon downloads, and you can use other script loaders instead of fx-autoconfig. FYI not to state the obvious but this script will have no effect if your browser/OS has `prefers-reduced-motion` enabled.

####   [Screenshot Page Action Button](/script/screenshotPageActionButton.uc.js):
Creates a screenshot button in the page actions area (the right side of the urlbar) that works just like the screenshot toolbar button.

####   [Scrolling Search One-offs](/script/scrollingOneOffs.uc.js):
This script allows the search one-offs box to be scrolled with mousewheel up/down OR left/right. This is for use with my theme, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. It won't do much without the CSS from [uc-search-one-offs.css](/uc-search-one-offs.css) to set up the layout of the one offs element.

####   [Search Mode Indicator Icons](/script/searchModeIndicatorIcons.uc.js):
Another epic script, this allows you to add an icon to the search engine indicator that appears on the left side of the url bar when you're using a one-off search engine. If you invoke the Amazon search engine, for example, the identity icon (normally a lock icon) will gain an attribute called engine with a value of "Amazon" which you can select in CSS to change it to an Amazon icon. I've already added a bunch in [uc-search-mode-icons.css](/uc-search-mode-icons.css). It's mostly an aesthetic feature for me, but if you added icons for all your search engines, you could hide the text indicator altogether. The icon could then basically replace the search engine's text label.

####   [Search Selection Keyboard Shortcut](/script/searchSelectionShortcut.uc.js):
Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, (meaning text that is a URL, not a hyperlink) instead of searching for the selection it will navigate directly to the URL. The latter feature is mainly useful for when someone pastes a URL on some website that doesn't automatically generate hyperlinks when URLs are input in text forms.

####   [Show Selected Sidebar in Switcher Panel](/script/showSelectedSidebarInSwitcherPanel.uc.js):
For some reason, proton removes the checkmark shown on the selected sidebar in the sidebar switcher panel. (The one that pops up when you click the button at the top of the sidebar) This script simply restores the previous behavior of adding the [checked] attribute. On its own it won't do anything, since the CSS for adding checkmarks to the menu items has also been removed. You'll need [uc-sidebar.css](/uc-sidebar.css) and the radio icon from the [resources](/resources) folder for the actual styling, or you can just read it starting around [line 120](/uc-sidebar.css#L120) if you want to make your own styles.

####   [Toggle Menubar Hotkey](/script/toggleMenubarHotkey.uc.js):
Adds a hotkey (alt+M by default) that toggles the menubar on and off. Unlike just pressing the alt key, this keeps it open permanently until closed again by the hotkey, toolbar context menu, or customize menu. Requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) — other script loaders will not work with this script.

####   [Toggle Tabs and Sidebar](/script/toggleTabsAndSidebarButton.uc.js):
Made by request. Adds a new toolbar button that can toggle between hiding tabs and hiding the sidebar. Intended for use with TreeStyleTabs, but will still work the same without it. It toggles the sidebar on its own, but it hides tabs by setting an attribute on the document element, which you need to reference in your userChrome.css file, like this: `:root[toggle-hidden="tabs"] #TabsToolbar {...}`. There are various templates available online for hiding the tab bar, or you can ask on [/r/FirefoxCSS](https://www.reddit.com/r/FirefoxCSS/). Just use one of those, adding `:root[toggle-hidden="tabs"]` to the selectors.

####   [Undo Recently Closed Tabs in Tab Context Menu](/script/undoListInTabContextMenu.uc.js):
Adds new menus to the context menu that appears when you right-click a tab (in the tab bar or in the TreeStyleTabs sidebar): one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them. An updated script that does basically the same thing as [UndoListInTabmenuToo](https://github.com/alice0775/userChrome.js//72/UndoListInTabmenuToo.uc.js) by Alice0775, but for current versions of Firefox and with TST support. The original broke around version 86 or 87 I think.

####   [Unread Tab Mods](/script/unreadTabMods.uc.js):
Modifies some tab functions so that unread tabs can be styled differently from other tabs, and (optionally) adds new items to the tab context menu so you can manually mark tabs as read or unread. When opening a new tab without selecting it, the tab will gain an attribute `notselectedsinceload`. It will lose this attribute when the tab becomes selected or becomes discarded/unloaded. The CSS for styling unread tabs is already included in duskFox. (the CSS theme on this repo) If you don't use my theme, you can style unread tabs yourself with CSS like `.tabbrowser-tab[notselectedsinceload]:not([pending]:not([busy])) { font-style: italic !important; }`

####   [Update Notification Slayer](/script/updateNotificationSlayer.uc.js):
Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification). See the file description for more info.

####   [Concise Update Banner Labels](/script/updateBannerLabels.uc.js):
Simply changes the update banners in the hamburger button app menu to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download Nightly update" (or whatever your version is) for example.

####   [Urlbar can Autofill Full Subdirectories](/script/urlbarAutofillSubdir.uc.js):
Allows the urlbar to autofill full subdirectories instead of just host names. For example, if you type "red" Firefox will normally just autofill "reddit.com" for the first result. With this script, if you visit reddit.com/r/FirefoxCSS more frequently than reddit.com, it will autofill the full URL to the subreddit, so you can navigate to it with just an Enter keypress. However, if you visit the root directory more often than any individual subdirectory, it will choose the root directory. For example, most people probably visit youtube.com way more often than any particular video page. So it will never suggest youtube.com/watch?v=whatever, since youtube.com will always have a higher visit count.

####   [Urlbar Mods](/script/urlbarMods.uc.js):
Makes some minor modifications to the urlbar. Currently this only restores the context menu that used to appear when right-clicking a search engine one-off button in the urlbar results panel. The context menu was disabled recently. It's actually disabled by default, so this script will do nothing unless you change the "false" on line 12 to "true" before running the script. I'll continue to add to this script as I think of more urlbar mods that are too small to deserve their own dedicated script.

####   [Add [open] Status to Urlbar Notification Icons](/script/urlbarNotificationIconsOpenStatus.uc.js):
All this does is set an attribute on the buttons in `#notification-popup-box` based on whether their popups are open or closed. That way we can set their fill-opacity to 1 when they're open, like we do already with the other icons in `#identity-box`. There aren't any ways to do this with pure CSS as far as I can tell, so it's necessary to make our own event listeners. (or we could override the class methods in PopupNotifications.jsm, but that would require more frequent updates) Very minor improvement, but also very cheap and easy, so I figured might as well make the icon opacity consistent. *Doesn't have any visual effect without [uc-urlbar.css](uc-urlbar.css)* or your own styles like `#notification-popup-box>[open="true"]{fill-opacity:1;}`

####   [Scroll Urlbar with Mousewheel](/script/urlbarMouseWheelScroll.uc.js):
Implements vertical scrolling and smooth scrolling inside the urlbar's input field. That might sound weird, but the urlbar doesn't naturally have any special scrolling logic, so when it's overflowing due to a long URL, scrolling it with a mouse wheel can be a real bitch, and scrolling it horizontally with a trackpad would feel really janky. This makes all scrolling in the urlbar smooth, and lets you scroll it horizontally with mousewheel up/down, since it can't be scrolled vertically anyway.

####   [Scroll Urlbar Results with Mousewheel](/script/urlbarViewScrollSelect.uc.js):
This script lets you cycle through urlbar results with mousewheel up/down, and invoke the current selected result by right-clicking anywhere in the urlbar results area. Nothing too special, just makes one-handed operation with a trackpad a little easier. Scroll events are rate-throttled proportionally to their magnitude, so it should be comfortable to scroll with any kind of input device, even including a trackpad or ball.

####   [Agent/Author Sheet Loader](/script/userChrome_as_css_module.uc.js):
Required for loading userChrome.au.css and userChrome.as.css. It will actually load any file in the chrome folder that ends in `au.css`, `au.css`, or `us.css`. Files ending in `au.css` will be loaded as author sheets, `as.css` as agent sheets, and `us.css` as user sheets. User sheets are roughly equivalent to userChrome.css, so probably aren't necessary for anything, but the functionality is there in the unlikely event you ever need it. Make sure you remove the files that come with fx-autoconfig in the JS folder, they are redundant with this.

####   [Browser Toolbox Stylesheet Loader](/script/userChrome_devtools_module.uc.js):
Required for loading stylesheets into browser toolbox windows. [See here](#styling-browser-toolbox-windows) for more info.
