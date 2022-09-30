const path = require("path");

module.exports = {
  mode: "production",
  devtool: "source-map",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          transpileOnly: false,
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts"],
  },
  output: {
    path: path.resolve(__dirname, "dist/umd"),
    filename: "ffmpeg.js",
    library: "FFmpegWASM",
    libraryTarget: "umd",
  },
};
