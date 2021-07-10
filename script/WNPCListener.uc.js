// ==UserScript==
// @name           WebNowPlaying Companion Listener
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Listen for updates from the WebNowPlaying Companion Addon, and set background timeout prefs based on whether a video is currently playing or not. If a video is playing, the min timeout values are minimized so that status updates will be sent from the addon to rainmeter as quickly as possible. This way there isn't a lag in the rainmeter skin's pause status after pausing a video. If a video is not playing, min timeout values are increased to conserve computational resources and reduce power consumption.
// ==/UserScript==

(() => {
    const prefs = [
        "dom.min_background_timeout_value",
        "dom.min_background_timeout_value_without_budget_throttling",
    ];
    function xpSet(int) {
        prefs.forEach((pref) => Services.prefs.setIntPref(pref, int));
    }
    function init() {
        let widget = CustomizableUI.getWidget("wnpc_aminomancer-browser-action");
        if (!widget) return;
        let node = widget.forWindow(window)?.node;
        if (!node) return;
        let observer = new MutationObserver(() =>
            xpSet(node.label === "Connected to media" ? 50 : 2000)
        );
        xpSet(2000);
        observer.observe(node, {
            attributeFilter: ["label"],
        });
    }
    if (gBrowserInit.delayedStartupFinished) setTimeout(init, 5000);
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                setTimeout(init, 5000);
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
