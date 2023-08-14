/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useEffect, useState, useCallback, useMemo, useContext } from "react";
import { fuzzyFilter } from "fuzzbunny";
import { GlobalContext } from "./GlobalContext";
import { SearchBar } from "./SearchBar";
import { ScriptCard } from "./ScriptCard";
import { WarningBox } from "./WarningBox";

export const ScriptsView = () => {
  const {
    path,
    navigate,
    restart,
    search,
    setSearch,
    missingFxAutoconfig,
    outdatedFxAutoconfig,
    scripts,
    scriptsDisabled,
    setUpdateCount,
    initialFocus,
    setInitialFocus,
  } = useContext(GlobalContext);

  let [, expandedCard] = path.split("/");

  const [updateAllButtonDisabled, setUpdateAllButtonDisabled] = useState(false);
  const [updateAllHidden, setUpdateAllHidden] = useState(true);
  const [updateAllDesc, setUpdateAllDesc] = useState("");
  const [restartHidden, setRestartHidden] = useState(true);
  const [updaters, setUpdaters] = useState({});

  const filteredScripts = useMemo(
    () => fuzzyFilter(scripts, search, { fields: ["name", "filename"] }),
    [scripts, search]
  );

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
  const doSearch = useCallback(
    val => {
      setSearch(val);
      if (expandedCard) navigate("scripts");
    },
    [expandedCard, navigate, setSearch]
  );
  const doSubmit = useCallback(() => {
    let matchingScript = filteredScripts[0]?.item;
    if (matchingScript) {
      navigate(`scripts/${matchingScript.filename}`);
      window.scrollTo(0, 0);
    } else {
      navigate("scripts");
    }
  }, [filteredScripts, navigate]);
  const onSearchFocus = useCallback(
    () => setInitialFocus(false),
    [setInitialFocus]
  );

  useEffect(() => {
    let values = Object.values(updaters).filter(updater => updater);
    if (!values.length) {
      setUpdateAllHidden(true);
      setRestartHidden(true);
      setUpdateCount(0);
      return;
    }
    if (values.every(updater => updater.disabled)) {
      if (values.some(updater => updater.writing)) {
        setUpdateAllButtonDisabled(true);
        setUpdateAllDesc("Updating…");
        setUpdateAllHidden(false);
        setRestartHidden(true);
      } else if (values.some(updater => updater.pendingRestart)) {
        setUpdateAllHidden(true);
        setRestartHidden(false);
      } else {
        setUpdateAllButtonDisabled(true);
        setUpdateAllDesc("Update failed — Try updating manually");
        setUpdateAllHidden(false);
        setRestartHidden(true);
      }
    } else {
      setUpdateAllButtonDisabled(false);
      setUpdateAllDesc("Updates available");
      setUpdateAllHidden(false);
      setRestartHidden(true);
    }
    setUpdateCount(
      values.filter(
        updater =>
          !(updater.disabled || updater.writing || updater.pendingRestart)
      ).length
    );
  }, [setUpdateCount, updaters]);

  useEffect(() => {
    let expandedCardScript = scripts.find(
      script => script.filename === expandedCard
    );
    if (expandedCard && !expandedCardScript) {
      navigate("scripts", false);
    }
  }, [expandedCard, navigate, scripts]);

  return (
    <div id="scripts">
      <div id="scripts-header" className="view-header">
        <div className="sticky-container">
          <div className="main-search">
            <SearchBar
              id="scripts-search"
              terms={search}
              doSearch={doSearch}
              doSubmit={doSubmit}
              placeholder="Search installed scripts"
              autoFocus={initialFocus} // eslint-disable-line jsx-a11y/no-autofocus
              onFocus={onSearchFocus}
            />
          </div>
          <div className="main-heading">
            <button
              className="back-button"
              title="Go back"
              onClick={goBack}
              hidden={!expandedCard}
            />
            <h1 className="header-name" hidden={!!expandedCard}>
              {search ? "Search Results" : "Manage Your Scripts"}
            </h1>
            <div className="spacer" />
            <div className="header-button-box" hidden={updateAllHidden}>
              <label className="header-button-description">
                {updateAllDesc}
              </label>
              <button
                id="update-all-button"
                className={updateAllButtonDisabled ? undefined : "primary"}
                disabled={updateAllButtonDisabled}
                onClick={updateAll}>
                Update all
              </button>
            </div>
            <div className="header-button-box" hidden={restartHidden}>
              <label className="header-button-description">
                Restart to finish updating
              </label>
              <button
                id="restart-button"
                className={"primary"}
                onClick={restart}>
                Restart
              </button>
            </div>
          </div>
          <WarningBox
            missingFxAutoconfig={missingFxAutoconfig}
            outdatedFxAutoconfig={outdatedFxAutoconfig}
            noResultsForSearch={filteredScripts.length < 1 && search}
            searchUnit="scripts"
          />
        </div>
      </div>
      <div id="main">
        <div id="scripts-list">
          {filteredScripts
            .map(({ item, highlights }) => (
              <ScriptCard
                key={`${item.id}-card`}
                script={item}
                enabled={!scriptsDisabled.split(",").includes(item.filename)}
                expanded={expandedCard === item.filename}
                highlights={highlights}
                setUpdater={setUpdater}
                aria-setsize={scripts.length}
                aria-posinset={scripts.indexOf(item) + 1}
                hidden={expandedCard && expandedCard !== item.filename}
              />
            ))
            .concat(
              // Add the rest of the scripts that aren't in the filtered list
              // (but hidden) because it makes searching feel more responsive
              scripts.map((script, index) =>
                filteredScripts.find(match => match.item === script) ? null : (
                  <ScriptCard
                    key={`${script.id}-card`}
                    script={script}
                    enabled={
                      !scriptsDisabled.split(",").includes(script.filename)
                    }
                    expanded={expandedCard === script.filename}
                    setUpdater={setUpdater}
                    aria-setsize={scripts.length}
                    aria-posinset={index + 1}
                    hidden={true}
                  />
                )
              )
            )}
        </div>
      </div>
    </div>
  );
};
