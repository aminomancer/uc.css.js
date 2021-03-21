// ==UserScript==
// @name           betterPopupPlacement.uc.js
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Anchor the permission popup to the permission granted icon, rather than the entire permission icon box. This way it looks like the arrow panel is popping out of an actual icon rather than hovering in the middle of multiple icons. Does the same thing with the identity icon popup, so the popup is tethered to the identity icon rather than the identity icon box. Otherwise the popup ends up in between the identity icon and the identity label. That's currently all this does but I'll probably modify more popup placements in the future.
// ==/UserScript==

(function () {
    function init() {
        gPermissionPanel._initializePopup();
        gIdentityHandler._initializePopup();

        gPermissionPanel._openPopup = function _openPopup(event) {
            // Make the popup available.
            this._initializePopup();

            // Remove the reload hint that we show after a user has cleared a permission.
            this._permissionReloadHint.hidden = true;

            // Update the popup strings
            this._refreshPermissionPopup();

            // Add the "open" attribute to the button in the identity box for styling
            this._identityPermissionBox.setAttribute("open", "true");

            // Check the panel state of other panels. Hide them if needed.
            let openPanels = Array.from(document.querySelectorAll("panel[openpanel]"));
            for (let panel of openPanels) {
                PanelMultiView.hidePopup(panel);
            }

            // Now open the popup, anchored off the primary chrome element
            PanelMultiView.openPopup(
                this._permissionPopup,
                this._identityPermissionBox.querySelector("#permissions-granted-icon"),
                {
                    position: "bottomcenter topleft",
                    triggerEvent: event,
                }
            ).catch(Cu.reportError);
        };

        gIdentityHandler._openPopup = function _openPopup(event) {
            // Make the popup available.
            this._initializePopup();

            // Update the popup strings
            this.refreshIdentityPopup();

            // Add the "open" attribute to the identity box for styling
            this._identityIconBox.setAttribute("open", "true");

            // Check the panel state of other panels. Hide them if needed.
            let openPanels = Array.from(document.querySelectorAll("panel[openpanel]"));
            for (let panel of openPanels) {
                PanelMultiView.hidePopup(panel);
            }

            // Now open the popup, anchored off the primary chrome element
            PanelMultiView.openPopup(this._identityPopup, this._identityIcon, {
                position: "bottomcenter topleft",
                triggerEvent: event,
            }).catch(Cu.reportError);
        };

        gIdentityHandler._identityPopup.style.marginTop = "0";
        gPermissionPanel._permissionPopup.style.marginTop = "0";
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
