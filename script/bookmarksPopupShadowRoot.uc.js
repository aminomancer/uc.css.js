(function () {
    function init () {
        var BMBtoolbarPopup = document.getElementById('BMB_bookmarksToolbarPopup');
        var BMBinnerBox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1];
        var BMBarrowScrollbox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1].children[1];

        BMBinnerBox.classList.add("BMB-special-innerbox");
        BMBarrowScrollbox.smoothScroll = true;
        BMBarrowScrollbox._scrollIncrement = 150;
        BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
        BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");

        BMBarrowScrollbox._scrollButtonDown.onclick = function scrollToBottom() {
            let scrollBox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1].children[1].scrollbox;
            scrollBox.setAttribute('style', 'scroll-behavior: auto;');
            scrollBox.scrollTo(0, scrollBox.scrollHeight);
            scrollBox.setAttribute('style', 'scroll-behavior: smooth;');
        };

        BMBarrowScrollbox._scrollButtonUp.onclick = function scrollToTop() {
            let scrollBox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1].children[1].scrollbox;
            scrollBox.setAttribute('style', 'scroll-behavior: auto;');
            scrollBox.scrollTo(0, 0);
            scrollBox.setAttribute('style', 'scroll-behavior: smooth;');
        };

        function toolbarPopupOpened() {
            try {
                var bmbSubviewButtons = document.getElementsByClassName('menu-iconic bookmark-item subviewbutton');
                BMBinnerBox.classList.add("BMB-special-innerbox");
                BMBarrowScrollbox.smoothScroll = true;
                BMBarrowScrollbox._scrollIncrement = 150;
                BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
                BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");
                for (var i = 0, max = bmbSubviewButtons.length; i < max; i++) {
                    if (bmbSubviewButtons[i].getElementsByTagName('menupopup')[0].shadowRoot.querySelector('hbox[part="innerbox"]').clientHeight < 700) {
                        bmbSubviewButtons[i].getElementsByTagName('menupopup')[0].shadowRoot.querySelector('hbox[part="innerbox"]').classList.add("BMBsmallContentBox");
                    }
                }
            } catch (e) {};
        };

        BMBtoolbarPopup.addEventListener("popupshowing", toolbarPopupOpened, false);
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