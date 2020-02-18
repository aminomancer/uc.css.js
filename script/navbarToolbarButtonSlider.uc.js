// ==UserScript==
// @name           navbarToolbarButtonSlider.uc.js
// @namespace      https://www.reddit.com/user/MotherStylus
// @description    Wrap all toolbar buttons after #urlbar-container in a scrollable div. I recommend setting mousewheel.autodir.enabled to true, so you can scroll horizontally through the buttons by scrolling up/down with a mousewheel. You may need to adjust the "300" on line 32, this is the time (in milliseconds) before the script executes. Without it, the script will execute too fast so toolbar buttons added by scripts or extensions may not load depending on your overall startup speed. You want it as low as possible so you don't see the massive container shrinking a second after startup. 300 is just enough for me to never miss any buttons but my setup is pretty heavy, you may want a smaller number. 100 might work for you at first but every now and then you have an abnormally slow startup and you miss an icon. That said, if you don't use any buttons added by scripts or the built-in devtools button, you could probably remove setTimeout altogether. You can also change "max-width" on line 31 to make the container wider or smaller, ideally by increments of 32. I use 352 because I want 11 icons to be visible.
// @include        *
// @author         aminomancer
// ==/UserScript==

(function () {
    setTimeout(() => {
        var toolbarIcons = document.querySelectorAll('#urlbar-container~*');
        var toolbarSlider = document.createElement('div');
        var customizableNavBar = document.getElementById('nav-bar-customization-target');
        var bippityBop = {
            onCustomizeStart: function () {
                unwrapAll(toolbarSlider.childNodes, customizableNavBar)
            },
            onCustomizeEnd: function () {
                setTimeout(() => {
                    rewrapAll()
                }, 100)
            },
            onWidgetAfterDOMChange: function (aNode) {
                try {
                    if (aNode.parentNode.id == "nav-bar-customization-target" && CustomizationHandler.isCustomizing() == false) {
                        setTimeout(() => {
                            toolbarSlider.appendChild(toolbarSlider.nextSibling);
                        }, 100)
                    }
                } catch (e) {};
            }
        };

        wrapAll(toolbarIcons, toolbarSlider);

        function wrapAll(buttons, container) {
            try {
                var parent = buttons[0].parentNode;
                var previousSibling = buttons[0].previousSibling;
                for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
                    container.appendChild(buttons[i]);
                }
                parent.insertBefore(container, previousSibling.nextSibling);
                return container;
            } catch (e) {};
        };

        function unwrapAll(buttons, container) {
            try {
                for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
                    container.appendChild(buttons[i]);
                }
                return container;
            } catch (e) {};
        };

        function rewrapAll() {
            try {
                let widgets = document.querySelectorAll('#nav-bar-toolbarbutton-slider~*');
                for (var i = 0; widgets.length - i; toolbarSlider.firstChild === widgets[0] && i++) {
                    toolbarSlider.appendChild(widgets[i]);
                }
                return toolbarSlider;
            } catch (e) {};
        };

        try {
            toolbarSlider.classList.add('container');
            toolbarSlider.setAttribute("id", "nav-bar-toolbarbutton-slider");
            toolbarSlider.setAttribute("style", "display: -moz-box; overflow-x: scroll; overflow-y: hidden; max-width: 352px; scrollbar-width: none;");
            CustomizableUI.addListener(bippityBop);
        } catch (e) {};
    }, 1000);
})();