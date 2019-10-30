const resolveURL = require('resolve-url');
const { version, dependencies } = require('../../../package.json');
const defaultOptions = require('../../constants/defaultOptions');

/*
 * Default options for browser worker
 */
module.exports = {
  ...defaultOptions,
  workerPath: (typeof process !== 'undefined' && process.env.FFMPEG_ENV === 'development')
    ? resolveURL(`/dist/worker.dev.js?nocache=${Math.random().toString(36).slice(3)}`)
    : `https://unpkg.com/@ffmpeg/ffmpeg@v${version}/dist/worker.min.js`,
  corePath: `https://unpkg.com/@ffmpeg/core@v${dependencies['@ffmpeg/core'].substring(1)}/ffmpeg-core.js`,
  workerBlobURL: true,
};
