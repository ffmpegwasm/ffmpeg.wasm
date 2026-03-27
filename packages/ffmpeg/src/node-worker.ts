/**
 * Node.js worker thread script for ffmpeg.wasm.
 *
 * This is the Node.js equivalent of worker.ts, using `worker_threads.parentPort`
 * instead of the Web Worker `self.onmessage` / `self.postMessage` API.
 *
 * The message protocol is identical to the browser worker — the FFmpeg class
 * in node-classes.ts sends the same { id, type, data } messages and expects
 * the same responses. This keeps the two implementations interchangeable.
 */

import { parentPort } from "node:worker_threads";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { FFmpegCoreModule, FFmpegCoreModuleFactory } from "@ffmpeg/types";
import type {
  FFMessageLoadConfig,
  FFMessageExecData,
  FFMessageWriteFileData,
  FFMessageReadFileData,
  FFMessageDeleteFileData,
  FFMessageRenameData,
  FFMessageCreateDirData,
  FFMessageListDirData,
  FFMessageDeleteDirData,
  FFMessageMountData,
  FFMessageUnmountData,
  CallbackData,
  IsFirst,
  OK,
  ExitCode,
  FSNode,
  FileData,
} from "./types.js";
import { CORE_URL, FFMessageType } from "./const.js";
import {
  ERROR_UNKNOWN_MESSAGE_TYPE,
  ERROR_NOT_LOADED,
  ERROR_IMPORT_FAILURE,
} from "./errors.js";

if (!parentPort) {
  throw new Error("node-worker.ts must be run inside a worker_threads Worker");
}

const port = parentPort;

let ffmpeg: FFmpegCoreModule;

/**
 * Load the ffmpeg-core WASM module in Node.js.
 *
 * Unlike the browser worker which uses importScripts() or dynamic import()
 * with CDN URLs, the Node.js version:
 * 1. Tries dynamic import() for the core module (works with npm-installed @ffmpeg/core)
 * 2. Falls back to reading a local .js file and evaluating it
 * 3. Constructs the WASM module with file:// URLs instead of blob: URLs
 */
const load = async ({
  coreURL: _coreURL,
  wasmURL: _wasmURL,
  workerURL: _workerURL,
}: FFMessageLoadConfig): Promise<IsFirst> => {
  const first = !ffmpeg;

  let createFFmpegCore: FFmpegCoreModuleFactory;

  try {
    if (!_coreURL) {
      // In Node.js, default to requiring the npm package directly
      const imported = await import(/* webpackIgnore: true */ "@ffmpeg/core");
      createFFmpegCore = imported.default || imported;
    } else if (_coreURL.startsWith("http://") || _coreURL.startsWith("https://")) {
      // Remote URL — fetch and evaluate (Node 18+ has native fetch)
      const response = await fetch(_coreURL);
      const text = await response.text();
      // Use Function constructor to evaluate in a clean scope
      const fn = new Function("module", "exports", text);
      const mod = { exports: {} as Record<string, unknown> };
      fn(mod, mod.exports);
      createFFmpegCore = (mod.exports.default || mod.exports) as FFmpegCoreModuleFactory;
    } else {
      // Local file path — use dynamic import with file:// URL
      const fileUrl = _coreURL.startsWith("file://") ? _coreURL : pathToFileURL(_coreURL).href;
      const imported = await import(/* webpackIgnore: true */ fileUrl);
      createFFmpegCore = imported.default || imported;
    }
  } catch (e) {
    throw ERROR_IMPORT_FAILURE;
  }

  if (!createFFmpegCore) {
    throw ERROR_IMPORT_FAILURE;
  }

  // Resolve wasmURL relative to coreURL
  const coreURL = _coreURL || "";
  const wasmURL = _wasmURL
    ? _wasmURL
    : coreURL
      ? coreURL.replace(/.js$/g, ".wasm")
      : undefined;
  const workerURL = _workerURL
    ? _workerURL
    : coreURL
      ? coreURL.replace(/.js$/g, ".worker.js")
      : undefined;

  // Build the locateFile configuration.
  // Emscripten's mainScriptUrlOrBlob hack encodes URLs in base64 — we replicate
  // the same mechanism so the core module can find its .wasm and .worker.js files.
  const config: Record<string, unknown> = {};
  if (wasmURL || workerURL) {
    config.mainScriptUrlOrBlob = `${coreURL}#${Buffer.from(
      JSON.stringify({ wasmURL, workerURL })
    ).toString("base64")}`;
  }

  ffmpeg = await createFFmpegCore(config);
  ffmpeg.setLogger((data: unknown) =>
    port.postMessage({ type: FFMessageType.LOG, data })
  );
  ffmpeg.setProgress((data: unknown) =>
    port.postMessage({ type: FFMessageType.PROGRESS, data })
  );
  return first;
};

const exec = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const ffprobe = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.ffprobe(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const writeFile = ({ path, data }: FFMessageWriteFileData): OK => {
  ffmpeg.FS.writeFile(path, data);
  return true;
};

const readFile = ({ path, encoding }: FFMessageReadFileData): FileData =>
  ffmpeg.FS.readFile(path, { encoding });

const deleteFile = ({ path }: FFMessageDeleteFileData): OK => {
  ffmpeg.FS.unlink(path);
  return true;
};

const rename = ({ oldPath, newPath }: FFMessageRenameData): OK => {
  ffmpeg.FS.rename(oldPath, newPath);
  return true;
};

const createDir = ({ path }: FFMessageCreateDirData): OK => {
  ffmpeg.FS.mkdir(path);
  return true;
};

const listDir = ({ path }: FFMessageListDirData): FSNode[] => {
  const names = ffmpeg.FS.readdir(path);
  const nodes: FSNode[] = [];
  for (const name of names) {
    const stat = ffmpeg.FS.stat(`${path}/${name}`);
    const isDir = ffmpeg.FS.isDir(stat.mode);
    nodes.push({ name, isDir });
  }
  return nodes;
};

const deleteDir = ({ path }: FFMessageDeleteDirData): OK => {
  ffmpeg.FS.rmdir(path);
  return true;
};

const mount = ({ fsType, options, mountPoint }: FFMessageMountData): OK => {
  const str = fsType as keyof typeof ffmpeg.FS.filesystems;
  const fs = ffmpeg.FS.filesystems[str];
  if (!fs) return false;
  ffmpeg.FS.mount(fs, options, mountPoint);
  return true;
};

const unmount = ({ mountPoint }: FFMessageUnmountData): OK => {
  ffmpeg.FS.unmount(mountPoint);
  return true;
};

/**
 * Message handler — mirrors the browser worker.ts self.onmessage handler.
 * Same message types, same response format, just different transport.
 */
port.on("message", async ({ id, type, data: _data }: { id: number; type: string; data: unknown }) => {
  const trans: ArrayBuffer[] = [];
  let data: CallbackData;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED;

    switch (type) {
      case FFMessageType.LOAD:
        data = await load(_data as FFMessageLoadConfig);
        break;
      case FFMessageType.EXEC:
        data = exec(_data as FFMessageExecData);
        break;
      case FFMessageType.FFPROBE:
        data = ffprobe(_data as FFMessageExecData);
        break;
      case FFMessageType.WRITE_FILE:
        data = writeFile(_data as FFMessageWriteFileData);
        break;
      case FFMessageType.READ_FILE:
        data = readFile(_data as FFMessageReadFileData);
        break;
      case FFMessageType.DELETE_FILE:
        data = deleteFile(_data as FFMessageDeleteFileData);
        break;
      case FFMessageType.RENAME:
        data = rename(_data as FFMessageRenameData);
        break;
      case FFMessageType.CREATE_DIR:
        data = createDir(_data as FFMessageCreateDirData);
        break;
      case FFMessageType.LIST_DIR:
        data = listDir(_data as FFMessageListDirData);
        break;
      case FFMessageType.DELETE_DIR:
        data = deleteDir(_data as FFMessageDeleteDirData);
        break;
      case FFMessageType.MOUNT:
        data = mount(_data as FFMessageMountData);
        break;
      case FFMessageType.UNMOUNT:
        data = unmount(_data as FFMessageUnmountData);
        break;
      default:
        throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
  } catch (e) {
    port.postMessage({
      id,
      type: FFMessageType.ERROR,
      data: (e as Error).toString(),
    });
    return;
  }
  if (data instanceof Uint8Array) {
    trans.push(data.buffer);
  }
  port.postMessage({ id, type, data }, trans);
});
