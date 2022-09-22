// const path = require('path');
// const GoogleFontsPlugin = require("google-fonts-webpack-plugin");

const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

// https://webpack.js.org/configuration/
module.exports = {
  // "entry": "index.js",
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: "initial",
          test: path.resolve(process.cwd(), "node_modules"),
          name: "vendor",
          enforce: true,
        },
      },
    },
    // Based on this: https://stackoverflow.com/questions/50544207/webpack-final-bundle-size-is-too-big
    //
    // There is further optimization to be had. One of these commented optimizations breaks the production build,
    // need to test which one it is
    minimizer: [
      new UglifyJsPlugin({
        uglifyOptions: {
          sourceMap: true,
          compress: {
            drop_console: true,
            // conditionals: true,
            unused: true,
            // comparisons: true,
            // dead_code: true,
            // if_return: true,
            // join_vars: true,
            // warnings: false
          },
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  module: {
    plugins: [
      new MiniCssExtractPlugin({
        filename: "[name].css",
        chunkFilename: "[id].css",
      }),
    ],
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          appendTsSuffixTo: [/\.vue$/],
        },
        exclude: /node_modules/,
      },
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
    ],
  },
  configureWebpack: (config) => {
    config.module.rules = [
      {
        test: /\.worker\.js$/i,
        use: [
          {
            loader: "comlink-loader",
            options: {
              singleton: true,
            },
          },
        ],
      },
      ...config.module.rules,
    ];
  },
  resolve: {
    alias: {
      "%": path.resolve("test"),
    },
  },
  // https://newbedev.com/how-do-i-add-a-google-font-to-a-vuejs-component
  // plugins: [
  //   new GoogleFontsPlugin({
  //     fonts: [
  //       { family: "Source Sans Pro" },
  //       { family: "Roboto", variants: ["400", "700italic"] }
  //     ]
  //     /* ...options */
  //   })
  // ]
};
