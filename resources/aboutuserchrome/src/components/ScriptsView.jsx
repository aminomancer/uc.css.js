/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useEffect, useState, useCallback, useContext } from "react";
import { GlobalContext } from "./GlobalContext";
import { ScriptCard } from "./ScriptCard";
import { WarningBox } from "./WarningBox";

export const ScriptsView = () => {
  const {
    path,
    missingFxAutoconfig,
    outdatedFxAutoconfig,
    scripts,
    scriptsDisabled,
    setUpdateCount,
  } = useContext(GlobalContext);

  let [, expandedCard] = path.split("/");

  const [updateAllButtonDisabled, setUpdateAllButtonDisabled] = useState(false);
  const [updateAllHidden, setUpdateAllHidden] = useState(true);
  const [updateAllDesc, setUpdateAllDesc] = useState("");
  const [updaters, setUpdaters] = useState({});

  const goBack = useCallback(() => {
    window.history.back();
  }, []);
  const setUpdater = useCallback(
    (name, updater) =>
      setUpdaters(currentUpdaters => {
        let newUpdaters = { ...currentUpdaters };
        if (updater) {
          newUpdaters[name] = updater;
        } else {
          delete newUpdaters[name];
        }
        return newUpdaters;
      }),
    []
  );
  const updateAll = useCallback(() => {
    Object.values(updaters).forEach(updater => updater?.update?.());
  }, [updaters]);

  useEffect(() => {
    let values = Object.values(updaters).filter(updater => updater);
    if (!values.length) {
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
    }
    setUpdateAllHidden(false);
    setUpdateCount(
      values.filter(
        updater =>
          !(updater.disabled || updater.writing || updater.pendingRestart)
      ).length
    );
  }, [setUpdateCount, updaters]);

  return (
    <div id="scripts">
      <div id="scripts-header" className="view-header">
        <div className="sticky-container">
          <div className="main-heading">
            <button
              className="back-button"
              title="Go back"
              onClick={goBack}
              hidden={!expandedCard}
            />
            <h1 className="header-name" hidden={!!expandedCard}>
              Manage Your Scripts
            </h1>
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
          missingFxAutoconfig={missingFxAutoconfig}
          outdatedFxAutoconfig={outdatedFxAutoconfig}
        />
      </div>
      <div id="main">
        <div id="scripts-list">
          {scripts.map(script =>
            !expandedCard || expandedCard === script.filename ? (
              <ScriptCard
                key={`${script.filename}-card`}
                script={script}
                enabled={!scriptsDisabled.split(",").includes(script.filename)}
                expanded={!!expandedCard}
                setUpdater={setUpdater}
              />
            ) : null
          )}
        </div>
      </div>
    </div>
  );
};
