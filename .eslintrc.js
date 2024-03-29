const IS_PROD = process.env.NODE_ENV === "production";

module.exports = {
  root: true,

  env: {
    node: true,
    webextensions: true,
  },

  parserOptions: {
    // project: ["./tsconfig.json"],
    parser: "@typescript-eslint/parser",
  },

  rules: {
    // https://stackoverflow.com/questions/34764287/turning-off-eslint-rule-for-a-specific-file
    //
    // Need to keep consoles in build for production debugging
    "no-debugger": IS_PROD ? "error" : "warn",
    "no-console": "off",
    "prefer-const": "warn",
    "no-await-in-loop": "off",
    "no-loop-func": "off",
    "import/prefer-default-export": "off",
    "import/no-cycle": "off",
    "no-restricted-syntax": "off",
    "no-constant-condition": "off",
    "no-param-reassign": "off",
    "array-callback-return": "off",
    "no-plusplus": "off",
    "max-len": "off",
    "no-unused-vars": "off",
    "no-use-before-define": "off",
    "no-case-declarations": "off",
    "no-shadow": "off",
    "no-continue": "off",
    "import/no-extraneous-dependencies": "off",
    camelcase: "off",
    "no-bitwise": "off",
    "no-empty": "off",
    "no-undef": "off",
    "no-useless-escape": "off",
    "func-names": "off",
    "no-unused-expressions": "off",
    "no-underscore-dangle": "off",
    "default-case": "off",
    "no-async-promise-executor": "off",
    "prefer-destructuring": "off",
    "max-classes-per-file": "off",
    "no-empty-pattern": "off",
    "prefer-promise-reject-errors": "off",
    "class-methods-use-this": "off",
    "no-empty-function": "off",
    "implicit-arrow-linebreak": "off",
    "no-warning-comments": IS_PROD ? "error" : "warn",
    // These rules fight with prettier
    quotes: "off",
    "object-curly-newline": "off",
    "comma-dangle": "off",
    indent: "off",
    "operator-linebreak": "off",
    "function-paren-newline": "off",
  },

  extends: ["plugin:vue/essential", "@vue/typescript", "@vue/airbnb"],

  overrides: [
    {
      files: ["**/*.spec.ts", "src/test/utils/mocks.ts"],
      env: {
        jest: true,
      },
    },
  ],

  ignorePatterns: ["webpack.config.js"],
};
