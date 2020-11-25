(function () {
    if (location != "chrome://browser/content/browser.xul" && location != "chrome://browser/content/browser.xhtml") return;

    try {
        CustomizableUI.createWidget({
            id: "alltabs-toolbar-button",
            type: "custom",
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onBuild: function (aDocument) {
                var toolbaritem = aDocument.createElementNS(
                    "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul",
                    "toolbarbutton"
                );
                toolbaritem.onclick = (event) => onClick(event);
                var props = {
                    id: "alltabs-toolbar-button",
                    class: "toolbarbutton-1 chromeclass-toolbar-additional",
                    label: "List all tabs",
                    tooltiptext: "List all tabs",
                    style: "list-style-image: url(chrome://global/skin/icons/arrow-dropdown-16.svg)",
                };
                for (var p in props) toolbaritem.setAttribute(p, props[p]);
                return toolbaritem;
            },
        });
    } catch (e) {}

    function onClick(event) {
        if (event.button == 0) {
            gTabsPanel.showAllTabsPanel();
            event.preventDefault();
        }
    }
})();
