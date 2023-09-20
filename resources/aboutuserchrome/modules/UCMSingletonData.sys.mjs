/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";
import { AppConstants } from "resource://gre/modules/AppConstants.sys.mjs";

const lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  FileUtils: "resource://gre/modules/FileUtils.sys.mjs",
});
XPCOMUtils.defineLazyModuleGetters(lazy, {
  NetUtil: "resource://gre/modules/NetUtil.jsm",
});
XPCOMUtils.defineLazyServiceGetters(lazy, {
  gUpdateTimerManager: [
    "@mozilla.org/updates/timer-manager;1",
    "nsIUpdateTimerManager",
  ],
  gExternalProtocolService: [
    "@mozilla.org/uriloader/external-protocol-service;1",
    "nsIExternalProtocolService",
  ],
  gMIMEService: ["@mozilla.org/mime;1", "nsIMIMEService"],
});

// Set the prefs on default branch so they show up in about:config and don't
// appear modified by the user.
const defaultPrefs = Services.prefs.getDefaultBranch("");
export const PREF_NOTIFICATIONS_ENABLED = "userChromeJS.manager.notifications";
export const PREF_UPDATE_INTERVAL = "userChromeJS.manager.updateInterval";
defaultPrefs.setIntPref(PREF_UPDATE_INTERVAL, 86400000);
XPCOMUtils.defineLazyPreferenceGetter(
  lazy,
  "UPDATE_INTERVAL",
  PREF_UPDATE_INTERVAL,
  86400000 // 24 hours
);

export const UPDATE_CHANGED_TOPIC = "userChromeManager:script-updater-changed";

/**
 * A data structure for a single script, with methods to check for a remote
 * update and to update the local file.
 */
class ScriptHandle {
  remoteFile = null;
  lastUpdateCheck = 0;
  pendingRestart = false;
  writing = false;
  downloadError = null;
  updateError = null;
  #subscriptions = new Set();
  #finishedWritingPromise = null;
  #finishedWritingResolve = null;

  constructor(script) {
    this.remoteURL = script.updateURL || script.downloadURL;
    this.filename = script.filename;
    this.path = script.path || script.asFile().path;
    this.currentVersion = script.version;
    this.timerTopic = `userChromeManager_update_check_${this.filename}`;
    for (let method of [
      "checkRemoteFile",
      "updateScript",
      "subscribe",
      "unsubscribe",
      "launchLocalFile",
    ]) {
      this[method] = this[method].bind(this);
    }
    lazy.gUpdateTimerManager.registerTimer(
      this.timerTopic,
      () => this.checkRemoteFile(),
      lazy.UPDATE_INTERVAL / 1000 // in seconds
    );
  }

  /**
   * Subscribe to changes to this handle.
   * @param {function(handle)} callback What to do when the handle changes
   * @returns {function()} A function to unsubscribe
   */
  subscribe(callback) {
    this.#subscriptions.add(callback);
    return () => this.unsubscribe(callback);
  }

  /**
   * Unsubscribe from changes to this handle.
   * @param {function(handle)} callback What to do when the handle changes
   */
  unsubscribe(callback) {
    this.#subscriptions.delete(callback);
  }

  /** Notify all subscribers that this handle has changed. */
  #notify() {
    for (let callback of this.#subscriptions) {
      callback(this);
    }
  }

  /** @type {boolean} */
  get recentlyChecked() {
    return this.lastUpdateCheck > Date.now() - lazy.UPDATE_INTERVAL;
  }

  /**
   * Download the remote file and notify subscribers about the updated data.
   * @returns {Promise<void>} Resolves when the download is complete/failed.
   */
  async checkRemoteFile() {
    if (
      !this.remoteURL ||
      this.remoteFile ||
      this.pendingRestart ||
      this.updateError ||
      this.recentlyChecked
    ) {
      this.#notify();
      return;
    }
    try {
      const remote = await fetch(new URL(this.remoteURL));
      this.remoteFile = await remote.text();
      this.downloadError = null;
    } catch (error) {
      this.downloadError = error;
    } finally {
      this.lastUpdateCheck = Date.now();
    }
    this.#notify();
  }

  /**
   * Try updating the local file with the remote file.
   * @returns {Promise<void>} Resolves when the write is complete/failed.
   */
  async updateScript() {
    if (
      !this.remoteFile ||
      this.pendingRestart ||
      this.updateError ||
      this.writing
    ) {
      return;
    }
    this.#finishedWritingPromise = new Promise(resolve => {
      this.#finishedWritingResolve = resolve;
    });
    this.writing = true;
    this.#notify();
    try {
      await IOUtils.writeUTF8(this.path, this.remoteFile, {
        mode: "overwrite",
        tmpPath: `${this.path}.tmp`,
      });
      this.pendingRestart = true;
    } catch (error) {
      this.updateError = error;
      this.remoteFile = null;
    } finally {
      this.writing = false;
      this.#finishedWritingResolve();
      this.#notify();
      lazy.gUpdateTimerManager.unregisterTimer(this.timerTopic);
    }
  }

  /**
   * Launch the local file in the default application (according to Firefox's
   * app defaults first, then the OS defaults).
   * @returns {Promise<void>} Resolves when the file is launched.
   */
  async launchLocalFile() {
    if (this.writing) {
      await this.#finishedWritingPromise;
    }
    let file = new lazy.FileUtils.File(this.path);
    let fileExtension = null;
    let mimeInfo = null;
    let match = file.leafName.match(/\.([^.]+)$/);
    if (match) fileExtension = match[1];
    let isWindows = AppConstants.platform == "win";
    let isWindowsExe = isWindows && fileExtension?.toLowerCase() == "exe";
    let isScript = ["js", "mjs", "jsm", "sjs"].includes(
      fileExtension?.toLowerCase()
    );
    if (
      file.isExecutable() &&
      !isWindowsExe &&
      !isScript &&
      !(await this.confirmLaunchExecutable(file.path))
    ) {
      return;
    }
    try {
      mimeInfo = lazy.gMIMEService.getFromTypeAndExtension(
        lazy.gMIMEService.getTypeFromFile(file),
        fileExtension
      );
    } catch (e) {}
    if (!fileExtension && isWindows) {
      // Open the file's containing folder in Explorer.
      try {
        file.reveal();
        return;
      } catch (ex) {}
      let { parent } = file;
      if (!parent) {
        throw new Error(
          "Unexpected reference to a top-level directory instead of a file"
        );
      }
      try {
        parent.launch();
        return;
      } catch (ex) {}
      lazy.gExternalProtocolService.loadURI(
        lazy.NetUtil.newURI(parent),
        Services.scriptSecurityManager.getSystemPrincipal()
      );
      return;
    }
    if (mimeInfo) {
      mimeInfo.preferredAction = Ci.nsIMIMEInfo.useSystemDefault;
      try {
        mimeInfo.launchWithFile(file);
        return;
      } catch (ex) {}
    }
    try {
      file.launch();
      return;
    } catch (ex) {}
    lazy.gExternalProtocolService.loadURI(
      lazy.NetUtil.newURI(file),
      Services.scriptSecurityManager.getSystemPrincipal()
    );
  }
}

/** A set of script handles shared between all windows. */
class ScriptUpdater {
  #handles = new Map();

  /**
   * Get or create the handle for a script.
   * @param {Script} script
   * @returns {ScriptHandle}
   */
  getHandle(script) {
    if (!this.#handles.has(script.filename)) {
      let handle = new ScriptHandle(script);
      handle.subscribe(() =>
        Services.obs.notifyObservers(null, UPDATE_CHANGED_TOPIC)
      );
      this.#handles.set(script.filename, handle);
    }
    return this.#handles.get(script.filename);
  }

  /** @type {ScriptHandle[]} */
  get handles() {
    return [...this.#handles.values()];
  }
}

export const gScriptUpdater = new ScriptUpdater();
