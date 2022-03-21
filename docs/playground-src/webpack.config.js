/* eslint-disable */
const HTMLWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const ResolveTypeScriptPlugin = require("resolve-typescript-plugin");
const webpack = require("webpack");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const config = (env, argv) => {
  const isWebpackServe = !!argv.env.WEBPACK_SERVE;
  const isProduction = argv.mode === "production";
  const fileName = isProduction ? "[name].[contenthash]" : "[name]";

  return {
    devServer: {
      port: 3001,
    },
    entry: { app: "./src/index" },
    module: {
      rules: [
        { test: /\.svg$/, type: "asset" },
        { test: /\.tsx?$/, use: "ts-loader" },
        {
          sideEffects: true,
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            "css-loader",
            {
              loader: "postcss-loader",
            },
          ],
        },
        {
          test: /\.txt/,
          type: "asset/source",
        },
        {
          test: /\.json/,
          type: "asset/source",
        },
      ],
    },
    node: {
      global: false,
    },
    optimization: {
      chunkIds: isProduction ? undefined : "named",
    },
    output: {
      chunkFilename: `${fileName}.js`,
      filename: `${fileName}.js`,
      path: path.resolve("../playground"),
      publicPath: isWebpackServe ? "/" : "/playground/",
    },
    plugins: [
      new MiniCssExtractPlugin({
        chunkFilename: `${fileName}.css`,
        filename: `${fileName}.css`,
      }),
      new HTMLWebpackPlugin({
        chunks: "app",
        favicon: "../favicon.svg",
        filename: "index.html",
        template: "./src/index.html",
      }),
      // new BundleAnalyzerPlugin({
      //   openAnalyzer: false,
      // }),
    ],
    resolve: {
      alias: {
        // npm packages we have no use for in the browser
        cosmiconfig: false,
        "find-up": false,

        // Low usage for flow, I'm not including it
        "fast-glob": false,
        "flow-parser": false,

        // Reducing typescript-eslint because it's huge
        "./create-program/createIsolatedProgram": false,
        "./create-program/createProjectProgram": false,
        "./create-program/createWatchProgram": false,

        // Mock out typescript because it's 10mb
        globby: false,
        path: path.resolve(".", "mocks", "path.ts"),
        semver$: path.resolve(".", "mocks", "semver.ts"),
        "semver-major": "semver/functions/major",
        "semver-satisfies": "semver/functions/satisfies",
        typescript: path.resolve(".", "mocks", "typescript.js"),
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
      fallback: {
        // Node specific overrides
        browser: false,
        constants: false,
        events: false,
        fs: false,
        "node:browser": false,
        "node:constants": false,
        "node:events": false,
        "node:fs": false,
        "node:os": false,
        "node:path": false,
        "node:process": false,
        "node:stream": false,
        "node:util": false,
        os: false,
        "os-browserify": false,
        path: false,
        process: false,
        stream: false,
        util: false,
      },
      plugins: [new ResolveTypeScriptPlugin()],
    },
    target: "web",
  };
};

module.exports = config;
