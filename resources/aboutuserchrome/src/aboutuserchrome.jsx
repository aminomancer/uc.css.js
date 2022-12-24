/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useRef, useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  HashRouter,
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
  useParams,
  useNavigate,
} from "react-router-dom";
import ReactMarkdown from "react-markdown";
const { XPCOMUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/XPCOMUtils.sys.mjs"
);
const { gScriptUpdater } = ChromeUtils.importESModule(
  "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
);

const ucUtils =
  window._ucUtils || window.docShell.chromeEventHandler.ownerGlobal._ucUtils;
const PREF_ENABLED = "userChromeJS.enabled";
const PREF_SCRIPTSDISABLED = "userChromeJS.scriptsDisabled";

// TODO - unnecessary for MemoryRouter?
class AboutURL extends URL {
  constructor(url, base) {
    url = url.replace(/\#\/?$/, "");
    base = base?.replace(/\#\/?$/, "");
    if (base) {
      if (!url || url === "/" || url === "#/") super(base);
      else super(`${base}/${url}`);
    } else {
      super(url);
    }
  }
}
globalThis.URL = AboutURL;

const UserChromeManager = () => {
  XPCOMUtils.defineLazyPreferenceGetter(
    window,
    "UCJS_ENABLED",
    PREF_ENABLED,
    false,
    (aPreference, previousValue, newValue) => {
      if (previousValue !== newValue) setUcjsEnabled(newValue);
    }
  );
  XPCOMUtils.defineLazyPreferenceGetter(
    window,
    "DISABLED_SCRIPTS",
    PREF_SCRIPTSDISABLED,
    "",
    (aPreference, previousValue, newValue) => {
      if (previousValue !== newValue) setScriptsDisabled(newValue);
    }
  );
  const missingFxAutoconfig = !ucUtils;
  const outdatedFxAutoconfig = !ucUtils?.parseStringAsScriptInfo;
  const scripts = ucUtils?.getScriptData().map(script => ({
    ...script,
    path: script.asFile().path,
    remoteURL: script.updateURL || script.downloadURL,
  }));

  const [ucjsEnabled, setUcjsEnabled] = useState(window.UCJS_ENABLED);
  const [scriptsDisabled, setScriptsDisabled] = useState(
    window.DISABLED_SCRIPTS
  );
  const [updateCount, setUpdateCount] = useState(0);

  return (
    <MemoryRouter>
      <div id="full">
        <div id="sidebar">
          <button-group
            id="categories"
            orientation="vertical"
            role="tabslist"
            tabIndex="0"
          >
            <NavLink
              to="/"
              className={({ isActive }) =>
                `category ${isActive ? "selected" : ""}`
              }
              role="tab"
              title="userChrome.js scripts"
              badge-count={updateCount ? updateCount : undefined}
            >
              Scripts
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `category ${isActive ? "selected" : ""}`
              }
              role="tab"
              title="Settings"
            >
              Settings
            </NavLink>
          </button-group>
          <div className="spacer" />
          <div id="sidebar-footer">
            <ul className="sidebar-footer-list">
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
                    className="sidebar-footer-icon"
                  ></img>
                  <span className="sidebar-footer-label">
                    Help/Documentation
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div id="content">
          <Routes>
            <Route
              path="/*"
              element={
                <ScriptsView
                  scripts={scripts}
                  missingFxAutoconfig={missingFxAutoconfig}
                  outdatedFxAutoconfig={outdatedFxAutoconfig}
                  scriptsDisabled={scriptsDisabled}
                  setUpdateCount={setUpdateCount}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsView
                  missingFxAutoconfig={missingFxAutoconfig}
                  outdatedFxAutoconfig={outdatedFxAutoconfig}
                  ucjsEnabled={ucjsEnabled}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </MemoryRouter>
  );
};

const ScriptsView = ({
  scripts,
  missingFxAutoconfig,
  outdatedFxAutoconfig,
  scriptsDisabled,
  setUpdateCount,
}) => {
  const [updateAllButtonDisabled, setUpdateAllButtonDisabled] = useState(false);
  const [updateAllHidden, setUpdateAllHidden] = useState(true);
  const [updateAllDesc, setUpdateAllDesc] = useState("");
  const [updaters, setUpdaters] = useState(new Map());
  const [expandedCard, setExpandedCard] = useState(null);
  const toggleExpandedCard = useCallback(
    card => {
      if (expandedCard === card) setExpandedCard(null);
      else setExpandedCard(card);
    },
    [expandedCard]
  );

  const setUpdater = (name, updater) => {
    if (!updater) updaters.delete(name);
    else updaters.set(name, updater);
    setUpdaters(new Map(updaters));
  };

  const updateAll = () => updaters.forEach(updater => updater.update?.());

  useEffect(() => {
    let values = [...updaters.values()];
    if (updaters.size < 1) {
      setUpdateAllHidden(true);
      setUpdateCount(0);
      return;
    }
    if (values.every(updater => updater.disabled)) {
      setUpdateAllButtonDisabled(true);
      if (values.some(updater => updater.writing)) {
        setUpdateAllDesc("Updating…");
      } else if (values.some(updater => updater.pendingRestart)) {
        setUpdateAllDesc("Restart to finish updating");
      } else {
        setUpdateAllDesc("Update failed — Try updating manually");
      }
    } else {
      setUpdateAllButtonDisabled(false);
      setUpdateAllDesc("Updates available");
      setUpdateCount(
        values.filter(
          updater =>
            !(updater.disabled || updater.writing || updater.pendingRestart)
        ).length
      );
    }
    setUpdateAllHidden(false);
  }, [setUpdateCount, updaters]);

  return (
    <div id="scripts">
      <div id="scripts-header">
        <div className="sticky-container">
          <div className="main-heading">
            <h1 className="header-name">Manage Your Scripts</h1>
            <div className="spacer" />
            <div className="header-button-box" hidden={updateAllHidden}>
              <label className="header-button-description">
                {updateAllDesc}
              </label>
              <button
                id="update-all-button"
                className={`update-button ${
                  updateAllButtonDisabled ? "" : "primary"
                }`}
                disabled={updateAllButtonDisabled}
                onClick={updateAll}
              >
                Update all
              </button>
            </div>
          </div>
        </div>
        <WarningBox
          scripts={scripts}
          missingFxAutoconfig={missingFxAutoconfig}
          outdatedFxAutoconfig={outdatedFxAutoconfig}
        />
      </div>
      <div id="main">
        <div id="scripts-list">
          {scripts.map(script => (
            <ScriptCard
              key={`${script.filename}-card`}
              script={script}
              isEnabled={!scriptsDisabled.split(",").includes(script.filename)}
              isExpanded={expandedCard === script.filename}
              setUpdater={setUpdater}
              onCardClick={event => {
                switch (event.target.localName) {
                  case "button":
                  case "input":
                  case "a":
                    return;
                }
                if (event.target.closest(".script-card-expanded")) return;
                toggleExpandedCard(script.filename);
                event.preventDefault();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ScriptCard = ({
  script,
  isEnabled,
  isExpanded,
  setUpdater,
  onCardClick,
}) => {
  let handle = gScriptUpdater.getHandle(script);
  let nameId = `${script.filename
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")}_name`;
  let truncatedDescription =
    script.description.length > 200
      ? `${String(script.description ?? "")?.slice(0, 200)}…`
      : script.description;

  const [writing, setWriting] = useState(false);
  const [pendingRestart, setPendingRestart] = useState(false);
  const [updateBarHidden, setUpdateBarHidden] = useState(true);
  const [updateBarType, setUpdateBarType] = useState("info");
  const [updateBarLabel, setUpdateBarLabel] = useState("");
  const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);
  const [updateButtonLabel, setUpdateButtonLabel] = useState("");

  useEffect(() => {
    let unsubscribe = handle.subscribe(() => {
      let remoteScriptData = handle.remoteFile
        ? ucUtils.parseStringAsScriptInfo(script.filename, handle.remoteFile)
        : {};
      let newVersion = remoteScriptData.version;
      if (handle.writing) {
        setUpdateButtonLabel("Updating…");
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
      } else if (handle.updateError) {
        setUpdateButtonLabel("Update failed");
        setUpdateBarType("warning");
        setUpdateBarLabel(`Update to ${newVersion} manually`);
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
        // eslint-disable-next-line no-console
        console.log(
          `Error overwriting ${script.filename} :>> `,
          handle.updateError
        );
      } else if (handle.pendingRestart) {
        setUpdateButtonLabel("Updated");
        setUpdateBarType("success");
        setUpdateBarLabel(`Restart to update to ${newVersion}`);
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
      } else if (handle.downloadError) {
        setUpdateBarHidden(true);
        // eslint-disable-next-line no-console
        console.log(
          `Error downloading ${script.filename} :>> `,
          handle.downloadError
        );
      } else if (Services.vc.compare(newVersion, script.version) > 0) {
        setUpdateButtonLabel("Update now");
        setUpdateBarLabel(`Update to ${remoteScriptData.version} available`);
        setUpdateButtonDisabled(false);
        setUpdateBarHidden(false);
      } else {
        setUpdateBarHidden(true);
      }
      setWriting(handle.writing);
      setPendingRestart(handle.pendingRestart);
    });
    handle.checkRemoteFile();
    return () => unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setUpdater(
      script.filename,
      updateBarHidden
        ? null
        : {
            disabled: updateButtonDisabled,
            writing,
            pendingRestart,
            update: updateButtonDisabled ? null : () => handle.updateScript(),
          }
    );
  }, [updateButtonDisabled, updateBarHidden, writing, pendingRestart]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="script card"
      active={isEnabled ? "true" : "false"}
      expanded={isExpanded ? "" : undefined}
      aria-labelledby={nameId}
      onClick={onCardClick}
    >
      <div className="script-card-collapsed">
        <img
          className="script-icon"
          alt=""
          src={script.icon}
          onError={event => (event.target.hidden = true)}
          hidden={!script.icon}
        />
        <div className="card-contents">
          <div className="script-name-container">
            <h3 id={nameId} className="script-name">
              {script.name || script.filename}
            </h3>
            <div className="script-version" hidden={!script.version}>
              {script.version}
            </div>
            <div className="spacer" />
            <input
              type="checkbox"
              className="script-checkbox toggle-button"
              checked={isEnabled}
              onChange={event => {
                let scriptsDisabled = Services.prefs.getStringPref(
                  PREF_SCRIPTSDISABLED,
                  ""
                );
                scriptsDisabled = scriptsDisabled
                  .split(",")
                  .filter(filename => filename !== script.filename)
                  .join(",");
                if (!event.target.checked) {
                  scriptsDisabled = `${script.filename},${scriptsDisabled}`;
                }
                Services.prefs.setCharPref(
                  PREF_SCRIPTSDISABLED,
                  scriptsDisabled
                );
              }}
            />
          </div>
          <div className="script-description">{truncatedDescription}</div>
        </div>
      </div>
      <div
        className="script-card-message"
        align="center"
        type={updateBarType}
        hidden={updateBarHidden}
      >
        <div className="message-inner">
          <span className="message-icon" />
          <span className="message-content">
            <span className="message-text">{updateBarLabel}</span>
            <button
              className={`update-button ${
                updateButtonDisabled ? "" : "primary"
              }`}
              disabled={updateButtonDisabled}
              onClick={e => handle.updateScript()}
            >
              {updateButtonLabel}
            </button>
          </span>
        </div>
      </div>
      {isExpanded ? <ScriptDetails script={script} /> : null}
    </div>
  );
};

const ScriptDetails = ({ script }) => {
  const descriptionWrapper = useRef();
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);
  const [descriptionToggleHidden, setDescriptionToggleHidden] = useState(true);
  const toggleDescriptionCollapsed = () => {
    setDescriptionCollapsed(previous => !previous);
    setDescriptionToggleHidden(false);
  };
  useEffect(() => {
    const { current } = descriptionWrapper;
    if (current) {
      requestAnimationFrame(() => {
        const remSize = parseFloat(
          window.getComputedStyle(document.documentElement).fontSize
        );
        if (current.getBoundingClientRect().height > 20 * remSize) {
          toggleDescriptionCollapsed();
        }
      });
    }
  }, []);
  return (
    <div className="script-card-expanded">
      <div className="script-detail-rows">
        {script.description?.length > 200 ? (
          <div
            className={`script-detail-description-wrapper ${
              descriptionCollapsed ? "script-detail-description-collapse" : ""
            }`}
            ref={descriptionWrapper}
          >
            <div className="script-detail-description">
              <ReactMarkdown>
                {script.description.replace(/\n/gi, "\n &nbsp;")}
              </ReactMarkdown>
            </div>
            <button
              class="button-link script-detail-description-toggle"
              data-l10n-id={
                descriptionCollapsed
                  ? "addon-detail-description-expand"
                  : "addon-detail-description-collapse"
              }
              hidden={descriptionToggleHidden}
              onClick={toggleDescriptionCollapsed}
            ></button>
          </div>
        ) : null}
        <div className="script-detail-row script-detail-source">
          <label className="script-detail-label">Source file</label>
          <a target="_blank" href={`file:///${script.path}`}>
            {script.filename}
          </a>
        </div>
        <div className="script-detail-row script-detail-running">
          <label className="script-detail-label">Running</label>
          {script.isRunning ? "true" : "false"}
        </div>
        <div
          className="script-detail-row script-detail-version"
          hidden={!script.version}
        >
          <label className="script-detail-label">Version</label>
          {script.version}
        </div>
        <div
          className="script-detail-row script-detail-author"
          hidden={!script.author}
        >
          <label className="script-detail-label">Author</label>
          {script.author}
        </div>
        <div
          className="script-detail-row script-detail-homepageURL"
          hidden={!script.homepageURL}
        >
          <label className="script-detail-label">Homepage</label>
          <a
            target="_blank"
            href={
              script.homepageURL &&
              (script.homepageURL.startsWith("http")
                ? script.homepageURL
                : `file:///${script.homepageURL}`)
            }
          >
            {script.homepageURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-downloadURL"
          hidden={!script.downloadURL}
        >
          <label className="script-detail-label">Download URL</label>
          <a
            target="_blank"
            href={
              script.downloadURL &&
              (script.downloadURL.startsWith("http")
                ? script.downloadURL
                : `file:///${script.downloadURL}`)
            }
          >
            {script.downloadURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-updateURL"
          hidden={!script.updateURL || script.updateURL === script.downloadURL}
        >
          <label className="script-detail-label">Update URL</label>
          <a
            target="_blank"
            href={
              script.updateURL &&
              (script.updateURL.startsWith("http")
                ? script.updateURL
                : `file:///${script.updateURL}`)
            }
          >
            {script.updateURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-optionsURL"
          hidden={!script.optionsURL}
        >
          <label className="script-detail-label">Options URL</label>
          <a
            target="_blank"
            href={
              script.optionsURL &&
              (script.optionsURL.startsWith("http")
                ? script.optionsURL
                : `file:///${script.optionsURL}`)
            }
          >
            {script.optionsURL}
          </a>
        </div>
        <div className="script-detail-row script-detail-type">
          <label className="script-detail-label">Type</label>
          {script.isESM
            ? "ES module"
            : (script.inbackground && "Background script") || "Chrome script"}
        </div>
        <div
          className="script-detail-row script-detail-onlyonce"
          hidden={!script.onlyonce}
        >
          <label className="script-detail-label">Only once</label>
          {"true"}
        </div>
        <div
          className="script-detail-row script-detail-ignoreCache"
          hidden={!script.ignoreCache}
        >
          <label className="script-detail-label">Ignore cache</label>
          {"true"}
        </div>
        <div
          className="script-detail-row script-detail-loadOrder"
          hidden={script.inbackground}
        >
          <label className="script-detail-label">Load order</label>
          {String(script.loadOrder)}
        </div>
        <div
          className="script-detail-row script-detail-charset"
          hidden={!script.charset}
        >
          <label className="script-detail-label">Character set</label>
          {script.charset}
        </div>
      </div>
    </div>
  );
};

const MessageBox = ({ description, linkText, linkURL }) => {
  if (!description) return null;
  return (
    <div id="message-box">
      <div className="message">
        <p>
          <strong>{description}</strong>
        </p>
        {linkText && linkURL ? (
          <p>
            <a href={linkURL} target="_blank" rel="noopener noreferrer">
              {linkText}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
};

const WarningBox = ({ scripts, missingFxAutoconfig, outdatedFxAutoconfig }) => {
  let message = {};
  if (missingFxAutoconfig || outdatedFxAutoconfig) {
    message.description = `fx-autoconfig is ${
      missingFxAutoconfig ? "not installed" : "outdated"
    }.`;
    message.linkText = "Download fx-autoconfig";
    message.linkURL = "https://github.com/MrOtherGuy/fx-autoconfig";
  } else if (!scripts.length) {
    message.description = "No scripts found.";
    message.linkText = "Download scripts";
    message.linkURL =
      "https://www.userchrome.org/what-is-userchrome-js.html#findingscripts";
  }
  return <MessageBox {...message} />;
};

const SettingsView = () => {};

const root = createRoot(document.getElementById("root"));
root.render(<UserChromeManager />);
