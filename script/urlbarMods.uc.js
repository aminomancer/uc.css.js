// ==UserScript==
// @name           Urlbar Mods
// @version        1.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the urlbar. When you click & drag the identity box in the urlbar, it lets you drag and drop the URL into text fields, the tab bar, desktop, etc. while dragging it shows a little white box with the URL and favicon as the drag image. This script changes the colors of that drag box so they use CSS variables instead. This script can also be configured to restore the context menu that used to appear when right-clicking a search engine one-off button in the urlbar results panel. (The context menu was disabled recently) I'll continue to add to this script as I think of more urlbar mods that are too small to deserve their own dedicated script.
// ==/UserScript==

(function () {
    class UrlbarMods {
        static config = {
            "restore one-offs context menu": false, // recently the context menu for the search engine one-off buttons in the urlbar results panel has been disabled. but the context menu for the one-off buttons in the searchbar is still enabled. I'm not sure why they did this, and it's a really minor thing, but it's not like right-clicking the buttons does anything else, (at least on windows) so you may want to restore the context menu.
            "style identity icon drag box": true, // when you click & drag the identity box in the urlbar, it lets you drag and drop the URL into text fields, the tab bar, desktop, etc. while dragging it shows a little white box with the URL and favicon as the drag image. this can't be styled with CSS because it's drawn by the canvas 2D API. but we can easily change the function so that it sets the background and text colors equal to some CSS variables. it uses --tooltip-bgcolor, --tooltip-color, and --tooltip-border-color, or if those don't exist, it uses the vanilla variables --arrowpanel-background, --arrowpanel-color, and --arrowpanel-border-color. so if you use my theme duskFox it'll look similar to a tooltip. if you don't use my theme it'll look similar to a popup panel.
            "show device icon in remote tab urlbar results": true, // my theme increases the prominence of the "type icon" in urlbar results. for bookmarks, this is a star. for open tabs, it's a tab icon. for remote tabs, aka synced tabs, it's a sync icon. with this option enabled, however, instead of showing a sync icon it will show a device icon specific to the type of device. so if the tab was synced from a cell phone, the type icon will show a phone. if it was synced from a laptop, it'll show a laptop, etc. the script will add some CSS to set the icons, but it won't change the way type icons are layed out. that's particular to my theme and it's purely a CSS issue, so I don't want the script to get involved in that. my urlbar-results.css file makes the type icon look basically like a 2nd favicon. it goes next to the favicon, rather than displaying on top of it. the script's CSS just changes the icon, so it'll fit with however you have type icons styled. if you don't use my theme but you want type icons to look more prominent, see urlbar-results.css and search "type-icon"
        };
        constructor() {
            if (UrlbarMods.config["restore one-offs context menu"])
                this.restoreOneOffsContextMenu();
            if (UrlbarMods.config["style identity icon drag box"]) this.styleIdentityIconDragBox();
            if (UrlbarMods.config["show device icon in remote tab urlbar results"])
                this.urlbarResultsDeviceIcon();
        }
        get urlbarOneOffs() {
            return this._urlbarOneOffs || (this._urlbarOneOffs = gURLBar.view.oneOffSearchButtons);
        }
        restoreOneOffsContextMenu() {
            const urlbarOneOffsProto = Object.getPrototypeOf(this.urlbarOneOffs);
            const oneOffsBase = Object.getPrototypeOf(urlbarOneOffsProto);
            this.urlbarOneOffs._on_contextmenu = oneOffsBase._on_contextmenu;
        }
        urlbarResultsDeviceIcon() {
            XPCOMUtils.defineLazyPreferenceGetter(
                this,
                "showRemoteIconsPref",
                "services.sync.syncedTabs.showRemoteIcons",
                true
            );
            XPCOMUtils.defineLazyModuleGetter(
                this,
                "UrlbarResult",
                "resource:///modules/UrlbarResult.jsm"
            );
            let showRemoteIconsPref = this.showRemoteIconsPref;
            let UrlbarResult = this.UrlbarResult;
            let gUniqueIdSerial = 1;
            const RECENT_REMOTE_TAB_THRESHOLD_MS = 72 * 60 * 60 * 1000;
            function escapeRegExp(string) {
                return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            }
            function getUniqueId(prefix) {
                return prefix + (gUniqueIdSerial++ % 9999);
            }
            let provider = gURLBar.view.controller.manager.providers.find(
                (provider) => provider.name === "RemoteTabs"
            );
            UrlbarUtils.RESULT_PAYLOAD_SCHEMA[
                UrlbarUtils.RESULT_TYPE.REMOTE_TAB
            ].properties.clientType = {
                type: "string",
            };
            eval(
                `provider.startQuery = async function ` +
                    provider.startQuery
                        .toSource()
                        .replace(/async startQuery/, ``)
                        .replace(/(device\: client\.name\,)/, `$1 clientType: client.clientType,`)
            );
            eval(
                `gURLBar.view._updateRow = function ` +
                    gURLBar.view._updateRow
                        .toSource()
                        .replace(
                            /(item\.removeAttribute\(\"stale\"\)\;)/,
                            `$1 item.removeAttribute("clientType");`
                        )
                        .replace(
                            /(item\.setAttribute\(\"type\"\, \"remotetab\"\)\;)/,
                            `$1 if (result.payload.clientType) item.setAttribute("clientType", result.payload.clientType);`
                        )
            );
            let css = `.urlbarView-row[type="remotetab"] .urlbarView-type-icon{background:var(--device-icon,url("chrome://browser/skin/sync.svg")) center/contain no-repeat;}.urlbarView-row[type="remotetab"][clientType="phone"]{--device-icon:url("chrome://browser/skin/device-phone.svg");}.urlbarView-row[type="remotetab"][clientType="tablet"]{--device-icon:url("chrome://browser/skin/device-tablet.svg");}.urlbarView-row[type="remotetab"][clientType="desktop"]{--device-icon:url("chrome://browser/skin/device-desktop.svg");}.urlbarView-row[type="remotetab"][clientType="tv"]{--device-icon:url("chrome://browser/skin/device-tv.svg");}.urlbarView-row[type="remotetab"][clientType="vr"]{--device-icon:url("chrome://browser/skin/device-vr.svg");}`;
            let sss = Cc["@mozilla.org/content/style-sheet-service;1"].getService(
                Ci.nsIStyleSheetService
            );
            let uri = makeURI("data:text/css;charset=UTF=8," + encodeURIComponent(css));
            if (sss.sheetRegistered(uri, sss.AUTHOR_SHEET)) return;
            sss.loadAndRegisterSheet(uri, sss.AUTHOR_SHEET);
        }
        styleIdentityIconDragBox() {
            // for a given string in CSS3 custom property syntax, e.g. "var(--tooltip-color)" or "var(--tooltip-color, rgb(255, 255, 255))", convert it to a hex code string e.g. "#FFFFFF"
            function varToHex(variable) {
                let temp = document.createElement("div");
                document.body.appendChild(temp);
                temp.style.color = variable;
                let rgb = getComputedStyle(temp).color;
                temp.remove();
                rgb = rgb
                    .split("(")[1]
                    .split(")")[0]
                    .split(rgb.indexOf(",") > -1 ? "," : " ");
                rgb.length = 3;
                rgb.forEach((c, i) => {
                    c = (+c).toString(16);
                    rgb[i] = c.length === 1 ? "0" + c : c.slice(0, 2);
                });
                return "#" + rgb.join("");
            }
            // draw a rectangle with rounded corners
            function roundRect(ctx, x, y, width, height, radius = 5, fill, stroke) {
                if (typeof radius === "number")
                    radius = { tl: radius, tr: radius, br: radius, bl: radius };
                else {
                    let defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
                    for (let side in defaultRadius)
                        radius[side] = radius[side] || defaultRadius[side];
                }
                ctx.beginPath();
                ctx.moveTo(x + radius.tl, y);
                ctx.lineTo(x + width - radius.tr, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
                ctx.lineTo(x + width, y + height - radius.br);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
                ctx.lineTo(x + radius.bl, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
                ctx.lineTo(x, y + radius.tl);
                ctx.quadraticCurveTo(x, y, x + radius.tl, y);
                ctx.closePath();
                if (fill) {
                    ctx.fillStyle = fill;
                    ctx.fill();
                }
                if (stroke) {
                    ctx.strokeStyle = stroke;
                    ctx.stroke();
                }
            }
            // override the internal dragstart callback so it uses variables instead of "white" and "black"
            eval(
                `gIdentityHandler.onDragStart = function ` +
                    gIdentityHandler.onDragStart
                        .toSource()
                        .replace(
                            /(let backgroundColor = ).*;/,
                            `$1varToHex("var(--tooltip-bgcolor, var(--arrowpanel-background))");`
                        )
                        .replace(
                            /(let textColor = ).*;/,
                            `$1varToHex("var(--tooltip-color, var(--arrowpanel-color))");`
                        )
                        .replace(/ctx\.fillStyle = backgroundColor;/, ``)
                        .replace(
                            /ctx\.fillRect.*;/,
                            `roundRect(ctx, 0, 0, totalWidth * scale, totalHeight * scale, 5, backgroundColor, varToHex("var(--tooltip-border-color, var(--arrowpanel-border-color))"));`
                        )
            );
        }
    }

    if (gBrowserInit.delayedStartupFinished) new UrlbarMods();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                new UrlbarMods();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
