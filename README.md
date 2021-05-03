# **uc.css.js**

My personal Firefox theme/layout, plus some privileged scripts to add new behaviors and functions.

<a href="https://youtu.be/BAuABH13ytM">
<i>Click any of the gifs for a more thorough video preview of the theme and some of the major scripts.</i>
<br/>
<p></p>
<img src="preview/prev-navbar.gif"/>
<br/>
<p></p>
<img src="preview/prev-search.gif"/>
</a>
<br/>
<p></p>

For best results, set density mode to `Normal` and theme to `Dark` in the customization menu. (right click on the navbar and click "Customize Toolbar...") I recommend using this on Firefox Nightly, updating at least weekly, and setting the following prefs in about:config:<details><summary>*Click for a full list.*</summary>
| Pref&nbsp;name 	| Type 	| Value 	| Notes&nbsp;(optional&nbsp;unless&nbsp;otherwise&nbsp;noted) 	|
|-	|-	|-	|-	|
| browser.anchor_color 	| String 	| `#5311ff` 	|  	|
| browser.display.focus_ring_style 	| Number 	| 0 	|  	|
| browser.display.focus_ring_width 	| Number 	| 0 	|  	|
| browser.proton.contextmenus.enabled 	| Boolean 	| true 	| The stylesheets have fallback options if these prefs are disabled. But the fallback styles are not regularly updated. So I strongly recommend enabling all of the proton prefs 	|
| browser.proton.doorhangers.enabled 	| Boolean 	| true 	|  	|
| browser.proton.enabled 	| Boolean 	| true 	|  	|
| browser.proton.modals.enabled 	| Boolean 	| true 	|  	|
| browser.proton.places-tooltip.enabled 	| Boolean 	| true 	|  	|
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
| gfx.font_rendering.cleartype_params.cleartype_level 	| Number 	| 100 	| These settings are a major improvement to text rendering on Windows. Idk about mac/linux 	|
| gfx.font_rendering.cleartype_params.force_gdi_classic_for_families 	| String 	| `<empty>` 	| Leave the value completely empty 	|
| gfx.font_rendering.cleartype_params.force_gdi_classic_max_size 	| Number 	| 6 	|  	|
| gfx.font_rendering.cleartype_params.pixel_structure 	| Number 	| 1 	|  	|
| gfx.font_rendering.cleartype_params.rendering_mode 	| Number 	| 5 	|  	|
| gfx.font_rendering.directwrite.use_gdi_table_loading 	| Boolean 	| false 	|  	|
| gfx.webrender.svg-images 	| Boolean 	| true 	|  	|
| layout.css.backdrop-filter.enabled 	| Boolean 	| true 	| Required for the acrylic/glass gaussian blur effect 	|
| layout.css.moz-document.content.enabled 	| Boolean 	| true 	| Required 	|
| reader.color_scheme 	| String 	| `dark` 	|  	|
| svg.context-properties.content.enabled 	| Boolean 	| true 	| Required for making some icons white 	|
| toolkit.legacyUserProfileCustomizations.stylesheets 	| Boolean 	| true 	| Required, of course 	|
| ui.IMERawInputBackground 	| String 	| `#000000` 	| This affects the appearance of IME overlays. e.g. when typing Hangul or Pinyin 	|
| ui.IMESelectedRawTextBackground 	| String 	| `#7755FF` 	|  	|
| ui.SpellCheckerUnderline 	| String 	| `#E2467A` 	|  	|
| ui.prefersReducedMotion 	| Number 	| 0 	|  	|
| ui.submenuDelay 	| Number 	| 100 	| These aren't required, but feel more responsive imo 	|
| ui.tooltipDelay 	| Number 	| 100 	|  	|
| ui.systemUsesDarkTheme 	| Number 	| 1 	| Currently required; working on a light mode 	|
| ui.textHighlightBackground 	| String 	| `#7755FF` 	| These prefs control the appearance of text highlighted by the findbar. I choose white text on purple/pink background 	|
| ui.textHighlightForeground 	| String 	| `#FFFFFF` 	|  	|
| ui.textSelectBackground 	| String 	| `#FFFFFF` 	|  	|
| ui.textSelectBackgroundAttention 	| String 	| `#FF3388` 	|  	|
| ui.textSelectBackgroundDisabled 	| String 	| `#000000` 	|  	|
| ui.textSelectForegroundAttention 	| String 	| `#000000` 	|  	|
| ui.textSelectForegroundCustom 	| String 	| `#7755FF` 	|  	|
| userChrome... 	|  	|  	| Several of my scripts use custom prefs beginning with `userChrome` for user customization. See the individual script files for details 	|
| userChrome.tabs.pinned-tabs.close-buttons.disabled 	| Boolean 	| true 	| This controls whether close buttons are shown on pinned tabs 	|
| userChrome.tabs.rounded-outer-corners.disabled 	| Boolean 	| false 	| This controls whether tabs have rounded bottom corners<br/><a href="https://youtu.be/BAuABH13ytM"><img src="preview/prev-tabcorners.png" width="100%"/></a> 	|
| userChrome.urlbar-results.disable_animation 	| Boolean 	| false 	| Toggle to `true` if you don't want urlbar animations 	|
| widget.chrome.allow-gtk-dark-theme 	| Boolean 	| true 	| I'm not sure if these still do anything. But might as well enable them 	|
| widget.content.allow-gtk-dark-theme 	| Boolean 	| true 	|  	|
| widget.disable-native-theme-for-content 	| Boolean 	| true 	| Enables Firefox's custom appearance for elements like checkboxes. Skips the "native" appearance given by the OS stylesheets. 	|
</details>

The `userContent.css` file handles stuff like the devtools, some UI pages and context menus, plaintext pages, browser background color while pages are loading, and the built-in HTML video player. It also includes some site-specific changes like my personal dark mode layout for Wikipedia. It isn't required for the rest of the theme to work, but takes care of some issues endemic to Firefox that might cause dark mode users a lot of grief otherwise.

This theme requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) or some other javascript loader to register the icon package. Download the [resources](/resources) folder and place it in your `chrome` folder — fx-autoconfig will automatically register it. For extra completeness, you can download [utils/chrome.manifest](/utils/chrome.manifest) to deal with some of the trickier icons. Replace the one from fx-autoconfig with mine, then make sure to rename your `JS` folder to `script`, or change the line in the manifest file. This will strictly redirect some `chrome://` URIs from the vanilla icons to icons from this theme, so the changes will apply globally, even in markup.

`userChrome.css` doesn't require any fonts, but `userContent.css` uses [Overpass](https://fonts.google.com/specimen/Overpass), [Overpass Mono](https://fonts.google.com/specimen/Overpass+Mono) and [Cutive Mono](https://fonts.google.com/specimen/Cutive+Mono) for plaintext files and the picture-in-picture button. Since they're free and show up frequently, it makes sense to install them locally rather than use webfont.

To get the complete functionality [shown in the video](https://youtu.be/BAuABH13ytM), you'll need to install at least some of the scripts. The stylesheets work fine without the scripts, but functionally it'll be just like vanilla Firefox. Instructions and explanations for the scripts are below.

Most of the important colors can be changed in uc-globals.css and uc-variables.css, but I'm still in the process of making everything easily configurable and adding a light mode. It's just a theme I built for personal use over the course of a couple years, so there isn't much top-down organization at the moment.

<h2><b>Scripts:</b></h2>

The files in the scripts folder are not content scripts like you'd load in Tampermonkey. They're meant to execute in the same context as Firefox's internal scripts. They're scripts for the Firefox frontend itself rather than for webpages. This is sort of analogous to gaining "privileges" to modify your UI document directly. With CSS alone you can only do so much. Even a lot of purely aesthetic features may require JavaScript, like the search engine icons shown in the GIF above.

They need to be loaded by an autoconfig script loader. I recommend [**fx-autoconfig by MrOtherGuy**](https://github.com/MrOtherGuy/fx-autoconfig) which is extremely robust. Some of my scripts are not fully compatible with loaders other than MrOtherGuy's because they don't support loading scripts into the global execution context before windows have been initialized. (The theme itself needs a javascript loader, and is designed for this particular one, but if you know how to register a manifest file then you can use any loader)

<h3><b>Installation:</b></h3>

You first need to find your Firefox installation folder. On Windows that's `C:/Program Files/Firefox/`. On Linux it should be `usr/lib/firefox/`. On macOS this is more complicated. You need to open the application file itself, probably in `Macintosh HD/Applications/`. It's the file you double-click to open Firefox, but it's actually a package, not a binary. If you right click it, there will be an option in the context menu labeled "Show Package Contents." Clicking this takes you to the root directory. So whichever OS you're on, you should end up with...
1) &nbsp; a file called `config.js` in your Firefox installation's root directory;
2) &nbsp; a folder called `defaults` in the root directory;
3) &nbsp; a folder called `pref` inside that `defaults` folder;
4) &nbsp; a file called `config-prefs.js` inside that `pref` folder;
5) &nbsp; a `JS` folder (or `script` if you're using my chrome.manifest file) in your profile's `chrome` folder;
6) &nbsp; a `resources` folder in your `chrome` folder, containing all the icons (assuming you're using the theme or the toolbox button script);
6) &nbsp; a `utils` folder in your `chrome` folder, containing `chrome.manifest` and `boot.jsm`

You may already have a file called `channel-prefs.js` inside the `prefs` folder. This is unrelated.

If you're using fx-autoconfig like I recommended, then your scripts should go in the `JS` folder by default. You should rename it `script` if you're planning to use my `chrome.manifest` file. This has no effect on any of the scripts, it's only done so we can override certain icon files. Any agent sheets or author sheets (files ending in .as.css or .au.css) should go in the `chrome` folder with your regular stylesheets.

<h3><b>Usage:</b></h3>

After you've installed the files, the script loader will locate any scripts you place in the proper folder that end in .uc.js, such as the ones in my repo. Once you have all this set up you can download my scripts, put them in the correct folder for your loader, restart, and you should see the changes immediately.

In the main directory on this repo you might notice two files: `userChrome.as.css` and `userChrome.au.css`. The "as" is an abbreviation for user agent sheet, and "au" is an abbreviation for author sheet. They're used for rules that will not work in `userChrome.css`. But Firefox will not load them on its own. These are loaded by the script `userChrome_as_css_module.uc.js`. The script has the same name as one of the files included with fx-autoconfig, but it is quite different, so you need the script from my repo.

These stylesheets style some of the most common and problematic elements like tooltips, scrollbars, etc. The main purposes for using special stylesheets are 1) to use CSS syntax that is forbidden to user sheets, such as the `::part(...)` pseudo-element; 2) to style native-anonymous content like default tooltips or scrollbars; or 3) to override the vanilla style rules without needing to use the `!important` tag. In particular, we can use the author sheet to make (or revert) general rules without affecting more specific rules in the built-in stylesheets, or dealing with a bunch of style conflicts and cascading confusion.

<h4><b>Styling Browser Toolbox Windows:</b></h4>

There's another script labeled `userChrome_devtools_module.uc.js` which is necessary if you want the theme to apply to elements in browser toolbox windows. My theme mainly uses this to make all context menus and scrollbars in the devtools consistent with the context menus and scrollbars in the main chrome window. It doesn't load a special stylesheet like the other module, it just loads userChrome and userContent.css into the devtools.

But by itself it doesn't do anything. It only works in conjunction with modifications I made to fx-autoconfig. I won't upload the modified script loader since it's not my original work, but you can either 1) follow the instructions below to modify it yourself; or 2) just copy all the contents of your chrome folder into `{your profile folder}/chrome_debugger_profile/chrome/`.

The problem with copying everything to `chrome_debugger_profile` is that you may need to reset the debugger profile from time to time. That's why I worked out a method for dynamically loading the main profile's scripts and stylesheets into toolbox processes without modifying the debugger profile.

<details><summary><i>Here's how if you want to do the same: (it's pretty fast)</i></summary>

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
12. That's it! The scripts that are in your main profile folder should now run in browser toolbox windows, even though they're not in the `chrome_debugger_profile` folder. Make sure you download `userChrome_devtools_module.uc.js` so stylesheets will be loaded too.
</details>
<br/>

<h3><b>Script descriptions:</b></h3>

-   `allTabsMenuExpansionPack`: This script adds several new features to the "all tabs menu" to help it catch up to the functionality of the regular tabs bar. First, it adds an animated close button for every tab in this menu. Second, it significantly improves the mute/unmute button by making it work like the mute button in the tabs bar used to work. If you only have one tab selected, it mutes/unmutes that tab. If you have multiple tabs selected, it mutes/unmutes all of them. This also adds a tooltip to the mute button.<p>By default, Firefox doesn't do anything to differentiate loaded tabs from unloaded tabs. But for the regular tab bar, unloaded tabs gain an attribute pending="true" which you can use to dim them. This way you know which tabs are already initialized and which will actually start up when you click them. Pretty useful if you frequently have 100+ tabs like me. This script adds the same functionality to the all tabs menu. It also adds special color stripes to multiselected tabs and container tabs in the "all tabs menu" so you can differentiate them from normal tabs. All the CSS required for this is included in and loaded by the script itself.</p>

-   `appMenuAboutConfigButton`: Adds an about:config shortcut button to the main app menu panel, under the built-in Settings button. It can open the built-in about:config page, or it can open the old-school about:config page with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. <details><summary><i>To use earthlng's about:config page with fx-autoconfig...</i></summary>download ONLY the profile/chrome/utils/aboutconfig folder and place it inside your profile/chrome/resources folder. Then open config.xhtml and find & replace "userchromejs" with "userchrome" and save. Now "chrome://userchrome/content/aboutconfig/config.xhtml" should be the correct URL. By default the script will open to that link, so if you don't have that module installed the button will open to a blank page. If you can't get the module to work or if you just prefer Firefox's built-in page, you can change the constant on line 10 of my script to "about:config" and it'll open to the same page you'd get if you typed about:config in the address bar. (the URL must be in quotes) That said, typing about:config is already easy enough. The reason I made this script was to make a clean shortcut to reach the old-school page, and in a more central location than a bookmark. FYI I added an icon for this button (and for all the other main app menu buttons too) in uc-app-menu.css</details>

-   `atoolboxButton`: Adds a new toolbar button for devtools features. Probably the single most valuable file on this repo, in my opinion. 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. By default, it also disables popup auto-hide when you open a toolbox window, and re-enables it when you close the toolbox. (there's a pref to disable this feature)<p>The icon changes to show whether popup auto-hide is enabled or disabled, and a badge on the button shows whether any toolbox windows are open. Middle-clicking to toggle popup auto-hide also shows a brief confirmation hint, to make it easier to keep track of the state of the preference. See the description at the top of the file for details about usage, configuration, and localization.</p><p>Requires icons from the [resources](/resources) folder: [toolbox.svg](/resources/toolbox.svg) and [command-noautohide.svg](/resources/command-noautohide.svg). Embedding the SVG code directly in the script would cause a delay in the animation, so the script uses the manifest from fx-autoconfig to assign the `resources` folder a chrome protocol URI, `chrome://userchrome/content/`<details><summary><i>Click here for a preview of the toolbox button's middle click function.</i></summary><a href="https://youtu.be/BAuABH13ytM"><img src="preview/prev-popup-autohide.gif"/></a></details>

-   `betterSaveToPocket`: The browser context menu has a button to save the current page to Pocket. By default, this opens a page action panel in the urlbar which tells you the page was saved and gives you an option to remove it or view the list of saved pages. This script overrides the saving function so that, rather than opening a panel, it immediately saves the link to Pocket and only creates a brief confirmation hint that fades after a few seconds. The confirmation hint is of the same type as the hint that pops up when you save a bookmark. It also turns the Pocket button red, the same as saving to Pocket does without the script.

-   `bookmarksPopupShadowRoot`: Implement smooth scrolling for all bookmarks popups that are tall enough to scroll. Add unique classes to their shadow parts so they can be styled selectively in CSS. Add special click functions to their scroll buttons — hovering a scroll button will scroll at a constant rate, as normal. (though faster than vanilla) But clicking a scroll button will immediately jump to the top/bottom of the list. Combined with uc-bookmarks.css, overhauls the appearance of the scroll buttons.

-   `bookmarksMenuAndButtonShortcuts`: Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason.

-   `findbarMatchesLabel`: Makes the label for findbar matches way more concise, miniaturizes the "Match Case" and "Whole Words" buttons, and also adds a ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some CSS from [uc-findbar.css][resources](/uc-findbar.css) or at least some tinkering with your own styles. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes ctrl+F more of a findbar toggle than a key that strictly opens the findbar.

-   `floatingSidebarResizer`: uc-sidebar.css makes the sidebar float over the content without flexing it, but that changes the way sidebar resizing works. This script is required to make the floating sidebar resizable. It also optionally improves the hotkeys a little bit so that ctrl+B (or cmd+B) toggles the sidebar on/off instead of exclusively opening the bookmarks sidebar. Instead the hotkey to jump to the bookmarks sidebar has been remapped to ctrl+shift+B. This key combination normally toggles the bookmarks toolbar on and off, but I figured it was worth replacing, since you probably either never use the bookmarks toolbar, or keep it open it all the time. Whereas the sidebar is something you're going to want to turn off when you're done using it, since it takes up a lot of space. My stylesheet makes the bookmarks toolbar hide automatically and only show when the nav-bar is being hovered, so a hotkey isn't really necessary. (bookmarks toolbar hiding is further enhanced with fullscreenNavBar.uc.js, FYI)

-   `fullscreenHotkey`: All this does is remap the fullscreen shortcut key from F11 to Ctrl+E, since I use F11 for other purposes.

-   `fullscreenNavBar`: In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. Those are posted here in my stylesheets but you can also do your own thing with this script by using selectors like `box[popup-status="true"] > #navigator-toolbox > whatever`<p>Without this script, there also isn't any good way to pass information to findbars or sidebars about whether the nav-bar is hovered/focused or popups are open. For the floating findbar and sidebar to work seamlessly, they need to be aware of information like that so they can move up and down in fullscreen when the navbar is hidden/shown. But they're not in the same ancestral chain as the navbar or the popups' anchors, so that information needs to be added to some high-level element with a script. In this case, the `<box>` element that contains the navbar works since it's siblings with the browser container. So we can style any children of the navbar or the browser container according to `[popup-status]`, and that encompasses just about every static element in the main window.</p>

-   `hideTrackingProtectionIconOnCustomNewTabPage`: Hide the url bar's tracking protection icon on the home page and new tab page, even if they are custom pages added by extensions. This and searchModeIndicatorIcons are both strongly recommended if you use my CSS theme. <details><summary>*More details...*</summary><p>By default, Firefox hides the tracking protection while 1) the current tab is open to the default new tab page or default home page; or 2) the user is typing into the url bar. Hiding the icon while the user is typing is unnecessary, since although `pageproxystate` has changed, the content principal is still the same and clicking the tracking protection icon to open the popup still works. Opening the popup while `pageproxystate` is invalid still loads the tracking details and options for the current content URI. But hiding the icon on the new tab page or home page is necessary, because the tracking protection icon is hidden on `about:blank`.</p><p>If you use an extension to set a custom new tab page, you will see the tracking protection icon briefly disappear when opening a new tab, before reappearing as the custom new tab page loads. That is because `about:blank` loads before the custom new tab page loads. So the icon is hidden and unhidden in the span of a hundred milliseconds or so. This looks very ugly, so my stylesheet has always prevented the tracking protection icon from being hidden on any page, including `about:blank`. That way at least it doesn't disappear. But this isn't a great solution, because there are a number of pages for which the tracking protection icon does nothing. The protection handler can't handle internal pages, for example.</p><p>Previously I just disabled pointer events on the icon when it was supposed to be hidden. But I think this script is a better solution. If this script is not installed, my theme will default to those older methods I just mentioned. But if the script is installed, it will restore the built-in behavior of hiding the tracking protection icon on internal pages, only it will also hide the icon on the user's custom new tab page and home page. The icon will still be visible if you're on a valid webpage, (web or extension content, not local or system content) even if you begin typing in the urlbar.</p></details>

-   `letCtrlWClosePinnedTabs`: The name should say it all, this just removes the "feature" that prevents you from closing pinned tabs with the Ctrl+W/Cmd+W shortcut.

-   `minBrowserNavbar`: Made by request. This script isn't part of the main theme (I don't use it myself) but it is fully compatible with it. It makes the Firefox navbar UI more like [Min Browser](https://minbrowser.org/) by hiding the main toolbar until the selected tab is clicked. The idle state is such that only the tab bar is visible at the top. Clicking the selected tab will automatically open the urlbar and focus the input area, while hiding the tab bar. It's essentially like the tab bar gets replaced by the urlbar (and other toolbar buttons) when the currently-open tab is clicked. When the urlbar area is un-focused, whether by clicking outside of it or by executing a search or URL navigation, the urlbar is automatically hidden again and replaced by the tab bar. Opening a new (blank) tab will also select the urlbar. <details><summary><i>More details...</i></summary><p>Clicking and dragging tabs, and closing tabs with middle click, are still allowed. In order to preserve functionality, some new buttons have been added to the tab bar: back/forward/reload navigation buttons, and min/max/close buttons. Speaking of which, this handles all 3 size modes: normal, maximized, and fullscreen.</p><p>In order to fully emulate Min Browser, the script closes the urlbar results whenever a different tab is clicked. However, this behavior can be disabled by toggling userChrome.minBrowser.resetOnBlur in about:config. In order to make everything look right, the tab bar and nav bar are given the same height, which is defined by a variable. This variable can also be changed by editing userChrome.minBrowser.toolbarHeight in about:config.</p><p>I've set up the styling so that it should be as versatile as possible, working with the default layout, the proton layout, and probably most user layouts. Still, you may need to set the colors yourself. For instance, by default the backgrounds of the tab bar and the navbar are different colors. If you want them to be the same color, you'll need to handle that yourself — I wouldn't change something like that in this script, or I'd end up making it unusable for some people.</p><p>
And if you have a lot of your own customizations, you'll probably need to make some changes, either in your own userChrome.css or by editing the stylesheet embedded in this script (search "const css").</p></details>

-   `multiLineUrlbarResults`: When a urlbar result's title overflows off the results panel, this moves its URL to a second line, underneath the title. Results that aren't overflowing are still single lines. This could be done without javascript, but I wanted the URL to be lined up with the title, not with the favicon. This requires some CSS from the end of [uc-urlbar-results.css](/uc-urlbar-results.css).

-   `navbarToolbarButtonSlider`: My masterpiece, wrap all toolbar buttons after `#urlbar-container` in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. This is meant to replace the widget overflow button that appears to the right of your other toolbar buttons when you have too many to display all at once. Instead of clicking to open a dropdown that has the rest of your toolbar buttons, you can just place all of them in a little horizontal scrollbox. Better yet, you can scroll through them with mousewheel up/down, just like the tab bar. When the window gets *really* small, the slider disappears and the toolbar buttons are placed into the normal widget overflow panel. This script has 3 user preferences, so check the description in the script file for details. This and the toolbox button have been the most valuable for me personally.

-   `oneClickOneOffSearchButtons`: Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until 2021 these functions could be overridden with a preference in about:config, but those settings were removed. This script restores the old functionality. <details><summary>*More details...*</summary><p>If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: `userChrome.urlbar.oneOffs.keyNavigation`. The script also hides the one-off search settings button, but this can be turned off in about:config with `userChrome.urlbar.oneOffs.hideSettingsButton`.</p><p>This script also has some conditional functions to work together with `scrollingOneOffs.uc.js`. They don't require each other at all, but they heavily improve each other both functionally and visually. Changing search engines with the arrow keys will scroll the one-offs container to keep the selected one-off button in view. And exiting the query in any way will automatically scroll back to the beginning of the one-offs container, so that it's reset for the next time you use it. It's hard to explain exactly what's going on under the hood when you combine the two, so for now I'll just say to try them out yourself.</p></details>

-   `openLinkInUnloadedTab`: Add a new menu item to context menus prompted by right/accel-clicking on links or other link-like affordances. The menu item will open the link in a new background tab without loading the page. So the tab will start unloaded or "discarded." The context menu entry appears in the content area context menu when right-clicking a link; and in every menu where bookmarks, history, and synced tabs can be interacted with — sidebar, menubar, toolbar, toolbar button popup, and library window. Has one user configuration preference: `userChrome.openLinkInUnloadedTab.use_link_text_as_tab_title_when_unknown`.

-   `removeSearchEngineAliasFormatting`: Depending on your settings you might have noticed that typing a search engine alias (e.g. "goo" for Google) causes some special formatting to be applied to the text you input in the url bar. This is a trainwreck because the formatting is applied using the selection controller, not via CSS, meaning you can't change it in your stylesheets. It's blue by default, and certainly doesn't match my personal theme very well. This script just prevents the formatting from ever happening at all.

-   `restoreTabSoundButton`: Proton removes the tab sound button. We can restore it to some extent with CSS, but we'd lose the tooltip and the ability to mute picture-in-picture tabs with the sound button. This script fully restores both, and will probably add more functionality in the future depending on what ships with the remaining Proton updates.

-   `restorePreProtonDownloadsButton`: Restores the pre-proton downloads button icons and animations. I kept the new progress animation, but I made it thicker. If you use my theme or my icons you'll definitely want this for the sake of consistency. If you don't use my theme or icons but you still want the old downloads button back, download the *standalone* version instead. (same file name, with `-standalone` at the end) The standalone version has the stylesheet and icons built-in, so doesn't require anything else except a script loader. This version requires [userChrome.au.css](/userChrome.au.css) and the [resources/downloads](/resources/downloads) folder.

-   `restorePreProtonStarButton`: The bookmark page action button used to have a pretty cool starburst animation. That's been removed but it's not too difficult to restore. The main version of this script requires fx-autoconfig, [userChrome.au.css](/userChrome.au.css), and the [resources](/resources) folder from my repo. If you don't want to use all that stuff, grab the *standalone* version instead. If you use the standalone version, you won't need any additional CSS and you can use other script loaders instead of fx-autoconfig, but you will need to download the icons from [resources/bookmarks](/resources/bookmarks) and place them in `{your profile}/chrome/bookmarks/`. FYI not to state the obvious but this script will have no effect if your browser/OS has `prefers-reduced-motion` enabled.

-   `scrollingOneOffs`: This script allows the search one-offs box to be scrolled with mousewheel up/down OR left/right. This is for use with my theme, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. It won't do much without the CSS from uc-search-one-offs.css to set up the layout of the one offs element.

-   `searchModeIndicatorIcons`: Another epic script, this allows you to add an icon to the search engine indicator that appears on the left side of the url bar when you're using a one-off search engine. If you invoke the Amazon search engine, for example, the identity icon (normally a lock icon) will gain an attribute called engine with a value of "Amazon" which you can select in CSS to change it to an Amazon icon. I've already added a bunch in uc-search-mode-icons.css. It's mostly an aesthetic feature for me, but if you added icons for all your search engines, you could hide the text indicator altogether. The icon could then basically replace the search engine's text label.

-   `searchSelectionShortcut`: Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, (meaning text that is a URL, not a hyperlink) instead of searching for the selection it will navigate directly to the URL. The latter feature is mainly useful for when someone pastes a URL on some website that doesn't automatically generate hyperlinks when URLs are input in text forms.

-   `toggleTabsAndSidebarButton`: Made by request. Adds a new toolbar button that can toggle between hiding tabs and hiding the sidebar. Intended for use with TreeStyleTabs, but will still work the same without it. It toggles the sidebar on its own, but it hides tabs by setting an attribute on the document element, which you need to reference in your userChrome.css file, like this: `:root[toggle-hidden="tabs"] #TabsToolbar {...}`. There are various templates available online for hiding the tab bar, or you can ask on [/r/FirefoxCSS](https://www.reddit.com/r/FirefoxCSS/). Just use one of those, adding `:root[toggle-hidden="tabs"]` to the selectors.

-   `toggleMenubarHotkey`: Adds a hotkey (alt+M by default) that toggles the menubar on and off. Unlike just pressing the alt key, this keeps it open permanently until closed again by the hotkey, toolbar context menu, or customize menu. Requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) — other script loaders will not work with this script.

-   `undoListInTabContextMenu`: Adds new menus to the context menu that appears when you right-click a tab (in the tab bar or in the TreeStyleTabs sidebar): one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them. An updated script that does basically the same thing as [UndoListInTabmenuToo](https://github.com/alice0775/userChrome.js//72/UndoListInTabmenuToo.uc.js) by Alice0775, but for current versions of Firefox and with TST support. The original broke around version 86 or 87 I think.

-   `updateNotificationSlayer`: Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification). See the file description for more info.

-   `updateBannerLabels`: Simply changes the update banners in the hamburger button app menu to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download Nightly update" (or whatever your version is) for example.

-   `urlbarMouseWheelScroll`: Implements vertical scrolling and smooth scrolling inside the urlbar's input field. That might sound weird, but the urlbar doesn't naturally have any special scrolling logic, so scrolling it with a mouse wheel can be a real bitch, and scrolling it horizontally with a trackpad would feel really janky. This makes all scrolling in the urlbar smooth, and lets you scroll it horizontally with mousewheel up/down, since it can't be scrolled vertically anyway.

-   `urlbarNotificationIconsOpenStatus`: All this does is set an attribute on the buttons in `#notification-popup-box` based on whether their popups are open or closed. That way we can set their fill-opacity to 1 when they're open, like we do already with the other icons in `#identity-box`. There aren't any ways to do this with pure CSS as far as I can tell, so it's necessary to make our own event listeners. (or we could override the class methods in PopupNotifications.jsm, but that would require more frequent updates) Very minor improvement, but also very cheap and easy, so I figured might as well make the icon opacity consistent. *Doesn't have any visual effect without uc-urlbar.css.*

-   `urlbarViewScrollSelect`: This script lets you cycle through urlbar results with mousewheel up/down, and invoke the current selected result by right-clicking anywhere in the urlbar results area. Nothing too special, just makes one-handed operation with a trackpad a little easier. Scroll events are limited proportionally to their magnitude, so it should be comfortable to scroll with any kind of input device, even including a trackpad or ball.

-   `userChrome_as_css_module`: Required for loading userChrome.au.css and userChrome.as.css.

-   `userChrome_devtools_module`: Required for loading stylesheets into browser toolbox windows. [See here](#styling-browser-toolbox-windows) for more info.
