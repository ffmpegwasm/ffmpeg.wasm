const TIMEOUT = 60000;
const BASE_URL = 'http://localhost:3000/tests/assets';
const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const OPTIONS = {
  corePath: 'http://localhost:3000/node_modules/@ffmpeg/core/ffmpeg-core.js',
};
const FLAME_MP4_LENGTH = 100374;
const META_FLAME_MP4_LENGTH = 100408;
const META_FLAME_MP4_LENGTH_NO_SPACE = 100404;

if (typeof module !== 'undefined') {
  module.exports = {
    TIMEOUT,
    BASE_URL,
    IS_BROWSER,
    OPTIONS,
    FLAME_MP4_LENGTH,
    META_FLAME_MP4_LENGTH,
    META_FLAME_MP4_LENGTH_NO_SPACE,
  };
}
