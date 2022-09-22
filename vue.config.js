// Created with
// https://github.com/adambullmer/vue-cli-plugin-browser-extension
module.exports = {
  filenameHashing: false,
  configureWebpack: {
    devtool: "source-map",
  },
  pages: {
    popup: {
      template: "public/browser-extension.html",
      entry: "./src/popup/main.ts",
      title: "Track and Trace Tools Menu",
    },
    // options: {
    //   template: 'public/browser-extension.html',
    //   entry: './src/options/main.js',
    //   title: 'Options',
    // },
    // override: {
    //   template: 'public/browser-extension.html',
    //   entry: './src/override/main.js',
    //   title: 'Override',
    // },
    standalone: {
      template: "public/browser-extension.html",
      entry: "./src/standalone/main.ts",
      title: "Track and Trace Tools",
      filename: "index.html",
    },
    // devtools: {
    //   template: 'public/browser-extension.html',
    //   entry: './src/devtools/main.js',
    //   title: 'Devtools',
    // },
  },
  pluginOptions: {
    browserExtension: {
      manifestTransformer: (manifest) => {
        if (process.env.NODE_ENV === "development") {
          manifest.content_scripts[0].css.pop();
        }
        return manifest;
      },
      componentOptions: {
        background: {
          entry: "src/background.ts",
        },
        contentScripts: {
          entries: {
            "content-script": ["src/content-scripts/content-script.ts"],
            // "load-script": ["src/content-scripts/load-script.ts"],
            // 'worker': [
            //   'src/content-scripts/worker.ts',
            // ],
          },
        },
      },
    },
  },
};
