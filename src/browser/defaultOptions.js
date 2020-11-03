const resolveURL = require('resolve-url');
const { devDependencies } = require('../../package.json');

/*
 * Default options for browser environment
 */
module.exports = {
  corePath: (typeof process !== 'undefined' && process.env.FFMPEG_ENV === 'development')
    ? resolveURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.js')
    : `https://unpkg.com/@ffmpeg/core@v${devDependencies['@ffmpeg/core'].substring(1)}/ffmpeg-core.js`,
};
