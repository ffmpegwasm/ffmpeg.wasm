const TIMEOUT = 60000;
const BASE_URL = 'http://localhost:3000/tests/assets';
const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const OPTIONS = {
  corePath: '../node_modules/@ffmpeg/core/ffmpeg-core.js',
};

if (typeof module !== 'undefined') {
  module.exports = {
    TIMEOUT,
    BASE_URL,
    IS_BROWSER,
    OPTIONS,
  };
}
