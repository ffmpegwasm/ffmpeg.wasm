/**
 * Node.js entry point for @ffmpeg/ffmpeg.
 *
 * Previously this file threw an error ("ffmpeg.wasm does not support nodejs").
 * Now it re-exports the Node.js FFmpeg class which uses worker_threads
 * to run ffmpeg-core in a background thread, keeping the same API
 * as the browser version.
 *
 * @see node-classes.ts for the implementation
 * @see https://github.com/ffmpegwasm/ffmpeg.wasm/issues/897
 */

export { FFmpeg } from "./node-classes.js";
export * from "./types.js";
export * from "./const.js";
