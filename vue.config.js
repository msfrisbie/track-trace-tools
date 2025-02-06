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
      entry: "./src/options/main.ts",
      title: "Track and Trace Tools",
      filename: "index.html",
    },
    // print: {
    //   template: "public/browser-extension.html",
    //   entry: "./src/print/main.ts",
    //   title: "Track and Trace Tools",
    //   filename: "print.html",
    // },
    // devtools: {
    //   template: 'public/browser-extension.html',
    //   entry: './src/devtools/main.js',
    //   title: 'Devtools',
    // },
  },
  pluginOptions: {
    browserExtension: {
      manifestTransformer: (manifest) => {
        console.log(manifest.content_scripts);
        if (process.env.NODE_ENV === "development") {
          manifest.content_scripts[0].css.pop();
          // manifest.content_scripts.pop();
        } else {
          manifest.content_scripts[0].css.push("css/content-script.css");
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
            "main-script": ["src/content-scripts/main-script.ts"],
            "load-script": ["src/content-scripts/load-script.ts"],
            // 'worker': [
            //   'src/content-scripts/worker.ts',
            // ],
          },
        },
      },
    },
  },
};
