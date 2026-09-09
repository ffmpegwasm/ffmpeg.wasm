const path = require("path");
const webpack = require("webpack");

const UMD_WORKER_TYPE = "classic";

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: "./dist/esm/index.js",
  resolve: {
    extensions: [".js"],
  },
  output: {
    path: path.resolve(__dirname, "dist/umd"),
    filename: "ffmpeg.js",
    library: "FFmpegWASM",
    libraryTarget: "umd",
  },
  stats: {
    warnings: false,
  },
  plugins: [
    new webpack.DefinePlugin({
      __FFMPEG_WORKER_TYPE__: JSON.stringify(UMD_WORKER_TYPE),
    }),
  ],
};
