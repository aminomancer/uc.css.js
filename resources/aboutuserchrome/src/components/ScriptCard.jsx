/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
  useRef,
} from "react";
import { GlobalContext, ucUtils } from "./GlobalContext";
import { ScriptDetails } from "./ScriptDetails";
const { gScriptUpdater } = ChromeUtils.importESModule(
  "chrome://userchrome/content/aboutuserchrome/modules/UCMSingletonData.sys.mjs"
);

export const ScriptCard = ({
  script,
  enabled,
  expanded,
  highlights,
  setUpdater,
  ...props
}) => {
  const { navigate } = useContext(GlobalContext);

  const [updateBarHidden, setUpdateBarHidden] = useState(true);
  const [updateBarType, setUpdateBarType] = useState("info");
  const [updateBarLabel, setUpdateBarLabel] = useState("");
  const [updateButtonDisabled, setUpdateButtonDisabled] = useState(false);
  const [updateButtonLabel, setUpdateButtonLabel] = useState("");
  const [iconHidden, setIconHidden] = useState(!script.icon);
  const [focused, setFocused] = useState(false);

  const nameButtonRef = useRef(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  let handle = useMemo(() => gScriptUpdater.getHandle(script), []);
  let normalizedScriptId = useMemo(
    () => script.id.toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
    [script.id]
  );
  let cardId = useMemo(() => `script-card-${normalizedScriptId}`, [
    normalizedScriptId,
  ]);
  let nameId = useMemo(() => `script-name-${normalizedScriptId}`, [
    normalizedScriptId,
  ]);
  let truncatedDescription = useMemo(() => {
    return script.description && script.description.length > 200
      ? `${String(script.description ?? "")?.slice(0, 200)}…`
      : script.description;
  }, [script.description]);

  const highlightToNode = useCallback(
    (part, index) => {
      if (!part) return null;
      return index % 2 ? (
        // Odd parts are highlighted
        <mark key={`script-name-highlight-${normalizedScriptId}-${index}`}>
          {part}
        </mark>
      ) : (
        // Even parts are just text
        <span key={`script-name-highlight-${normalizedScriptId}-${index}`}>
          {part}
        </span>
      );
    },
    [normalizedScriptId]
  );
  const nameWithHighlights = useMemo(() => {
    if (!highlights) return null;
    let nameNodes = highlights.name?.map(highlightToNode).filter(Boolean);
    if (nameNodes?.length) return nameNodes;
    let filenameNodes = highlights.filename
      ?.map(highlightToNode)
      .filter(Boolean);
    if (filenameNodes?.length) return filenameNodes;
    return null;
  }, [highlightToNode, highlights]);

  const onCardActivate = useCallback(
    event => {
      if (expanded) return;
      navigate(`scripts/${script.filename}`);
      window.scrollTo(0, 0);
      event.preventDefault();
      event.stopPropagation();
    },
    [expanded, navigate, script.filename]
  );
  const onCardClick = useCallback(
    event => {
      switch (event.target.localName) {
        case "button":
        case "input":
        case "a":
          return;
      }
      onCardActivate(event);
    },
    [onCardActivate]
  );
  const onCardKeyDown = useCallback(
    event => {
      if (event.repeat) return;
      switch (event.key) {
        case "Enter":
        case " ":
          switch (event.target.localName) {
            case "button":
            case "input":
            case "a":
              return;
          }
          onCardActivate(event);
          break;
      }
    },
    [onCardActivate]
  );
  const onNameButtonClick = useCallback(onCardActivate, [onCardActivate]);
  const onNameButtonKeyDown = useCallback(
    event => {
      if (event.repeat) return;
      switch (event.key) {
        case "Enter":
        case " ":
          onCardActivate(event);
          break;
      }
    },
    [onCardActivate]
  );
  const onNameButtonFocus = useCallback(event => {
    setFocused(true);
  }, []);
  const onNameButtonBlur = useCallback(event => {
    setFocused(false);
  }, []);
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
    () => ucUtils.toggleScript(script.filename),
    [script.filename]
  );
  const onNotification = useCallback(
    scriptHandle => {
      let remoteScriptData = scriptHandle.remoteFile
        ? ucUtils.parseStringAsScriptInfo(
            scriptHandle.filename,
            scriptHandle.remoteFile
          )
        : {};
      let newVersion = remoteScriptData.version;
      let updater = {};
      if (scriptHandle.writing) {
        setUpdateButtonLabel("Updating…");
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
        updater.disabled = true;
        updater.update = null;
      } else if (scriptHandle.updateError) {
        setUpdateButtonLabel("Update failed");
        setUpdateBarType("warning");
        setUpdateBarLabel(`Update to ${newVersion} manually`);
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
        updater.disabled = true;
        updater.update = null;
        console.error(
          `Error overwriting ${scriptHandle.filename} :>> `,
          scriptHandle.updateError
        );
      } else if (scriptHandle.pendingRestart) {
        setUpdateButtonLabel("Updated");
        setUpdateBarType("success");
        setUpdateBarLabel(`Restart to update to ${newVersion}`);
        setUpdateButtonDisabled(true);
        setUpdateBarHidden(false);
        updater.disabled = true;
        updater.update = null;
      } else if (scriptHandle.downloadError) {
        setUpdateBarHidden(true);
        updater = null;
        console.error(
          `Error downloading ${scriptHandle.filename} :>> `,
          scriptHandle.downloadError
        );
      } else if (
        Services.vc.compare(newVersion, scriptHandle.currentVersion) > 0
      ) {
        setUpdateButtonLabel("Update now");
        setUpdateBarLabel(`Update to ${newVersion} available`);
        setUpdateButtonDisabled(false);
        setUpdateBarHidden(false);
        updater.disabled = false;
        updater.update = scriptHandle.updateScript;
      } else {
        setUpdateBarHidden(true);
        updater = null;
      }
      if (updater) {
        updater.writing = scriptHandle.writing;
        updater.pendingRestart = scriptHandle.pendingRestart;
      }
      setUpdater(scriptHandle.filename, updater);
    },
    [setUpdater]
  );

  useEffect(() => {
    let unsubscribe = handle.subscribe(onNotification);
    handle.checkRemoteFile();
    return () => {
      unsubscribe();
    };
  }, [handle, onNotification]);

  useEffect(() => {
    if (expanded && focused) {
      nameButtonRef.current?.blur();
      document.querySelector(".back-button").focus();
    }
  }, [expanded, focused]);

  useEffect(() => {
    setFocused(document.activeElement === nameButtonRef.current);
  }, [expanded]);

  return (
    <div
      id={cardId}
      className="script card"
      active={enabled ? "true" : "false"}
      expanded={expanded ? "" : undefined}
      aria-labelledby={nameId}
      focused={focused ? "" : undefined}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      role="presentation"
      {...props}
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
            <button
              className="script-name-button"
              onClick={onNameButtonClick}
              onKeyDown={onNameButtonKeyDown}
              onFocus={onNameButtonFocus}
              onBlur={onNameButtonBlur}
              disabled={expanded}
              aria-expanded={expanded ? "true" : "false"}
              aria-controls={cardId}
              ref={nameButtonRef}
            >
              <h3
                id={nameId}
                className="script-name"
                title={`${script.filename}${
                  script.version ? ` ${script.version}` : ""
                }`}
                aria-label={`${script.name || script.filename}${
                  enabled ? "" : " (disabled)"
                }`}
              >
                {nameWithHighlights || script.name || script.filename}
              </h3>
            </button>
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
          <span className="script-description">{truncatedDescription}</span>
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
