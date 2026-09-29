import "./globals.js";
import "../worker.js";
import { parentPort } from "node:worker_threads";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { FFMessageEvent, FFMessageLoadConfig } from "../types.js";
import { FFMessageType } from "../const.js";

const scope = globalThis as unknown as { onmessage: (event: { data: unknown }) => void };

const defaultCoreURL = () => {
  const umd = createRequire(import.meta.url).resolve("@ffmpeg/core");
  return pathToFileURL(umd.replace(/[\\/]umd[\\/]/, "/esm/")).href;
};

// Paths (including Windows ones) become file: URLs, which is what import()
// and emscripten expect (#438).
const toURL = (pathOrURL: string) =>
  /^(file|https?|data|blob):/i.test(pathOrURL) ? pathOrURL : pathToFileURL(pathOrURL).href;

parentPort!.on("message", (data: FFMessageEvent["data"]) => {
  if (data.type === FFMessageType.LOAD) {
    const { coreURL, wasmURL, ...config } = (data.data ?? {}) as FFMessageLoadConfig;
    data.data = {
      ...config,
      coreURL: coreURL ? toURL(coreURL) : defaultCoreURL(),
      ...(wasmURL && { wasmURL: toURL(wasmURL) }),
    };
  }
  scope.onmessage({ data });
});
