/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this file,
 * You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ */

import { RichDescription } from "./RichDescription";

function isValidURL(url) {
  try {
    Services.io.newURI(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * For a given script, check if the author is a URL instead of a name. If so,
 * try to extract a name from the URL, and return both the name and the URL so
 * they can be displayed as a link. If the author is not a URL, return the
 * author as the name and the homepage as the URL. If there is no homepage,
 * return the author as the name and no URL (i.e. just plain text).
 * @param {object} script
 * @param {string} [script.author]
 * @param {string} [script.homepageURL]
 * @returns {DisplayURLs}
 */
function getDisplayURLs({ author, homepageURL } = {}) {
  let displayAuthorName = author;
  let displayAuthorURL;
  let displayHomepageURL = homepageURL;
  if (author) {
    try {
      displayAuthorURL = new URL(author);
      let urlParts = displayAuthorURL.pathname.split("/");
      if (urlParts.length < 3 && !urlParts[1]) {
        displayAuthorName = displayAuthorURL.host;
      } else if (
        ["github.com", "gitlab.com", "bitbucket.org"].includes(
          displayAuthorURL.host
        )
      ) {
        displayAuthorName = urlParts[1] || author;
      }
      displayAuthorURL = displayAuthorURL.href;
    } catch (e) {}
  }

  displayHomepageURL =
    homepageURL &&
    (isValidURL(homepageURL) ? homepageURL : `file:///${homepageURL}`);

  displayAuthorURL = displayAuthorURL || displayHomepageURL;

  /**
   * @typedef {object} DisplayURLs
   * @property {string} [author]
   * @property {string} [authorURL]
   * @property {string} [homepageURL]
   */
  return {
    author: displayAuthorName,
    authorURL: displayAuthorURL,
    homepageURL: displayHomepageURL,
  };
}

export const ScriptDetails = ({ script, launchLocalFile }) => {
  let { author, authorURL, homepageURL } = getDisplayURLs(script);

  return (
    <div className="script-card-expanded">
      <div className="script-detail-rows">
        {script.description?.length > 200 ? (
          <RichDescription
            description={script.description}
            prefix="script-detail-"
          />
        ) : null}
        <div className="script-detail-row script-detail-source">
          <label className="script-detail-label">Source file</label>
          <a href={script.path} onClick={launchLocalFile}>
            {script.filename}
          </a>
        </div>
        <div className="script-detail-row script-detail-running">
          <label className="script-detail-label">Running</label>
          <code>{script.isRunning ? "true" : "false"}</code>
        </div>
        <div
          className="script-detail-row script-detail-version"
          hidden={!script.version}>
          <label className="script-detail-label">Version</label>
          <span>{script.version}</span>
        </div>
        <div
          className="script-detail-row script-detail-author"
          hidden={!author}>
          <label className="script-detail-label">Author</label>
          {authorURL ? (
            <a target="_blank" href={authorURL}>
              {author}
            </a>
          ) : (
            <span>{author}</span>
          )}
        </div>
        <div
          className="script-detail-row script-detail-homepageURL"
          hidden={!homepageURL}>
          <label className="script-detail-label">Homepage</label>
          <a target="_blank" href={homepageURL}>
            {script.homepageURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-downloadURL"
          hidden={!script.downloadURL}>
          <label className="script-detail-label">Download URL</label>
          <a
            target="_blank"
            href={
              script.downloadURL &&
              (isValidURL(script.downloadURL)
                ? script.downloadURL
                : `file:///${script.downloadURL}`)
            }>
            {script.downloadURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-updateURL"
          hidden={!script.updateURL || script.updateURL === script.downloadURL}>
          <label className="script-detail-label">Update URL</label>
          <a
            target="_blank"
            href={
              script.updateURL &&
              (isValidURL(script.updateURL)
                ? script.updateURL
                : `file:///${script.updateURL}`)
            }>
            {script.updateURL}
          </a>
        </div>
        <div
          className="script-detail-row script-detail-optionsURL"
          hidden={!script.optionsURL}>
          <label className="script-detail-label">Options URL</label>
          <a
            target="_blank"
            href={
              script.optionsURL &&
              (isValidURL(script.optionsURL)
                ? script.optionsURL
                : `file:///${script.optionsURL}`)
            }>
            {script.optionsURL}
          </a>
        </div>
        <div className="script-detail-row script-detail-type">
          <label className="script-detail-label">Type</label>
          <span>
            {script.isESM
              ? "ES module"
              : (script.inbackground && "Background script") || "Chrome script"}
          </span>
        </div>
        <div
          className="script-detail-row script-detail-onlyonce"
          hidden={!script.onlyonce}>
          <label className="script-detail-label">Only once</label>
          <code>{"true"}</code>
        </div>
        <div
          className="script-detail-row script-detail-ignoreCache"
          hidden={!script.ignoreCache}>
          <label className="script-detail-label">Ignore cache</label>
          <code>{"true"}</code>
        </div>
        <div
          className="script-detail-row script-detail-loadOrder"
          hidden={script.inbackground}>
          <label className="script-detail-label">Load order</label>
          <span>{String(script.loadOrder)}</span>
        </div>
        <div
          className="script-detail-row script-detail-charset"
          hidden={!script.charset}>
          <label className="script-detail-label">Character set</label>
          <span>{script.charset}</span>
        </div>
      </div>
    </div>
  );
};
