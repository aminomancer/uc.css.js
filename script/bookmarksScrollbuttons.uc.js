(function () {
    setTimeout(() => {
        var BMBtoolbarPopup = document.getElementById('BMB_bookmarksToolbarPopup');
        var BMBinnerBox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1];
        var BMBarrowScrollbox = document.getElementById('BMB_bookmarksToolbarPopup').shadowRoot.children[1].children[1];

        BMBinnerBox.classList.add("BMB-special-innerbox");
        BMBarrowScrollbox.smoothScroll = true;
        BMBarrowScrollbox._scrollIncrement = 150;
        BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
        BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");

        function toolbarPopupOpened() {
            try {
                BMBinnerBox.classList.add("BMB-special-innerbox");
                BMBarrowScrollbox.smoothScroll = true;
                BMBarrowScrollbox._scrollIncrement = 150;
                BMBarrowScrollbox._scrollButtonUp.classList.add("BMB-special-scrollbutton-up");
                BMBarrowScrollbox._scrollButtonDown.classList.add("BMB-special-scrollbutton-down");
            } catch (e) {};
        };

        BMBtoolbarPopup.addEventListener("popupshowing", toolbarPopupOpened, false);
    }, 1000);
})();