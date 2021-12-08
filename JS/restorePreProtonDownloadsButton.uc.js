// ==UserScript==
// @name           Restore pre-Proton Downloads Button
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    The new downloads button has a nice progress animation (even if the conic-gradient anti-aliasing isn't great) but I'm not at all a fan of the new ultra-thin icon style itself. I've invested a lot of energy into restoring the previous, bolder icons, so I can't leave the downloads button untouched. The whole DOM structure has fundamentally changed so restoring the old animations was quite a challenge. I decided to keep the progress animation and simply thicken it, but the other animations are modified versions of the old ones. Changing the animations can be done in CSS, but it will break the javascript method that switches from the download icon to the progress animation, because it's listening for "animationend" events and checking the animation name. The original animations all had different names, while the new ones use the same name. We can't really make this work with just one set of keyframes, since the start and finish animations are very different. One is a "dip" and the other more like a "blip," so I had to change the animation names, which requires changing the callback. That's what this script is for. It won't do anything without CSS — see userChrome.au.css. Since this involves icons, it also requires the contents from the /resources/downloads folder on my repo. And in order to load both the script and the resources, it requires fx-autoconfig. See the repo's readme for installation instructions.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    function init() {
        document.documentElement.setAttribute("pre-proton-downloads-button", true);
        DownloadsIndicatorView._showNotification = function _showNotification(aType) {
            let anchor = DownloadsButton._placeholder;
            if (!anchor || !isElementVisible(anchor.parentNode)) {
                // Our container isn't visible, so can't show the animation:
                return;
            }
            anchor.setAttribute("notification", aType);
            anchor.setAttribute("animate", "");

            this._currentNotificationType = aType;

            const onNotificationAnimEnd = (event) => {
                if (
                    event.animationName !== "downloadsButtonNotification" &&
                    event.animationName !== "downloadsIndicatorStartDip" &&
                    event.animationName !== "downloadsIndicatorFinishPulse"
                ) {
                    return;
                }
                anchor.removeEventListener("animationend", onNotificationAnimEnd);

                requestAnimationFrame(() => {
                    anchor.removeAttribute("notification");
                    anchor.removeAttribute("animate");

                    requestAnimationFrame(() => {
                        let nextType = this._nextNotificationType;
                        this._currentNotificationType = null;
                        this._nextNotificationType = null;
                        if (nextType && isElementVisible(anchor.parentNode)) {
                            this._showNotification(nextType);
                        }
                    });
                });
            };
            anchor.addEventListener("animationend", onNotificationAnimEnd);
        };
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
