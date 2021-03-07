const path = require("path");
const webpack = require("webpack");
const config = require("./webpack.config.umd");

module.exports = {
  ...config,
  entry: "./browser/polkadot-utils.ts",
  output: {
    path: path.resolve(__dirname, "../browser"),
    filename: "polkadot-utils.js",
    library: "polkadotUtils",
    libraryTarget: "umd",
  },
};
