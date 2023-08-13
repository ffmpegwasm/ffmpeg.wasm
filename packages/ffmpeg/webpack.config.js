const path = require("path");

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
};
