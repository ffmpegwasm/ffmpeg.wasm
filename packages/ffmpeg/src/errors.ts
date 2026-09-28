export const ERROR_UNKNOWN_MESSAGE_TYPE = new Error("unknown message type");
export const ERROR_NOT_LOADED = new Error(
  "ffmpeg is not loaded, call `await ffmpeg.load()` first"
);
export const ERROR_TERMINATED = new Error("called FFmpeg.terminate()");
export const ERROR_IMPORT_FAILURE = new Error(
  "failed to import ffmpeg-core.js"
);
export const ERROR_NOT_ISOLATED = new Error(
  "@ffmpeg/core-mt needs SharedArrayBuffer: serve the page with the headers Cross-Origin-Opener-Policy: same-origin and Cross-Origin-Embedder-Policy: require-corp (or credentialless), or use the single-threaded @ffmpeg/core"
);
export const ERROR_WORKER = new Error(
  "ffmpeg worker failed, most likely its script could not be loaded (network, CORS/CORP or 404)"
);
export const ERROR_CRASHED = new Error("ffmpeg-core crashed; call load() to start a new one");
