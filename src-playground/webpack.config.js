/* eslint-disable */
import { globbySync } from "globby";
import HTMLWebpackPlugin from "html-webpack-plugin";
import MonacoWebpackPlugin from "monaco-editor-webpack-plugin";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import path from "path";
import webpack from "webpack";
import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { NormalModuleReplacementPlugin } = webpack;

// The "mocks" folder creates stubs for node_module dependencies. We hack in our own
// files so that we can remove deeper dependencies like path, globby, fast-glob, and more
const mockNodeModuleData = globbySync("./mocks/**/*.js").map((relativeFilePath) => {
  const nodeModuleSubPath = relativeFilePath.slice("./mocks/".length);
  let filePathForOS = nodeModuleSubPath;

  // Handle windows vs osx
  if (path.sep === "\\") {
    filePathForOS = filePathForOS.split("/").join("\\\\");
  }
  const regex = new RegExp(filePathForOS);
  const mockOsCompatiblePath = path.resolve(__dirname, relativeFilePath);

  return {
    mockOsCompatiblePath,
    nodeModuleSubPath,
    regex,
  };
});

// The "mocks" folder creates stubs for node API dependencies
const mockNodeApiData = globbySync("./mocks/*.(j|t)s").map((relativeFilePath) => {
  const nodeModuleSubPath = relativeFilePath.slice("./mocks/".length);
  const packagename = nodeModuleSubPath.slice(0, nodeModuleSubPath.lastIndexOf("."));

  const mockOsCompatiblePath = path.resolve(__dirname, relativeFilePath);

  return {
    mockOsCompatiblePath,
    packagename,
  };
});
const config_resolve_fallback = mockNodeApiData
  .map((value) => {
    const { mockOsCompatiblePath, packagename } = value;
    return {
      [`node:${packagename}`]: mockOsCompatiblePath,
      [packagename]: mockOsCompatiblePath,
    };
  })
  .reduce((result, current) => {
    return Object.assign(result, current);
  }, {});

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
    entry: {
      app: "./src/index",
    },
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
      // Apply node_module overrides defined in the mocks folder
      ...mockNodeModuleData.map((file) => {
        const { mockOsCompatiblePath, regex } = file;
        return new NormalModuleReplacementPlugin(regex, mockOsCompatiblePath);
      }),
      new MonacoWebpackPlugin(),
      new HTMLWebpackPlugin({
        chunks: ["app"],
        filename: "index.html",
        template: "./src/index.html",
        templateParameters: {
          docSiteAssetRelativePath: "..",
          docSiteRoot: docSiteRoot,
        },
      }),
      new BundleAnalyzerPlugin({
        analyzerMode: isProduction ? "disabled" : "static",
        openAnalyzer: false,
      }),
    ],
    resolve: {
      extensionAlias: {
        ".js": [".ts", ".js"],
        ".mjs": [".mts", ".mjs"],
      },
      extensions: [".ts", ".tsx", ".js", ".jsx", ".html"],
      fallback: {
        // Apply Node API overrides defined in the mocks folder
        ...config_resolve_fallback,
      },
    },
    target: "web",
  };
};

export default config;
