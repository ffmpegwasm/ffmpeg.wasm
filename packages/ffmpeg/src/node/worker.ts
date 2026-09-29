import "./globals.js";
import "../worker.js";
import { parentPort } from "node:worker_threads";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { FFMessageEvent, FFMessageLoadConfig } from "../types.js";

const scope = globalThis as unknown as { onmessage: (event: { data: unknown }) => void };

const defaultCoreURL = () => {
  const umd = createRequire(import.meta.url).resolve("@ffmpeg/core");
  return pathToFileURL(umd.replace(/[\\/]umd[\\/]/, "/esm/")).href;
};

parentPort!.on("message", (data: FFMessageEvent["data"]) => {
  if (data.type === "LOAD") {
    const config = (data.data ?? {}) as FFMessageLoadConfig;
    data.data = { ...config, coreURL: config.coreURL ?? defaultCoreURL() };
  }
  scope.onmessage({ data });
});
