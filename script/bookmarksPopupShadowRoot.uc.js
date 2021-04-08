const bookmarksPopupShadowRoot = {
    init() {
        const BMBtoolbarPopup = document.getElementById("BMB_bookmarksToolbarPopup");
        const BMBarrowScrollbox = BMBtoolbarPopup.scrollBox;

        function setUpScroll() {
            BMBtoolbarPopup.shadowRoot.children[1].classList.add("BMB-special-innerbox");
            BMBarrowScrollbox.smoothScroll = true;
            BMBarrowScrollbox._scrollIncrement = 150;
            BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
            BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");
        }

        function toolbarPopupOpened() {
            try {
                document
                    .getElementById("BMB_bookmarksPopup")
                    .querySelectorAll(`menupopup[placespopup="true"]`)
                    .forEach((popup) => {
                        let scrollbox = popup.scrollBox.scrollbox;
                        let height = window.screen.availHeight;
                        if (scrollbox.scrollTopMax < height && scrollbox.clientHeight < height)
                            popup.shadowRoot
                                .querySelector('hbox[part="innerbox"]')
                                .classList.add("BMBsmallContentBox");
                    });

                setUpScroll();

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

        function scrollByIndex(box, index, aInstant) {
            if (index == 0) {
                return;
            }

            var rect = box.scrollClientRect;
            var [start, end] = box.startEndProps;
            var x = index > 0 ? rect[end] + 1 : rect[start] - 1;
            var nextElement = box._elementFromPoint(x, index);
            if (!nextElement) {
                return;
            }

            var targetElement;
            if (box.isRTLScrollbox) {
                index *= -1;
            }
            while (index < 0 && nextElement) {
                if (box._canScrollToElement(nextElement)) {
                    targetElement = nextElement;
                }
                nextElement = nextElement.previousElementSibling;
                index++;
            }
            while (index > 0 && nextElement) {
                if (box._canScrollToElement(nextElement)) {
                    targetElement = nextElement;
                }
                nextElement = nextElement.nextElementSibling;
                index--;
            }

            if (!targetElement || !box._canScrollToElement(targetElement)) return;

            box._stopScroll();

            let animFrame = window.requestAnimationFrame(() => {
                targetElement.scrollIntoView({
                    block: "nearest",
                    behavior: aInstant ? "instant" : "auto",
                });
                box._ensureElementIsVisibleAnimationFrame = 0;
                box._arrowScrollAnim.requestHandle = 0;
            });

            box._ensureElementIsVisibleAnimationFrame = animFrame;
            box._arrowScrollAnim.requestHandle = animFrame;
        }

        setUpScroll();

        BMBarrowScrollbox._onButtonMouseOver = function _onButtonMouseOver(index) {
            if (this._ensureElementIsVisibleAnimationFrame || this._arrowScrollAnim.requestHandle)
                return;
            if (this._clickToScroll) {
                this._continueScroll(index);
            } else {
                this._startScroll(index);
            }
        };

        BMBarrowScrollbox._onButtonMouseOut = function _onButtonMouseOut() {
            if (this._ensureElementIsVisibleAnimationFrame || this._arrowScrollAnim.requestHandle)
                return;
            if (this._clickToScroll) {
                this._pauseScroll();
            } else {
                this._stopScroll();
            }
        };

        BMBarrowScrollbox._scrollButtonDown.onclick = function scrollToBottom() {
            scrollByIndex(BMBarrowScrollbox, BMBtoolbarPopup.children.length);
        };

        BMBarrowScrollbox._scrollButtonUp.onclick = function scrollToTop() {
            scrollByIndex(BMBarrowScrollbox, -BMBtoolbarPopup.children.length);
        };

        BMBtoolbarPopup.addEventListener("popupshowing", toolbarPopupOpened, false, { once: true });
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
