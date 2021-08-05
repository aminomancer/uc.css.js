// ==UserScript==
// @name           Floating Sidebar Resizer
// @version        1.2.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    A floating sidebar that you can still resize, plus some better shortcut hotkeys. The default sidebar in firefox is nice, it can move from the left side to the right side and you can resize it. But it squeezes the browser content area out of the way. That might be desirable for some people. That way the entire contents of the page are still visible when the sidebar is open. That works well with responsive page layouts but doesn't work well with elements that try to preserve some explicit aspect ratio. It also doesn't look very aesthetic when you open the sidebar and the entire page makes this jarring transformation as everything shifts left or right to make way for the sidebar. So say your browser window is sized precisely to 16:9 dimensions. Maybe you have ocd like me and don't want to see any letterbox when you watch netflix. By default when you open the sidebar, it pushes the whole content area to the side, which changes the content area width:height ratio. So the player setup needs to resize the video element, resulting in a letterbox effect. It's easy enough to make the sidebar "float" over the content though. You can do it with pure css. The major downside is that you lose the ability to resize the sidebar. You'd have to set the width manually. That's because the native implementation of resizing relies on the old-school proprietary -moz-box spec. The space within #browser is finite and the -moz-boxes within fill that space based on some css rules. The resizing is actually handled by the separator, which is a totally independent element. So within #browser you have: content | separator | sidebar. And moving the separator defines how big the sidebar and content area are, but this only works *because* they can't occupy the same space. To make the sidebar float over the content area you need to change its display and position rules, which means the separator no longer packs right next to the sidebar. It's sort of like plucking the sidebar out of the flexbox. The separator moves all the way to the end of the screen and the content area expands to fill that space. So the separator becomes useless and we lose the ability to resize the sidebar. So the main thing this does is add a resizer to the sidebar. It doesn't make the sidebar float by itself. That's what the css files in this repo are for. It also remaps the ctrl+b shortcut to simply toggle the sidebar rather than exclusively opening the bookmarks sidebar. So if you previously had the synced tabs sidebar open before you closed it, ctrl+b will open the sidebar to the synced tabs page, rather than opening to the bookmarks view. The bookmarks view is instead remapped to ctrl+shift+b. This overrides the built-in ctrl+shift+b command, which opens the bookmarks toolbar. I don't use the bookmarks toolbar myself but I figure someone who does use it probably wants it open 24/7 and isn't likely to need a hotkey to hide/show it. FYI the hotkey depends on your os, like other firefox shortcuts. e.g. On macOS it'll be Cmd+B, not Ctrl+B. It also depends on your accel key setting, so if you change the key in about:config, this hotkey will use your modifier key. Anyway, the hotkey changes can be disabled in about:config by setting userchrome.floating-sidebar.hotkey to false.
// ==/UserScript==

(() => {
    function startup() {
        // outer box
        let box = SidebarUI._box;
        let prefsvc = Services.prefs;
        let sidebarBundle = Services.strings.createBundle(
            "chrome://browser/locale/customizableui/customizableWidgets.properties"
        );
        // boolean pref: whether sidebar is on the left or right side of the browser content area.
        let anchor = "sidebar.position_start";
        // string pref: we set this so we can remember user's sidebar width when rebooting or opening a new window.
        let widthPref = "userChrome.floating-sidebar.width";
        // boolean pref: whether the ctrl+B hotkey should be changed or not.
        let hotkey = "userChrome.floating-sidebar.hotkey";
        // string representing the built-in ctrl+B command
        let cB = "viewBookmarksSidebarKb";
        // string representing the built-in ctrl+shift+B command
        let csB = "viewBookmarksToolbarKb";
        // invisible little bar by which to drag the sidebar to resize it
        let resizer = document.createElement("div");
        // the actual ctrl+B command
        let sidebarCmd = document.getElementById(cB);
        // the actual ctrl+shift+B command
        let toolbarCmd = document.getElementById(csB);
        // the bookmarks button that appears in the switcher menu at the top of the sidebar
        let sidebarSwitch = document.getElementById("sidebar-switcher-bookmarks");
        // the bookmarks button that appears in the titlebar menubar under view > sidebar > bookmarks
        let menuSwitch = document.getElementById("menu_bookmarksSidebar");
        let frame = false;
        let startWidth;
        let startX;

        function initDrag(e) {
            resizer.style.width = "200%"; // this is not directly visible since the element has no background or content. this just means that while you're clicking+dragging the resizer, its width expands to double the size of the entire sidebar. sounds weird but this is done because there are iframes under the cursor... an iframe in the sidebar, on one side of the cursor, and an iframe in the browser on the other side. when the cursor moves over these elements, the CSS changes the cursor from "ew-resize" to "default" or "pointer" or whatever. at the same time, the script kicks in and sets the width of the sidebar to follow the cursor. if these actually happened simultaneously then it wouldn't matter, since the sidebar would always resize instantly, meaning the resizer would always be directly underneath the cursor. but they don't happen simultaneously, the CSS changes the cursor and THEN the sidebar is resized. meaning that during the intervening period, the cursor flickers to something else. when you're actually resizing, this is happening like dozens of times a second or more, so you would see really rapid flickering of the cursor. if we were designing a web app this would be easy to solve, just use javascript to modulate document.body.style.cursor on mousedown and mouseup. but since this is a userChrome script, and the cursor is on top of iframes with documents that are very complicated to access from the global execution context, we should just work around it. so instead of trying to manually set cursor rules for every element the cursor might intersect, we'll just make the invisible resizer so big that there's no way to move your mouse outside of it before the sidebar catches up. then we set its size back to normal on mouseup.
            resizer.style.marginInline = "-100%"; // we want the resizer to expand massively in both directions, right and left. since the sidebar itself is always bounded by the window itself on one side, this rule causes the resizer to "align" itself horizontally with its center at the edge it normally exists at. so if the sidebar is on the right side, this will keep the resizer centered on the sidebar's left edge. and vice versa. if you look at it in the inspector you can see it's as if the resizer is expanding massively from where it already is. there are other ways to do this but this uses the fewest rules and assignments as far as i could tell.
            startX = e.screenX; // of all the values this seems to be the least jittery. the others seem to work poorly because there's an iframe right next to the dragger that your cursor will hover over sometimes, which will change the event target and momentarily disrupt the value of e.clientX. if we added logic to check the event target i think that'd be slower than just using screenX instead.
            startWidth = parseInt(document.defaultView.getComputedStyle(box).width, 10);
            document.documentElement.addEventListener("mousemove", doDrag, true); // listen to mouse movements
            document.documentElement.addEventListener("mouseup", stopDrag, false); // listen for mouseup so we can kill all the listeners except mousedown (which calls this)
        }

        function doDrag(e) {
            if (frame) return; // throttling, since mousemove events can fire way faster than even a 144Hz monitor can render frames.
            frame = true; // this will "ignore" any events sent in between the execution of this line, and the execution of requestAnimationFrame(...frame=false). therefore, only one width update per frame rendered, and that update will happen during the draw phase. this isn't necessary for most other types of events but this one could potentially cause stutters otherwise depending on your input hardware.
            requestAnimationFrame(() => {
                SidebarUI._positionStart // check which side of the screen the sidebar is on
                    ? (box.style.width = startWidth + e.screenX - startX + "px") // if it's on the left side then we add the cursor's X coordinate since that integer increases as we move the cursor right, and we obviously move the mouse *right* to "drag" the box rightwards.
                    : (box.style.width = startWidth - e.screenX + startX + "px"); // if it's on the right side then we subtract screenX and add startX since we're going to be moving the cursor leftwards to expand the sidebar box, and screenX will get smaller as the cursor moves left.
                frame = false; // denote that execution has finished so the function can accept another event
            });
        }

        function stopDrag(_e) {
            resizer.style.width = "4px"; // this is the neutral/idle size. when you're not clicking/dragging it's just a 4px vertical "border"
            resizer.style.removeProperty("margin-inline"); // remove the -100% margin-inline rule we set while dragging.
            document.documentElement.removeEventListener("mousemove", doDrag, true); // stop listening for mouse movements since we let go of the left mouse button.
            document.documentElement.removeEventListener("mouseup", stopDrag, false); // stop listening for mouseup since we already released the LMB.
            prefsvc.setStringPref(widthPref, box.style.width); // now that we've stopped moving the mouse, permanently record the sidebar width so we can restore from it later. we do this only on mouseup instead of mousemove since we don't want to spend resources needlessly calling the prefs service. the mouse needs to be released eventually and there's no realistic reason we'd ever need to restore from the pref while the LMB is still being held down. the only way is if you click, hold, drag the resizer, and while still dragging, hit ctrl+N on your keyboard to open a new window. but... lol why
        }

        function alignObserve(_sub, _top, pref) {
            // we want the resizer to go on the left side of the sidebar when the sidebar is on the right side of the window, and vice versa.
            // mozilla implements this by just making the sidebar a -moz-box and changing -moz-box-ordinal-group to change the order. the children of #browser are packed horizontally so that works fine. but -moz-box works kinda like flexbox and makes it a bitch to implement something like this "floating sidebar." the whole purpose of this is to make it so opening the sidebar *doesn't* squeeze the browser content area. so we do this kinda thing manually instead.
            prefsvc.getBoolPref(pref)
                ? (resizer.style.right = "0")
                : resizer.style.removeProperty("right");
        }

        function exitSideBar(e) {
            if (e.code === "Escape") {
                if (e.repeat || e.shiftKey || e.altKey || e.ctrlKey || this.hidden) return;
                SidebarUI.toggle();
                e.preventDefault();
            }
        }

        function hotkeyObserve(_sub, _top, pref) {
            if (prefsvc.getBoolPref(pref)) {
                sidebarCmd.setAttribute("oncommand", "SidebarUI.toggle();"); // ctrl+B to toggle
                toolbarCmd.setAttribute(
                    "oncommand",
                    "SidebarUI.toggle('viewBookmarksSidebar');" // ctrl+shift+B to open bookmarks sidebar
                );
                menuSwitch.setAttribute("key", csB); // show ctrl+shift+B as the shortcut for view > sidebar > bookmarks
                sidebarSwitch.setAttribute("key", csB); // show ctrl+shift+B as the shortcut in the sidebar switcher menu
                if (BMB_viewBookmarksSidebar) BMB_viewBookmarksSidebar.setAttribute("key", csB); // same for bookmarks toolbar button popup
                SidebarUI.updateShortcut({ button: sidebarSwitch }); // this generates the shortcut label from the key attribute. better to do it this way so it'll correctly show the modifier key depending on your settings and OS. like if accel key is cmd/meta then it'll say so, if you set it to alt for some reason it should say that as well. although it won't dynamically update if you change your accel key setting during runtime, since that would be extremely rare.
                nodeToShortcutMap["bookmarks-menu-button"] = csB; // change the hotkey in the bookmarks toolbar button's tooltip to reflect the bookmarks sidebar hotkey rather than the bookmarks manager hotkey, since the history toolbar button shows its sidebar hotkey. it's just to clear up a minor inconsistency.
                document
                    .getElementById("toolbar-context-menu")
                    .setAttribute("bmb-command-disabled", true); // when right-clicking the toolbar there's a "bookmarks toolbar" menu, where the ctrl+shift+B command is shown in the acceltext of the menuitems. we'll use CSS to hide it, since the acceltext is applied dynamically and it's a bitch to change that.
            } else {
                // (mostly) factory reset
                sidebarCmd.setAttribute("oncommand", "SidebarUI.toggle('viewBookmarksSidebar');");
                toolbarCmd.setAttribute(
                    "oncommand",
                    "BookmarkingUI.toggleBookmarksToolbar('shortcut');"
                );
                menuSwitch.setAttribute("key", cB);
                sidebarSwitch.setAttribute("key", cB);
                if (BMB_viewBookmarksSidebar) BMB_viewBookmarksSidebar.setAttribute("key", cB);
                SidebarUI.updateShortcut({ button: sidebarSwitch });
                nodeToShortcutMap["bookmarks-menu-button"] = cB;
                document
                    .getElementById("toolbar-context-menu")
                    .removeAttribute("bmb-command-disabled");
            }
            CustomizableUI.getWidget("sidebar-button")
                .forWindow(window)
                .node.setAttribute(
                    "tooltiptext",
                    `${sidebarBundle.GetStringFromName(
                        "sidebar-button.tooltiptext2"
                    )} (${ShortcutUtils.prettifyShortcut(sidebarCmd)})`
                );
            gDynamicTooltipCache.delete("bookmarks-menu-button");
        }

        async function prefSet(pref, val) {
            return prefsvc.setBoolPref(pref, val); // but you promised~...
        }

        // for initial startup
        async function setHotkeyPref() {
            try {
                hotkeyObserve(null, null, hotkey); // will reliably throw if the pref hasn't already been made, so we can use try/catch like if/else
            } catch (e) {
                await prefSet(hotkey, true); // create the pref if it doesn't already exist...
                hotkeyObserve(null, null, hotkey); // then pass the new pref to the function that sets the hotkey stuff
            }
        }

        function domSetup() {
            resizer.className = "dragger"; // for stylesheets i guess
            resizer.style.cssText =
                "display: inline-block; height: 100%; position: absolute; width: 4px; cursor: ew-resize;";
            box.appendChild(resizer); // can't be the first child or it'll break native functions
            box.style.minWidth = "18em"; // set a min width so you can't resize it to 0px. we choose 18em since that's the width of the searchbox. any smaller and you'd have to change the searchbox rules, since resizing below 18em would result in the searchbox not shrinking and instead overflowing and bleeding off of the window.
            box.style.maxWidth = "100%"; // since we used screenX it could grow beyond the window's width. so we set it here. setting the max width with CSS actually results in smoother animation than using logic in the width-setting script to limit the value. css is really underrated for things like that.
            try {
                box.style.width = prefsvc.getStringPref(widthPref); // on window startup, set the sidebar width equal to the value of the custom pref we set up.
            } catch (e) {
                box.style.width = "18em"; // if the pref doesn't already exist (e.g. on first script run) then use the built-in default.
            }
            // on initial setup, if the sidebar is on the left side, move the resizer to the right edge.
            if (prefsvc.getBoolPref(anchor)) resizer.style.right = "0"; // align resizer to the right edge
        }

        function attachListeners() {
            // SidebarUI._switcherTarget.addEventListener("SidebarShown", (e) => console.log(e)); // could conceivably use this to do something when the sidebar opens. but the event doesn't pop until after the sidebar has already been rendered so it's not useful for instantiating visual changes.
            resizer.addEventListener("mousedown", initDrag, false); // listen for clicks on the resizer
            window.addEventListener("unload", uninit, false); // listen for unload so we can clean up after ourselves explicitly
            prefsvc.addObserver(anchor, alignObserve); // watch the pref set by the "Move Sidebar to Left/Right" button
            prefsvc.addObserver(hotkey, hotkeyObserve); // watch the custom hotkey pref
            box.addEventListener("keypress", exitSideBar, true);
        }

        // since some of this stuff is for global interfaces we wanna destroy the listeners for a window when it's gone. probably not necessary but not a bad habit
        function uninit() {
            // remove itself
            window.removeEventListener("unload", uninit, false);
            // remove the pref observers
            prefsvc.removeObserver(anchor, alignObserve);
            prefsvc.removeObserver(hotkey, hotkeyObserve);
        }

        setHotkeyPref();
        domSetup();
        attachListeners();
    }
    // wait until components are initialized so we can access SidebarUI
    if (gBrowserInit.delayedStartupFinished) {
        startup();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                startup();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
