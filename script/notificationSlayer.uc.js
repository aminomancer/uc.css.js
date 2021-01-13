(() => {
    function init() {
        let notificationSlayer = (subject, topic) => {
            if (topic == "update-available") {
                console.log("trying to slay notification");
                setTimeout(() => {
                    try {
                        AppMenuNotifications.dismissNotification(
                            AppMenuNotifications.activeNotification.id
                        );
                    } catch (e) {
                        console.log("failed to slay notification");
                    }
                }, 500);
                AppMenuNotifications.dismissNotification(
                    AppMenuNotifications.activeNotification.id
                );
            }
        };
        Services.obs.addObserver(notificationSlayer, "update-available");
    }

    if (gBrowserInit.delayedStartupFinished) {
        init();
    } else {
        let delayedStartupFinished = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedStartupFinished, topic);
                init();
            }
        };
        Services.obs.addObserver(delayedStartupFinished, "browser-delayed-startup-finished");
    }
})();

// var boopty2 = ChromeUtils.import("resource://gre/modules/UpdateListener.jsm", {})

// boopty2.UpdateListener

// var dumpListeners = {
//     observers: {
//         "update-downloading": ["UpdateListener"],
//         "update-staged": ["UpdateListener"],
//         "update-downloaded": ["UpdateListener"],
//         "update-available": ["UpdateListener"],
//         "update-error": ["UpdateListener"],
//         "update-swap": ["UpdateListener"],
//     },

//     observe(subject, topic, data) {
//         for (let module of this.observers[topic]) {
//             try {
//                 global[module].observe(subject, topic, data);
//             } catch (e) {
//                 Cu.reportError(e);
//             }
//         }
//     },

//     init() {
//         for (let observer of Object.keys(this.observers)) {
//             Services.obs.addObserver(this, observer);
//         }
//     },
// };
