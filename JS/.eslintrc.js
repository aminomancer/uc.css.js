module.exports = {
  env: {
    node: false,
    browser: true,
    es2021: true,
    "mozilla/browser-window": true,
    "mozilla/jsm": true,
    // "mozilla/chrome-worker": true,
    // "mozilla/frame-script": true,
    // "mozilla/privileged": true,
    // "mozilla/simpletest": true,
    // "mozilla/sjs": true,
    // "mozilla/xpcshell": true,
  },
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
  rules: {
    "no-eval": "off",
    "mozilla/valid-lazy": "off",
    "no-unused-vars": "off",
  },
};
