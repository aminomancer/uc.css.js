// ==UserScript==
// @name           Fluent Reveal Tabs
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a visual effect to tabs similar to the spotlight gradient effect on Windows 10's start menu tiles. When hovering a tab, a subtle radial gradient is applied under the mouse. Also applies to tabs in the "All tabs menu," and is fully compatible with my All Tabs Menu Expansion Pack. Inspired by the proof of concept here: https://www.reddit.com/r/FirefoxCSS/comments/ng5lnt/proof_of_concept_legacy_edge_like_interaction/
// ==/UserScript==

(function () {
    class FluentRevealEffect {
        static options = {
            showOnSelectedTab: false, // whether to show the effect if the tab is selected. this doesn't look good with my theme so I set it to false.
            showOnPinnedTab: false, // whether to show the effect on pinned tabs. likewise, doesn't look good with my theme but may work with yours.
            showInAllTabsMenu: true,
            lightColor: "hsla(224, 100%, 80%, 0.05)", // the color of the gradient. default is sort of a faint baby blue. you may prefer just white, e.g. hsla(0, 0%, 100%, 0.05)
            gradientSize: 50, // how wide the radial gradient is. 50px looks best with my theme, but default proton tabs are larger so you may want to try 60 or even 70.
            allTabsLightColor: "hsla(224, 100%, 80%, 0.07)", // same as above but for the all tabs menu. I prefer brighter and larger in the all tabs menu.
            allTabsGradientSize: 80,
            clickEffect: false, // whether to show an additional light burst when clicking a tab. I don't recommend this since it doesn't play nicely with dragging & dropping if you release while your mouse is outside the tab box. I can probably fix this issue but I don't think it's a great fit for tabs anyway.
        };
        static sleep(ms) {
            return new Promise((resolve) => setTimeout(resolve, ms));
        }
        constructor() {
            this._options = FluentRevealEffect.options;
            gBrowser.tabContainer.addEventListener("TabOpen", (e) =>
                this.applyEffect(e.target.querySelector(".tab-content"))
            );
            gBrowser.tabs.forEach((tab) => this.applyEffect(tab.querySelector(".tab-content")));

            if (this._options.showInAllTabsMenu) this.setUpAllTabsMenu();
        }

        async setUpAllTabsMenu() {
            gTabsPanel.init();
            let allTabsXPac = false;
            if (_ucUtils)
                allTabsXPac = !!_ucUtils
                    .getScriptData()
                    .find(
                        (script) =>
                            script.name === "All Tabs Menu Expansion Pack" &&
                            script.author === "aminomancer"
                    );

            console.log(allTabsXPac);
            if (allTabsXPac) await FluentRevealEffect.sleep(100);
            eval(
                `gTabsPanel.allTabsPanel._createRow = function ` +
                    gTabsPanel.allTabsPanel._createRow
                        .toSource()
                        .replace(/\_createRow/, "")
                        .replace(/^\(function /, "")
                        .replace(/\}\)/, `}`)
                        .replace(
                            /let button \= doc.createXULElement\(\"toolbarbutton\"\)\;/,
                            `let button = doc.createXULElement(\"toolbarbutton\"); fluentRevealFx.applyEffect(` +
                                (allTabsXPac ? "row" : "button") +
                                `, {gradientSize: "${this._options.allTabsGradientSize}", lightColor: "${this._options.allTabsLightColor}"});`
                        )
            );
        }

        /*
        Reveal Effect
        https://github.com/d2phap/fluent-reveal-effect
    
        MIT License
        Copyright (c) 2018 Duong Dieu Phap
    
        Permission is hereby granted, free of charge, to any person obtaining a copy
        of this software and associated documentation files (the "Software"), to deal
        in the Software without restriction, including without limitation the rights
        to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
        copies of the Software, and to permit persons to whom the Software is
        furnished to do so, subject to the following conditions:
    
        The above copyright notice and this permission notice shall be included in all
        copies or substantial portions of the Software.
    
        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
        IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
        FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
        AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
        LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
        OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
        SOFTWARE.
        */

        applyEffect(element, options = this._options) {
            element.is_pressed = false;

            if (!element.getAttribute("fluent-reveal-hover")) {
                element.setAttribute("fluent-reveal-hover", true);
                this.enableBackgroundEffects(element, options.lightColor, options.gradientSize);
            }

            if (this._options.clickEffect && !element.getAttribute("fluent-reveal-click")) {
                element.setAttribute("fluent-reveal-click", true);
                this.enableClickEffects(element, options.lightColor, options.gradientSize);
            }
        }

        clearEffect(element) {
            element.is_pressed = false;
            element.style.removeProperty("background-image");
        }

        shouldClear(element) {
            let tab = element.tab || element.closest("tab");
            return (
                (!this._options.showOnSelectedTab && tab.selected) ||
                (!this._options.showOnPinnedTab && tab.pinned)
            );
        }

        enableBackgroundEffects(element, lightColor, gradientSize) {
            element.addEventListener("mousemove", (e) => {
                if (this.shouldClear(element)) return this.clearEffect(element);

                let x = e.pageX - this.getOffset(element).left;
                let y = e.pageY - this.getOffset(element).top;

                if (this._options.clickEffect && element.is_pressed) {
                    let cssLightEffect = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0)), radial-gradient(circle ${70}px at ${x}px ${y}px, rgba(255,255,255,0), ${lightColor}, rgba(255,255,255,0), rgba(255,255,255,0))`;

                    this.drawEffect(element, x, y, lightColor, gradientSize, cssLightEffect);
                } else this.drawEffect(element, x, y, lightColor, gradientSize);
            });

            element.addEventListener("mouseleave", (e) => this.clearEffect(element));
        }

        enableClickEffects(element, lightColor, gradientSize) {
            element.addEventListener("mousedown", (e) => {
                if (this.shouldClear(element)) return this.clearEffect(element);

                element.is_pressed = true;
                const x = e.pageX - this.getOffset(element).left;
                const y = e.pageY - this.getOffset(element).top;

                const cssLightEffect = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0)), radial-gradient(circle ${70}px at ${x}px ${y}px, rgba(255,255,255,0), ${lightColor}, rgba(255,255,255,0), rgba(255,255,255,0))`;

                this.drawEffect(element, x, y, lightColor, gradientSize, cssLightEffect);
            });

            element.addEventListener("mouseup", (e) => {
                if (this.shouldClear(element)) return this.clearEffect(element);

                element.is_pressed = false;
                const x = e.pageX - this.getOffset(element).left - window.scrollX;
                const y = e.pageY - this.getOffset(element).top - window.scrollY;

                this.drawEffect(element, x, y, lightColor, gradientSize);
            });
        }

        getOffset(element) {
            return {
                top: element.getBoundingClientRect().top,
                left: element.getBoundingClientRect().left,
            };
        }

        drawEffect(element, x, y, lightColor, gradientSize, cssLightEffect = null) {
            let lightBg;

            if (cssLightEffect === null)
                lightBg = `radial-gradient(circle ${gradientSize}px at ${x}px ${y}px, ${lightColor}, rgba(255,255,255,0))`;
            else lightBg = cssLightEffect;

            element.style.backgroundImage = lightBg;
        }
    }

    function init() {
        window.fluentRevealFx = new FluentRevealEffect();
    }

    if (gBrowserInit.delayedStartupFinished) init();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
