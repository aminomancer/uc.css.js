# **uc.css.js**

My personal Firefox theme/layout, plus some privileged scripts to add new behaviors and functions.

<p>
<img src="preview/prev-window-small.webp">
</p>
<p>
<img src="preview/prev-navbar.gif"/>
</p>
<p>
<img src="preview/prev-search.gif"/>
</p>

For best results, set density mode to `Normal` and theme to `Dark` in the customization menu. (right click on the navbar and click "Customize Toolbar...") I strongly recommend using this on [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) and updating the theme at least weekly. To that end, you might find it easier to clone the repo to your chrome folder so you can pull updates quickly. I also recommend setting the following prefs in about:config. There's a [user.js](/user.js) file in the root directory that will automatically set all the required prefs if you put it in your _profile_ folder. (not your chrome folder) That said, I recommend setting the preferences manually in about:config, since most should be kept regardless of the theme you use, and there are many other optional prefs you should consider setting in this list. There are also OS-specific prefs that are not in user.js, so it won't necessarily handle everything for you. The following are in alphabetical order, not in order of importance. Several are optional, but the few that are required are in italics and are marked in the Notes column.<details><summary>**_Click for a full list._**</summary>
| Pref&nbsp;name | Type | Value | Notes&nbsp;(optional&nbsp;unless&nbsp;otherwise&nbsp;noted) |
|- |- |- |- |
| browser.anchor\_color | String | `#5311ff` | |
| browser.visited\_color | String | `#753afc` | |
| browser.display.focus\_ring\_style | Number | 0 | |
| browser.display.focus\_ring\_width | Number | 0 | |
| <i>browser.proton.enabled</i> | Boolean | true | |
| <i>browser.proton.places-tooltip.enabled</i> | Boolean | true | |
| browser.startup.blankWindow | Boolean | false | These two settings eliminate the blank white window during startup |
| browser.startup.preXulSkeletonUI | Boolean | false | |
| browser.tabs.tabMinWidth | Number | 90 | User preference, but mine is 90 |
| browser.tabs.tabmanager.enabled | Boolean | true | Enables "all tabs menu" |
| browser.urlbar.accessibility.tabToSearch.announceResults | Boolean | false | |
| browser.urlbar.richSuggestions.tail | Boolean | false | |
| browser.urlbar.searchTips | Boolean | false | |
| browser.urlbar.trimURLs | Boolean | false | |
| dom.forms.selectSearch | Boolean | true | |
| findbar.highlightAll | Boolean | true | Stylesheet eliminates some rarely used findbar buttons. So I leave this set to true |
| findbar.matchdiacritics | Number | 2 | |
| gfx.font\_rendering.cleartype\_params.cleartype\_level | Number | 100 | These settings are a major improvement to text rendering on Windows. I don't think they do anything on mac/linux |
| gfx.font\_rendering.cleartype\_params.force\_gdi\_classic\_for\_families | String | `<empty>` | Leave the value completely empty |
| gfx.font\_rendering.cleartype\_params.force\_gdi\_classic\_max\_size | Number | 6 | |
| gfx.font\_rendering.cleartype\_params.pixel\_structure | Number | 1 | |
| gfx.font\_rendering.cleartype\_params.rendering\_mode | Number | 5 | |
| gfx.font\_rendering.directwrite.use\_gdi\_table\_loading | Boolean | false | |
| <i>gfx.webrender.svg-images</i> | Boolean | true | |
| <i>layout.css.backdrop-filter.enabled</i> | Boolean | true | Required for the acrylic/glass gaussian blur effect |
| <i>layout.css.cached-scrollbar-styles.enabled</i> | Boolean | false | Sort of required for scrollbar styles in userChrome.ag.css |
| <i>layout.css.moz-document.content.enabled</i> | Boolean | true | Required |
| <i>layout.css.xul-box-display-values.content.enabled</i> | Boolean | true | Required |
| <i>layout.css.xul-display-values.content.enabled</i> | Boolean | true | Required |
| layout.css.xul-tree-pseudos.content.enabled | Boolean | true | |
| reader.color\_scheme | String | `dark` | |
| mousewheel.autodir.enabled | Boolean | true | Allow mousewheel ⇅ to scroll ⇄-only scrollboxes |
| prompts.contentPromptSubDialog | Boolean | true | Use the modern content dialog instead of modal prompts |
| <i>svg.context-properties.content.enabled</i> | Boolean | true | Required for making some icons white |
| <i>toolkit.legacyUserProfileCustomizations.stylesheets</i> | Boolean | true | Required, of course |
| ui.IMERawInputBackground | String | `#000000` | This affects the appearance of IME overlays. e.g. when typing Hangul or Pinyin |
| ui.IMESelectedRawTextBackground | String | `#7755FF` | |
| ui.key.menuAccessKeyFocuses | Boolean | false | Disable Alt-key opening menubar if you use my Alt+M hotkey |
| ui.SpellCheckerUnderline | String | `#E2467A` | |
| ui.prefersReducedMotion | Number | 0 | |
| ui.submenuDelay | Number | 100 | These aren't required, but feel more responsive imo |
| ui.tooltipDelay | Number | 100 | |
| ui.skipNavigatingDisabledMenuItem | Number | 1 | When focusing menuitems with arrow keys, skip disabled items |
| ui.SpellCheckerUnderlineStyle | Number | 1 | Use dotted underline for spell checker |
| <i>ui.systemUsesDarkTheme</i> | Number | 1 | Currently required; working on a light mode |
| ui.textHighlightBackground | String | `#7755FF` | These prefs control the appearance of text highlighted by the findbar. I choose white text on purple/pink background |
| ui.textHighlightForeground | String | `#FFFFFF` | |
| ui.textSelectBackground | String | `#FFFFFF` | |
| ui.textSelectBackgroundAttention | String | `#FF3388` | |
| ui.textSelectBackgroundDisabled | String | `#000000` | |
| ui.textSelectForegroundAttention | String | `#000000` | |
| ui.textSelectForegroundCustom | String | `#7755FF` | |
| userChrome... | | | Several of my scripts use custom prefs beginning with `userChrome` for user customization. See the individual script files for details |
| userChrome.bookmarks-toolbar.icons-only | Boolean | false | If true, bookmark buttons in the toolbar are just square icons |
| userChrome.css.mac-ui-fonts | Boolean | true | Replace UI font with SF Pro, the system font for macOS. [Click here for details](#fonts) |
| userChrome.css.menupopup-shadows | Boolean | true | Add a shadow behind context menus and panels |
| userChrome.css.remove-menu-borders | Boolean | false | If true, remove the thin border on context menus, panels, etc. |
| userChrome.css.remove-tooltip-borders | Boolean | false | If true, remove the thin border on tooltips. If false, use [tooltipShadowSupport.uc.js](#tooltip-shadow-support) |
| userChrome.css.ctrl-tab-backdrop-overlay | Boolean | true | If true, dim the whole screen behind the Ctrl+tab panel, like Windows 10's Alt+tab overlay |
| userChrome.tabs.all-tabs-menu.reverse-order | Boolean | true | Display all tabs menu in reverse order (newer tabs on top, like history) |
| userChrome.tabs.new-loading-spinner-animation | Boolean | true | Replace the tab loading throbber with a spinning animation |
| userChrome.tabs.pinned-tabs.close-buttons.disabled | Boolean | true | This controls whether close buttons are shown on pinned tabs |
| userChrome.tabs.rounded-outer-corners.disabled | Boolean | false | This controls whether tabs have rounded bottom corners<br/><img src="preview/prev-tabcorners.webp" width="100%"/> |
| userChrome.urlbar.hide-bookmarks-button-on-system-pages | Boolean | true | Hides the urlbar's bookmark button on system pages & new tab page |
| userChrome.urlbar-results.disable\_animation | Boolean | false | Toggle to `true` if you don't want urlbar animations |
| widget.content.allow-gtk-dark-theme | Boolean | true | Makes Linux theming more consistent |
| widget.disable-native-theme-for-content | Boolean | true | Enables Firefox's custom appearance for elements like checkboxes. Skips the "native" appearance given by the OS stylesheets. |
| <i>widget.macos.native-context-menus</i> | Boolean | false | Required to use some of my scripts on macOS, and for context menu styles on macOS |

</details>

## **Theme: (CSS)**

### **Setup:**

As with any CSS theme, you need to make a `chrome` folder in your profile's root directory (which can be found in `about:profiles`) and place the files from this repo into it. For user stylesheets to work you also need to enable some of the prefs described above, or download the [user.js](/user.js) file and place it in your profile's root directory. This will allow the basic userChrome and userContent stylesheets to take effect, but some additional steps are required beyond that.

This theme requires more technical setup than most because it changes a lot of lower-level stuff like javascript methods and icon/animation source code, but if you follow the instructions fully it'll work for anyone on any modern desktop OS, regardless of background knowledge. It requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) to register the icon package and replace some of Firefox's lower-level stylesheets. Instructions for setting up fx-autoconfig are [below](#installation). To be clear, this _specific_ loader is required, unless you know how to register your own manifest from scratch.

The theme is tightly integrated with some (though not all) of the scripts on this repo. Although fx-autoconfig is mainly required for the purpose of registering files with the manifest, it also allows you to load scripts. So because you already need fx-autoconfig for the basic theme to work, I recommend reading through the [scripts section](#scripts) to decide which scripts you want to use. Scripts with an asterisk \* next to their description are particularly important for the theme to work as intended. Please ***do not*** download the entire script folder and dump it in your chrome folder. Unlike the CSS, not all of the scripts are meant to be used at the same time. For example, a few scripts have both a standalone and a theme version which are totally redundant.

#### **Resources & manifest:**

If you haven't already, download the [resources](/resources) folder and place it in your `chrome` folder, along with the CSS files. fx-autoconfig will automatically register this folder to the path `chrome://userchrome/content/`. This theme also requires downloading [utils/chrome.manifest](/utils/chrome.manifest). Most of the theme will work without it, but it's crucial for certain things.

In particular, it replaces some icons and modifies some internal scripts and stylesheets that would be very hard to override with either CSS or javascript. Simply replace the chrome.manifest file from fx-autoconfig with my version. This will strictly redirect some `chrome://` URIs from the vanilla files to files from this theme, so the changes will apply globally. Without this, it would be very difficult to do certain things. We use this to restore the pre-proton tab sound icons, to change the appearance of plaintext files and other lower-level internal pages, and to change the styling for very hard-to-reach elements.

For example, menupopup scrollbuttons are contained in shadow trees within shadow trees. There is no way to select them with any kind of specificity except to use javascript to give them custom classes/attributes, _or_ to inject stylesheets into the shadow trees. I used to use the latter method but now that we use the manifest so liberally (and still judiciously) it makes more sense to modify arrowscrollbox.css with the manifest. So now we can make blanket changes to how these elements are styled without losing the ability to select attributes or classes on the shadow host.

The manifest also makes it _much_ easier to change icons, and makes it possible to customize some icons that would be simply impossible to change otherwise. For example you would not be able to change the icon for an element like `<image src="chrome://global/skin/icons/icon.svg">` because `src` is not a CSS property. But with the manifest, we can change which icon actually exists at that URL. For all these reasons, the manifest has become a central part of this theme and is one of my go-to solutions for difficult problems because it's so clean.

**_NOTE_**: By default, fx-autoconfig expects scripts to be in the folder called `JS`, whereas mine are in an equivalent folder called `script`. The manifest is what sets the URLs of everything. It gives the JS or script folder a URL `chrome://userscripts/content`, which the loader uses to find your scripts. Replacing the manifest with mine changes it so that it looks for the `script` folder, so if you use my manifest, make sure the script folder in your profile's chrome directory is called `script` rather than `JS`.

#### **Updating:**

[Release packages](/../../releases/) are available as a courtesy, but since the theme and scripts are updated on a daily basis to keep up with Nightly, the latest release package may not be completely up to date. If you want the very latest stylesheets/scripts, you should either [clone the repo](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/cloning-a-repository-from-github/cloning-a-repository) directly to your profile's `chrome` folder, (use [GitHub Desktop](https://desktop.github.com/) if all of this sounds like gibberish to you) or download individual folders with [GitZip](https://addons.mozilla.org/en-US/firefox/addon/gitzip/) or [Refined GitHub](https://addons.mozilla.org/en-US/firefox/addon/refined-github-/).

### **Details:**

The `userContent.css` file handles stuff like the devtools, some UI pages and context menus, plaintext pages, browser background color while pages are loading, and the built-in HTML video player. It also includes some reskins for specific websites and extensions, like my personal dark mode layout for Wikipedia, or [Dark Reader's](https://addons.mozilla.org/en-US/firefox/addon/darkreader/) popup. The Firefox UI is increasingly integrated with content browsers, so it's not feasible to make a theme so dramatically different from vanilla Firefox without userContent.css. The big content area isn't the only browser, there are tiny ones all over the place. For example, several modal dialogs that appear to be part of the parent process are actually content.

So `userContent.css` isn't strictly required for the rest of the theme to work, but without it you'll find some elements look inconsistent with the theme, and it also takes care of some issues that make the fabled global dark mode harder to realize. If you already have a `userContent` file, I'd suggest changing its name and adding `@import url(personal-userContent.css)` to the end of the theme's [userContent](/userContent.css) file, so it loads last and therefore wins any conflicts of equal priority & specificity. Then you can delete any of the [content stylesheets](/resources/in-content) you don't want to use, or remove their `@import` rules from userContent.css.

#### **Fonts:**

`userChrome.css` doesn't require any fonts, but there's an optional preference in about:config which lets you replace fonts in the UI (not in-content) with [SF Pro](https://developer.apple.com/fonts/), macOS's system font, on Windows or Linux. You can enable this by [downloading the font](https://devimages-cdn.apple.com/design/resources/download/SF-Pro.dmg), unpacking it with 7-Zip, installing it as normal, and setting `userChrome.css.mac-ui-fonts` to `true` in about:config. This requires a local copy of all variants of the font, including "SF Pro," "SF Pro Display," "SF Pro Text," and "SF Pro Rounded." Additionally, `userContent.css` can use [Overpass Mono](https://fonts.google.com/specimen/Overpass+Mono) for plaintext files, if you have it installed. Otherwise it just uses your default monospace font.

#### **Further modification:**

If you want the functional features shown in the animations, you'll need to install some of the scripts. The stylesheets do not strictly require installing any scripts, but some scripts are designed to solve problems that CSS can't, so I recommend reading the full list of [script descriptions](#script-descriptions). Since the theme itself already requires fx-autoconfig, installing the scripts doesn't require any extra time or setup. Most scripts do not require installing the CSS theme either, but the few exceptions are noted in the descriptions and at the top of each script file. Instructions and explanations for the scripts are [below](#installation).

Most of the important colors can be changed in [uc-low-globals.css](resources/layout/uc-low-globals.css), [uc-globals.css](/uc-globals.css) and [uc-variables.css](/uc-variables.css). Changing the hues is easy, but at the moment I wouldn't recommend trying to convert it to a "light" color scheme. Also, instead of modifying uc-globals and uc-variables directly, it'll be easier to make your own stylesheet that overrides the variables. Then you can just add `@import url(uc-overrides.css);` to the end of [userChrome.css](/userChrome.css) and after the `@import` statements in [userContent.css](/userContent.css) and [userChrome.ag.css](/userChrome.ag.css).

## **Scripts:**

The files in the script folder are not content scripts like you'd load in Tampermonkey. They're meant to execute in the same context as Firefox's internal scripts. They're scripts for the Firefox frontend itself rather than for webpages. This is sort of analogous to gaining "privileges" to modify your UI document directly. With CSS alone you can only do so much. Even a lot of features that appear to be purely visual may require JavaScript, like the search engine icons shown in the GIF above.

They need to be loaded by an autoconfig script loader. I recommend [**fx-autoconfig by MrOtherGuy**](https://github.com/MrOtherGuy/fx-autoconfig) which is extremely robust. Some of my scripts are not fully compatible with loaders other than MrOtherGuy's. In particular, most will be incompatible with xiaoxiaoflood's loader, and a few will be incompatible with Alice0775's loader.

If you use any of my scripts, please disable telemetry by going to `about:preferences#privacy` and unticking the box towards the bottom that says "Allow Nightly to send technical and interaction data to Mozilla." Because we're modifying the way the browser's internal systems work, sending Mozilla data about your interactions is not only useless but actively confounding. Any interaction data emitted by functions that we modify with these scripts have the potential to confuse and mislead Firefox developers and waste valuable time.

### **Installation:**

You first need to find your Firefox installation folder. On Windows that's `C:/Program Files/Firefox Nightly/`. On Linux it should be `usr/lib/firefox/`. On macOS this is more complicated. You need to open the application file itself, probably in `Macintosh HD/Applications/`. It's the file you double-click to open Firefox, but it's actually a package, not a binary. If you right click it, there will be an option in the context menu labeled "Show Package Contents." Clicking this takes you to the app constants. From there, navigate to `Contents/Resources/` to reach the root directory. So whichever OS you're on, you should end up with...

1. &nbsp; a file called `config.js` in your Firefox installation's root directory;
2. &nbsp; a folder called `defaults` in the root directory;
3. &nbsp; a folder called `pref` inside that `defaults` folder;
4. &nbsp; a file called `config-prefs.js` inside that `pref` folder;
5. &nbsp; a `JS` folder in your profile's chrome folder;
6. &nbsp; a `utils` folder in your `chrome` folder, containing `chrome.manifest` and `boot.jsm`;

\*If you're using my **theme**, (the CSS files) you should also have a `resources` folder in your `chrome` folder, containing all the icons, and you should rename the `JS` folder to `script`.

You may already have a file called `channel-prefs.js` inside the `pref` folder. This is unrelated, so leave it alone.

If you're using fx-autoconfig like I recommended, then your scripts should go in the `JS` folder by default. (or `script` folder if you're using my theme) You can actually rename the folder to anything you want, as long as you edit the 2nd line in [utils/chrome.manifest](/utils/chrome.manifest) to reflect the new folder name. Any agent sheets or author sheets (files ending in .ag.css or .au.css) should go in the `chrome` folder with your regular stylesheets.

### **Usage:**

After you've installed the files, the script loader will locate any scripts you place in the proper folder that end in .uc.js. Once you have all this set up you can download scripts, put them in the correct folder for your script loader, restart, and you should see the changes immediately. When updating scripts, be sure to clear your startup cache. With fx-autoconfig, you can click "Tools" in the menubar, then "userScripts," then "Restart now!" and it will clear the startup cache as it restarts. Without fx-autoconfig, there are still methods you can use from the browser console but they will cause Firefox to restart with the devtools still open, which is unstable. Instead, I'd recommend going to `about:profiles` and click the "Open Folder" button in your profile's local directory row. Then quit Firefox, and in the local directory delete the folder labeled `startupCache` before restarting the browser.

#### **Special stylesheets:**

In the main directory on this repo you might notice two files: [userChrome.ag.css](/userChrome.ag.css) and [userChrome.au.css](/userChrome.au.css). The _"ag"_ is an abbreviation for user _agent_ sheet, and _"au"_ is an abbreviation for _author_ sheet. They're used for rules that would not work if we put them in `userChrome.css`. But Firefox will not load these stylesheets on its own. These are loaded by the [Agent/Author Sheet Loader](#agentauthor-sheet-loader). The script does the same general thing as two of the files included with fx-autoconfig, but if you want the stylesheets to work in the devtools, (e.g. for context menus) you need the script from my repo. And since you don't want to load duplicate stylesheets, delete the scripts included in fx-autoconfig's JS folder.

These agent/author sheets handle some of the most common and problematic elements like tooltips, scrollbars, etc. The main purposes for using special stylesheets are 1) to use CSS syntax that is forbidden to user sheets, such as the `::part(...)` pseudo-element; 2) to style native-anonymous content like default tooltips or scrollbars; or 3) to override the vanilla style rules without needing to use the `!important` tag. In particular, we can use the author sheet to make (or revert) general rules without affecting more specific rules in the built-in stylesheets, or dealing with a bunch of style conflicts and cascading confusion.

\* _Other themes/loaders, including older versions of this theme, may use the file suffix `.as.css` for the agent sheet, instead of `.ag.css`. I've switched to "ag" for the sake of consistency with fx-autoconfig. If you have a `userChrome.as.css` file left over from something, you can just delete it and replace it with `userChrome.ag.css`. The [agent sheet loader](#agentauthor-sheet-loader) will ignore `.as.css` files._

#### **Updating:**

Firefox is updated every night, so my theme and scripts are updated on a regular basis to ensure compatibility with the latest build from [mozilla-central](https://hg.mozilla.org/mozilla-central/), which is distributed through the [Firefox Nightly](https://www.mozilla.org/en-US/firefox/channel/desktop/#nightly) branch. If you update Firefox and a script stops working, or your UI suddenly looks ugly, check the repo before you file a bug report or complain that something's broken. Compare the `@version` number at the top of a given file to the version of your copy. If you're sure you have the latest version, then remove it for now and wait a day or two. I use this theme and almost all of the scripts myself, and I use Firefox Nightly on a daily basis, so it's not like I'm going to leave something in my setup broken for longer than a day or two.

If your problem is still not fixed after a couple days, or you think it might just be a detail I overlooked, (everyone has unique browsing habits, Firefox has a lot of interfaces that some users may never see, myself included) feel free to post in the [Issues](/../../issues/) or [Discussions](/../../discussions/) section. But please don't bother complaining if you're not using the Nightly branch. In order to make this work for the latest version of Firefox, I have no choice but to potentially make it incompatible with older versions of Firefox, stable or not. Just like Firefox updates can break our mods, updating our mods to keep up with Firefox can break them in older versions. I have no plans to make a second version for any Firefox version other than the latest Nightly release.

#### **Styling Browser Toolbox Windows:**

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

### **Script descriptions & links:**

<p><small><super>(<i>Click a script's name to download it</i>)</br><i>* &nbsp;means you definitely want to download the script if you use my theme</i></super></small></p>

#### [about:cfg](/script/aboutCfg.uc.js):

Registers the old-school about:config page to the URL `about:cfg`. Intended for use with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. That module restores the old pre-87 about:config page, but gives it a long-winded URL like `chrome://userchromejs/content/aboutconfig/config.xhtml` which takes a lot longer to type in and doesn't look very elegant. This script finds the URL for that module and registers it to an about: URL so it counts as a chrome UI page. We're not just faking it, this makes it a bona-fide about: page. That means you can navigate to it by just typing about:cfg in the urlbar, and also means the identity icon will show it as a secure system page rather than a local file. It even means about:cfg will show up on the about:about page! For instructions on installing earthlng's aboutconfig module for [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig), please see the next script description below.<p>There's a config setting in the script if you want to change the "cfg" in about:cfg to something else. This script has only been tested with fx-autoconfig, but it may work with xiaoxiaoflood's loader. I don't think it will work with Alice0775's loader but I haven't tested it. This is fully compatible with [App Menu about:config Button](#app-menu-aboutconfig-button). (the next script down) That button will automatically navigate to about:cfg if this script is installed. I recommend editing the `config.xhtml` file in earthlng's module to remove line 13: `title="about:config"`. This line sets the tab's title to about:config, which isn't necessary or desirable since we're fundamentally changing the URL to about:cfg. Without the title attribute, Firefox will automatically set the title to the tab's URL, which (with this script) is about:cfg. Another minor improvement is to add this to line 20, after the `<window>` element: `<html:link rel="icon" href="chrome://branding/content/about-logo.svg"/>`. This will add a Firefox logo favicon to the tab instead of the default globe favicon.</p>

#### [App Menu about:config Button](/script/appMenuAboutConfigButton.uc.js):

Adds an about:config shortcut button to the main app menu panel, under the built-in Settings button. It can open the built-in about:config page, or it can open the old-school about:config page with earthlng's [aboutconfig](https://github.com/earthlng/aboutconfig) module. <details><summary><i><b>To use earthlng's about:config page with fx-autoconfig...</b></i></summary><p>download ONLY the profile/chrome/utils/aboutconfig folder and place it inside your profile/chrome/resources folder. Then open `config.xhtml` and find & replace "userchromejs" with "userchrome" and save. Now `chrome://userchrome/content/aboutconfig/config.xhtml` should be the correct URL, and the script will find it there. If it's not present there or at `chrome://userchromejs/content/aboutconfig/config.xhtml` (the default if you only use earthlng's module without fx-autoconfig) or `chrome://userchromejs/content/aboutconfig/aboutconfig.xhtml`, (the default for xiaoxiaoflood's version) then the script will use the vanilla "about:config" URL instead.</p><p>If you can't get the module to work or if you just prefer Firefox's built-in page, you can change the constant on line 12 of my script to "about:config" and it'll open to the same page you'd get if you typed about:config in the address bar. If you do use earthlng's module and the script just can't find the URL because you have an unorthodox setup or something, you can type the exact URL there to fix it. Make sure the URL is within the quotes. FYI I added an icon for this button (and for all the other main app menu buttons too) in [uc-app-menu.css](/uc-app-menu.css)</p></details>

#### [App Menu Mods](/script/appMenuMods.uc.js):

Makes some minor modifications to the app menu, aka the hamburger menu. It adds a restart button to the app menu, as long as you're using fx-autoconfig to load the script. Right-clicking the button or holding Shift or Ctrl/Cmd while left-clicking it will also clear the startup cache while restarting. Additionally, it changes the "Add-ons and Themes" button to say "Extensions" (or whatever the equivalent is in your language, since the strings are localized automatically) and it adds a separator under the "Manage Account" button in the profile/account panel. I'll continue adding more mods to this script as I think of them.

#### [All Tabs Menu Expansion Pack](/script/allTabsMenuExpansionPack.uc.js):

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
7. Includes a preference `userChrome.tabs.all-tabs-menu.reverse-order` that lets you reverse the order of the tabs so that newer tabs are displayed on top rather than on bottom.
8. Modifies the all tabs button's tooltip to display the number of tabs as well as the shortcut to open the all tabs menu, Ctrl+Shift+Tab.
9. Allows the panel to display pinned tabs, and displays a pin icon on them.
10. Makes the sound icon show if the tab has blocked media or media in picture-in-picture, just like regular tabs.
11. And a few other subtle improvements.

All the relevant CSS for this script is already included in and loaded by the script. It's designed to look consistent with my theme as well as with the latest vanilla (proton) Firefox. If you need to change anything, see the "const css" line in here, or the end of uc-tabs-bar.css on my repo.

</details>
<img src="preview/prev-alltabs-xpac.webp"/>

#### [Vertical Tabs Pane](/script/verticalTabsPane.uc.js):

<details><summary>This script create a vertical pane across from the sidebar that functions like the vertical tabs pane in Microsoft Edge. <i><b>Click here for details.</b></i></summary>

It doesn't hide the tab bar since people have different preferences on how to do that, but it sets an attribute on the root element that you can use to hide the regular tab bar while the vertical pane is open, for example `:root[vertical-tabs] #TabsToolbar...`

By default, the pane is resizable just like the sidebar is. And like the pane in Edge, you can press a button to collapse it, and it will hide the tab labels and become a thin strip that just shows the tabs' favicons. Hovering the collapsed pane will expand it without moving the browser content. As with the `[vertical-tabs]` attribute, this "unpinned" state is reflected on the root element, so you can select it like `:root[vertical-tabs-unpinned]...`

Like the sidebar, the state of the pane is stored between windows and recorded in preferences. There's no need to edit these preferences directly. There are a few other preferences that can be edited in about:config, but they can all be changed on the fly by opening the context menu within the pane. The new tab button and the individual tabs each have their own context menus, but right-clicking anything else will open the pane's context menu, which has options for changing these preferences.

- `Move Pane to Right/Left` will change which side the pane (and by extension, the sidebar) is displayed on, relative to the browser content. Since the pane always mirrors the position of the sidebar, moving the pane to the right will move the sidebar to the left, and vice versa.
- `Reverse Tab Order` changes the direction of the pane so that newer tabs are displayed on top rather than on bottom.
- `Expand Pane on Hover/Focus` causes the pane to expand on hover when it's collapsed. When you collapse the pane with the unpin button, it collapses to a small width and then temporarily expands if you hover it, after a delay of 100ms. Then when your mouse leaves the pane, it collapses again, after a delay of 100ms.
- Both of these delays can be changed with the `Configure Hover Delay` and `Configure Hover Out Delay` options in the context menu, or in about:config.

The pane itself can be turned on or off with a hotkey (Ctrl+Alt+V) or by clicking the toolbar button, which is automatically added to the tab strip and to the top of the pane. As with most toolbar buttons, the toggle button in the navbar can be moved/removed in the "Customize toolbar" menu. The hotkey can be changed by editing the `config` section in the script.

For languages other than English, the labels and tooltips can be modified directly in the `l10n` object inside the script file. All the relevant CSS for this script is already included in and loaded by the script. It's designed to look consistent with my theme as well as with the latest vanilla (proton) Firefox. If you need to change anything, I recommend doing it in userChrome.css, since any rules you add with `!important` will override this stylesheet's rules. If you don't know where to begin, scroll down to the `let css` line in the script to see the included stylesheet.

The pane's selector is `#vertical-tabs-pane`. While it's open, it will have attribute `[checked]`. While it's unpinned, `[unpinned]` and while expanded, `[expanded]`. While it's on the left, it will have `[positionstart]` just like the built-in sidebar. So you can use those selectors for your own purposes the same way the built-in stylesheet does. Although they're styled a little differently, the individual tab rows are structurally just like the rows in Firefox's built-in all-tabs panel, so if you have custom styling for that panel, you can use it here with minimal changes.

In order to make the scrolling feel just like the built-in tabs bar, I used an `arrowscrollbox` element as the container. It has generally smooth scrolling irrespective of the pointing device, which is a nice feature for an element you expect to scroll frequently. But this means there isn't a visible scrollbar. I could make a config option in the script that switches from `arrowscrollbox` to a regular `vbox` element, which does show its scrollbar. But it would need to be tested extensively just like I did with the arrowscrollbox, so if anyone really wants this, let me know and I'll take it into consideration.

</details>
<img src="preview/prev-vertical-tabs-pane.webp"/>

#### [Toolbox Button](/script/atoolboxButton.uc.js):

Adds a new toolbar button for devtools features. Probably the single most valuable file on this repo, in my opinion. 1) opens the content toolbox on left click; 2) opens the browser toolbox on right click; 3) toggles "Popup Auto-Hide" on middle click. (mouse buttons can be configured by preference) By default, it also disables popup auto-hide when you open a toolbox window, and re-enables it when you close the toolbox. (there's a pref to disable this feature)<p>The icon changes to show whether popup auto-hide is enabled or disabled, and a badge on the button shows whether any toolbox windows are open. Middle-clicking to toggle popup auto-hide also shows a brief confirmation hint, to make it easier to keep track of the state of the preference. See the description at the top of the file for details about usage, configuration, and localization.</p><details><summary><i><b>Click here for a preview of the toolbox button's middle click function.</b></i></summary><img src="preview/prev-popup-autohide.webp"/></details>

#### [Bookmarks Popup Mods](/script/bookmarksPopupShadowRoot.uc.js):

Implement smooth scrolling for all bookmarks popups that are tall enough to scroll. Add unique classes to their shadow parts so they can be styled selectively in CSS. Add special click functions to their scroll buttons — hovering a scroll button will scroll at a constant rate, as normal. (though faster than vanilla) But clicking a scroll button will immediately jump to the top/bottom of the list. Combined with [uc-bookmarks.css](/uc-bookmarks.css), overhauls the appearance of the scroll buttons.

#### [Bookmarks Menu & Button Shortcuts](/script/bookmarksMenuAndButtonShortcuts.uc.js):

Adds some shortcuts for bookmarking pages. First, middle-clicking the bookmarks or library toolbar button will bookmark the current tab, or un-bookmark it if it's already bookmarked. Second, a menu item is added to the bookmarks toolbar button's popup, which bookmarks the current tab, or, if the page is already bookmarked, opens the bookmark editor popup. These are added primarily so that bookmarks can be added or removed with a single click, and can still be quickly added even if the bookmark page action is hidden for whatever reason. Third, another menu item is added to replicate the "Search bookmarks" button in the app menu's bookmarks panel. Clicking it will open the urlbar in bookmarks search mode.

#### [Clear Downloads Panel Button](/script/clearDownloadsButton.uc.js):

Place a "Clear Downloads" button in the downloads panel, right next to the "Show all downloads" button.

#### [Copy Current URL Hotkey](/script/copyCurrentUrlHotkey.uc.js):

Adds a new hotkey (Ctrl+Alt+C by default) that copies whatever is in the urlbar, even when it's not in focus. Key and modifiers are configurable in the script file.

#### [Debug Extension in Toolbar Context Menu](/script/debugExtensionInToolbarContextMenu.uc.js):

Adds a new context menu when right-clicking an add-on's button in the toolbar or urlbar, any time the "Manage Extension" and "Remove Extension" items are available. The new "Debug Extension" menu contains 7 items: _"Extension Manifest"_ opens the extension's manifest directly in a new tab. Aside from reading the manifest, from there you can also see the whole contents of the extension by removing "/manifest.json" from the URL. _"Popup Document"_ opens the extension's popup URL (if it has one) in a regular browser window. The popup URL is whatever document it displays in its panel view. _"Options Document"_ opens the document that the extension displays in its submenu on about:addons, also in a regular browser window. _"Inspect Extension"_ opens a devtools tab targeting the extension background. This is the same page you'd get if you opened about:debugging and clicked the "Inspect" button next to an extension. _"View Source"_ opens the addon's .xpi archive. And, as you'd expect, _"Copy ID"_ copies the extension's ID to your clipboard, while _"Copy URL"_ copies the extension's base URL, so it can be used in CSS rules like `@-moz-document`</p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/prev-debug-ext.webp" width="386"/></details>

#### [Extension Options Panel](/script/extensionOptionsPanel.uc.js):

This script creates a toolbar button that opens a popup panel where extensions can be configured, disabled, uninstalled, etc. Each extension gets its own button in the panel. Clicking an extension's button leads to a subview where you can jump to the extension's options, disable or enable the extension, uninstall it, configure automatic updates, disable/enable it in private browsing, view its source code in whatever program is associated with .xpi files, open the extension's homepage, or copy the extension's ID. The panel can also be opened from the App Menu, since the built-in "Add-ons and themes" button is replaced with an "Extensions" button that opens the panel, which in turn has an equivalent button inside it. Based on a [similar script](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/extensionOptionsMenu.uc.js) by xiaoxiaoflood, but will not be compatible with xiaoxiaoflood's loader. This one requires fx-autoconfig or Alice0775's loader. It opens a panel instead of a menupopup, for more consistency with other toolbar widgets. The script can be configured by editing the values in `static config` on line 11.</p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/prev-ext-opt-panel.webp"/></details>

#### [Eyedropper Button](/script/eyedropperButton.uc.js):

Adds a toolbar button that implements the color picker without launching the devtools or opening any popups. That is, you can click the button and then immediately click anywhere inside the content window to copy the color of that pixel to your clipboard. Similar to the menu item in the "More Tools" and "Tools > Browser Tools" menus, only this one can be placed directly on your toolbar. The script also adds a customizable hotkey that does the same thing — by default, it's Ctrl+Shift+Y. (or Cmd+Shift+Y on macOS) The color format is determined by `devtools.defaultColorUnit`. For example, changing this preference to "hsl" will give you results like `hsl(25, 75%, 50%)`.

#### [Mini Findbar Matches Label](/script/findbarMatchesLabel.uc.js):

\* Makes the label for findbar matches way more concise, miniaturizes the "Match Case" and "Whole Words" buttons, and also adds a Ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some CSS from [uc-findbar.css](/uc-findbar.css) or at least some tinkering with your own styles. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes Ctrl+F more of a findbar toggle than a key that strictly opens the findbar.

#### [Floating Sidebar Resizer](/script/floatingSidebarResizer.uc.js):

\* [uc-sidebar.css](/uc-sidebar.css) makes the sidebar float over the content without flexing it, but that changes the way sidebar resizing works. This script is required to make the floating sidebar resizable. It also optionally improves the hotkeys a little bit so that Ctrl+B (or Cmd+B) toggles the sidebar on/off instead of exclusively opening the bookmarks sidebar. Instead the hotkey to jump to the bookmarks sidebar has been remapped to Ctrl+Shift+B. This key combination normally toggles the bookmarks toolbar on and off, but I figured it was worth replacing, since you probably either never use the bookmarks toolbar, or keep it open it all the time. Whereas the sidebar is something you're going to want to turn off when you're done using it, since it takes up a lot of space. My stylesheet makes the bookmarks toolbar hide automatically and only show when the nav-bar is being hovered, so a hotkey isn't really necessary. (bookmarks toolbar hiding is further enhanced with [Auto-hide Nav-bar Support](#auto-hide-nav-bar-support), FYI)

#### [Fluent Reveal Tabs](/script/fluentRevealTabs.uc.js):

Adds a pretty visual effect to tabs similar to the spotlight gradient effect on Windows 10's start menu tiles. When hovering a tab, a subtle radial gradient is applied under the mouse. Also applies to tabs in the "All tabs menu," and is fully compatible with my All Tabs Menu Expansion Pack. User configuration is towards the top of the script. Inspired by this [proof of concept](https://www.reddit.com/r/FirefoxCSS/comments/ng5lnt/proof_of_concept_legacy_edge_like_interaction/), and built on a modified version of [this library](https://github.com/d2phap/fluent-reveal-effect).

#### [Fluent Reveal Navbar Buttons](/script/fluentRevealNavbar.uc.js):

Adds the same Windows 10-style effect to navbar buttons. When hovering over or near a button, a subtle radial gradient is applied to every button in the vicinity the mouse. This is compatible with [Fluent Reveal Tabs](#fluent-reveal-tabs) so you can use both if you want. The navbar button version has more of a performance hit. I wouldn't recommend using it on weaker hardware if your setup is already pretty heavy with scripts, CSS animations/transitions, or other stateful modifications. </p><details><summary><i><b>Click here for a preview.</b></i></summary><img src="preview/fluent-reveal-navbar.webp"/></details>

#### [Fullscreen Hotkey](/script/fullscreenHotkey.uc.js):

All this does is remap the fullscreen shortcut key from F11 to Ctrl+E, since I use F11 for other purposes.

#### [Auto-hide Nav-bar Support](/script/autoHideNavbarSupport.uc.js):

\* In fullscreen, the nav-bar hides automatically when you're not using it. But it doesn't have a very smooth animation. This sets up its own logic to allow CSS transitions to cover the animation. You can use this for any toolbar, whether in fullscreen or not. duskFox just uses it for the bookmarks/personal toolbar, as well as for the navbar while in fullscreen, but your CSS can use it under any circumstances with `popup-status="true"`. The CSS transitions are in [uc-fullscreen.css](/uc-fullscreen.css) but you can also do your own thing with this script by using selectors like `box[popup-status="true"] > #navigator-toolbox > whatever`<p>Without this script, there also isn't any good way to pass information to findbars or sidebars about whether the nav-bar is hovered/focused or popups are open. For the floating findbar and sidebar to work seamlessly, they need to be aware of information like that so they can move up and down in fullscreen when the navbar is hidden/shown. But they're not in the same ancestral chain as the navbar or the popups' anchors, so that information needs to be added to some high-level element with a script, like the parent of `#navigator-toolbox`. So we can style anything the navbar or the browser container according to `[popup-status]` and `[urlbar-status]`. We also use this to automatically fade/reveal the bookmarks toolbar.</p>

#### [Hide Tracking Protection Icon on Custom New Tab Page](/script/hideTrackingProtectionIconOnCustomNewTabPage.uc.js):

\* Hide the url bar's tracking protection icon on the home page and new tab page, even if they are custom pages added by extensions. This is strongly recommended if you use my CSS theme. <details><summary>**_More details..._**</summary><p>By default, Firefox hides the tracking protection while 1) the current tab is open to the default new tab page or default home page; or 2) the user is typing into the url bar. Hiding the icon while the user is typing is unnecessary, since although `pageproxystate` has changed, the content principal is still the same and clicking the tracking protection icon to open the popup still works. Opening the popup while `pageproxystate` is invalid still loads the tracking details and options for the current content URI. But hiding the icon on the new tab page or home page is necessary, because the tracking protection icon is hidden on `about:blank`.</p><p>If you use an extension to set a custom new tab page, you will see the tracking protection icon briefly disappear when opening a new tab, before reappearing as the custom new tab page loads. That is because `about:blank` loads before the custom new tab page loads. So the icon is hidden and unhidden in the span of a hundred milliseconds or so. This looks very ugly, so my stylesheet has always prevented the tracking protection icon from being hidden on any page, including `about:blank`. That way at least it doesn't disappear. But this isn't a great solution, because there are a number of pages for which the tracking protection icon does nothing. The protection handler can't handle internal pages, for example.</p><p>Previously I just disabled pointer events on the icon when it was supposed to be hidden. But I think this script is a better solution. If this script is not installed, my theme will default to those older methods I just mentioned. But if the script is installed, it will restore the built-in behavior of hiding the tracking protection icon on internal pages, only it will also hide the icon on the user's custom new tab page and home page. The icon will still be visible if you're on a valid webpage, (web or extension content, not local or system content) even if you begin typing in the urlbar.</p></details>

#### [Let Ctrl+W Close Pinned Tabs](/script/letCtrlWClosePinnedTabs.uc.js):

The name should say it all — this just removes the "feature" that prevents you from closing pinned tabs with the Ctrl+W/Cmd+W shortcut. I can't think of any good reason for this, it's not like your hand is likely to slip and hit Ctrl+W by accident. And freeing up the key combination isn't helpful, since every web and extension developer knows the key combination is already taken by every major browser. Blocking the hotkey on pinned tabs just wastes a prime key combination, as well as the user's time.

#### [Nav-bar Toolbar Button Slider](/script/navbarToolbarButtonSlider.uc.js):

\* My masterpiece, wrap all toolbar buttons after `#urlbar-container` in a scrollable div. It can scroll horizontally through the buttons by scrolling up/down with a mousewheel, like the tab bar. This is meant to replace the widget overflow button that appears to the right of your other toolbar buttons when you have too many to display all at once. Instead of clicking to open a dropdown that has the rest of your toolbar buttons, you can just place all of them in a little horizontal scrollbox. Better yet, you can scroll through them with mousewheel up/down, just like the tab bar. This and the toolbox button have been the most valuable for me personally. <details><summary><i><b>For user configuration...</b></i></summary>This script has several options which can be modified in about:config. By default, it wraps all toolbar buttons that come _after_ the urlbar. (to the right of the urlbar, normally) You can edit `userChrome.toolbarSlider.wrapButtonsRelativeToUrlbar` in about:config to change this: the default value is `after`; a value of `before` will wrap all buttons to the left of the urlbar; and a value of `all` will wrap all buttons. You can change `userChrome.toolbarSlider.width` to make the container wider or smaller. If you choose `12`, it'll be 12 buttons long. When the window gets _really_ small, the slider disappears and the toolbar buttons are placed into the normal widget overflow panel. You can disable the overflow panel entirely by setting `userChrome.toolbarSlider.collapseSliderOnOverflow` to `false`. You can specify more buttons to exclude from the slider by adding their IDs (in quotes, separated by commas) to `userChrome.toolbarSlider.excludeButtons` in about:config. For example you might type `["bookmarks-menu-button", "downloads-button"]` if you want those to stay outside of the slider. You can also decide whether to exclude flexible space springs from the slider by toggling `userChrome.toolbarSlider.excludeFlexibleSpace` in about:config. By default, springs are excluded. There is no visible scrollbar in the slider, since it would look pretty awkward with default scrollbars, but they can be shown with CSS.</details>

#### [One-click One-off Search Buttons](/script/oneClickOneOffSearchButtons.uc.js):

\* Restore old behavior for one-off search engine buttons. It used to be that, if you entered a search term in the url bar, clicking a search engine button would immediately execute a search with that engine. This was changed in an update so that clicking the buttons only changes the "active" engine — you still have to press enter to actually execute the search. You also used to be able to advance through your one-off search engine buttons by pressing left/right arrow keys. Until 2021 these functions could be overridden with a preference in about:config, but those settings were removed. This script restores the old functionality. <details><summary>**_More details..._**</summary><p>If you want to restore the one-click functionality but don't want the horizontal key navigation, go to about:config and toggle this custom setting to false: `userChrome.urlbar.oneOffs.keyNavigation`. The script also hides the one-off search settings button, but this can be turned off in about:config with `userChrome.urlbar.oneOffs.hideSettingsButton`.</p><p>This script also has some conditional functions to work together with [Scrolling Search One-offs](#scrolling-search-one-offs). They don't require each other at all, but they heavily improve each other both functionally and visually. Changing search engines with the arrow keys will scroll the one-offs container to keep the selected one-off button in view. And exiting the query in any way will automatically scroll back to the beginning of the one-offs container, so that it's reset for the next time you use it. The integration between the two is in the form of several subtle little quality-of-life features like that, so it's easier to just test them out together than to explain it all in words.</p></details>

#### [Open Bookmark in Container Tab (context menu)](/script/openBookmarkInContainerTab.uc.js):

Adds a new menu to context menus prompted by right-clicking bookmarks, history entries, etc. that allows you to open them in a container tab. This does basically the same thing as the [similarly-named addon](https://addons.mozilla.org/en-US/firefox/addon/open-bookmark-in-container-tab/) by Rob Wu, except it also supports history entries and synced tabs, and of course the method is very different. By doing this with an autoconfig script instead of an addon, we can make the menu appear in a logical order, towards the top of the context menu where all the other "open in x" menu items are, rather than at the very bottom where context menu items from addons always go.

The menu will be present in *all* context menus where you'd be able to open a bookmark, history entry, or synced tab, including menus, popups, panels, and even the Library/Bookmarks Manager window. However, for synced tabs, it will only be present in the sidebar, not in the profile panel, because the profile panel lacks a context menu in the first place. Right-clicking a synced tab in the profile panel simply opens the synced tab rather than opening a context menu.

#### [Open Link in Unloaded Tab (context menu item)](/script/openLinkInUnloadedTab.uc.js):

Add a new context menu item that can open links in tabs without loading them. The item will appear in all context menus that are prompted by right-clicking on links or other link-like affordances. The menu item will open the link in a new background tab, which will start unloaded or "discarded." Specifically, the context menu entry appears in the content area context menu when right-clicking a link; and in every context menu where bookmarks, history, or synced tabs can be interacted with — sidebar, menubar, toolbar, toolbar button popup, and library window.

This has one user configuration preference: `userChrome.openLinkInUnloadedTab.use_link_text_as_tab_title_when_unknown`. This determines what the tab's title will be when you open an unloaded tab from a link that you've never visited before. Without loading the page, Firefox has no idea what to call the tab. The script will try to find a title from your bookmarks and history, but if it's not present in either, it will simply use the URL for the title. But if this preference is set to `true`, instead of using the link URL for the title, it will use the link *text*.

#### [Private Tabs](/script/privateTabs.uc.js):

An fx-autoconfig port of [Private Tab](https://github.com/xiaoxiaoflood/firefox-scripts/blob/master/chrome/privateTab.uc.js) by xiaoxiaoflood. Adds buttons and menu items allowing you to open a "private tab" in nearly any circumstance in which you'd be able to open a normal tab. Instead of opening a link in a private window, you can open it in a private tab instead. This will use a special container and prevent history storage, depending on user configuration. You can also toggle tabs back and forth between private and normal mode. This script adds two hotkeys: Ctrl+Alt+P to open a new private tab, and Ctrl+Alt+T to toggle private mode for the active tab. These hotkeys can be configured along with several other options at the top of the script file.

#### [Private Window Homepage](/script/privateWindowHomepage.uc.js):

By default, private windows are opened to about:privatebrowsing, regardless of your homepage or new tab page preferences. This script simply removes part of a built-in function that manually sets the URL to about:privatebrowsing. So with this script installed, private windows will behave like ordinary windows in this (and only this) respect. They will still be private windows in every other way, they just won't open to a separate home page.

#### [Remove Search Engine Alias Formatting](/script/removeSearchEngineAliasFormatting.uc.js):

\* Depending on your settings you might have noticed that typing a search engine alias (e.g. "goo" for Google) causes some special formatting to be applied to the text you input in the url bar. This is a trainwreck because the formatting is applied using the selection controller, not via CSS, meaning you can't change it in your stylesheets. It's blue by default, and certainly doesn't match my personal theme very well. This script just prevents the formatting from ever happening at all.

#### [Restore pre-Proton Tab Sound Button](/script/restoreTabSoundButton.uc.js):

\* Proton removes the tab sound button and (imo) makes the tab sound tooltip look silly. This fully restores both, but requires some extra steps, and doesn't restore the tab sound button's CSS styles, since there's no reason to use a script to load an ordinary user stylesheet. If you want to use my sound icon styles, see [uc-tabs.css](/uc-tabs.css#L503). This script _requires_ that you either 1) use my theme, complete with [chrome.manifest](/utils/chrome.manifest) and the [resources](/resources) folder, (in which case you'll already have all of the following files) or 2) download [this file](/resources/script-override/tabMods.uc.js) and put it in `<your profile>/chrome/resources/script-override/`, then edit the [utils/chrome.manifest](/utils/chrome.manifest) file that comes with fx-autoconfig to add the following line (at the bottom):<p>`override chrome://browser/content/tabbrowser-tab.js ../resources/tabMods.uc.js`</p><p>For those who are curious, this will override the tab markup template and some methods relevant to the sound & overlay icons. We can't use a normal script to do this because, by the time a script can change anything, browser.xhtml has already loaded tabbrowser-tab.js, the tab custom element has already been defined, and tabs have already been created with the wrong markup. This wasn't required in the past because `.tab-icon-sound` wasn't fully removed, just hidden. But as of June 06, 2021, the sound button is entirely gone in vanilla Firefox 91. So [tabMods.uc.js](/resources/script-override/tabMods.uc.js) restores the markup and class methods; [restoreTabSoundButton.uc.js](/script/restoreTabSoundButton.uc.js) restores and improves the tooltip; and [uc-tabs.css](/uc-tabs.css#L503) rebuilds the visual appearance.</p><details><summary>If you don't use my theme, restoring the sound button will also require some CSS. <i><b>Click to expand...</b></i></summary>

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
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 18 18"><path fill="context-fill" d="M3.52,5.367c-1.332,0-2.422,1.09-2.422,2.422v2.422c0,1.332,1.09,2.422,2.422,2.422h1.516l4.102,3.633 V1.735L5.035,5.367H3.52z M12.059,9c0-0.727-0.484-1.211-1.211-1.211v2.422C11.574,10.211,12.059,9.727,12.059,9z M14.48,9 c0-1.695-1.211-3.148-2.785-3.512l-0.363,1.09C12.422,6.82,13.27,7.789,13.27,9c0,1.211-0.848,2.18-1.938,2.422l0.484,1.09 C13.27,12.148,14.48,10.695,14.48,9z M12.543,3.188l-0.484,1.09C14.238,4.883,15.691,6.82,15.691,9c0,2.18-1.453,4.117-3.512,4.601 l0.484,1.09c2.422-0.605,4.238-2.906,4.238-5.691C16.902,6.215,15.086,3.914,12.543,3.188z"/></svg>');
    background-size: 12px;
    background-position: center;
    margin-inline-start: 1px;
}
.tab-icon-sound[muted],
.tab-icon-sound[pictureinpicture][muted]:hover {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="18px" height="18px" viewBox="0 0 18 18"><path fill="context-fill" d="M3.52,5.367c-1.332,0-2.422,1.09-2.422,2.422v2.422c0,1.332,1.09,2.422,2.422,2.422h1.516l4.102,3.633V1.735L5.035,5.367H3.52z"/><path fill="context-fill" fill-rule="evenodd" d="M12.155,12.066l-1.138-1.138l4.872-4.872l1.138,1.138 L12.155,12.066z"/><path fill="context-fill" fill-rule="evenodd" d="M10.998,7.204l1.138-1.138l4.872,4.872l-1.138,1.138L10.998,7.204z"/></svg>');
    background-size: 12px;
    background-position: center;
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

#### [Restore pre-Proton Downloads Button](/script/restorePreProtonDownloadsButton.uc.js):

\* Restores the pre-proton downloads button icons and animations. I kept the new progress animation, but I made it thicker. If you use my theme or my icons you'll definitely want this for the sake of consistency. If you don't use my theme or icons but you still want the old downloads button back, download the [_standalone_](/script/restorePreProtonDownloadsButton-standalone.uc.js) version instead. The standalone version has the stylesheet and icons built-in, so doesn't require anything else except a script loader. This version requires [userChrome.au.css](/userChrome.au.css) and the [resources/downloads](/resources/downloads) folder.

#### [Restore pre-Proton Library Button](/script/restorePreProtonLibraryButton.uc.js):

\* The library toolbar button used to have an animation that played when a bookmark was added. It's another casualty of the proton updates. This script restores the library button animation in its entirety, with one minor improvement. The library animation always looked just a tiny bit off for certain window scaling factors — the animation would appear about half a pixel from where the static icon is, causing it to appear to move when the animation finishes. The script can fix this, so see the description at the top of the file for details on enabling the scaling fix. This version of the script requires fx-autoconfig, [userChrome.au.css](/userChrome.au.css) and the [resources/skin](/resources/skin) folder. If you don't want to download those files, grab the [_standalone_](/script/restorePreProtonLibraryButton-standalone.uc.js) version instead.

#### [Restore pre-Proton Star Button](/script/restorePreProtonStarButton.uc.js):

\* The bookmark page action button used to have a pretty cool starburst animation. That's been removed but it's not too difficult to restore. The main version of this script requires fx-autoconfig, [userChrome.au.css](/userChrome.au.css), and the [resources](/resources) folder from my repo. If you don't want to use all that stuff, grab the [_standalone_](/script/restorePreProtonStarButton-standalone.uc.js) version instead. If you use the standalone version, you won't need any additional CSS or icon downloads, and you can use other script loaders instead of fx-autoconfig. FYI not to state the obvious but this script will have no effect if your browser/OS has `prefers-reduced-motion` enabled.

#### [Screenshot Page Action Button](/script/screenshotPageActionButton.uc.js):

Creates a screenshot button in the page actions area (the right side of the urlbar) that works just like the screenshot toolbar button. Firefox used to have one built in. I had to write this from scratch so the code is different under the hood, but the end result for the user is functionally identical to the original button that was removed around April 2021.

#### [Scrolling Search One-offs](/script/scrollingOneOffs.uc.js):

\* This script allows the search one-offs box to be scrolled with mousewheel up/down OR left/right. This is for use with my theme, which moves the one-off search engine buttons to the right side of the url bar when the user is typing into the url bar. It won't do much without the CSS from [uc-search-one-offs.css](/uc-search-one-offs.css) to set up the layout of the one offs element.

#### [Search Mode Indicator Icons](/script/searchModeIndicatorIcons.uc.js):

\* Automatically replace the urlbar's identity icon with the current search engine's icon. [(Click for a preview)](preview/prev-search.gif) This also adds an `[engine]` attribute to the identity icon so you can customize the icons yourself if you don't like a search engine's icon, or want to adjust its dimensions. If you have google set to "goo" and type in goo then hit spacebar, the identity icon will change to a google icon. And it'll also gain an attribute reflecting that, so you can change its icon further with a CSS rule like: `#identity-icon[engine="Tabs"] {color: red}`

This doesn't change anything about the layout so you may want to tweak some things in your stylesheet. For example I have mine set up so the tracking protection icon disappears while the user is typing in the urlbar, and so a little box appears behind the identity icon while in one-off search mode. This way the icon appears to the left of the label, like it does on about:preferences and other UI pages.

Without any additional CSS, the script will use the same icon that shows in the search engine's one-off button in the urlbar results. But as I mentioned before, you can use the `[engine]` attribute to customize it further. I have a bunch of customize search engine icons in [uc-search-mode-icons.css](/uc-search-mode-icons.css), which gets its icon files from the [resources/engines](/resources/engines) folder.

#### [Search Selection Keyboard Shortcut](/script/searchSelectionShortcut.uc.js):

Adds a new keyboard shortcut (Ctrl+Shift+F) that searches your default search engine for whatever text you currently have highlighted. This does basically the same thing as the context menu option "Search {Engine} for {Selection}" except that if you highlight a URL, (meaning text that is a URL, not a hyperlink) instead of searching for the selection it will navigate directly to the URL. The latter feature is mainly useful for when someone pastes a URL on some website that doesn't automatically generate hyperlinks when URLs are input in text forms.

#### [Show Selected Sidebar in Switcher Panel](/script/showSelectedSidebarInSwitcherPanel.uc.js):

\* For some reason, proton removes the checkmark shown on the selected sidebar in the sidebar switcher panel. (The one that pops up when you click the button at the top of the sidebar) This script simply restores the previous behavior of adding the [checked] attribute. On its own it won't do anything, since the CSS for adding checkmarks to the menu items has also been removed. You'll need [uc-sidebar.css](/uc-sidebar.css) and the radio icon from the [resources](/resources) folder for the actual styling, or you can just read it starting around [line 120](/uc-sidebar.css#L120) if you want to make your own styles.

#### [Toggle Menubar Hotkey](/script/toggleMenubarHotkey.uc.js):

Adds a hotkey (Alt+M by default) that toggles the menubar on and off. Unlike just pressing the Alt key, this keeps it open permanently until closed again by the hotkey, toolbar context menu, or customize menu. Requires [**fx-autoconfig**](https://github.com/MrOtherGuy/fx-autoconfig) — other script loaders will not work with this script.

#### [Toggle Tabs and Sidebar](/script/toggleTabsAndSidebarButton.uc.js):

Made by request. Adds a new toolbar button that can toggle between hiding tabs and hiding the sidebar. Intended for use with TreeStyleTabs, but will still work the same without it. It toggles the sidebar on its own, but it hides tabs by setting an attribute on the document element, which you need to reference in your userChrome.css file, like this: `:root[toggle-hidden="tabs"] #TabsToolbar {...}`. There are various templates available online for hiding the tab bar, or you can ask on [/r/FirefoxCSS](https://www.reddit.com/r/FirefoxCSS/). Just use one of those, adding `:root[toggle-hidden="tabs"]` to the selectors.

#### [Tooltip Shadow Support](/script/tooltipShadowSupport.uc.js):

\* This script makes it easier to add box shadows and borders to tooltips without messing up some specific tooltips. <details><summary><i><b>More details...</b></i></summary><p>Some tooltips have an awkward structure, where multiple descriptions exist within a single container, with `display: -moz-popup`. This means the tooltip is displayed within a restricted popup area with dimensions equal to the container, and overflow completely hidden. Box shadows on the container therefore won't be visible, since they'll fall outside of the popup box — you'd have to use a window shadow instead, but those can't be styled in a precise way.</p><p>In tooltips with only 1 label we can just make the container transparent and put the background and box shadow on the label element. That way there can still be room within the popup for the box shadow to be visible. A box shadow with a 5px radius can fit well within a container with ~7px padding. Tooltips with a more elaborate structure with containers within containers, e.g. the tab tooltip, don't have this problem at all. But tooltips like the back and forward buttons' can only be given a shadow if you give each label a background color, and try to position and size them so that they perfectly overlap and create the illusion of being one element.</p><p>But if you also want rounded corners and borders, that won't be an option. A good way to fix this is just to put the tooltips inside of another container, so that's what this script does. Because generic tooltips are native-anonymous, they don't inherit variables from the main window. So if you want to customize the theme's tooltips, you have to edit [userChrome.ag.css](/userChrome.ag.css) directly to change some things. If you want to disable the borders, 1) don't use this script, and 2) go to about:config and set `userChrome.css.remove-tooltip-borders` to true.</p></details>

#### [Animate Context Menus](/script/animateContextMenus.uc.js):

Gives all context menus the same opening animation that panel popups like the app menu have — the menu slides down 70px and fades in opacity at the same time. It's a cool effect that doesn't trigger a reflow since it uses transform, but it does repaint the menu, so I wouldn't recommend using this on weak hardware.

#### [Undo Recently Closed Tabs in Tab Context Menu](/script/undoListInTabContextMenu.uc.js):

Adds new menus to the context menu that appears when you right-click a tab (in the tab bar or in the TreeStyleTabs sidebar): one lists recently closed tabs so you can restore them, and another lists recently closed windows. These are basically the same functions that exist in the history toolbar button's popup, but I think the tab context menu is a more convenient location for them. An updated script that does basically the same thing as [UndoListInTabmenuToo](https://github.com/alice0775/userChrome.js/blob/master/72/UndoListInTabmenuToo.uc.js) by Alice0775, but for current versions of Firefox and with TST support. The original broke around version 86 or 87 I think.

#### [Unread Tab Mods](/script/unreadTabMods.uc.js):

Modifies some tab functions so that unread tabs can be styled differently from other tabs, and (optionally) adds new items to the tab context menu so you can manually mark tabs as read or unread. When opening a new tab without selecting it, the tab will gain an attribute `notselectedsinceload`. It will lose this attribute when the tab becomes selected or becomes discarded/unloaded. The CSS for styling unread tabs is already included in duskFox. (the CSS theme on this repo) If you don't use my theme, you can style unread tabs yourself with CSS like this: `.tabbrowser-tab[notselectedsinceload]:not([pending]), .tabbrowser-tab[notselectedsinceload][pending][busy] {font-style:italic!important;}`

#### [Update Notification Slayer](/script/updateNotificationSlayer.uc.js):

Prevent "update available" notification popups, instead just create a badge (like the one that ordinarily appears once you dismiss the notification). See the file description for more info.

#### [Concise Update Banner Labels](/script/updateBannerLabels.uc.js):

Simply changes the update banners in the hamburger button app menu to make the strings a bit more concise. Instead of "Update available — download now" it will show "Download Nightly update" (or whatever your version is) for example.

#### [Urlbar can Autofill Full Subdirectories](/script/urlbarAutofillSubdir.uc.js):

Allows the urlbar to autofill full subdirectories instead of just host names. For example, if you type "red" Firefox will normally just autofill "reddit.com" for the first result. With this script, if you visit reddit.com/r/FirefoxCSS more frequently than reddit.com, it will autofill the full URL to the subreddit, so you can navigate to it with just an Enter keypress. However, if you visit the root directory more often than any individual subdirectory, it will choose the root directory. For example, most people probably visit youtube.com way more often than any particular video page. So it will never suggest youtube.com/watch?v=whatever, since youtube.com will always have a higher visit count.

#### [Urlbar Mods](/script/urlbarMods.uc.js):

\* Makes some minor (optional) modifications to the urlbar, urlbar results, and search engine one-off buttons. When you click & drag the identity box in the urlbar, it lets you drag and drop the URL into text fields, the tab bar, desktop, etc. while dragging it shows a little white box with the URL and favicon as the drag image. This script changes the colors of that drag box so they use CSS variables instead, and therefore fit much more consistently with the browser theme, whether light or dark.

When you have syncing enabled, typing `%` in the urlbar will show tabs that were synced from your other devices. Normally, the only indication that a result is a synced tab is the "action text" that shows the name of the device from which the tab was synced. duskFox (the CSS theme) adds a little type indicator icon to urlbar results like bookmarks, open tabs, pinned results, and synced tabs. duskFox's indicator for synced tabs is normally a little sync icon.

But with this script, it will show a device icon instead, such as a phone or a laptop, to match the device from which the tab came. So if the tab was synced from an iPhone, you'll see a phone icon next to the row's favicon. If it came from an iPad, you'll see a tablet icon, and so on. This is meant to match how the "send tab to device" buttons look in the app menu. It doesn't require duskFox, but duskFox makes urlbar results' type icons look a lot better in my opinion, and it adds type icons for several types of results that don't normally have them.

This script can also be configured to restore the context menu that used to appear when right-clicking a search engine one-off button in the urlbar results panel. This feature is disabled by default, since the context menu has very few options in it. But you can enable it by toggling a config value at the top of the script. I'll continue to add to this script as I think of more urlbar mods that are too small to deserve their own dedicated script.

#### [Add [open] Status to Urlbar Notification Icons](/script/urlbarNotificationIconsOpenStatus.uc.js):

\* All this does is set an attribute on the buttons in `#notification-popup-box` based on whether their popups are open or closed. That way we can set their fill-opacity to 1 when they're open, like we do already with the other icons in `#identity-box`. There aren't any ways to do this with pure CSS as far as I can tell, so it's necessary to make our own event listeners. (or we could override the class methods in PopupNotifications.jsm, but that would require more frequent updates) Very minor improvement, but also very cheap and easy, so I figured might as well make the icon opacity consistent. _Doesn't have any visual effect without [uc-urlbar.css](uc-urlbar.css)_ or your own styles like `#notification-popup-box>[open="true"]{fill-opacity:1;}`

#### [Scroll Urlbar with Mousewheel](/script/urlbarMouseWheelScroll.uc.js):

Implements vertical scrolling and smooth scrolling inside the urlbar's input field. That might sound weird, but the urlbar doesn't naturally have any special scrolling logic, so when it's overflowing due to a long URL, scrolling it with a mouse wheel can be a real bitch, and scrolling it horizontally with a trackpad would feel really janky. This makes all scrolling in the urlbar smooth, and lets you scroll it horizontally with mousewheel up/down, since it can't be scrolled vertically anyway.

#### [Scroll Urlbar Results with Mousewheel](/script/urlbarViewScrollSelect.uc.js):

This script lets you cycle through urlbar results with mousewheel up/down, and invoke the current selected result by right-clicking anywhere in the urlbar results area. Nothing too special, just makes one-handed operation with a trackpad a little easier. Scroll events are rate-throttled proportionally to their magnitude, so it should be comfortable to scroll with any kind of input device, even including a trackpad or ball.

#### [Backspace Panel Navigation](/script/backspacePanelNav.uc.js):

Press backspace to navigate back/forward in popup panels. (e.g. the main hamburger menu, the history toolbar button popup, the "all tabs" menu, etc.) If a subview is open, backspace will go back to the previous view. If the mainview is open, pressing backspace will close the popup the same way pressing escape would.

#### [Autocomplete Popup Styler](/script/autocompletePopupStyler.uc.js):

\* This mini-script adds an attribute to `#PopupAutoComplete` when it's opened on a panel in the chrome UI, rather than opened on an input field in the content area: `[anchored-on-panel="true"]`. The reason for this is that the duskFox stylesheets give panels and menupopups the same background color, as is typical, but remove the borders. So without this, if the autocomplete popup opened on a panel, (for example the notification popup you get when Firefox asks to save a password) it would end up blending in with the panel, which doesn't look great. When it opens inside the content area, we want it to keep its normal background color, `var(--arrowpanel-background)`. But when it opens in a panel, we want to give it a brighter background color, `var(--autocomplete-background)`. This is implemented in [uc-popups.css](/uc-popups.css) by this rule: `panel#PopupAutoComplete[type="autocomplete-richlistbox"][anchored-on-panel]{background-color: var(--autocomplete-background) !important;}`

#### [OS Detector](/script/osDetector.uc.js):

\* This tiny setup script adds an attribute on the document element representing the operating system, so we can select it with CSS. For example `:root[operatingsystem="macosx"]` would select the root element only on macOS. There are already ways to select different windows versions and a less reliable way to target linux, but the existing CSS options for selecting macOS are very sloppy. If you use the theme on macOS or linux you will definitely want to download this so your titlebar buttons will show up correctly.

#### [Custom Hint Provider](/script/customHintProvider.uc.js):

A utility script for other scripts to take advantage of. Sets up a global object (on the chrome window) for showing confirmation hints with custom messages. The built-in confirmation hint component can only show a few messages built into the browser's localization system. This script works just like the built-in confirmation hint, and uses the built-in confirmation hint element, but it accepts any arbitrary string as a parameter. So you can open a confirmation hint with _any_ message, e.g. `CustomHint.show(anchorNode, "This is my custom message", {hideArrow: true, hideCheck: true, description: "Awesome.", duration: 3000})`</p><p>This script is entirely optional — some of my scripts take advantage of it, if it's present, but will not break if it's not present. My scripts that _require_ it come with their own independent version of it built-in. It doesn't do anything on its own, it's sort of a micro-library. You may as well download it if you use any of my scripts, since it can't hurt anything and will provide useful feedback for some of my scripts. I'm uploading it as a separate component so other developers can use it, and to avoid adding too much redundant code in my other scripts.

#### [Agent/Author Sheet Loader](/script/userChromeAgentAuthorSheetLoader.uc.js):

\* Required for loading [userChrome.ag.css](/userChrome.ag.css) and [userChrome.au.css](/userChrome.au.css), and therefore pretty much a non-negotiable requirement for duskFox. This script will actually load any file in the chrome folder that ends in `ag.css`, `au.css`, or `us.css`. Files ending in `au.css` will be loaded as author sheets, `ag.css` as agent sheets, and `us.css` as user sheets. User sheets are roughly equivalent to userChrome.css, so probably aren't necessary for anything, but the functionality is there in the unlikely event you ever need it. So you may add your own stylesheets simply by putting them in the chrome folder — no need to `@import` them. Stylesheets should be loaded in alphabetical order. Make sure you remove the files that come with fx-autoconfig in the JS folder, or you'll end up loading redundant stylesheets.

#### [Browser Toolbox Stylesheet Loader](/script/userChromeDevtoolsSheetLoader.uc.js):

\* Required for loading stylesheets into browser toolbox windows. If you want context menus in the devtools to look consistent with context menus elsewhere, grab this script. [See here](#styling-browser-toolbox-windows) for more info.

#### [Misc. Mods](/script/miscMods.uc.js):

Various tiny mods not worth making separate scripts for. Read the comments [inside the script](/script/miscMods.uc.js) for details.

## **Other useful links:**

<details><summary><b><i>Click to expand...</i></b></summary>

[Searchfox](https://searchfox.org/): A search engine for Firefox's source code. This is what I use to write most of my scripts. For example, if you wanted to make a button that adds a bookmark, you could find something in the UI that already does that, copy its ID, and search for it on Searchfox. From there you could track down its callback function, copy something from that and search for it, and ultimately find what you need. It indexes several repositories, including multiple versions of Firefox. You can permanently add this search engine to Firefox with [this extension](https://addons.mozilla.org/en-US/firefox/addon/add-custom-search-engine/), which makes writing code for Firefox immensely faster.

[FirefoxCSS Subreddit](https://www.reddit.com/r/FirefoxCSS/): Where to bring questions about modding Firefox.

[FirefoxCSS Store](https://firefoxcss-store.github.io/): A collection of Firefox CSS themes. If my theme is too complicated or labor-intensive for you, there are some really nice themes there that don't require autoconfig.

[userChrome.org](https://www.userchrome.org/): A site hosted by Jefferson Scher with a lot of [information](https://www.userchrome.org/what-is-userchrome-css.html), [guides](https://www.userchrome.org/how-create-userchrome-css.html), [tools](https://www.userchrome.org/firefox-89-styling-proton-ui.html), and other [resources](https://www.userchrome.org/help-with-userchrome-css.html) for modding Firefox, [setting up autoconfig](https://www.userchrome.org/what-is-userchrome-js.html), etc.

[firefox-csshacks](https://github.com/MrOtherGuy/firefox-csshacks/): A huge collection of CSS snippets (big and small) and information about CSS theming, by the author of fx-autoconfig. If there's something you're trying but struggling to do with CSS, this is a good place to start.

[Alice0775 scripts](https://github.com/alice0775/userChrome.js): Another repo full of Firefox scripts. Most of these should be compatible with fx-autoconfig. There's another autoconfig loader on this repo, but some of my scripts require fx-autoconfig specifically.

[xiaoxiaoflood scripts](https://github.com/xiaoxiaoflood/firefox-scripts): Another repo full of up-to-date Firefox scripts and addons. These won't be compatible with fx-autoconfig but there's another loader on this repo.

[Add custom search engines](https://addons.mozilla.org/firefox/addon/add-custom-search-engine): An extremely useful addon that can generate search engines for Firefox. That is, if a website you use has an internal search engine that uses URL queries or x-suggestions, e.g. `https://en.wikipedia.org/wiki/Special:Search?search=%s`, you can use this addon to turn it into a one-off search engine, and thereby search wikipedia from your urlbar, and even get search suggestions from wikipedia in your urlbar results.

[mozlz4-edit](https://addons.mozilla.org/firefox/addon/mozlz4-edit): An addon that can read, edit, and save .lz4/.mozlz4 files. Mozilla uses the LZ4 algorithm to compress all sorts of things from caches to databases, but in particular your one-off search engines. The addon above should be sufficient for most people, but if you need to make changes to a search engine you already created and don't want to redo it (or forgot how) this will let you. Just open the search.json.mozlz4 file in your profile folder.

[Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/): An addon for running JavaScript in browser tabs. If you need to modify a particular website, this is the best way. This is overall the best GreaseMonkey-like addon for Firefox, in my opinion.

[Sidebar Always Loaded](https://github.com/thepante/SAL-Firefox): A very cool script that makes the sidebar more permanent and less intrusive. It's similar to my Floating Sidebar script but 100% standalone, 50% more elegant, and has ~25% more features. Compatible with [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) or [Alice0775's loader](https://github.com/alice0775/userChrome.js/tree/master/72).

[NsCDE](https://github.com/NsCDE/NsCDE): A really cool Unix desktop environment package that integrates with Firefox and many other applications to produce remarkably consistent user interfaces.

[Lepton](https://github.com/black7375/Firefox-UI-Fix): A Firefox theme that respects the vanilla Firefox UI "flavor" while fixing many of the biggest problems with Proton.

[Adapting Firefox to Windows 10 accent colors](https://www.reddit.com/r/FirefoxCSS/comments/ocjsmr/my_almost_comprehensive_css_for_making_firefox/): A really handy guide and template on how to make Firefox's Proton UI consistent with your personalized Windows 10 color scheme.

[MDN — Browser Toolbox](https://developer.mozilla.org/en-US/docs/Tools/Browser_Toolbox): The first tutorial to read if you're trying to get into modding Firefox, whether CSS or JavaScript.

[MDN — CSS Cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Cascade): If your CSS background is limited to reading posts on r/FirefoxCSS and experimenting in the browser toolbox, learning some of the quirks of CSS may be very helpful. You can save a lot of trial & error time by knowing beforehand that something won't work.

[JavaScript — Understanding the weird parts](https://www.udemy.com/course/understand-javascript/): A really good course if you're trying to learn JavaScript from scratch. It doesn't concern the many internal APIs/components that you'd use in Firefox scripts, like XPCOM, but you definitely want to know most of this stuff beforehand to avoid wasting a lot of time.

</details>
