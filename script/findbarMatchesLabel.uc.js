// ==UserScript==
// @name           Mini Findbar Matches Label
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    Creates a miniaturized label for findbar matches, miniaturizes the "Match case" and "Whole words" buttons, and also adds a Ctrl+F hotkey to close the findbar if you already have it focused. Instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. Requires some css from my repo obviously, namely uc-findbar.Css. And you'll want to hide the long-winded built-in matches label, naturally. I just added the hotkey because I don't like reaching over to the escape key. This makes ctrl+f more of a findbar toggle than a key that strictly opens the findbar. FYI, the hotkey works with ctrl as well as for cmd/meta, like the built-in 'accel' key, but doesn't actually use the accel key pref because it's deprecated. The hotkey works like this: if the findbar isn't open, then ctrl+f opens it. If it is open but the input box is not focused, then ctrl+f focuses it and selects whatever text is in the box. (that's the normal behavior in firefox) and if the findbar is open and the input box is focused, then ctrl+f closes it. Also, if you're in 'find as you type' mode, ctrl+f switches to regular find mode. From there, ctrl+f again will close the findbar. (or if you un-focus the findbar in between, it will focus the findbar, and then hitting ctrl+f once more will close it) the indicator can be styled with the selector .matches-indicator. It's the next sibling of the findbar input box. See uc-findbar.css in this repo for how I styled it. It's explained in more detail in the code comments below.
// ==/UserScript==

(() => {
    let findbarMatchesLabel = {
        /* on window startup, attach an event listener to the window's tab container that listens for the initialization of the findbar. every tab has its own findbar, or strictly speaking every tab has its own browser and every browser has its own findbar. a findbar is not actually created when you make a new tab though. you have to actually hit ctrl+F to generate the object that we reference with gFindBar. it doesn't get garbage collected when you close the findbar, so each tab should only ever have one findbar object under ordinary circumstances. but the initial setup requires user interaction, so we need to use this special event which i guess was made for test purposes but is apparently also used to help resist fingerprinting somehow. */
        init() {
            gBrowser.tabContainer.addEventListener(
                "TabFindInitialized",
                findbarMatchesLabel.setupForBrowser.bind(window)
            );
        },

        setupForBrowser(event) {
            if (event.target.ownerGlobal !== this) return; // make sure event was called from this window, otherwise we might have problems when multiple windows are open.
            let findbar = this.gFindBar; // just an alias
            let getBounds = window.windowUtils.getBoundsWithoutFlushing;

            function exitFindBar(e) {
                if (e.repeat || e.shiftKey || e.altKey) {
                    return;
                }
                if (e.code === "KeyF" && (e.ctrlKey || e.metaKey)) {
                    if (this.hidden) return; // if it's already hidden then let the built-in command open it.
                    let field = this._findField;
                    try {
                        this.findMode > 0 // if we're in 'find as you type' mode...
                            ? this.open(0) // switch to normal find mode.
                            : field.contains(document.activeElement) // if we're in normal mode already then check if the input box is focused...
                            ? field.selectionEnd - field.selectionStart === field.textLength // if already focused, check if all input text is selected. difference between end and start only equals length if every character is within the selection range.
                                ? this.close() // if there's already a selection, close the findbar.
                                : (field.select(), field.focus()) // if nothing is selected, select the full contents of the input box.
                            : (field.select(), field.focus()); // if not focused, focus and select the input box.
                    } catch (e) {
                        // i haven't seen an error here but if any of these references don't exist it probably means the built-in findbar object initialized wrong for some reason.
                        // in which case it's probably not open. it definitely exists though, since this event listener can't exist in the first place unless the findbar object exists. so just try opening it
                        this.open(0);
                    }
                    e.preventDefault();
                }
            }

            function onKey(e) {
                if (this.hasMenu() && this.open) return;
                // handle arrow key focus navigation
                else {
                    if (
                        e.keyCode == KeyEvent.DOM_VK_UP ||
                        (e.keyCode == KeyEvent.DOM_VK_LEFT &&
                            document.defaultView.getComputedStyle(this.parentNode).direction ==
                                "ltr") ||
                        (e.keyCode == KeyEvent.DOM_VK_RIGHT &&
                            document.defaultView.getComputedStyle(this.parentNode).direction ==
                                "rtl")
                    ) {
                        e.preventDefault();
                        window.document.commandDispatcher.rewindFocus();
                        return;
                    }
                    if (
                        e.keyCode == KeyEvent.DOM_VK_DOWN ||
                        (e.keyCode == KeyEvent.DOM_VK_RIGHT &&
                            document.defaultView.getComputedStyle(this.parentNode).direction ==
                                "ltr") ||
                        (e.keyCode == KeyEvent.DOM_VK_LEFT &&
                            document.defaultView.getComputedStyle(this.parentNode).direction ==
                                "rtl")
                    ) {
                        e.preventDefault();
                        window.document.commandDispatcher.advanceFocus();
                        return;
                    }
                }
                // handle access keys
                if (!e.charCode || e.charCode <= 32 || e.altKey || e.ctrlKey || e.metaKey) return;
                const charLower = String.fromCharCode(e.charCode).toLowerCase();
                if (this.accessKey.toLowerCase() == charLower) {
                    this.click();
                    return;
                }
                // check against accesskeys of siblings and activate them if matched
                for (const el of Object.values(this.parentElement.children))
                    if (el.accessKey.toLowerCase() === charLower) {
                        el.focus();
                        el.click();
                        return;
                    }
            }

            function domSetup() {
                findbar._tinyIndicator = document.createElement("label"); // the new mini indicator that will read something like 1/27 instead of 1 of 27 matches.
                findbar._caseSensitiveButton = findbar.querySelector(".findbar-case-sensitive");
                findbar._entireWordButton = findbar.querySelector(".findbar-entire-word");
                findbar._closeButton = findbar.querySelector(".findbar-closebutton");
                // my own findbar CSS is pretty complicated. it turns the findbar into a small floating box rather than a bar that covers the full width of the window and flexes the browser out of the way. mine hovers over the window, i.e. like position: absolute & display: block. i also hide all the buttons except the next, previous, and close buttons. so my findbar is tiny but since we're adding an indicator we might as well make the text field bigger. the default firefox findbar is really silly, why have such a giant findbar if the text field is only gonna be 14em?
                // there's also some CSS in my stylesheets that gives the findbar a smooth transition and starting animation and compresses the buttons and stuff. the effects of this script probably look really weird without those rules so i'd definitely look for the findbar rules in my repo if you're gonna try this script.
                findbar._findField.style.width = "20em";
                findbar._tinyIndicator.style.cssText = // this could all be set in a stylesheet, i just put it here so the core CSS won't get separated from the javascript it depends on. the other stuff in the stylesheets works with or without this script. whereas this code is exclusive to the new match indicator.
                    "box-sizing: border-box; display: inline-block; -moz-box-align: center; margin: 0; line-height: 20px; position: absolute; font-size: 10px; right: 110px; color: hsla(0, 0%, 100%, 0.25); pointer-events: none; padding-inline-start: 20px; mask-image: linear-gradient(to right, transparent 0px, black 20px);";
                findbar._tinyIndicator.className = "matches-indicator"; // for styling the background color changes which depend on the status of the findbar and whether it's focused
                findbar._findField.parentNode.after(findbar._closeButton);
                findbar._findField.after(findbar._tinyIndicator); // put it after the input box so we can use the ~ squiggly combinator
                // move the match-case and entire-word buttons into the text field. uc-findbar.css turns these buttons into mini icons, same size as the next/previous buttons. this way we can fit everything important into one row.
                findbar._tinyIndicator.after(
                    findbar._caseSensitiveButton,
                    findbar._entireWordButton
                );
            }

            domSetup();
            findbar.addEventListener("keypress", exitFindBar, true); // set up hotkey ctrl+F to close findbar when it's already open
            findbar._caseSensitiveButton.addEventListener("keypress", onKey);
            findbar._entireWordButton.addEventListener("keypress", onKey);

            setTimeout(() => {
                let distanceFromEdge =
                    getBounds(findbar).right - getBounds(findbar._caseSensitiveButton).left;
                findbar._tinyIndicator.style.right = `${distanceFromEdge + 1}px`;
            }, 500);

            // override the native function so it updates both labels.
            findbar.onMatchesCountResult = function onMatchesCountResult(result) {
                if (result.total !== 0) {
                    if (result.total == -1) {
                        this._foundMatches.value = PluralForm.get(
                            result.limit,
                            this.strBundle.GetStringFromName("FoundMatchesCountLimit")
                        ).replace("#1", result.limit);
                        this._tinyIndicator.innerText = `${result.limit}+`;
                    } else {
                        this._foundMatches.value = PluralForm.get(
                            result.total,
                            this.strBundle.GetStringFromName("FoundMatches")
                        )
                            .replace("#1", result.current)
                            .replace("#2", result.total);
                        this._tinyIndicator.innerText = `${result.current}/${result.total}`;
                    }
                    this._foundMatches.hidden = false;
                    findbar._tinyIndicator.removeAttribute("empty"); // bring it back if it's not blank.
                } else {
                    this._foundMatches.hidden = true;
                    this._foundMatches.value = "";
                    this._tinyIndicator.innerText = "   ";
                    findbar._tinyIndicator.setAttribute("empty", "true"); // hide the indicator background with CSS if it's blank.
                }
            };
        },
    };

    // check that startup has finished and gBrowser is initialized before we add an event listener
    if (gBrowserInit.delayedStartupFinished) {
        findbarMatchesLabel.init();
    } else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                findbarMatchesLabel.init();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
})();
