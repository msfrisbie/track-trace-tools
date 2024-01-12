const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// https://webpack.js.org/configuration/
module.exports = (env, argv) => {
  const isDevelopment = argv.mode === "development";
  const isCircleCI = process.env.CIRCLECI === "true";

  const config = {
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
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parallel: false,
            sourceMap: false, // Set to false if you don't need source maps
            compress: {
              drop_console: true,
              // Other compress options here
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
  };

  return config;
};
