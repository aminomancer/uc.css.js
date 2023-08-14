/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { useCallback, useMemo } from "react";

export const SearchBar = ({
  id,
  terms,
  doSearch,
  doSubmit,
  placeholder = "Search",
  searchIcon = true,
  clearButton = true,
  ...props
}) => {
  let searchValue = useMemo(() => terms || "", [terms]);

  const onChange = useCallback(
    event => {
      doSearch(event.target.value);
    },
    [doSearch]
  );
  const onClear = useCallback(() => {
    doSearch("");
  }, [doSearch]);
  const onKeyDown = useCallback(
    event => {
      if (event.repeat) return;
      switch (event.key) {
        case "Escape":
          onClear();
          break;
        case "Enter":
          let { value } = event.target;
          if (value) {
            doSearch?.(value);
            doSubmit?.(value);
          }
          break;
      }
    },
    [onClear, doSearch, doSubmit]
  );
  const onSearchboxClick = useCallback(event => {
    if (
      event.target === event.currentTarget &&
      !event.target.matches(":focus-within")
    ) {
      let input = event.target.querySelector("input");
      input.setSelectionRange(0, 0);
      input.focus();
    }
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <div
      id={id}
      className="search-textbox"
      onClick={onSearchboxClick}
      role="search">
      <div className="textbox-search-sign" hidden={!searchIcon} />
      <input
        type="search"
        placeholder={placeholder}
        defaultValue={searchValue}
        maxLength="100"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        inputMode="search"
        aria-label={placeholder}
        aria-autocomplete="list"
        aria-haspopup="false"
        onChange={onChange}
        onKeyDown={onKeyDown}
        {...props}
      />
      <button
        className="textbox-search-clear"
        title="Clear"
        alt="Clear"
        onClick={onClear}
        hidden={!clearButton || !searchValue}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
};
