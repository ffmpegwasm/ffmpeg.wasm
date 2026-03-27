/**
 * Node.js-specific utilities for @ffmpeg/util.
 *
 * Provides the same `fetchFile` and `toBlobURL` APIs as the browser version,
 * but implemented with Node.js built-in modules (fs, Buffer, fetch).
 *
 * Usage:
 * ```ts
 * // In Node.js, import from the /node subpath:
 * import { fetchFile } from "@ffmpeg/util/node";
 *
 * // Or just use the main import — it works in Node 18+ where fetch() is global.
 * import { fetchFile } from "@ffmpeg/util";
 * ```
 *
 * @see https://github.com/ffmpegwasm/ffmpeg.wasm/issues/897
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

/**
 * Fetch file data from various sources in Node.js.
 *
 * Supports:
 * - Local file paths: "/path/to/video.mp4"
 * - Remote URLs: "https://example.com/video.mp4"
 * - Base64 data URIs: "data:video/mp4;base64,..."
 * - Buffer objects
 * - Uint8Array objects
 *
 * Returns a Uint8Array suitable for ffmpeg.writeFile().
 */
export const fetchFile = async (
  file?: string | Buffer | Uint8Array
): Promise<Uint8Array> => {
  if (!file) return new Uint8Array();

  // Already binary data — return as Uint8Array
  if (file instanceof Uint8Array) {
    return file;
  }
  if (Buffer.isBuffer(file)) {
    return new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
  }

  if (typeof file === "string") {
    // Base64 data URI
    if (/^data:/.test(file)) {
      const base64 = file.split(",")[1];
      if (!base64) return new Uint8Array();
      return new Uint8Array(Buffer.from(base64, "base64"));
    }

    // Remote URL
    if (file.startsWith("http://") || file.startsWith("https://")) {
      const response = await fetch(file);
      return new Uint8Array(await response.arrayBuffer());
    }

    // Local file path
    if (existsSync(file)) {
      const buffer = await readFile(file);
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }

    // Try as URL (e.g., file:// protocol)
    try {
      const response = await fetch(file);
      return new Uint8Array(await response.arrayBuffer());
    } catch {
      throw new Error(`Cannot read file: ${file}`);
    }
  }

  return new Uint8Array();
};

/**
 * In Node.js, toBlobURL isn't needed (no browser security model requiring
 * blob URLs). This function fetches the URL and returns it as-is for
 * compatibility with browser code that calls toBlobURL.
 *
 * For Node.js, the core module is loaded via require() or dynamic import(),
 * so blob URLs are unnecessary. This function exists purely for API
 * compatibility so that code written for the browser doesn't break.
 */
export const toBlobURL = async (
  url: string,
  _mimeType: string,
  _progress = false,
  _cb?: unknown
): Promise<string> => {
  // In Node.js, just return the URL as-is — the Node.js FFmpeg loader
  // handles file:// URLs and npm package paths directly.
  return url;
};
