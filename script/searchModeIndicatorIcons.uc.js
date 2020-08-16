(function () {
    const searchModeIndicatorFocused = document.getElementById('urlbar-search-mode-indicator-title');
    const searchModeIndicatorInactive = document.getElementById('urlbar-label-search-mode');
    const identityIcon = document.getElementById('identity-icon');
    const options = {
        childList: true,
        subtree: true
    };
    const observer = new MutationObserver(mCallback);

    function mCallback(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList' || 'subtree') {
                if (searchModeIndicatorFocused.textContent == "Google" || searchModeIndicatorInactive.textContent == "Google") {
                    console.log('Searching Google');
                    identityIcon.className = "googleIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Google Images" || searchModeIndicatorInactive.textContent == "Google Images") {
                    console.log('Searching Google Images');
                    identityIcon.className = "googleImagesIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Google Videos" || searchModeIndicatorInactive.textContent == "Google Videos") {
                    console.log('Searching Google Videos');
                    identityIcon.className = "googleVideosIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Google Shopping" || searchModeIndicatorInactive.textContent == "Google Shopping") {
                    console.log('Searching Google Shopping');
                    identityIcon.className = "googleShoppingIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Gmail" || searchModeIndicatorInactive.textContent == "Gmail") {
                    console.log('Searching Gmail');
                    identityIcon.className = "gmailIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Google Drive" || searchModeIndicatorInactive.textContent == "Google Drive") {
                    console.log('Searching Google Drive');
                    identityIcon.className = "googleDriveIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Google Maps" || searchModeIndicatorInactive.textContent == "Google Maps") {
                    console.log('Searching Google Maps');
                    identityIcon.className = "googleMapsIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Netflix" || searchModeIndicatorInactive.textContent == "Netflix") {
                    console.log('Searching Netflix');
                    identityIcon.className = "netflixIndicator";
                } else if (searchModeIndicatorFocused.textContent == "YouTube" || searchModeIndicatorInactive.textContent == "YouTube") {
                    console.log('Searching YouTube');
                    identityIcon.className = "youtubeIndicator";
                } else if (searchModeIndicatorFocused.textContent == "DoorDash" || searchModeIndicatorInactive.textContent == "DoorDash") {
                    console.log('Searching DoorDash');
                    identityIcon.className = "doorDashIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Amazon" || searchModeIndicatorInactive.textContent == "Amazon") {
                    console.log('Searching Amazon');
                    identityIcon.className = "amazonIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Prime Now" || searchModeIndicatorInactive.textContent == "Prime Now") {
                    console.log('Searching Prime Now');
                    identityIcon.className = "primeNowIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Wikipedia" || searchModeIndicatorInactive.textContent == "Wikipedia") {
                    console.log('Searching Wikipedia');
                    identityIcon.className = "wikipediaIndicator";
                } else if (searchModeIndicatorFocused.textContent == "GitHub" || searchModeIndicatorInactive.textContent == "GitHub") {
                    console.log('Searching GitHub');
                    identityIcon.className = "gitHubIndicator";
                } else if (searchModeIndicatorFocused.textContent == "XVIDEOS" || searchModeIndicatorInactive.textContent == "XVIDEOS") {
                    console.log('Searching XVIDEOS');
                    identityIcon.className = "xVideosIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Bookmarks" || searchModeIndicatorInactive.textContent == "Bookmarks") {
                    console.log('Searching Bookmarks');
                    identityIcon.className = "bookmarksIndicator";
                } else if (searchModeIndicatorFocused.textContent == "History" || searchModeIndicatorInactive.textContent == "History") {
                    console.log('Searching History');
                    identityIcon.className = "historyIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Twitter" || searchModeIndicatorInactive.textContent == "Twitter") {
                    console.log('Searching Twitter');
                    identityIcon.className = "twitterIndicator";
                } else if (searchModeIndicatorFocused.textContent == "Instagram" || searchModeIndicatorInactive.textContent == "Instagram") {
                    console.log('Searching Instagram');
                    identityIcon.className = "instagramIndicator";
                } else {
                    identityIcon.className = "otherIndicator";
                }
            }
        }
    };

    observer.observe(searchModeIndicatorFocused, options);
    observer.observe(searchModeIndicatorInactive, options);
})();