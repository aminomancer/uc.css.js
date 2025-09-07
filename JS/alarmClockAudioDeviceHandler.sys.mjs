// ==UserScript==
// @name           Alarm Clock Audio Device Handler
// @version        1.0.0
// @author         aminomancer
// @homepageURL    https://github.com/aminomancer/uc.css.js
// @long-description
// @description
/*
For use with alarm clock scheduled tasks. When the alarm clock tab is closed, this script will switch the audio output device back to the original device. Use a scheduled task that opens a playlist with `%24` at the end of the URL search params, like `https://www.youtube.com/watch?v=example&list=example&index=1%24`. Have your task also wake up your computer and set your audio device to speakers. Firefox will recognize the playlist tab thanks to the `%24`, and it will watch for that tab to close or leave. This way, your computer switches to your loud speakers to wake you up, but when you close the tab and start using the browser, it automatically switches back to your preferred sound device.

This requires [NirCmd](https://www.nirsoft.net/utils/nircmd.html) to switch audio devices. You can install it portably or just put it in `C:\Windows\`. Set the path to nircmd.exe in `userChrome.nircmd.path` (default is `C:\Windows\nircmd.exe`). Set the desired audio device name in `userChrome.alarm.soundDevice`. The default sound device name is "Headphones". Find it in your Windows sound control panel. Set the alarm URL globs in `userChrome.alarm.urlGlobs` (default is `["*://*.youtube.com/watch?v=*&list=*%24"]`). Make sure to include `%24` at the end of the URL search params so that the script can identify the alarm tab. This script only works on Windows because it uses NirCmd.

The script will see when the special `%24` URL loads and watch the tab it loaded in. When the tab is closed, or when it navigates away from the playlist, it will switch your sound device. The way it determines if you've navigated away from the playlist within that tab is by processing your url glob. The `%24` disappears immediately upon loading, so we don't check that. Instead, we check if the URL matches the glob _minus_ the `%24`. So if your glob is `*://*.youtube.com/watch?v=*&list=*%24`, the script will check if the URL still matches `*://*.youtube.com/watch?v=*&list=*`. For YouTube purposes, this means leaving the playlist player will switch sound devices. You can use a totally different website if you want. Just update the globs accordingly.
*/
// @downloadURL    https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/alarmClockAudioDeviceHandler.sys.mjs
// @updateURL      https://cdn.jsdelivr.net/gh/aminomancer/uc.css.js@master/JS/alarmClockAudioDeviceHandler.sys.mjs
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// ==/UserScript==

import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";
import { SharedStorage } from "chrome://userchromejs/content/uc_api.sys.mjs";

class _AlarmTabsWatcher {
  alarmTabs = new Set();
  matchPatternSet = new MatchPatternSet([]);
  trimmedMatchPatternSet = new MatchPatternSet([]);

  lazy = XPCOMUtils.declareLazy({
    // Lazy module import
    EveryWindow: "resource:///modules/EveryWindow.sys.mjs",

    // Lazy prefs
    alarmUrlGlobs: {
      pref: "userChrome.alarm.urlGlobs",
      default: JSON.stringify(["*://*.youtube.com/watch?v=*&list=*%24"]),
      onUpdate: (_data, _previous, latest) => this.buildMatchPatternSet(latest),
      transform: value => {
        try {
          return JSON.parse(value);
        } catch (e) {
          throw new Error("Failed to parse alarm URL globs pref", { cause: e });
        }
      },
    },
    soundDevice: {
      pref: "userChrome.alarm.soundDevice",
      default: "Headphones",
    },
    nircmdPath: {
      pref: "userChrome.nircmd.path",
      default: "C:\\Windows\\nircmd.exe",
      transform: value => {
        const file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
        file.initWithPath(value);
        return file;
      },
    },
  });

  constructor() {
    this.buildMatchPatternSet(this.lazy.alarmUrlGlobs);

    this.lazy.EveryWindow.registerCallback(
      "alarmTabsWatcher",
      win => {
        this.onBrowserWindow(win);
        win.addEventListener("TabClose", this);
        win.gBrowser.addTabsProgressListener(this);
      },
      win => {
        win.removeEventListener("TabClose", this);
        win.gBrowser.removeTabsProgressListener(this);
      }
    );
  }

  buildMatchPatternSet(globs = this.lazy.alarmUrlGlobs) {
    this.matchPatternSet = new MatchPatternSet(new Set(globs));
    this.trimmedMatchPatternSet = new MatchPatternSet(
      new Set(globs.map(glob => glob.replace(/%24$/, "")))
    );
  }

  onLocationChange(browser) {
    const tab = browser?.getTabBrowser()?.getTabForBrowser(browser);
    if (!tab) return;

    const url = browser.currentURI.spec;

    if (!this.alarmTabs.has(tab) && this.matchPatternSet.matches(url)) {
      this.alarmTabs.add(tab);
    } else if (
      this.alarmTabs.has(tab) &&
      !this.trimmedMatchPatternSet.matches(url)
    ) {
      // Remove the tab if it navigates away from the alarm playlist
      this.alarmTabs.delete(tab);
      this.checkEmpty();
    }
  }

  onStateChange(browser) {
    this.onLocationChange(browser);
  }

  handleEvent(event) {
    if (event.type === "TabClose") {
      const tab = event.target;
      if (this.alarmTabs.has(tab)) {
        // Remove the tab when it is closed
        this.alarmTabs.delete(tab);
        this.checkEmpty();
      }
    }
  }

  onBrowserWindow(win) {
    this.onLocationChange(win.gBrowser.selectedBrowser);
  }

  checkEmpty() {
    if (this.alarmTabs.size === 0) {
      this.switchSoundDevice();
    }
  }

  switchSoundDevice() {
    const { nircmdPath, soundDevice } = this.lazy;
    if (!nircmdPath.exists() || !nircmdPath.isExecutable()) {
      throw new Error(
        `nircmd path is invalid or not executable: ${nircmdPath.path}`
      );
    }
    const process = Cc["@mozilla.org/process/util;1"].createInstance(
      Ci.nsIProcess
    );
    process.init(nircmdPath);
    process.run(false, ["setdefaultsounddevice", soundDevice, "1"], 3);
  }
}

SharedStorage.AlarmTabsWatcher = new _AlarmTabsWatcher();
