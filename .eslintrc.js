module.exports = {
  root: true,

  env: {
    node: true,
    webextensions: true,
  },

  extends: [
    "plugin:vue/essential",
    // '@vue/airbnb',
  ],

  parserOptions: {
    parser: "@typescript-eslint/parser",
  },

  rules: {
    // Need to keep consoles in build for production debugging
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "prefer-const": "off",
    "no-var": "off",
  },

  extends: ["plugin:vue/essential", "@vue/typescript"],

  overrides: [
    {
      files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
      env: {
        jest: true,
      },
    },
  ],
};
