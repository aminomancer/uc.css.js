// ==UserScript==
// @name           Multi-line Urlbar Results
// @version        1.1
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    When a urlbar result's title overflows off the results panel, this moves its URL to a second line, underneath the title. Results that aren't overflowing are still single lines. This could be done without javascript, but I wanted the URL to be lined up with the title, not with the favicon. This requires some CSS from the end of uc-urlbar-results.css.
// ==/UserScript==

(function () {
    function init() {
        const urlbarViewOverflowHandler = {
            bounds: windowUtils.getBoundsWithoutFlushing,

            handleEvent(e) {
                if (e.detail != 1 || !gURLBar.view?.isOpen) return;
                if (
                    e.target.classList.contains("urlbarView-title") ||
                    (e.target.classList.contains("urlbarView-url") &&
                        e.target.clientWidth / e.target.scrollWidth < 0.5)
                )
                    this.toggleOverflown(e);
            },

            toggleOverflown(e) {
                const inner = e.target.closest(".urlbarView-row-inner");
                const url = inner.querySelector(".urlbarView-url");
                const title = inner.querySelector(".urlbarView-title");
                switch (e.type) {
                    case "overflow":
                        url.style.marginInlineStart = `${
                            this.bounds(title).left - this.bounds(title.parentElement).left
                        }px`;
                        inner.classList.add("overflown");
                        break;
                    case "underflow":
                        url.style.removeProperty("margin-inline-start");
                        inner.classList.remove("overflown");
                }
            },

            onResultsChanged() {
                for (const row of gURLBar.view._rows.children) {
                    const inner = row.firstElementChild;
                    const url = inner.querySelector(".urlbarView-url");
                    const title = inner.querySelector(".urlbarView-title");
                    if (title.scrollWidth === title.clientWidth)
                        inner.classList.remove("overflown");
                    if (
                        inner.classList.contains("overflown") ||
                        row.getAttribute("type") === "remotetab" ||
                        row.hasAttribute("sponsored")
                    )
                        url.style.marginInlineStart = `${
                            this.bounds(title).left - this.bounds(title.parentElement).left
                        }px`;
                    else url.style.removeProperty("margin-inline-start");
                    row.toggleAttribute("hide-url", url.textContent === title.textContent);
                }
            },

            onQueryFinished(_q) {
                this.onResultsChanged();
            },

            onQueryCancelled(_q) {
                this.onResultsChanged();
            },

            onQueryResults(_q) {
                this.onResultsChanged();
            },

            onQueryResultRemoved(_q) {
                this.onResultsChanged();
            },

            attachEvents() {
                gURLBar.view._rows.setAttribute("overflow-handler", "userChromeJS");
                gURLBar.view.controller.addQueryListener(this);
                gURLBar.view._rows.addEventListener("overflow", this);
                gURLBar.view._rows.addEventListener("underflow", this);
            },
        };

        urlbarViewOverflowHandler.attachEvents();
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
