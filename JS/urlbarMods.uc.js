// ==UserScript==
// @name           Urlbar Mods
// @version        1.4.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Makes some minor modifications to the urlbar. See the code comments below for more details.
// ==/UserScript==

(function () {
    class UrlbarMods {
        static config = {
            // recently the context menu for the search engine one-off buttons in the urlbar results panel has been disabled. but the context menu for the one-off buttons in the searchbar is still enabled. I'm not sure why they did this, and it's a really minor thing, but it's not like right-clicking the buttons does anything else, (at least on windows) so you may want to restore the context menu.
            "restore one-offs context menu": false,

            // when you click & drag the identity box in the urlbar, it lets you drag and drop the URL into text fields, the tab bar, desktop, etc. while dragging it shows a little white box with the URL and favicon as the drag image. this can't be styled with CSS because it's drawn by the canvas 2D API. but we can easily change the function so that it sets the background and text colors equal to some CSS variables. it uses --tooltip-bgcolor, --tooltip-color, and --tooltip-border-color, or if those don't exist, it uses the vanilla variables --arrowpanel-background, --arrowpanel-color, and --arrowpanel-border-color. so if you use my theme duskFox it'll look similar to a tooltip. if you don't use my theme it'll look similar to a popup panel.
            "style identity icon drag box": true,

            // my theme increases the prominence of the "type icon" in urlbar results. for bookmarks, this is a star. for open tabs, it's a tab icon. for remote tabs, aka synced tabs, it's a sync icon. with this option enabled, however, instead of showing a sync icon it will show a device icon specific to the type of device. so if the tab was synced from a cell phone, the type icon will show a phone. if it was synced from a laptop, it'll show a laptop, etc. the script will add some CSS to set the icons, but it won't change the way type icons are layed out. that's particular to my theme and it's purely a CSS issue, so I don't want the script to get involved in that. my urlbar-results.css file makes the type icon look basically like a 2nd favicon. it goes next to the favicon, rather than displaying on top of it. the script's CSS just changes the icon, so it'll fit with however you have type icons styled. if you don't use my theme but you want type icons to look more prominent, see urlbar-results.css and search "type-icon"
            "show device icon in remote tab urlbar results": true,

            // normally, when you type something like "firefox install" or "clear cookies" in the urlbar, it suggests an "intervention" or "tip" which acts as a kind of shortcut to various settings and profile operations that some beginners might have a hard time finding. this is a fine feature for people who are new to firefox. but people who use firefox a lot use the urlbar quickly and could very easily accidentally hit enter on one of those results. I decided to add this option to the script because I very nearly wiped my entire profile due to the tip that lets you "Restore default settings and remove old add-ons for optimal performance." From my point of view, these results just waste space while presenting a major hazard to the user, which makes them far more of a liability than an asset. Therefore, they will be removed entirely by this setting.
            "disable urlbar intervention tips": true,

            // by default, urlbar results are not sorted consistently between regular mode and search mode. when you use the urlbar normally, the order of urlbar results is determined by a pref. (browser.urlbar.showSearchSuggestionsFirst) it's true by default, so search suggestions are shown at the top of the list. when you enter "search mode," e.g. by clicking a one-off search engine button in the urlbar results panel, this pref is no longer used. suggestions are shown at the top of the list no matter what — it's hard-coded into the urlbar muxer's sort function. if you don't change the pref this shouldn't matter, since they both show suggestions at the top of the list. but if you set the pref to false, (e.g. if you want top or recent site URLs to appear at the top of the list so you don't have to hit Tab so many times to reach them) you'll get URLs at the top of the list in regular mode, and URLs at the bottom of the list in search mode. this inconsistent, unintuitive behavior makes no sense, but for some reason prominent developers are defending this status quo. I have twice offered to fix it for them and, instead of leaving it waiting for someone to eventually solve it, my whole complaint was dismissed as if it was invalid. (see https://bugzilla.mozilla.org/show_bug.cgi?id=1727904 for more details) there seems to be an increasing number of bizarre and almost user-hostile design choices incorporated into firefox, with an incredible degree of resistance to user feedback. so, as I have done like 80 times by now, I'm releasing this (debatable) bug fix as a third-party javascript mod.
            "sort urlbar results consistently": true,

            // when you type nothing but space or tab characters in the urlbar, the first result will have an empty title. consecutive whitespace characters don't add to the displayed node width so it ends up looking basically empty. we can change this by setting it to use non-breaking spaces instead of space characters, and adding an attribute "all-whitespace" to the title element. then your CSS can underline it. this is already done in uc-urlbar-results.css but if you wanna do it yourself: .urlbarView-title[all-whitespace] {text-decoration: underline}
            "underline whitespace results": true,
        };
        constructor() {
            if (UrlbarMods.config["restore one-offs context menu"])
                this.restoreOneOffsContextMenu();
            if (UrlbarMods.config["style identity icon drag box"]) this.styleIdentityIconDragBox();
            if (UrlbarMods.config["show device icon in remote tab urlbar results"])
                this.urlbarResultsDeviceIcon();
            if (UrlbarMods.config["disable urlbar intervention tips"])
                this.disableUrlbarInterventions();
            if (UrlbarMods.config["sort urlbar results consistently"]) this.urlbarResultsSorting();
            if (UrlbarMods.config["underline whitespace results"]) this.underlineSpaceResults();
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
            let src1 = provider.startQuery.toSource();
            let src2 = gURLBar.view._updateRow.toSource();
            if (!src1.includes("client.clientType"))
                eval(
                    `provider.startQuery = async function ` +
                        provider.startQuery
                            .toSource()
                            .replace(/async startQuery/, ``)
                            .replace(
                                /(device\: client\.name\,)/,
                                `$1 clientType: client.clientType,`
                            )
                );
            if (!src2.includes("result.payload.clientType"))
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
        disableUrlbarInterventions() {
            let manager = gURLBar.controller.manager;
            let interventions = manager.providers.find(
                (provider) => provider.name === "UrlbarProviderInterventions"
            );
            if (interventions) manager.unregisterProvider(interventions);
        }
        urlbarResultsSorting() {
            let UnifiedComplete = gURLBar.view.controller.manager.muxers.get("UnifiedComplete");
            let sortSrc = UnifiedComplete.sort.toSource();
            if (!sortSrc.includes("getLogger"))
                eval(
                    `UnifiedComplete.sort = function ` +
                        sortSrc
                            .replace(/sort/, ``)
                            .replace(
                                /logger/,
                                `UrlbarUtils.getLogger({ prefix: "MuxerUnifiedComplete" })`
                            )
                            .replace(
                                /showSearchSuggestionsFirst\: true/,
                                `showSearchSuggestionsFirst: UrlbarPrefs.get("showSearchSuggestionsFirst")`
                            )
                );
        }
        underlineSpaceResults() {
            gURLBar.view._addTextContentWithHighlights = function (node, text, highlights) {
                node.textContent = "";
                if (!text) return;
                if (/^\s{2,}$/.test(text) && !highlights.length) {
                    text = text.replace(/\s/g, `\u00A0`);
                    node.setAttribute("all-whitespace", true);
                } else node.removeAttribute("all-whitespace");
                highlights = (highlights || []).concat([[text.length, 0]]);
                let index = 0;
                for (let [highlightIndex, highlightLength] of highlights) {
                    if (highlightIndex - index > 0)
                        node.appendChild(
                            this.document.createTextNode(text.substring(index, highlightIndex))
                        );
                    if (highlightLength > 0) {
                        let strong = this._createElement("strong");
                        strong.textContent = text.substring(
                            highlightIndex,
                            highlightIndex + highlightLength
                        );
                        node.appendChild(strong);
                    }
                    index = highlightIndex + highlightLength;
                }
            };
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
