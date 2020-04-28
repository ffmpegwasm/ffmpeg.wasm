const resolveURL = require('resolve-url');
const { dependencies } = require('../../package.json');
const defaultOptions = require('../constants/defaultOptions');

/*
 * Default options for browser worker
 */
module.exports = {
  ...defaultOptions,
  corePath: (typeof process !== 'undefined' && process.env.FFMPEG_ENV === 'development')
    ? resolveURL('/node_modules/@ffmpeg/core/ffmpeg-core.js')
    : `https://unpkg.com/@ffmpeg/core@v${dependencies['@ffmpeg/core'].substring(1)}/ffmpeg-core.js`,
};
