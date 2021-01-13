// ==UserScript==
// @name           mini findbar matches label
// @author         aminomancer
// @homepage       https://github.com/aminomancer
// @description    creates a miniaturized label for findbar matches and also adds a ctrl+F hotkey to close the findbar if you already have it focused. instead of "1 of 500 matches" this one says "1/500" and floats inside the input box. requires some CSS from my repo obviously. and you'll want to hide the long-winded built-in matches label, naturally. i just added the hotkey because i don't like reaching over to the escape key. this makes ctrl+F more of a findbar toggle than a key that strictly opens the findbar.
// fyi, the hotkey works with ctrl as well as for cmd/meta, like the built-in 'accel' key, but doesn't actually use the accel key pref because it's deprecated. the hotkey works like this: if the findbar isn't open, then ctrl+F opens it. if it is open but the input box is not focused, then ctrl+F focuses it and selects whatever text is in the box. (that's the normal behavior in firefox) and if the findbar is open and the input box is focused, then ctrl+F closes it. also, if you're in 'find as you type' mode, ctrl+F switches to regular find mode. from there, ctrl+F again will close the findbar. (or if you un-focus the findbar in between, it will focus the findbar, and then hitting ctrl+F once more will close it)
// as for the matches indicator, it's written to be as snappy as possible but the built-in indicator logic is a little buggy. we have to cover that weirdness up a bit by checking for unexpected values. it's slower when there are a ton of matched results. the indicator can be styled with the selector .matches-indicator. it's the next sibling of the findbar input box. see uc3.css in this repo for how i styled it. i think there's other findbar-related stuff in some of the other ucX.css files so do a search for 'findbar' or something. it's explained in more detail in the code comments below.
// ==/UserScript==

(function () {
    let findbarMatchesLabel = {
        /* on window startup, attach an event listener to the window's tab container that listens for the initialization of the findbar. every tab has its own findbar, or strictly speaking every tab has its own browser and every browser has its own findbar. a findbar is not actually created when you make a new tab though. you have to actually hit ctrl+F to generate the object that we reference with gFindBar. it doesn't get garbage collected when you close the findbar, so each tab should only ever have one findbar object under ordinary circumstances. but the initial setup requires user interaction, so we need to use this special event which i guess was made for test purposes but is apparently also used to help resist fingerprinting somehow. */
        init() {
            gBrowser.tabContainer.addEventListener(
                "TabFindInitialized",
                findbarMatchesLabel.attachObservers.bind(window)
            );
        },

        attachObservers(event) {
            if (event.target.ownerGlobal !== this) return; // make sure event was called from this window, otherwise we might have problems when multiple windows are open.
            let findbar = gFindBar, // just an alias
                nativeMatches = findbar._foundMatches, // the native DOM node that displays the index and number of matches. we use this to calculate the intended indicator string value
                matchesIndicator = document.createElement("label"), // the new mini indicator that will read something like 1/27 instead of 1 of 27 matches.
                mutObserver = new MutationObserver(updateStr), // the observer that listens to the native DOM node and updates the custom indicator
                obsOps = {
                    attributes: true,
                    attributeFilter: ["value"], // only care about changes to the node's value
                };

            // called when the native indicator's value changes
            function updateStr(mus) {
                for (let mu of mus) {
                    if (mu.type === "attributes") {
                        strTransform.bind(findbar)();
                    }
                }
            }

            // truncates the string, puts it on the new indicator, and sets an attribute on the indicator to tell CSS whether it's "empty"
            function strTransform() {
                let val = nativeMatches.value, // native value
                    current = val.match(/\d+/g), // extract numbers from the native value to an array
                    str = current // check that the value has numbers
                        ? current.length > 1 // check if the value has 2 numbers or just 1 (difference between "x of y matches" and "more than y matches" — see findbar.properties)
                            ? current[1] === "1" // check if there's only 1 result
                                ? "   " // don't show if it says 1 of 1 matches, since findbar is buggy and sometimes returns only 1 result in between find execution regardless of the real value
                                : `${current[0]}/${current[1]}` // x of y matches => x/y
                            : `${current[0]}+` // More than y matches => 1000+ (this is always 1000, at least for me)
                        : "   "; // don't show if there are no matches or the field is empty. or more accurately, show 3 spaces, so the gradient background doesn't disappear abruptly.
                if (
                    current || // the gFindBar is buggy, so only "clear" the indicator...
                    this._findStatusDesc.textContent === "Phrase not found" || // if a match actually wasn't found...
                    this.getElement("find-next").disabled // or the field is actually empty (which disables the buttons)
                ) {
                    matchesIndicator.innerText = str; // set the indicator text
                }
                /* we give the indicator a background color in CSS that's the same as the text field background color. then we use mask-image to "feather" its left edge. this way if you type a really long string into the find field and it overflows into the indicator, there's a gradient covering the right edge of the field, preventing it from overlapping the indicator. firefox uses this input-masking feature for the urlbar and some other stuff, i think. for the findbar, it's gonna be rare in practice because usually if you type a really long string, there will only be 1 result at most, or more likely 0. but doesn't hurt to have some logic for marginal scenarios.
                we use the "empty" attribute here to turn the background on and off. in CSS you just use .matches-indicator[empty] {background: none}. since there's no text in the indicator when it's empty, it doesn't matter if it overlaps with the string you input into the findbar. so we don't need the background while it's empty. we use an attribute instead of removing the bg with javascript, because with CSS we can use a transition. this way the gradient that "masks" the string when it gets too long will smoothly disappear when you change the string to something that returns 0 or 1 results. instead of abruptly disappearing, the far edge of the text just fades back into existence. */
                matchesIndicator.innerText === "   "
                    ? matchesIndicator.setAttribute("empty", "true") // hide the indicator background with CSS if it's blank.
                    : matchesIndicator.removeAttribute("empty"); // bring it back if it's not blank.
            }

            function exitFindBar(event) {
                if (event.code === "KeyF" && (event.ctrlKey || event.metaKey)) {
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
                    event.preventDefault();
                }
            }

            function domSetup() {
                // my own findbar CSS is pretty complicated. it turns the findbar into a small floating box rather than a bar that covers the full width of the window and flexes the browser out of the way. mine hovers over the window, i.e. like position: absolute & display: block. i also hide all the buttons except the next, previous, and close buttons. so my findbar is tiny but since we're adding an indicator we might as well make the text field bigger. the default firefox findbar is really silly, why have such a giant findbar if the text field is only gonna be 14em?
                // there's also some CSS in my stylesheets that gives the findbar a smooth transition and starting animation and compresses the buttons and stuff. the effects of this script probably look really weird without those rules so i'd definitely look for the findbar rules in my repo if you're gonna try this script.
                findbar._findField.style.width = "20em";
                matchesIndicator.style.cssText = // this could all be set in a stylesheet, i just put it here so the core CSS won't get separated from the javascript it depends on. the other stuff in the stylesheets works with or without this script. whereas this code is exclusive to the new match indicator.
                    "box-sizing: border-box; display: inline-block; -moz-box-align: center; line-height: 20px; position: fixed; font-size: 10px; right: 68px; color: hsla(0, 0%, 100%, 0.25); pointer-events: none; padding-inline-start: 20px; mask-image: linear-gradient(to right, transparent 0px, black 20px);";
                matchesIndicator.className = "matches-indicator"; // for styling the background color changes which depend on the status of the findbar and whether it's focused
                findbar._findField.after(matchesIndicator); // put it after the input box so we can use the ~ squiggly combinator
            }

            domSetup();
            findbar.addEventListener("keypress", exitFindBar, true); // set up hotkey ctrl+F to close findbar when it's already open
            mutObserver.observe(nativeMatches, obsOps); // listen for changes to the value of the native matches indicator
        },
    };

    // check that startup has finished and gBrowser is initialized before we add an event listener
    if (gBrowserInit.delayedStartupFinished) {
        findbarMatchesLabel.init();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                findbarMatchesLabel.init();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();
