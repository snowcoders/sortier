import HTMLWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import * as webpack from "webpack";
import "webpack-dev-server";
import ResolveTypeScriptPlugin from "resolve-typescript-plugin";

/**
    @type {webpack.Configuration}
*/
const config = (env, argv) => {
  const isProduction = argv.mode === "production";
  const fileName = isProduction ? "[name].[contenthash]" : "[name]";

  return {
    devServer: {
      port: 3001,
    },
    node: {
      global: false,
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
      ],
    },
    output: {
      chunkFilename: `${fileName}.js`,
      filename: `${fileName}.js`,
      path: path.resolve("../playground"),
      publicPath: "/playground/",
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
    ],
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      alias: {
        cosmiconfig: false,
        "find-up": false,
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
      fallback: {
        "fast-glob": false,
        fs: false,
        browser: false,
        os: false,
        "os-browserify": false,
        path: false,
        process: false,
        stream: false,
        util: false,
        events: false,
        constants: false,
        "node:fs": false,
        "node:browser": false,
        "node:os": false,
        "node:path": false,
        "node:process": false,
        "node:stream": false,
        "node:util": false,
        "node:events": false,
        "node:constants": false,
      },
    },
    target: "web",
  };
};

export default config;
