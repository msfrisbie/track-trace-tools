// https://vue-test-utils.vuejs.org/guides/using-with-typescript.html
module.exports = {
  // preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: [
    "js",
    "ts",
    "json",
    // tell Jest to handle `*.vue` files
    "vue",
  ],
  transform: {
    // process `*.vue` files with `vue-jest`
    ".*\\.(vue)$": "vue-jest",
    "^.+\\.tsx?$": "ts-jest",
  },
  testURL: "http://localhost/",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/jest/envVars.js"],
  setupFilesAfterEnv: ["<rootDir>/jest/jest.setup.js"],
};
