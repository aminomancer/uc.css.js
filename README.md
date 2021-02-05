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

To get the complete functionality [shown in the video](https://youtu.be/BAuABH13ytM), you'll need to install at least some of the scripts. The instructions and explanations are below.

I don't use tree style tabs but I've tested this with TST and they don't seem to interact in a negative way. It just doesn't fully style all the TST stuff. I'll probably make a TST theme if someone asks, but since I don't use the extension myself it's not a high priority.

Most of the important color variables can be changed in uc4.css, but if you want to change the colors as thoroughly as I have, you'll need to go digging through all 8 of my stylesheets. It's just a theme I built for personal use over the course of a couple years, so there isn't much top-down organization.

I might try to make the customization more user-friendly in the future if other people actually like the aesthetic. So far I've mostly gotten requests for some of the individual snippets that can't be found anywhere else, so it hasn't seemed like a good use of my time.


<h2><b>Scripts:</b></h2>

The files in the scripts folder are not content scripts like you'd load in Tampermonkey. They're meant to execute in the same context as Firefox's internal scripts. They're scripts for the Firefox frontend itself rather than for webpages. This is sort of analogous to gaining "privileges" to modify your UI document directly. With CSS alone you can only do so much. Even a lot of purely aesthetic features may require JavaScript, like the search engine icons shown in the GIF above.

They are loaded by [**alice0775's autoconfig loader**](https://github.com/alice0775/userChrome.js/tree/master/72). From that repo you put the stuff in `install_folder` in your firefox installation folder. That is, you should end up with...
1) &nbsp; a file called `config.js` in your Firefox installation's root directory;
2) &nbsp; a folder called `defaults` in the root directory;
3) &nbsp; a folder called `pref` inside that `defaults` folder;
4) &nbsp; a file called `config-prefs.js` inside that `pref` folder.

You may already have a file called `channel-prefs.js` inside the `prefs` folder. This is unrelated.

Then, get the updated [**userChrome.js from here**](https://github.com/alice0775/userChrome.js/tree/master/73) and put it in your profile's chrome folder, along with all the stylesheets you use. Then at startup firefox will load any scripts you place in your chrome folder that end in .uc.js, such as the ones in my repo. Once you have all this set up you can download my scripts to your chrome folder and restart, and you should see the changes immediately.
<br>

Here's a description of each of the scripts:

-   `agentsheets`: Overlay scrollbars and hiding some stuff that's otherwise difficult to hide with a usersheet.

-   `allTabsMenuDimUnloadedTabs`: Automatically dims unloaded tabs in the 'all tabs' menu so you can tell which ones have been loaded and which haven't. Requires a CSS rule, see the description in the file for details.

-   `atoolboxButton`: Adds a new toolbar button for devtools features. Probably the single most valuable file on this repo, in my opinion. 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. There's a bit more to it as well, see the description in the file.<details><summary><i>Click here for a preview of the toolbox button's middle click function.</i></summary><a href="https://youtu.be/BAuABH13ytM"><img src="preview/prev-popup-autohide.gif"/></a></details>

-   `bookmarksPopupShadowRoot`: Implement smooth scrolling in the bookmarks toolbar button's popup. Also adds a click function to the arrow buttons at the top and bottom: clicking the bottom arrow will jump to the end of the list, and clicking the top arrow will jump to the start.

-   `findbarMatchesLabel`: Makes the label for findbar matches way more concise and also adds a ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some CSS from my repo or at least some tinkering with your own styles. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes ctrl+F more of a findbar toggle than a key that strictly opens the findbar.

-   `floatingSidebarResizer`: Makes the sidebar float over the content without flexing it, while still allowing you to resize it. It also optionally improves the hotkeys a little bit so that ctrl+B (or cmd+B) toggles the sidebar on/off instead of exclusively opening the bookmarks sidebar. Instead the hotkey to jump to the bookmarks sidebar has been remapped to ctrl+shift+B. This key combination normally toggles the bookmarks toolbar on and off, but I figured it was worth replacing, since you probably either never use the bookmarks toolbar, or use it all the time. Whereas the sidebar is something you're going to want to turn off when you're done using it, since it takes up a lot of space.

-   `fullscreenNavBar`: In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. Those are posted here in my stylesheets but you can also do your own thing with selectors like `box[popup-status="true"] > #navigator-toolbox > whatever`

-   `hideTabBrowserArrows`: Quick, safe, and very specific way to hide the left and right arrows on either end of the tab bar without messing up other arrows.

-   `navbarToolbarButtonSlider`: My masterpiece, wrap all toolbar buttons after #urlbar-container in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. This is meant to replace the widget overflow button that appears to the right of your other toolbar buttons when you have too many to display all at once. Instead of clicking to open a dropdown that has the rest of your toolbar buttons, you can just place all of them in a little horizontal scrollbox. Better yet, you can scroll through them with mousewheel up/down, just like the tab bar. This and the toolbox button have been the most valuable for me personally.

-   `oneClickOneOffSearchButtons`: Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. Until recently this could be overridden with a preference in about:config, but that setting was removed. This script simply restores the old functionality.

-   `removeSearchEngineAliasFormatting`: Depending on your settings you might have noticed that typing a search engine alias (e.g. "goo" for Google) causes some special formatting to be applied to the text you input in the url bar. This is a trainwreck because the formatting is applied using the selection controller, not via CSS, meaning you can't change it in your stylesheets. It's blue by default, and certainly doesn't match my personal theme very well. This script just prevents the formatting from ever happening at all.

-   `scrollingOneOffs`: This is for my own personal stylesheet, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. The script allows the search one-offs box to be scrolled with mousewheel up/down.

-   `searchModeIndicatorIcons`: Another epic script, this allows you to add an icon to the search engine indicator that appears on the left side of the url bar when you're using a one-off search engine. If you invoke the Amazon search engine, for example, the identity icon (normally a lock icon) will gain an attribute called engine equal to "Amazon" which you can select in CSS to change it to an Amazon icon. I've already added a bunch in uc8.css. It's mostly an aesthetic feature for me, but if you added icons for all your search engines, you could hide the text indicator altogether. The icon would then basically replace the search engine's text label.

-   `searchSelectionShortcut`: Adds a new keyboard shortcut (ctrl+shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, instead of searching for the selection it will navigate directly to the URL.

-   `tooltipStyling`: As the name suggests, register an agent sheet with the privilege to style tooltips.

-   `updateNotificationSlayer`: Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification). See the file description for more info.

-   `urlbarViewScrollSelect`: Lets you navigate the results/suggestions in the urlbar with the mousewheel, (or trackpad scroll) and execute the active/selected result by right clicking anywhere in the urlbar panel. Makes one-hand operation easier.
