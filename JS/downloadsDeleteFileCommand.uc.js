// ==UserScript==
// @name           Downloads Delete File Command
// @version        1.0.2
// @author         aminomancer
// @homepage       https://github.com/aminomancer/uc.css.js
// @description    Adds a new "Delete" menuitem when right-clicking a download
// in the downloads panel or the downloads manager. This will delete the
// downloaded file from disk. It's important since the ability to "temporarily"
// download files with Firefox is being removed as part of bug 1733587 to reduce
// the risk of data loss. When you choose to "open" a file instead of "save" it,
// Firefox will no longer save the file in your Temp folder, but rather in your
// chosen Downloads folder. So, being able to clean up these files from the
// context menu is a nice feature. This will most likely be released in Firefox
// (see bug 1745624), but I did a lot of the testing for it with an autoconfig
// script, so it isn't any extra work to publish this here, at least until it
// makes it into a release build. When you download a version of Firefox that
// includes the menuitem, you can just delete this script.
// @license        This Source Code Form is subject to the terms of the Creative Commons Attribution-NonCommercial-ShareAlike International License, v. 4.0. If a copy of the CC BY-NC-SA 4.0 was not distributed with this file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
// @include        chrome://browser/content/places/places.xhtml
// @include        main
// ==/UserScript==

(function () {
  function init() {
    if (!("DownloadsViewUI" in window)) return;
    // Make the command.
    document.getElementById("downloadsCmd_alwaysOpenSimilarFiles").after(
      _ucUtils.createElement(document, "command", {
        id: "downloadsCmd_deleteFile",
        oncommand: "goDoCommand('downloadsCmd_deleteFile')",
      })
    );
    // Make the menuitem.
    let context = document.getElementById("downloadsContextMenu");
    context.insertBefore(
      _ucUtils.createElement(document, "menuitem", {
        command: "downloadsCmd_deleteFile",
        class: "downloadDeleteFileMenuItem",
        "data-l10n-id": "text-action-delete",
      }),
      context.querySelector(".downloadRemoveFromHistoryMenuItem")
    );
    let clearDownloads = context.querySelector(`[data-l10n-id="downloads-cmd-clear-downloads"]`);
    if (clearDownloads.getAttribute("accesskey") === "D")
      clearDownloads.setAttribute("accesskey", "C");

    // Add the class method for the command.
    if (!DownloadsViewUI.DownloadElementShell.prototype.hasOwnProperty("downloadsCmd_deleteFile"))
      DownloadsViewUI.DownloadElementShell.prototype.downloadsCmd_deleteFile =
        async function downloadsCmd_deleteFile() {
          let { download } = this;
          let { path } = download.target;
          let { succeeded } = download;
          let indicator = DownloadsCommon.getIndicatorData(this.element.ownerGlobal);
          // Remove the download view.
          await DownloadsCommon.deleteDownload(download);
          if (succeeded) {
            // Temp files are made "read-only" by DownloadIntegration.downloadDone,
            // so reset the permission bits to read/write. This won't be necessary
            // after 1733587 since Downloads won't ever be temporary.
            let info = await IOUtils.stat(path);
            await IOUtils.setPermissions(path, 0o660);
            await IOUtils.remove(path, {
              ignoreAbsent: true,
              recursive: info.type === "directory",
            });
          }
          if (!indicator._hasDownloads) indicator.attention = DownloadsCommon.ATTENTION_NONE;
        };
    // Add a class method for the panel's class (extends the class above) to handle a special case.
    if (
      "DownloadsViewItem" in window &&
      !DownloadsViewItem.prototype.hasOwnProperty("downloadsCmd_deleteFile")
    ) {
      DownloadsViewItem.prototype.downloadsCmd_deleteFile =
        async function downloadsCmd_deleteFile() {
          await DownloadsViewUI.DownloadElementShell.prototype.downloadsCmd_deleteFile.call(this);
          // Protects against an unusual edge case where the user:
          // 1) downloads a file with Firefox;
          // 2) deletes the file from outside of Firefox, e.g., a file manager;
          // 3) downloads the same file from the same source;
          // 4) opens the downloads panel and uses the menuitem to delete one of those 2 files.
          // Under those conditions, Firefox will make 2 view items even though
          // there's only 1 file. Using this method will only delete the view
          // item it was called on, because this instance is not aware of other
          // view items with identical targets. So the remaining view item needs
          // to be refreshed to hide the "Delete" option. That example only
          // concerns 2 duplicate view items but you can have an arbitrary
          // number, so iterate over all items...
          for (let viewItem of DownloadsView._visibleViewItems.values()) {
            viewItem.download.refresh().catch(Cu.reportError);
          }
          // Don't use DownloadsPanel.hidePanel for this method because it will remove
          // the view item from the list, which is already sufficient feedback.
        };
    }
    // Show/hide the menuitem based on whether there's any file to delete.
    if (DownloadsViewUI.updateContextMenuForElement.name === "updateContextMenuForElement")
      eval(
        `DownloadsViewUI.updateContextMenuForElement = function ` +
          DownloadsViewUI.updateContextMenuForElement
            .toSource()
            .replace(/^updateContextMenuForElement/, "")
            .replace(
              /(let download = element\._shell\.download;)/,
              `$1\n    contextMenu.querySelector(".downloadDeleteFileMenuItem").hidden =\n      !(download.target.exists || download.target.partFileExists);\n`
            )
      );
  }
  if ("gBrowserInit" in window) {
    if (gBrowserInit.delayedStartupFinished) init();
    else {
      let delayedListener = (subject, topic) => {
        if (topic == "browser-delayed-startup-finished" && subject == window) {
          Services.obs.removeObserver(delayedListener, topic);
          init();
        }
      };
      Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }
  } else init();
})();
