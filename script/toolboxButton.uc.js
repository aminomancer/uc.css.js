(function () {
    if (location != 'chrome://browser/content/browser.xul' && location != 'chrome://browser/content/browser.xhtml')
        return;

    try {
        CustomizableUI.createWidget({
            id: 'toolbox-button',
            type: 'custom',
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onBuild: function (aDocument) {
                var toolbaritem = aDocument.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'toolbarbutton');
                toolbaritem.onclick = event => onClick(event);
                var props = {
                    id: 'toolbox-button',
                    class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                    label: 'Browser Toolbox',
                    tooltiptext: 'Open Content/Browser Toolbox',
                    // style: 'list-style-image: url("data:image/svg+xml;utf8,<svg></svg>")'
                };
                for (var p in props)
                    toolbaritem.setAttribute(p, props[p]);
                return toolbaritem;
            }
        });
    } catch (e) {};

    function onClick(event) {
        if (event.button == 0) {
            key_toggleToolbox.click();
            event.preventDefault();
        } else if (event.button == 2) {
            key_browserToolbox.click();
            event.preventDefault();
        } else if (event.button == 1) {
            if (Services.prefs.getBoolPref('ui.popup.disable_autohide') == false) {
                Services.prefs.setBoolPref('ui.popup.disable_autohide', true);
            } else if (Services.prefs.getBoolPref('ui.popup.disable_autohide') == true) {
                Services.prefs.setBoolPref('ui.popup.disable_autohide', false);
            };
        }
    }
})();