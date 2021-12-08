// ==UserScript==
// @name           Urlbar can Autofill Full Subdirectories
// @version        1.0
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    By default, the urlbar's first result is always either an autofilled host matching the input string (like mozilla.org if you type "moz") or, if no matching host can be found in the user's history, bookmarks, or search engines, simply the input string, to be searched with the user's default engine. This works perfectly fine, but some users might find it desirable if they could navigate to frequently visited pages (not only hosts) with just an enter keypress. For example, if you frequently visit reddit.com/r/FirefoxCSS, you might prefer if Firefox would just offer that as the first suggestion when you type "red" rather than simply offering "reddit.com" every time. This script refactors the urlbar's autofill behavior so it will attempt to find the user's most-trafficked site, whether it's just a host address or not. If you visit reddit.com/r/FirefoxCSS more often than reddit.com, then it will offer reddit.com/r/FirefoxCSS as the first result. But if you visit a site's root directory more often than any specific subdirectory, it will offer the root directory instead, like the vanilla behavior. For example, you probably visit youtube.com way more often than any specific youtube.com/watch?v=* URL. So in that case, youtube.com will always be the first result. As usual, it will still only autofill a URL if the domain starts with the search string. So typing red will autofill reddit.com/r/FirefoxCSS, but typing firefoxcss will just search your history for domains that start with firefoxcss, and if none are found, will offer a regular affordance to search your default search engine for firefoxcss.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

(function () {
    function init() {
        const { UrlbarResult } = ChromeUtils.import("resource:///modules/UrlbarResult.jsm");
        let autofiller = gURLBar.controller.manager.providers.find((p) => p.name === "Autofill");
        let pUniComp = gURLBar.controller.manager.providers.find(
            (p) => (p.name = "UnifiedComplete")
        );

        autofiller._matchKnownUrl = async function (queryContext) {
            let tempResults = [];
            await pUniComp.startQuery(queryContext, (_o, result) => {
                tempResults.push(result);
            });

            let firstResult = tempResults[0];
            if (firstResult) {
                let trimmedURL = UrlbarUtils.stripPrefixAndTrim(firstResult.payload.url, {
                    stripHttp: true,
                    stripHttps: true,
                    stripWww: true,
                })[0];
                if (trimmedURL.startsWith(queryContext.trimmedSearchString))
                    return this._processUrlRow(tempResults[0], queryContext);
            }

            let conn = await PlacesUtils.promiseLargeCacheDBConnection();
            if (!conn) return null;

            let query, params;
            if (
                UrlbarTokenizer.looksLikeOrigin(this._searchString, {
                    ignoreKnownDomains: true,
                })
            )
                [query, params] = this._getOriginQuery(queryContext);
            else [query, params] = this._getUrlQuery(queryContext);

            if (query) {
                let rows = await conn.executeCached(query, params);
                if (rows.length) return this._processRow(rows[0], queryContext);
            }
            return null;
        };

        autofiller._processUrlRow = function (row, queryContext) {
            let autofilledValue, finalCompleteValue;
            let url = row.payload.url;
            let strippedURL = queryContext.trimmedSearchString;

            let strippedURLIndex = url.toLowerCase().indexOf(strippedURL.toLowerCase());
            let strippedPrefix = url.substr(0, strippedURLIndex);
            autofilledValue = url.substr(strippedURLIndex);
            finalCompleteValue = strippedPrefix + autofilledValue;

            let [title] = UrlbarUtils.stripPrefixAndTrim(finalCompleteValue, {
                stripHttp: true,
                trimEmptyQuery: true,
                trimSlash: false,
            });
            let result = new UrlbarResult(
                UrlbarUtils.RESULT_TYPE.URL,
                UrlbarUtils.RESULT_SOURCE.HISTORY,
                ...UrlbarResult.payloadAndSimpleHighlights(queryContext.tokens, {
                    title: [title, UrlbarUtils.HIGHLIGHT.TYPED],
                    url: [finalCompleteValue, UrlbarUtils.HIGHLIGHT.TYPED],
                    icon: row.payload.icon,
                })
            );
            autofilledValue =
                queryContext.searchString + autofilledValue.substring(this._searchString.length);
            result.autofill = {
                value: autofilledValue,
                selectionStart: queryContext.searchString.length,
                selectionEnd: autofilledValue.length,
            };
            return result;
        };
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
