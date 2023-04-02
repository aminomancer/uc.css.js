/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import React, { useCallback, useContext } from "react";
import { createRoot } from "react-dom/client";
import {
  GlobalContext,
  GlobalContextProvider,
  DEFAULT_PATH,
} from "./components/GlobalContext";
import { ScriptsView } from "./components/ScriptsView";
import { SettingsView } from "./components/SettingsView";
import { version } from "./aboutuserchrome.json";

const UserChromeManager = () => {
  const { path, navigate, updateCount } = useContext(GlobalContext);

  const onCategoryClick = useCallback(
    event => {
      let category = event.target?.closest("[path]");
      if (category) navigate(category?.getAttribute("path"));
    },
    [navigate]
  );

  return (
    <div id="full">
      <div id="sidebar">
        <button-group
          id="categories"
          orientation="vertical"
          role="tablist"
          tabIndex="0"
          aria-controls="content"
        >
          <button
            className={`category ${
              path.split("/")[0] === DEFAULT_PATH ? "selected" : ""
            }`}
            role="tab"
            aria-selected={path.split("/")[0] === DEFAULT_PATH}
            title="Manage your scripts"
            onClick={onCategoryClick}
            path={DEFAULT_PATH}
            name="scripts"
            badge-count={updateCount || undefined}
          >
            <span className="category-name">Scripts</span>
          </button>
          <button
            className={`category ${
              path.split("/")[0] === "settings" ? "selected" : ""
            }`}
            role="tab"
            aria-selected={path.split("/")[0] === "settings"}
            title="Settings"
            onClick={onCategoryClick}
            path="settings"
            name="settings"
          >
            <span className="category-name">Settings</span>
          </button>
        </button-group>
        <div className="spacer" />
        <div id="sidebar-footer">
          <ul className="sidebar-footer-list">
            <li>
              <a
                href="https://www.userchrome.org/what-is-userchrome-js.html#findingscripts"
                id="get-more-button"
                className="sidebar-footer-link"
                target="_blank"
                title="Get more scripts"
              >
                <img
                  src="chrome://global/skin/icons/search-glass.svg"
                  alt=""
                  className="sidebar-footer-icon"
                ></img>
                <span className="sidebar-footer-label">Get more scripts</span>
              </a>
            </li>
            <li>
              <a
                href="https://github.com/aminomancer/uc.css.js"
                id="help-button"
                className="sidebar-footer-link"
                target="_blank"
                title="Help/Documentation"
              >
                <img
                  src="chrome://global/skin/icons/help.svg"
                  alt=""
                  className="sidebar-footer-icon"
                ></img>
                <span className="sidebar-footer-label">Help/Documentation</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div id="content">
        {
          {
            scripts: <ScriptsView />,
            settings: <SettingsView />,
            // TODO - Add a recommended scripts view
          }[path.split("/")[0]]
        }
      </div>
    </div>
  );
};

history.scrollRestoration = "manual";

// eslint-disable-next-line no-console
console.log(`UserChrome Manager v${version}`);

createRoot(document.getElementById("root")).render(
  <GlobalContextProvider>
    <UserChromeManager />
  </GlobalContextProvider>
);
