/* eslint-disable */
const HTMLWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

/**
 *
 * @param {*} env
 * @param {*} argv
 * @returns {import("webpack-dev-server").WebpackConfiguration}
 */
const config = (env, argv) => {
  const isWebpackServe = !!argv.env.WEBPACK_SERVE;
  const isWebpackWatch = !!argv.env.WEBPACK_WATCH;
  const isProduction = argv.mode === "production";
  const fileName = isProduction ? "[name].[contenthash]" : "[name]";
  const docSiteRoot = isWebpackServe || isWebpackWatch ? "/" : "/sortier/";

  return {
    devServer: {
      port: 3001,
    },
    devtool: isProduction ? false : "inline-source-map",
    entry: { app: "./src/index" },
    module: {
      rules: [
        {
          loader: "ts-loader",
          options: {
            compilerOptions: {
              sourceMap: !isProduction,
            },
          },
          test: /\.tsx?$/,
        },
        {
          test: /\.txt$/,
          type: "asset/source",
        },
        {
          test: /\.json$/,
          type: "asset/source",
        },
        {
          sideEffects: true,
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.ttf$/,
          type: "asset/resource",
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
      path: path.resolve("../docs/playground"),
      publicPath: `${docSiteRoot}playground/`,
    },
    plugins: [
      new MonacoWebpackPlugin(),
      new HTMLWebpackPlugin({
        chunks: "app",
        filename: "index.html",
        template: "./src/index.html",
        templateParameters: {
          docSiteAssetRelativePath: "..",
          docSiteRoot: docSiteRoot,
        },
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
      extensionAlias: {
        ".js": [".ts", ".js"],
        ".mjs": [".mts", ".mjs"],
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
    },
    target: "web",
  };
};

module.exports = config;
