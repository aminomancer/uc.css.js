// ==UserScript==
// @name           floatingSidebarResizer.uc.js
// @homepage       https://github.com/aminomancer
// @description    a floating sidebar that you can still resize. the default sidebar in firefox is nice, it can move from the left side to the right side and you can resize it. but it squeezes the browser content area out of the way. that might be desirable for some people. that way the entire contents of the page are still visible when the sidebar is open. that works well with responsive page layouts but doesn't work well with elements that try to preserve some explicit aspect ratio. it also doesn't look very aesthetic when you open the sidebar and the entire page makes this jarring transformation as everything shifts left or right to make way for the sidebar. so say your browser window is sized precisely to 16:9 dimensions. maybe you have OCD like me and don't want to see any letterbox when you watch netflix. by default when you open the sidebar, it pushes the whole content area to the side, which changes the content area width:height ratio. so the player setup needs to resize the video element, resulting in a letterbox effect.
// it's easy enough to make the sidebar "float" over the content though. you can do it with pure CSS. the major downside is that you lose the ability to resize the sidebar. you'd have to set the width manually. that's because the native implementation of resizing relies on the old-school proprietary -moz-box spec. the space within #browser is finite and the -moz-boxes within fill that space based on some css rules. the resizing is actually handled by the separator, which is a totally independent element. so within #browser you have: content | separator | sidebar. and moving the separator defines how big the sidebar and content area are, but this only works *because* they can't occupy the same space. to make the sidebar float over the content area you need to change its display and position rules, which means the separator no longer packs right next to the sidebar. it's sort of like plucking the sidebar out of the flexbox. the separator moves all the way to the end of the screen and the content area expands to fill that space. so the separator becomes useless and we lose the ability to resize the sidebar.
// so all this does is add a resizer to the sidebar. it doesn't make the sidebar float by itself. that's what the CSS files in this repo are for.
// @author         aminomancer
// ==/UserScript==

(() => {
    function startup() {
        let box = SidebarUI._box, // outer box
            prefsvc = Services.prefs,
            sidebarAnchor = "sidebar.position_start", // boolean pref: whether sidebar is on the left or right side of the browser content area.
            widthPref = "userChrome.floating-sidebar.width", // string pref: we set this so we can remember user's sidebar width when rebooting or opening a new window.
            resizer = document.createElement("div"), // invisible little bar by which to drag the sidebar to resize it
            startX,
            startWidth,
            frame = false;

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

        function prefObserve(_sub, _top, pref) {
            // we want the resizer to go on the left side of the sidebar when the sidebar is on the right side of the window, and vice versa.
            // mozilla implements this by just making the sidebar a -moz-box and changing -moz-box-ordinal-group to change the order. the children of #browser are packed horizontally so that works fine. but -moz-box works kinda like flexbox and makes it a bitch to implement something like this "floating sidebar." the whole purpose of this is to make it so opening the sidebar *doesn't* squeeze the browser content area. so we do this kinda thing manually instead.
            if (prefsvc.getBoolPref(pref)) {
                resizer.style.right = "0";
                box.style.paddingRight = "4px"; // you can remove this if you use default scrollbars. since i use floating overlay scrollbars i need a gutter to the right of the scrollbars if there's gonna be an element on the right edge of the sidebar. i don't need it on the left since, naturally, my scrollbars are always on the right side of the element they're scrolling. this is just because my scrollbar thumb is not in its own slider. or more accurately, the slider and buttons are invisible, and the scrollbar's margin is shifted so that it completely overlaps with the content of the page. in other words if you had text going all the way to the edge of the page, my scrollbar would overlap with it. the text could go right under the scrollbar. since the scrollbar only shows when it's hovered or active, that works fine. but normally there's nothing to resize on the far end of the scrollbar. in this unusual case, we're putting the resizer on the far right edge of the sidebar, where a scrollbar already is. since my scrollbar script sets the scrollbar's z-index to the maximum value, (necessary because it removes the appearance property, and by default the scrollbar doesn't appear on top of anything, but rather flexes the document or element to the side to make room for it) without this padding the resizer would fall completely underneath the scrollbar and be unclickable. so we add a 4px gutter to make room for the 4px resizer element.
            } else {
                resizer.style.removeProperty("right");
                box.style.removeProperty("padding-right");
            }
        }

        // since some of this stuff is for global interfaces we wanna destroy the listeners for a window when it's gone. probably not necessary but not a bad habit
        function uninit() {
            // remove itself
            window.removeEventListener("unload", uninit, false);
            // remove the pref observer
            prefsvc.removeObserver(sidebarAnchor, prefObserve);
        }

        function domSetup() {
            resizer.className = "dragger"; // for stylesheets i guess
            resizer.style.cssText =
                "display: inline-block; height: 100%; position: absolute; width: 4px; cursor: ew-resize;";
            box.appendChild(resizer); // can't be the first child or it'll break native functions
            box.style.minWidth = "18em"; // set a min width so you can't resize it to 0px. we choose 18em since that's the width of the searchbox. any smaller and you'd have to change the searchbox rules, since resizing below 18em would result in the searchbox not shrinking and instead overflowing and bleeding off of the window.
            box.style.maxWidth = "100%"; // since we used screenX it could grow beyond the window's width. so we set it here. setting the max width with CSS actually results in smoother animation than using logic in the width-setting script to limit the value. css is really underrated for things like that.
            box.style.width = prefsvc.getStringPref(widthPref); // on window startup, set the sidebar width equal to the value of the custom pref we set up.
            if (prefsvc.getBoolPref(sidebarAnchor)) {
                // on initial setup, if the sidebar is on the left side, move the resizer to the right edge.
                resizer.style.right = "0"; // align resizer to the right edge
                box.style.paddingRight = "4px"; // again, adding the gutter if it's on the left side.
            }
        }

        function attachListeners() {
            // SidebarUI._switcherTarget.addEventListener("SidebarShown", (e) => console.log(e)); // could conceivably use this to do something when the sidebar opens. but the event doesn't pop until after the sidebar has already been rendered so it's not useful for instantiating visual changes.
            resizer.addEventListener("mousedown", initDrag, false); // listen for clicks on the resizer
            prefsvc.addObserver(sidebarAnchor, prefObserve); // watch the pref set by the "Move Sidebar to Left/Right" button
            window.addEventListener("unload", uninit, false); // listen for unload so we can clean up after ourselves explicitly
        }

        domSetup();
        attachListeners();
    }
    // wait until components are initialized so we can access SidebarUI
    if (gBrowserInit.delayedStartupFinished) {
        // if we're executing after it's already finished then just call startup
        startup();
    } else {
        // otherwise set up a listener that calls startup when it really is finished
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                startup();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
