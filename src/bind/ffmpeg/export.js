// The wasm functions bind.js calls.
const EXPORTED_FUNCTIONS = ["_run_ffmpeg", "_run_ffprobe", "_set_max_threads"];

console.log(EXPORTED_FUNCTIONS.join(","));
