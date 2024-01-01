module.exports = {
  purge: {
    content: ["./public/**/*.html", "./src/**/*.vue"],
    // Whitelist selectors by using regular expression
    whitelistPatterns: [
      /-(leave|enter|appear)(|-(to|from|active))$/, // transitions
      /data-v-.*/, // scoped css
    ],
  },
  presets: [],
  darkMode: false, // or 'media' or 'class'
  theme: {},
  plugins: [],
};
