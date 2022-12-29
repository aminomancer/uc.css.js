/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useRef, useEffect, useState, useCallback, useContext } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { GlobalContext, ucUtils } from "./GlobalContext";
const { gScriptUpdater } = ChromeUtils.importESModule(
  "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
);

export const ScriptCard = ({ script, enabled, expanded, setUpdater }) => {
  const { navigate } = useContext(GlobalContext);
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
  const [iconHidden, setIconHidden] = useState(!script.icon);

  const onCardActivate = useCallback(
    event => {
      switch (event.target.localName) {
        case "button":
        case "input":
        case "a":
          return;
      }
      if (event.target.closest(".script-card-expanded")) return;
      if (expanded) {
        window.history.back();
      } else {
        navigate(`scripts/${script.filename}`);
        window.scrollTo(0, 0);
      }
      event.preventDefault();
    },
    [expanded, navigate, script.filename]
  );
  const onIconError = useCallback(() => {
    setIconHidden(true);
  }, []);
  const launchLocalFile = useCallback(
    event => {
      handle.launchLocalFile();
      event.preventDefault();
    },
    [handle]
  );
  const toggleScript = useCallback(
    event => {
      ucUtils.toggleScript(script.filename);
    },
    [script.filename]
  );

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
        console.error(
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
        console.error(
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
    return () => {
      unsubscribe();
    };
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
            update: updateButtonDisabled ? null : handle.updateScript,
          }
    );
  }, [
    updateButtonDisabled,
    updateBarHidden,
    writing,
    pendingRestart,
    setUpdater,
    script.filename,
    handle.updateScript,
  ]);

  return (
    <div
      className="script card"
      active={enabled ? "true" : "false"}
      expanded={expanded ? "" : undefined}
      aria-labelledby={nameId}
      onClick={onCardActivate}
      role="presentation"
    >
      <div className="script-card-collapsed">
        <img
          className="script-icon"
          alt=""
          src={script.icon}
          onError={onIconError}
          hidden={iconHidden}
        />
        <div className="card-contents">
          <div className="script-name-container">
            <h3
              id={nameId}
              className="script-name"
              title={`${script.filename}${
                script.version ? ` ${script.version}` : ""
              }`}
            >
              {script.name || script.filename}
            </h3>
            <div className="script-version" hidden={!script.version}>
              {script.version}
            </div>
            <div className="spacer" />
            <input
              type="checkbox"
              className="script-checkbox toggle-button"
              checked={enabled}
              onInput={toggleScript}
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
              onClick={handle.updateScript}
            >
              {updateButtonLabel}
            </button>
          </span>
        </div>
      </div>
      {expanded ? (
        <ScriptDetails script={script} launchLocalFile={launchLocalFile} />
      ) : null}
    </div>
  );
};

/**
 * @param {string} uri
 * @returns {string}
 */
function markdownUriTransformer(uri) {
  const url = (uri || "").trim();
  const first = url.charAt(0);
  if (first === "#" || first === "/") return url;
  const colon = url.indexOf(":");
  if (colon === -1) return url;
  let index = -1;
  const protocols = ["http", "https", "mailto", "tel", "about", "chrome"];
  while (++index < protocols.length) {
    const protocol = protocols[index];
    if (
      colon === protocol.length &&
      url.slice(0, protocol.length).toLowerCase() === protocol
    ) {
      return url;
    }
  }
  index = url.indexOf("?");
  if (index !== -1 && colon > index) return url;
  index = url.indexOf("#");
  if (index !== -1 && colon > index) return url;
  return "";
}

export const ScriptDetails = ({ script, launchLocalFile }) => {
  const descriptionWrapper = useRef();
  const [descriptionCollapsed, setDescriptionCollapsed] = useState(false);
  const [descriptionToggleHidden, setDescriptionToggleHidden] = useState(true);

  const toggleDescriptionCollapsed = useCallback(() => {
    setDescriptionCollapsed(previous => !previous);
    setDescriptionToggleHidden(false);
  }, []);

  useEffect(() => {
    const { current } = descriptionWrapper;
    if (current) {
      requestAnimationFrame(() => {
        const remSize = parseFloat(
          window.getComputedStyle(document.documentElement).fontSize
        );
        let { paddingTop, paddingBottom } = window.getComputedStyle(current);
        let { height } = current.getBoundingClientRect();
        paddingTop = parseFloat(paddingTop);
        paddingBottom = parseFloat(paddingBottom);
        height -= paddingTop + paddingBottom;
        if (height > 20 * remSize + 8) {
          toggleDescriptionCollapsed();
        }
      });
    }
  }, [toggleDescriptionCollapsed]);

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
              <ReactMarkdown
                className="line-break"
                linkTarget="_blank"
                transformLinkUri={markdownUriTransformer}
                remarkPlugins={[remarkBreaks]}
              >
                {script.description.replace(/␠/g, " ")}
              </ReactMarkdown>
            </div>
            <button
              className="button-link script-detail-description-toggle"
              hidden={descriptionToggleHidden}
              onClick={toggleDescriptionCollapsed}
            >
              {descriptionCollapsed ? "Show more" : "Show less"}
            </button>
          </div>
        ) : null}
        <div className="script-detail-row script-detail-source">
          <label className="script-detail-label">Source file</label>
          <a href={script.path} onClick={launchLocalFile}>
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
