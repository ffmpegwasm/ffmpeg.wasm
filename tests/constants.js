const TIMEOUT = 30000;
const BASE_URL = 'http://localhost:3000/tests/assets';
const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';
const OPTIONS = {
  corePath: '../node_modules/@ffmpeg/core/ffmpeg-core.js',
  ...(IS_BROWSER ? { workerPath: '../dist/worker.dev.js' } : {}),
  logger: ({ message }) => console.log(message),
};
const FLAME_MP4_LENGTH = 100374;
const META_FLAME_MP4_LENGTH = 100408;

if (typeof module !== 'undefined') {
  module.exports = {
    TIMEOUT,
    BASE_URL,
    IS_BROWSER,
    OPTIONS,
    FLAME_MP4_LENGTH,
    META_FLAME_MP4_LENGTH,
  };
}
