// ==UserScript==
// @name           Invert PDF Button
// @version        1.1.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @description    Add a new button to Firefox's PDF.js viewer toolbar. It inverts the PDF colors to provide a dark mode.
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/invertPDFButton.sys.mjs
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/invertPDFButton.sys.mjs
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @backgroundmodule
// ==/UserScript==

export class InvertPDFButtonChild extends JSWindowActorChild {
  static config = {
    filter: "invert(98%) hue-rotate(176.4deg)",
    icons: {
      invert:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M7.996,2.01v11.86c-2.766,0-5.015-2.198-5.015-4.906c0-1.303,0.518-2.532,1.463-3.46L7.996,2.01 M3.274,4.309L3.274,4.309C2.061,5.504,1.31,7.151,1.31,8.964c0,3.635,2.993,6.577,6.687,6.577s6.687-2.942,6.687-6.578c0-1.813-0.752-3.46-1.964-4.655l0,0l-4.137-4.07c-0.326-0.318-0.844-0.318-1.17,0L3.274,4.309z" /></svg>',
      uninvert:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="context-fill" fill-opacity="context-fill-opacity"><path d="M15.227,14.594L9.212,8.58L7.996,7.363v0.001L5.297,4.664l0.001-0.001L4.116,3.48L4.114,3.482L1.938,1.305c-0.322-0.322-0.842-0.322-1.164,0s-0.322,0.842,0,1.164l2.182,2.183C1.934,5.811,1.31,7.318,1.31,8.964c0,3.635,2.993,6.577,6.687,6.577c1.639,0,3.133-0.585,4.294-1.548l1.764,1.765c0.322,0.322,0.842,0.322,1.164,0C15.549,15.437,15.549,14.916,15.227,14.594z M7.996,13.87c-2.766,0-5.015-2.198-5.015-4.906c0-1.152,0.425-2.234,1.172-3.113l3.843,3.845V13.87z M5.29,2.325l2.121-2.087c0.326-0.318,0.844-0.318,1.17,0l4.137,4.07c1.212,1.196,1.964,2.842,1.964,4.656c0,0.818-0.158,1.597-0.435,2.319L7.996,5.031V2.01L6.473,3.508L5.29,2.325z" /></svg>',
    },
    l10n: {
      invert: "Invert PDF",
      uninvert: "Uninvert PDF",
    },
  };

  handleEvent(event) {
    if (this.document?.nodePrincipal.originNoSuffix !== "resource://pdf.js") {
      return;
    }
    this.setup();
  }

  setup() {
    let container = this.document.getElementById("toolbarViewerRight");
    if (!container || this.document.getElementById("editorInvert")) {
      return;
    }
    this.addButton(container);
    let inverted = Services.prefs.getBoolPref(
      "userChrome.invertPDFButton.inverted",
      false
    );
    if (inverted) {
      this.invertPDF();
    } else {
      this.uninvertPDF();
    }
    this.addStyles();
  }

  addButton(container) {
    let separator = this.document.createElement("div");
    separator.className = "verticalToolbarSeparator";
    separator.id = "editorInvertSeparator";
    container.prepend(separator);
    let button = this.document.createElement("button");
    button.id = "editorInvert";
    button.className = "toolbarButton";
    const { invert: label } = InvertPDFButtonChild.config.l10n;
    button.title = label;
    button.onclick = () => {
      if (button.dataset.inverted) {
        this.uninvertPDF();
        this.sendAsyncMessage("UninvertPDF");
      } else {
        this.invertPDF();
        this.sendAsyncMessage("InvertPDF");
      }
    };
    let altText = this.document.createElement("span");
    altText.textContent = label;
    button.appendChild(altText);
    container.prepend(button);
  }

  addStyles() {
    if (!this.document.getElementById("editorInvertStyles")) {
      const { invert, uninvert } = InvertPDFButtonChild.config.icons;
      let stylesheet = this.document.createElement("style");
      stylesheet.id = "editorInvertStyles";
      stylesheet.textContent = /* css */ `#editorInvert::before {
          mask-image: url('${invert}');
        }
        #editorInvert[data-inverted]::before {
          mask-image: url('${uninvert}');
        }`;
      this.document.head.appendChild(stylesheet);
    }
  }

  invertPDF() {
    const {
      filter,
      l10n: { uninvert },
    } = InvertPDFButtonChild.config;
    let viewer = this.document.getElementById("viewer");
    if (viewer) {
      if (viewer.style.filter) {
        viewer.style.removeProperty("filter");
        return;
      }
      viewer.style.filter = filter;
    }
    let button = this.document.getElementById("editorInvert");
    if (button) {
      button.dataset.inverted = true;
      button.title = uninvert;
      button.querySelector("span").textContent = uninvert;
    }
  }

  uninvertPDF() {
    let viewer = this.document.getElementById("viewer");
    if (viewer) {
      viewer.style.removeProperty("filter");
    }
    let button = this.document.getElementById("editorInvert");
    if (button) {
      const { invert } = InvertPDFButtonChild.config.l10n;
      delete button.dataset.inverted;
      button.title = invert;
      button.querySelector("span").textContent = invert;
    }
  }
}

export class InvertPDFButtonParent extends JSWindowActorParent {
  async receiveMessage({ name } = {}) {
    switch (name) {
      case "InvertPDF":
        Services.prefs.setBoolPref("userChrome.invertPDFButton.inverted", true);
        break;
      case "UninvertPDF":
        Services.prefs.clearUserPref("userChrome.invertPDFButton.inverted");
        break;
    }
  }
}

if (Services.appinfo.processType === Services.appinfo.PROCESS_TYPE_DEFAULT) {
  Services.prefs
    .getDefaultBranch("")
    .setBoolPref("userChrome.invertPDFButton.inverted", false);

  let esModuleURI = import.meta.url;
  ChromeUtils.registerWindowActor("InvertPDFButton", {
    child: { esModuleURI, events: { DOMContentLoaded: {} } },
    parent: { esModuleURI },
    allFrames: true,
    messageManagerGroups: ["browsers"],
  });
}
