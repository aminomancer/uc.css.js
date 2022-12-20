/* This Source Code Form is subject to the terms of the Creative Commons
 * Attribution-NonCommercial-ShareAlike International License, v. 4.0.
 * If a copy of the CC BY-NC-SA 4.0 was not distributed with this
 * file, You can obtain one at http://creativecommons.org/licenses/by-nc-sa/4.0/
 * or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA. */

"use strict";

const path = require("path");

module.exports = {
  parser: "@babel/eslint-parser",
  parserOptions: {
    sourceType: "script",
    babelOptions: { configFile: path.join(__dirname, ".babel-eslint.rc.js") },
  },
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
  settings: { "import/extensions": [".mjs"] },
  rules: {
    "arrow-body-style": "off",
    complexity: ["warn", { max: 50 }],
    "consistent-return": "off",
    curly: ["error", "multi-line", "consistent"],
    "linebreak-style": ["error", "unix"],
    "mozilla/valid-lazy": "off",
    "no-console": "warn",
    "no-empty": "off",
    "no-eval": "off",
    "no-implied-eval": "error",
    "no-unused-vars": "off",
    "prefer-arrow-callback": "off",
    "prefer-numeric-literals": 2,
    "prefer-promise-reject-errors": 2,
    "prefer-reflect": 0,
    "prefer-rest-params": 2,
    "prefer-spread": 2,
    "prefer-template": 2,
    "prettier/prettier": ["error", {}, { usePrettierrc: true }],
  },
  ignorePatterns: ["node_modules", "utils/**"],
  // allow external repositories that use the plugin to pick them up as well.
  extends: [
    "eslint:recommended",
    "prettier/prettier",
    "plugin:prettier/recommended",
    "plugin:mozilla/recommended",
  ],
  plugins: ["prettier", "mozilla", "import"],
  overrides: [
    {
      files: ["*@aminomancer/**", "extensions/**"],
      env: { webextensions: true },
      globals: { XPCNativeWrapper: true },
      rules: { complexity: "off", "no-console": "off" },
    },
    {
      files: ["utils/**", "resources/aboutconfig/**"],
      rules: { "prettier/prettier": "off" },
    },
    {
      files: ["prefs/**"],
      rules: { "prettier/prettier": "off" },
      globals: { user_pref: "readonly" },
    },
    {
      files: ["resources/script-override/**"],
      rules: { "prettier/prettier": ["error", { quoteProps: "preserve" }] },
    },
    {
      files: ["resources/aboutuserchrome/**"],
      parserOptions: { sourceType: "module" },
    },
    {
      // All .eslintrc.js files are in the node environment, so turn that
      // on here.
      // https://github.com/eslint/eslint/issues/13008
      files: [".eslintrc.js"],
      env: { node: true, browser: false },
    },
    {
      files: ["*.mjs"],
      rules: {
        "import/default": "error",
        "import/export": "error",
        "import/named": "error",
        "import/namespace": "error",
        "import/newline-after-import": "error",
        "import/no-anonymous-default-export": "error",
        "import/no-duplicates": "error",
        "import/no-absolute-path": "error",
        "import/no-named-default": "error",
        "import/no-named-as-default": "error",
        "import/no-named-as-default-member": "error",
        "import/no-self-import": "error",
        "import/no-unassigned-import": "error",
        "import/no-unresolved": [
          "error",
          // Bug 1773473 - Ignore resolver URLs for chrome and resource as we
          // do not yet have a resolver for them.
          { ignore: ["chrome://", "resource://"] },
        ],
        "import/no-useless-path-segments": "error",
      },
    },
    {
      files: ["*.html", "*.xhtml", "*.xml"],
      rules: {
        // Curly brackets are required for all the tree via recommended.js,
        // however these files aren't auto-fixable at the moment.
        curly: "off",
      },
    },
    {
      // Rules of Hooks broadly checks for camelCase "use" identifiers, so
      // enable only for paths actually using React to avoid false positives.
      extends: ["plugin:react-hooks/recommended"],
      files: ["*.jsx"],
    },
  ],
};
