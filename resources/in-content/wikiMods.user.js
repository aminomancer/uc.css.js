// ==UserScript==
// @name        Wikipedia Mods
// @namespace   https://github.com/aminomancer
// @match       http*://*.wikipedia.org/wiki/*
// @grant       none
// @version     1.1
// @author      aminomancer
// @run-at      document-body
// @description 11/22/2021, 1:26:57 AM
// ==/UserScript==

class WikiMods {
    constructor() {
        this.logo = this.makeLogo();
        if (this.logo === "hidden") document.addEventListener('visibilitychange', this);
    }
    handleEvent(e) {
        if (!document.hidden) {
            this.logo = this.makeLogo();
            if (typeof this.logo === "object") document.removeEventListener('visibilitychange', this);
        }
    }
    // add a custom logo, intended to be used in conjunction with my wikipedia dark mode theme:
    // https://github.com/aminomancer/uc.css.js/blob/master/resources/in-content/site-wiki.css
    makeLogo() {
        if (!location.pathname.startsWith("/wiki/")) return false;
        let original = document.querySelector("#p-logo .mw-wiki-logo");
        let mwHead = document.querySelector("#mw-head");
        if (!mwHead) return "hidden";
        let bodyContent = document.querySelector(".mw-body#content");
        bodyContent.setAttribute("uc-custom-logo", true);
        let logo = document.createElement("a");
        let heading = document.createElement("span");
        let firstLetter = document.createElement("strong");
        let text1 = document.createTextNode("W");
        firstLetter.appendChild(text1);
        let text2 = document.createTextNode("ikipedia");
        heading.appendChild(firstLetter);
        heading.appendChild(text2);
        logo.appendChild(heading);
        logo.id = "uc-custom-logo-link";
        logo.title = original.title;
        logo.href = original.href;
        mwHead.prepend(logo);
        return logo;
    }
}

window.ucWikiMods = new WikiMods();
