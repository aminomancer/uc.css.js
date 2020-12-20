var ticking,
    isScrollingX,
    isScrollingY,
    xVal = window.pageXOffset,
    yVal = window.pageYOffset,
    xEnd = function (event) {
        event.target.documentElement.removeAttribute("scrolling-x");
    },
    yEnd = function (event) {
        event.target.documentElement.removeAttribute("scrolling-y");
    },
    scrollInit = function (xCallback, yCallback, refresh) {
        window.addEventListener(
            "scroll",
            function (event) {
                // Optimize for requestAnimationFrame
                if (!ticking) {
                    window.requestAnimationFrame(function () {
                        // Allow updates when monitor draws (at refresh rate)
                        ticking = false;

                        // Set attribute and update position values
                        if (xVal != window.pageXOffset) {
                            event.target.documentElement.setAttribute("scrolling-x", "true");
                            xVal = window.pageXOffset;
                        }

                        if (yVal != window.pageYOffset) {
                            event.target.documentElement.setAttribute("scrolling-y", "true");
                            yVal = window.pageYOffset;
                        }

                        // Cancel scroll-ending callbacks while scrolling
                        window.clearTimeout(isScrollingX);
                        window.clearTimeout(isScrollingY);

                        // Callbacks to run 66ms after scrolling ends
                        isScrollingX = setTimeout(function () {
                            xCallback(event);
                        }, refresh || 66);

                        isScrollingY = setTimeout(function () {
                            yCallback(event);
                        }, refresh || 66);
                    });
                    // Prevent updates except at monitor refresh rate
                    ticking = true;
                }
            },
            // Don't capture/bubble, requires way more logic to handle more than one (root) set of scrollbars
            false
        );
    };

// Start capturing
scrollInit(xEnd, yEnd, 100);
