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
    user_pref: "readonly",
  },
};
