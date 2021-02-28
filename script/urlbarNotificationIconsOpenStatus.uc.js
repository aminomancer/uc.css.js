// ==UserScript==
// @name           urlbarNotificationIconsOpenStatus.uc.js
// @homepage       https://github.com/aminomancer
// @description    All this does is set an attribute on the buttons in #notification-popup-box based on whether their popups are open or closed. That way we can set their fill-opacity to 1 when they're open, like we do already with the other icons in #identity-box. There aren't any ways to do this with pure CSS as far as I can tell, so it's necessary to make our own event listeners. (or we could override the class methods in PopupNotifications.jsm, but that would require more frequent updates) Very minor improvement, but also very cheap and easy, so I figured might as well make the icon opacity consistent.
// @author         aminomancer
// ==/UserScript==

(() => {
    const handler = {
        handleEvent(e) {
            if (e.type === "popupshowing")
                PopupNotifications._currentAnchorElement.setAttribute("open", true);
            else PopupNotifications._currentAnchorElement.removeAttribute("open");
        },
        attachListeners() {
            PopupNotifications.panel.addEventListener("popupshowing", this, false);
            PopupNotifications.panel.addEventListener("popuphiding", this, false);
        },
    };

    function init() {
        if (PopupNotifications.panel) handler.attachListeners();
        else window.setTimeout(handler.attachListeners, 5000);
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