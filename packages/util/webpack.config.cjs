const path = require("path");

module.exports = {
  mode: "production",
  entry: "./dist/esm/index.js",
  output: {
    library: "FFmpegUtil",
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "umd"),
  },
};
