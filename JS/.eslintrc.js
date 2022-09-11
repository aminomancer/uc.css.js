module.exports = {
  parserOptions: {
    sourceType: "script",
    ecmaVersion: "latest",
  },
  overrides: [
    {
      files: [".eslintrc.js"],
      env: {
        node: true,
        browser: false,
      },
    },
  ],
  globals: {
    _ucUtils: "writable",
    windowUtils: "writable",
    tabPreviews: "writable",
    gUnifiedExtensions: "writable",
    UIState: "writable",
    FxAccounts: "writable",
    EnsureFxAccountsWebChannel: "writable",
    SyncedTabs: "writable",
    MIN_STATUS_ANIMATION_DURATION: "writable",
    SyncedTabsPanelList: "writable",
    SyncedTabsDeckComponent: "writable",
    syncedTabsDeckComponent: "writable",
  },
};
