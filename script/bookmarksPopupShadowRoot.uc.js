const bookmarksPopupShadowRoot = {
    init() {
        const BMBtoolbarPopup = document.getElementById("BMB_bookmarksToolbarPopup");
        const BMBinnerBox = document.getElementById("BMB_bookmarksToolbarPopup").shadowRoot
            .children[1];
        const BMBarrowScrollbox = document.getElementById("BMB_bookmarksToolbarPopup").shadowRoot
            .children[1].children[1];

        BMBinnerBox.classList.add("BMB-special-innerbox");
        BMBarrowScrollbox.smoothScroll = true;
        BMBarrowScrollbox._scrollIncrement = 150;
        BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
        BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");

        BMBarrowScrollbox._scrollButtonDown.onclick = function scrollToBottom() {
            let scrollBox = document.getElementById("BMB_bookmarksToolbarPopup").shadowRoot
                .children[1].children[1].scrollbox;
            scrollBox.setAttribute("style", "scroll-behavior: auto;");
            scrollBox.scrollTo(0, scrollBox.scrollHeight);
            scrollBox.setAttribute("style", "scroll-behavior: smooth;");
        };

        BMBarrowScrollbox._scrollButtonUp.onclick = function scrollToTop() {
            let scrollBox = document.getElementById("BMB_bookmarksToolbarPopup").shadowRoot
                .children[1].children[1].scrollbox;
            scrollBox.setAttribute("style", "scroll-behavior: auto;");
            scrollBox.scrollTo(0, 0);
            scrollBox.setAttribute("style", "scroll-behavior: smooth;");
        };

        function toolbarPopupOpened() {
            try {
                const bmbSubviewButtons = document.getElementsByClassName(
                    "menu-iconic bookmark-item subviewbutton"
                );
                BMBinnerBox.classList.add("BMB-special-innerbox");
                BMBarrowScrollbox.smoothScroll = true;
                BMBarrowScrollbox._scrollIncrement = 150;
                BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
                BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");
                for (let i = 0, max = bmbSubviewButtons.length; i < max; i++) {
                    if (
                        bmbSubviewButtons[i]
                            .getElementsByTagName("menupopup")[0]
                            .shadowRoot.querySelector('hbox[part="innerbox"]').clientHeight < 700
                    ) {
                        bmbSubviewButtons[i]
                            .getElementsByTagName("menupopup")[0]
                            .shadowRoot.querySelector('hbox[part="innerbox"]')
                            .classList.add("BMBsmallContentBox");
                    }
                }
            } catch (e) {}
        }

        BMBtoolbarPopup.addEventListener("popupshowing", toolbarPopupOpened, false);
        CustomizableUI.removeListener(this);
    },

    onWidgetAfterDOMChange(aNode, _aNextNode, _aContainer, aWasRemoval) {
        if (!aWasRemoval && aNode.ownerGlobal === window && aNode === BookmarkingUI.button)
            this.init();
    },

    onWindowClosed(aWindow) {
        try {
            aWindow === window
                ? CustomizableUI.removeListener(this)
                : CustomizableUI.removeListener(aWindow.bookmarksPopupShadowRoot);
        } catch (e) {}
    },
    addHandler() {
        if (document.getElementById("bookmarks-menu-button")) this.init();
        else CustomizableUI.addListener(this);
    },
};

if (gBrowserInit.delayedStartupFinished) {
    bookmarksPopupShadowRoot.addHandler();
} else {
    let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
            Services.obs.removeObserver(delayedListener, topic);
            bookmarksPopupShadowRoot.addHandler();
        }
    };
    Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
}
