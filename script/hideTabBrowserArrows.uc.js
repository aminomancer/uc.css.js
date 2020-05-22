(function () {
    document.getElementById('tabbrowser-arrowscrollbox').shadowRoot.getElementById('scrollbutton-up').classList.add('tabbrowser-scroll-arrow-hide');
    document.getElementById('tabbrowser-arrowscrollbox').shadowRoot.getElementById('scrollbutton-down').classList.add('tabbrowser-scroll-arrow-hide');
    document.getElementById('tabbrowser-arrowscrollbox').shadowRoot.querySelector('spacer[part="overflow-start-indicator"]').classList.add('tabbrowser-scroll-start-indicator');
    document.getElementById('tabbrowser-arrowscrollbox').shadowRoot.querySelector('spacer[part="overflow-end-indicator"]').classList.add('tabbrowser-scroll-end-indicator');
})();