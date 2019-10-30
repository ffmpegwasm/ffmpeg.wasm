const path = require('path');
const webpack = require('webpack');
const common = require('./webpack.config.common');

const genConfig = ({
  entry, filename, library, libraryTarget,
}) => ({
  ...common,
  mode: 'development',
  entry,
  output: {
    filename,
    library,
    libraryTarget,
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        FFMPEG_ENV: JSON.stringify('development'),
      },
    }),
  ],
  devServer: {
    allowedHosts: ['localhost', '.gitpod.io'],
  },
});

module.exports = [
  genConfig({
    entry: path.resolve(__dirname, '..', 'src', 'index.js'),
    filename: 'ffmpeg.dev.js',
    library: 'FFmpeg',
    libraryTarget: 'umd',
  }),
  genConfig({
    entry: path.resolve(__dirname, '..', 'src', 'worker-script', 'browser', 'index.js'),
    filename: 'worker.dev.js',
  }),
];
