// ==UserScript==
// @name           navbarToolbarButtonSlider.uc.js
// @namespace      https://www.reddit.com/user/MotherStylus
// @description    Wrap all toolbar buttons after #urlbar-container in a scrollable div. I recommend setting mousewheel.autodir.enabled to true, so you can scroll horizontally through the buttons by scrolling up/down with a mousewheel. You may need to adjust the "300" on line 32, this is the time (in milliseconds) before the script executes. Without it, the script will execute too fast so toolbar buttons added by scripts or extensions may not load depending on your overall startup speed. You want it as low as possible so you don't see the massive container shrinking a second after startup. 300 is just enough for me to never miss any buttons but my setup is pretty heavy, you may want a smaller number. 100 might work for you at first but every now and then you have an abnormally slow startup and you miss an icon. That said, if you don't use any buttons added by scripts or the built-in devtools button, you could probably remove setTimeout altogether. You can also change "max-width" on line 31 to make the container wider or smaller, ideally by increments of 32. I use 352 because I want 11 icons to be visible.
// @include        *
// @author         aminomancer
// ==/UserScript==

(function () {
    var toolbarSliderContainer = document.createElement("div");
    var toolbarSlider = document.createElement("div");
    var customizableNavBar = document.getElementById("nav-bar-customization-target");
    var toolbarIcons = customizableNavBar.children;
    // var toolbarWidgets = CustomizableUI.getWidgetsInArea('nav-bar').filter(Boolean).filter(filterWidgets);
    var toolbarButtonArray = [];
    var bippityBop = {
        onCustomizeStart: function () {
            unwrapAll(toolbarSlider.childNodes, customizableNavBar)
        },
        onCustomizeEnd: async function () {
            await convertToArray(toolbarIcons);
            rewrapAll(toolbarButtonArray);
        },
        onWidgetAfterDOMChange: function (aNode) {
            if (aNode.parentNode.id == "nav-bar-customization-target" && CustomizationHandler.isCustomizing() == false) {
                pickUpSibling();
            }
        }
    };

    function convertToArray(buttons) {
        return new Promise(resolve => {
            toolbarButtonArray.length = 0;
            for (let i = 0; i < buttons.length; i++) {
                switch (buttons[i].id) {
                    case "wrapper-back-button":
                    case "back-button":
                    case "wrapper-forward-button":
                    case "forward-button":
                    case "wrapper-stop-reload-button":
                    case "stop-reload-button":
                    case "wrapper-urlbar-container":
                    case "urlbar-container":
                    case "wrapper-search-container":
                    case "search-container":
                    case "nav-bar-toolbarbutton-slider-container":
                        break;
                    default:
                        toolbarButtonArray.push(buttons[i]);
                }
            }
            resolve("resolved");
        });
    };

    // function filterWidgets(item) {
    //     switch (item.id) {
    //         case "wrapper-back-button":
    //         case "back-button":
    //         case "wrapper-forward-button":
    //         case "forward-button":
    //         case "wrapper-stop-reload-button":
    //         case "stop-reload-button":
    //         case "wrapper-urlbar-container":
    //         case "urlbar-container":
    //         case "wrapper-search-container":
    //         case "search-container":
    //         case "nav-bar-toolbarbutton-slider-container":
    //             return false;
    //         default:
    //             return true;
    //     }
    // };

    function wrapAll(buttons, container) {
        var parent = buttons[0].parentNode;
        var previousSibling = buttons[0].previousSibling;
        for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
            container.appendChild(buttons[i]);
        }
        toolbarSliderContainer.appendChild(container);
        parent.insertBefore(toolbarSliderContainer, previousSibling.nextSibling);
    };

    function unwrapAll(buttons, container) {
        for (var i = 0; buttons.length - i; container.firstChild === buttons[0] && i++) {
            container.appendChild(buttons[i]);
        }
    };

    function rewrapAll(widgets) {
        for (var i = 0; widgets.length - i; toolbarSlider.firstChild === widgets[0] && i++) {
            toolbarSlider.appendChild(widgets[i]);
        }
    };

    // function getOrphansIntendedNeighbor(orphan) {
    //     var pos = toolbarWidgets.findIndex(
    //         (item) =>
    //         item.id == orphan.id
    //     );
    //     return toolbarWidgets[pos + 1].instances[0].node;
    // };

    // function pickUpOrphan() {
    //     var orph = toolbarSliderContainer.nextElementSibling;
    //     toolbarSlider.insertBefore(orph, getOrphansIntendedNeighbor(orph));
    // };

    function pickUpSibling() {
        toolbarSlider.appendChild(toolbarSliderContainer.nextElementSibling);
    };

    async function init() {
        await convertToArray(toolbarIcons);
        wrapAll(toolbarButtonArray, toolbarSlider);
        while (toolbarSliderContainer.nextElementSibling) pickUpSibling();
        // setTimeout(() => {
        //     while (toolbarSliderContainer.nextElementSibling) pickUpOrphan();
        // }, 1000);
    };

    init();
    CustomizableUI.addListener(bippityBop);
    toolbarSliderContainer.className = "container";
    toolbarSliderContainer.id = "nav-bar-toolbarbutton-slider-container";
    toolbarSliderContainer.style.cssText = "display:-moz-box;-moz-box-align:center;overflow-x:scroll;overflow-y:hidden;max-width:352px;scrollbar-width:none";
    toolbarSlider.className = "container";
    toolbarSlider.id = "nav-bar-toolbarbutton-slider";
    toolbarSlider.style.cssText = "display:flex;flex-flow:row;flex-direction:row";
})();