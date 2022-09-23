const path = require("path");

module.exports = {
  mode: "production",
  entry: "./dist/cjs/index.js",
  output: {
    library: "FFmpegUtil",
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "umd"),
  },
};
