const resolveURL = require('resolve-url');
const { devDependencies } = require('../../package.json');

/*
 * Default options for browser environment
 */
module.exports = {
  corePath: process.env.NODE_ENV === 'development'
    ? resolveURL('/node_modules/@ffmpeg/core/dist/ffmpeg-core.js')
    : `https://unpkg.com/@ffmpeg/core@${devDependencies['@ffmpeg/core'].substring(1)}/dist/ffmpeg-core.js`,
};
