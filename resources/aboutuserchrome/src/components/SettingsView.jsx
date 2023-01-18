/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useCallback, useContext } from "react";
import {
  GlobalContext,
  gPrefs,
  PREF_ENABLED,
  PREF_GBROWSERHACK_ENABLED,
} from "./GlobalContext";
import { WarningBox } from "./WarningBox";
import { PeriodInput } from "./PeriodInput";
const {
  PREF_UPDATE_INTERVAL,
  PREF_NOTIFICATIONS_ENABLED,
} = ChromeUtils.importESModule(
  "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
);

export const SettingsView = () => {
  const {
    missingFxAutoconfig,
    outdatedFxAutoconfig,
    ucjsEnabled,
    gBrowserHackEnabled,
    gBrowserHackRequired,
    updateInterval,
    notificationsEnabled,
  } = useContext(GlobalContext);

  const setBoolPref = useCallback(event => {
    let pref = event.target?.getAttribute("pref");
    if (pref) gPrefs.set(pref, event.target.checked);
  }, []);
  const setUpdateInterval = useCallback(value => {
    gPrefs.set(PREF_UPDATE_INTERVAL, value);
  }, []);

  // TODO - Move the header to a separate component, using e.g. context
  return (
    <div id="settings">
      <div id="settings-header" className="view-header">
        <div className="sticky-container">
          <div className="main-search">
            <div className="search-spacer"></div>
          </div>
          <div className="main-heading">
            <h1 className="header-name">Settings</h1>
          </div>
          <WarningBox
            missingFxAutoconfig={missingFxAutoconfig}
            outdatedFxAutoconfig={outdatedFxAutoconfig}
          />
        </div>
      </div>
      <div id="main">
        <div id="settings">
          <div id="fx-autoconfig-settings" className="settings-group">
            <h2>fx-autoconfig</h2>
            <div className="setting-container">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="userChromeJS-enabled"
                  className="checkbox"
                  pref={PREF_ENABLED}
                  checked={ucjsEnabled}
                  disabled={missingFxAutoconfig}
                  onChange={setBoolPref}
                ></input>
                <label htmlFor="userChromeJS-enabled" className="checkbox-text">
                  Load userChrome.js scripts
                </label>
              </div>
            </div>
            <div className="setting-container">
              <div className="checkbox-container tail-with-learn-more">
                <input
                  type="checkbox"
                  id="gBrowser_hack-enabled"
                  className="checkbox"
                  pref={PREF_GBROWSERHACK_ENABLED}
                  checked={gBrowserHackEnabled}
                  disabled={gBrowserHackRequired}
                  onChange={setBoolPref}
                ></input>
                <label
                  htmlFor="gBrowser_hack-enabled"
                  className="checkbox-text"
                >
                  Enable gBrowser hack
                </label>
              </div>
              <a
                href="https://github.com/MrOtherGuy/fx-autoconfig#startup-error"
                target="_blank"
              >
                Learn more
              </a>
            </div>
          </div>
          <div id="about-userchrome-settings" className="settings-group">
            <h2>Script Updates</h2>
            <div className="setting-container">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="manager-notifications"
                  className="checkbox"
                  pref={PREF_NOTIFICATIONS_ENABLED}
                  checked={notificationsEnabled}
                  onChange={setBoolPref}
                ></input>
                <label
                  htmlFor="manager-notifications"
                  className="checkbox-text"
                >
                  Show update notification badges
                </label>
              </div>
            </div>
            <div className="setting-container">
              <label htmlFor="manager-updateInterval">
                Update check frequency
              </label>
              <PeriodInput
                id="manager-updateInterval"
                defaultValue={updateInterval}
                min={900000}
                max={2592000000}
                onChange={setUpdateInterval}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
