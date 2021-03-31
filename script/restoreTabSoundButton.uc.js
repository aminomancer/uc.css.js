// ==UserScript==
// @name           Restore pre-Proton tab sound button functionality
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Proton makes really big changes to tabs, in particular removing the tab sound button. We can currently restore it to some extent with CSS, but it won't display a tooltip and it won't work when the video playing in the tab is in picture-in-picture mode. We can't really restore these functions, we have to recreate them. So this script generates a localized tooltip for the sound button based on its current function (mute, unmute, or block) and also makes the sound button work in picture-in-picture mode. As you might expect, it will mute the tab if it's not muted, and unmute the tab if it is already muted. This is consistent with the styling in uc-tabs.css: in PiP mode, the sound button is styled to look like a PiP icon, but when hovering the tab it will transform into a regular mute/unmute button, since the PiP button has no functionality of its own, it's purely a visual indicator.
// ==/UserScript==

(function () {
    const tabEventHandler = {
        sentenceCase(str) {
            return str
                .replace(/[a-z]/i, function (letter) {
                    return letter.toUpperCase();
                })
                .trim();
        },

        handleEvent(e) {
            if (!e.target.classList.contains("tab-icon-sound")) return;
            let tab = e.target.closest(".tabbrowser-tab");
            switch (e.type) {
                case "mouseover":
                case "mouseout":
                    this.tooltipHandler(e, tab);
                    break;
                case "click":
                    this.clickHandler(e, tab);
                    break;
                default:
                    return false;
            }
        },

        async tooltipHandler(e, tab) {
            const selectedTabs = gBrowser.selectedTabs;
            const contextTabInSelection = selectedTabs.includes(tab);
            const affectedTabsLength = contextTabInSelection ? selectedTabs.length : 1;
            let state = null;

            if (tab.soundPlaying) state = "mute";
            if (tab.muted) state = "unmute";
            if (tab.activeMediaBlocked) state = "unblock";

            let tipString = await document.l10n.formatValue(`browser-tab-${state}`, {
                count: affectedTabsLength,
            });

            if (state)
                e.target.setAttribute("tooltiptext", this.sentenceCase(tipString.toLowerCase()));
            else e.target.removeAttribute("tooltiptext");
        },

        clickHandler(e, tab) {
            if (e.button != 0 || e.getModifierState("Accel") || e.shiftKey) return;

            if (tab.soundPlaying || tab.muted || tab.activeMediaBlocked) {
                tab.multiselected
                    ? gBrowser.toggleMuteAudioOnMultiSelectedTabs(tab)
                    : tab.toggleMuteAudio();
                e.preventDefault();
                e.stopPropagation();
                return;
            }
        },

        attachListeners() {
            gBrowser.tabContainer.addEventListener("mouseover", this, true);
            gBrowser.tabContainer.addEventListener("mouseout", this, true);
            gBrowser.tabContainer.addEventListener("click", this, true);
        },
    };

    if (gBrowserInit.delayedStartupFinished) {
        tabEventHandler.attachListeners();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                tabEventHandler.attachListeners();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
