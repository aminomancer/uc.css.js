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
    babelOptions: {
      configFile: path.join(__dirname, ".babel-eslint.rc.js"),
    },
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
  settings: {
    "import/extensions": [".mjs"],
  },
  rules: {
    "no-eval": "off",
    "no-implied-eval": "error",
    "no-unused-vars": "off",
    "mozilla/valid-lazy": "off",
    "consistent-return": "off",
    "no-empty": "off",
    complexity: ["warn", { max: 50 }],
    curly: ["error", "multi-line"],
    "no-console": "warn",
    "prettier/prettier": [
      "error",
      {
        "endOfLine": "auto",
        "arrowParens": "avoid",
        "printWidth": 100,
        "tabWidth": 2,
        "trailingComma": "es5",
        "quoteProps": "preserve",
      },
    ],
  },
  ignorePatterns: ["node_modules", "utils/boot.jsm"],
  // Ignore eslint configurations in parent directories.
  root: true,
  // New rules and configurations should generally be added in
  // tools/lint/eslint/eslint-plugin-mozilla/lib/configs/recommended.js to
  // allow external repositories that use the plugin to pick them up as well.
  extends: ["plugin:mozilla/recommended"],
  plugins: ["mozilla", "import"],
  overrides: [
    {
      files: ["*@aminomancer/**", "extensions/**"],
      env: { webextensions: true },
    },
    {
      // All .eslintrc.js files are in the node environment, so turn that
      // on here.
      // https://github.com/eslint/eslint/issues/13008
      files: [".eslintrc.js"],
      env: {
        node: true,
        browser: false,
      },
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
