/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.sys.mjs";

const lazy = {};
const defaultPrefs = Services.prefs.getDefaultBranch("");
defaultPrefs.setIntPref("userChromeManager.updateInterval", 86400000);
XPCOMUtils.defineLazyPreferenceGetter(
  lazy,
  "UPDATE_INTERVAL",
  "userChromeManager.updateInterval",
  86400000 // 24 hours
);

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
  constructor(script) {
    this.remoteURL = script.remoteURL;
    this.filename = script.filename;
    this.path = script.path;
  }
  subscribe(callback) {
    this.#subscriptions.add(callback);
    return () => this.unsubscribe(callback);
  }
  unsubscribe(callback) {
    this.#subscriptions.delete(callback);
  }
  #notify() {
    for (let callback of this.#subscriptions) {
      callback(this);
    }
  }
  get recentlyChecked() {
    return this.lastUpdateCheck > Date.now() - lazy.UPDATE_INTERVAL;
  }
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
  async updateScript() {
    if (
      !this.remoteFile ||
      this.pendingRestart ||
      this.updateError ||
      this.writing
    ) {
      return;
    }
    Services.console.logStringMessage(`Updating ${this.filename}`);
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
      this.#notify();
    }
  }
}

/**
 * A set of script handles shared between all windows.
 */
class ScriptUpdater {
  #handles = new Map();
  getHandle(script) {
    if (!this.#handles.has(script.filename)) {
      this.#handles.set(script.filename, new ScriptHandle(script));
    }
    return this.#handles.get(script.filename);
  }
}

export const gScriptUpdater = new ScriptUpdater();
