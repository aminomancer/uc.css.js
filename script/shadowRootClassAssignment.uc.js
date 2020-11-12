(function () {
    setTimeout(() => {
        var protButton = document.getElementById('tracking-protection-icon-container')

        function protPopupOpened() {
            try {
                var protArrow = document.getElementById('protections-popup').shadowRoot.querySelector('.panel-arrow')
                protArrow.id = "protections-popup-panel-arrow"
            } catch (e) { };
        };

        protButton.addEventListener("click", protPopupOpened, { once: true })
    }, 1000)
})()