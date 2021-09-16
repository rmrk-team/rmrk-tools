const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
      process: path.resolve("node_modules/process/browser.js"),
    }),
  ],
  externals: {
    crypto: "crypto",
    url: "url",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    path: path.resolve(__dirname, "../browser"),
    filename: "rmrk-tools.js",
    library: "rmrkTools",
    libraryTarget: "umd",
  },
};
