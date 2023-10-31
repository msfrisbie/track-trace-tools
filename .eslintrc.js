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
    // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    "no-console": "off",
    "prefer-const": "warn",
    "no-var": "off",
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
    "guard-for-in": "off",
    "brace-style": "off",
    "no-throw-literal": "off",
    quotes: "off",
    "operator-linebreak": "off",
    "comma-dangle": "off",
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