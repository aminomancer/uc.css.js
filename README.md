# **uc.css.js**

My personal Firefox theme/layout, plus some privileged scripts to add new behaviors and functions.

<a href="https://youtu.be/BAuABH13ytM">
<i>Click any of the gifs for a more thorough video preview of the theme and some of the major scripts.</i>
<br>
<p></p>
<img src="preview/prev-navbar.gif"/>
<br>
<p></p>
<img src="preview/prev-search.gif"/>
</a>
<br>
<p></p>

Make sure to set `ui.systemUsesDarkTheme` to `1` in about:config, and set density mode to `Normal` in the customization menu. (right click on the navbar and click "Customize Toolbar") <details><summary>Currently I recommend using this on Nightly, and setting all of the proton prefs to true. Click for a full list.</summary>`browser.proton.appmenu.enabled`  
`browser.proton.contextmenus.enabled`  
`browser.proton.doorhangers.enabled`  
`browser.proton.enabled`  
`browser.proton.places-tooltip.enabled`  
`browser.proton.tabs.enabled`  
`browser.proton.toolbar.enabled`  
`browser.proton.urlbar.enabled`</details>

The `userContent.css` file handles stuff like the devtools, some UI pages and context menus, plaintext pages, browser background color while pages are loading, and the built-in HTML video player. It also includes some site-specific changes like my personal dark mode layout for Wikipedia. It isn't required for the rest of the theme to work, but takes care of some issues endemic to Firefox that might cause dark mode users a lot of grief otherwise.

`userChrome.css` doesn't require any fonts, but `userContent.css` uses [Overpass](https://fonts.google.com/specimen/Overpass), [Overpass Mono](https://fonts.google.com/specimen/Overpass+Mono) and [Cutive Mono](https://fonts.google.com/specimen/Cutive+Mono) for plaintext files and the picture-in-picture button. Since they're free and show up frequently, it makes sense to install them locally rather than use webfont.

To get the complete functionality [shown in the video](https://youtu.be/BAuABH13ytM), you'll need to install at least some of the scripts. The stylesheets work fine without the scripts, but functionally it'll be just like vanilla Firefox. Instructions and explanations for the scripts are below.

I don't use tree style tabs but I've tested this with TST and they don't seem to interact in a negative way. It just doesn't fully style all the TST stuff. I'll probably make a TST theme if someone asks, but since I don't use the extension myself it's not a high priority.

Most of the important colors can be changed in uc-globals.css and uc-variables.css, but I'm still in the process of making everything easily configurable and adding a light mode. It's just a theme I built for personal use over the course of a couple years, so there isn't much top-down organization at the moment.

The theme can be customized with preferences in about:config. There are more prefs for the individual scripts too, which are documented in the script descriptions. Here are the CSS prefs:

`userChrome.tabs.pinned-tabs.close-buttons.disabled`:  
If set to `true`, hides the close buttons for pinned tabs. This theme already hides the close buttons on every tab, but when you hover a tab, its close button is normally revealed. Since the theme makes pinned tabs quite small, you might want to eliminate the close buttons for pinned tabs completely so you don't accidentally click on them. This is what I use personally, I just close pinned tabs by middle-clicking them.

`userChrome.tabs.rounded-outer-corners.disabled`:  
As of 2/25/21, the theme adds rounded outside corners to tabs, sort of like Microsoft Edge does. They're designed to look like actual physical folder tabs, (the kind you'd stick folder labels onto if anyone still used paper folders) which was a popular UI choice when tabs were first introduced, since they were inspired by real folder tabs after all. If you're not a fan of this visual style, set this pref to `true`.

<img src="preview/prev-tabcorners.png" width="254"/>


<h2><b>Scripts:</b></h2>

The files in the scripts folder are not content scripts like you'd load in Tampermonkey. They're meant to execute in the same context as Firefox's internal scripts. They're scripts for the Firefox frontend itself rather than for webpages. This is sort of analogous to gaining "privileges" to modify your UI document directly. With CSS alone you can only do so much. Even a lot of purely aesthetic features may require JavaScript, like the search engine icons shown in the GIF above.

They need to be loaded by an autoconfig script loader. I recommend [**MrOtherGuy's script manager**](https://github.com/MrOtherGuy/fx-autoconfig) which is extremely robust. You can also use [alice0775's autoconfig loader](https://github.com/alice0775/userChrome.js/tree/master/72) if you prefer something more lightweight, though from here on out some of my scripts will not be fully compatible with loaders other than MrOtherGuy's because they don't support loading scripts into the global execution context before windows have been initialized.

Whatever you choose, the installation steps are almost the same. You first need to find your Firefox installation folder. On Windows that's `C:/Program Files/Firefox/`. On Linux it should be `usr/lib/firefox/`. On macOS this is more complicated. You need to open the application file itself, probably in `Macintosh HD/Applications/`. It's the file you double-click to open Firefox, but it's actually a package, not a binary. If you right click it, there will be an option in the context menu labeled "Show Package Contents." Clicking this takes you to the root directory. So whichever OS you're on, you should end up with...
1) &nbsp; a file called `config.js` in your Firefox installation's root directory;
2) &nbsp; a folder called `defaults` in the root directory;
3) &nbsp; a folder called `pref` inside that `defaults` folder;
4) &nbsp; a file called `config-prefs.js` inside that `pref` folder;
5) &nbsp; a `JS` folder and a `utils` folder in your profile's `chrome` folder (if you use MrOtherGuy's loader); or a `userChrome.js` file in your `chrome` folder if you use alice0775's loader.

You may already have a file called `channel-prefs.js` inside the `prefs` folder. This is unrelated.

If you're using MrOtherGuy's script manager like I recommended, then your scripts should go in the `JS` folder. Any agent sheets or author sheets (files ending in .as.css or .au.css) should go in the `chrome` folder with your regular stylesheets. If you're using alice0775's loader instead, then get the updated [userChrome.js from here](https://github.com/alice0775/userChrome.js/tree/master/73) and put it in your profile's chrome folder, along with all the stylesheets you use. With alice0775's loader, scripts should go directly in the main chrome folder, right along with userChrome.css, etc.

After you've installed the files, the script loader will locate any scripts you place in the proper folder that end in .uc.js, such as the ones in my repo. Once you have all this set up you can download my scripts, put them in the correct folder for your loader, restart, and you should see the changes immediately.

In the main directory on this repo you might notice two files: `userChrome.as.css` and `userChrome.au.css`. These are loaded by the scripts: `userChrome_as_css_module.uc.js` and `userChrome_au_css_module.uc.js`. The main purposes for using these instead of your main userChrome.css are 1) to use CSS syntax that is forbidden to user sheets, such as the ::part(*) pseudo-element; 2) to style native-anonymous content like default tooltips or scrollbars; or 3) to traverse shadow trees from parent to children, e.g. when you need to select a specific menupopup's children without affecting other menupopups' children. In some cases, this is impossible even in an agent sheet for some reason I haven't figured out yet. In those cases I use javascript to traverse the shadow tree, and then assign a unique ID or class to the shadow DOM nodes I want to style with specificity. Then, I use the regular `userChrome.css` stylesheet to implement those rules. So, for example, `bookmarksPopupShadowRoot` gives several elements in the bookmarks toolbar popup unique classes, which are styled later in my main stylesheets.
<br>

Here's a description of each of the scripts:

-   `allTabsMenuDimUnloadedTabs`: Automatically dims unloaded tabs in the 'all tabs' menu so you can tell which ones have been loaded and which haven't. Requires a CSS rule, see the description in the file for details.

-   `atoolboxButton`: Adds a new toolbar button for devtools features. Probably the single most valuable file on this repo, in my opinion. 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. There's a bit more to it as well, see the description in the file.<details><summary><i>Click here for a preview of the toolbox button's middle click function.</i></summary><a href="https://youtu.be/BAuABH13ytM"><img src="preview/prev-popup-autohide.gif"/></a></details>

-   `bookmarksPopupShadowRoot`: Implement smooth scrolling in the bookmarks toolbar button's popup. Also adds a click function to the arrow buttons at the top and bottom: clicking the bottom arrow will jump to the end of the list, and clicking the top arrow will jump to the start.

-   `findbarMatchesLabel`: Makes the label for findbar matches way more concise, miniaturizes the "Match Case" and "Whole Words" buttons, and also adds a ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some CSS from my repo or at least some tinkering with your own styles. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes ctrl+F more of a findbar toggle than a key that strictly opens the findbar.

-   `floatingSidebarResizer`: Makes the sidebar float over the content without flexing it, while still allowing you to resize it. It also optionally improves the hotkeys a little bit so that ctrl+B (or cmd+B) toggles the sidebar on/off instead of exclusively opening the bookmarks sidebar. Instead the hotkey to jump to the bookmarks sidebar has been remapped to ctrl+shift+B. This key combination normally toggles the bookmarks toolbar on and off, but I figured it was worth replacing, since you probably either never use the bookmarks toolbar, or use it all the time. Whereas the sidebar is something you're going to want to turn off when you're done using it, since it takes up a lot of space.

-   `fullscreenHotkey`: All this does is remap the fullscreen shortcut key from F11 to Ctrl+E, since I use F11 for other purposes.

-   `fullscreenNavBar`: In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. Those are posted here in my stylesheets but you can also do your own thing with selectors like `box[popup-status="true"] > #navigator-toolbox > whatever`

-   `minBrowserNavbar`: This script makes the Firefox navbar UI more like [Min Browser](https://minbrowser.org/) by hiding the main toolbar until the selected tab is clicked. The idle state is such that only the tab bar is visible at the top. Clicking the selected tab will automatically open the urlbar and focus the input area, while hiding the tab bar. It's essentially like the tab bar gets replaced by the urlbar (and other toolbar buttons) when the currently-open tab is clicked. When the urlbar area is un-focused, whether by clicking outside of it or by executing a search or URL navigation, the urlbar is automatically hidden again and replaced by the tab bar. Opening a new (blank) tab will also select the urlbar. <details><summary>More details...</summary>Clicking and dragging tabs, and closing tabs with middle click, are still allowed. In order to preserve functionality, some new buttons have been added to the tab bar: back/forward/reload navigation buttons, and min/max/close buttons. Speaking of which, this handles all 3 size modes: normal, maximized, and fullscreen.  
In order to fully emulate Min Browser, the script closes the urlbar results whenever a different tab is clicked. However, this behavior can be disabled by toggling userChrome.minBrowser.resetOnBlur in about:config. In order to make everything look right, the tab bar and nav bar are given the same height, which is defined by a variable. This variable can also be changed by editing userChrome.minBrowser.toolbarHeight in about:config.  
I've set up the styling so that it should be as versatile as possible, working with the default layout, the proton layout, and probably most user layouts. Still, you may need to set the colors yourself. For instance, by default the backgrounds of the tab bar and the navbar are different colors. If you want them to be the same color, you'll need to handle that yourself — I wouldn't change something like that in this script, or I'd end up making it unusable for some people.  
And if you have a lot of your own customizations, you'll probably need to make some changes, either in your own userChrome.css or by editing the stylesheet embedded in this script (search "const css").</details>

-   `navbarToolbarButtonSlider`: My masterpiece, wrap all toolbar buttons after #urlbar-container in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. This is meant to replace the widget overflow button that appears to the right of your other toolbar buttons when you have too many to display all at once. Instead of clicking to open a dropdown that has the rest of your toolbar buttons, you can just place all of them in a little horizontal scrollbox. Better yet, you can scroll through them with mousewheel up/down, just like the tab bar. This and the toolbox button have been the most valuable for me personally.

-   `oneClickOneOffSearchButtons`: Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until recently these functions could be overridden with a preference in about:config, but those settings were removed, e.g. `browser.urlbar.update2.disableOneOffsHorizontalKeyNavigation`. This script restores the old functionality. This script also has some conditional functions to work together with scrollingOneOffs.uc.js. They don't require each other at all, but they heavily improve each other both functionally and visually. Changing search engines with the arrow keys will scroll the one-offs container to keep the selected one-off button in view. And exiting the query in any way will automatically scroll back to the beginning of the one-offs container, so that it's reset for the next time you use it. It's hard to explain exactly what's going on so for now I'll just say to try them out yourself. If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: `userChrome.urlbar.oneOffs.keyNavigation`. The script also hides the one-off search settings button, but this can be turned off in about:config with `userChrome.urlbar.oneOffs.hideSettingsButton`.

-   `removeSearchEngineAliasFormatting`: Depending on your settings you might have noticed that typing a search engine alias (e.g. "goo" for Google) causes some special formatting to be applied to the text you input in the url bar. This is a trainwreck because the formatting is applied using the selection controller, not via CSS, meaning you can't change it in your stylesheets. It's blue by default, and certainly doesn't match my personal theme very well. This script just prevents the formatting from ever happening at all.

-   `scrollingOneOffs`: This is for my own personal stylesheet, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. The script allows the search one-offs box to be scrolled with mousewheel up/down.

-   `searchModeIndicatorIcons`: Another epic script, this allows you to add an icon to the search engine indicator that appears on the left side of the url bar when you're using a one-off search engine. If you invoke the Amazon search engine, for example, the identity icon (normally a lock icon) will gain an attribute called engine equal to "Amazon" which you can select in CSS to change it to an Amazon icon. I've already added a bunch in uc-search-mode-icons.css. It's mostly an aesthetic feature for me, but if you added icons for all your search engines, you could hide the text indicator altogether. The icon would then basically replace the search engine's text label.

-   `searchSelectionShortcut`: Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL.

-   `updateNotificationSlayer`: Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification). See the file description for more info.

-   `urlbarNotificationIconsOpenStatus`: All this does is set an attribute on the buttons in #notification-popup-box based on whether their popups are open or closed. That way we can set their fill-opacity to 1 when they're open, like we do already with the other icons in #identity-box. There aren't any ways to do this with pure CSS as far as I can tell, so it's necessary to make our own event listeners. (or we could override the class methods in PopupNotifications.jsm, but that would require more frequent updates) Very minor improvement, but also very cheap and easy, so I figured might as well make the icon opacity consistent. *Doesn't have any visual effect without uc-urlbar.css.*

-   `urlbarViewScrollSelect`: Lets you navigate the results/suggestions in the urlbar with the mousewheel, (or trackpad scroll) and execute the active/selected result by right clicking anywhere in the urlbar panel. Makes one-hand operation easier.
