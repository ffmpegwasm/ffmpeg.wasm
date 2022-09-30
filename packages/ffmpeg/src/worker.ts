/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { FFmpegCoreModule, FFmpegCoreModuleFactory } from "@ffmpeg/types";
import type {
  FFMessageEvent,
  FFMessageLoadConfig,
  FFMessageWriteFileData,
  FFMessageExecData,
  FFMessageReadFileData,
  CallbackData,
  IsFirst,
  IsDone,
  ExitCode,
} from "./types";
import { toBlobURL } from "./utils";
import {
  CORE_URL,
  FFMessageType,
  MIME_TYPE_JAVASCRIPT,
  MIME_TYPE_WASM,
} from "./const";
import { ERROR_UNKNOWN_MESSAGE_TYPE, ERROR_NOT_LOADED } from "./errors";

declare global {
  interface WorkerGlobalScope {
    createFFmpegCore: FFmpegCoreModuleFactory;
  }
}

let ffmpeg: FFmpegCoreModule;

const load = async ({
  coreURL: _coreURL = CORE_URL,
  wasmURL: _wasmURL,
  workerURL: _workerURL,
  blob = true,
  thread = false,
}: FFMessageLoadConfig): Promise<IsFirst> => {
  const first = !ffmpeg;
  let coreURL = _coreURL;
  let wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, ".wasm");
  let workerURL = _workerURL
    ? _workerURL
    : _coreURL.replace(/.js$/g, ".worker.js");

  if (blob) {
    coreURL = await toBlobURL(coreURL, MIME_TYPE_JAVASCRIPT, (data) =>
      self.postMessage({ type: FFMessageType.DOWNLOAD, data })
    );
    wasmURL = await toBlobURL(wasmURL, MIME_TYPE_WASM, (data) =>
      self.postMessage({ type: FFMessageType.DOWNLOAD, data })
    );
    if (thread) {
      try {
        workerURL = await toBlobURL(workerURL, MIME_TYPE_JAVASCRIPT, (data) =>
          self.postMessage({ type: FFMessageType.DOWNLOAD, data })
        );
        // eslint-disable-next-line
      } catch (e) {}
    }
  }

  importScripts(coreURL);
  ffmpeg = await (self as WorkerGlobalScope).createFFmpegCore({
    // Fixed `Overload resolution failed.` when using multi-threaded ffmpeg-core.
    mainScriptUrlOrBlob: coreURL,
    locateFile: (path: string, prefix: string): string => {
      if (path.endsWith(".wasm")) return wasmURL;
      if (path.endsWith(".worker.js")) return workerURL;
      return prefix + path;
    },
  });
  ffmpeg.setLogger((data) =>
    self.postMessage({ type: FFMessageType.LOG, data })
  );
  ffmpeg.setProgress((data: number) =>
    self.postMessage({ type: FFMessageType.PROGRESS, data })
  );
  return first;
};

const writeFile = ({ path, bin }: FFMessageWriteFileData): IsDone => {
  ffmpeg.FS.writeFile(path, bin);
  return true;
};

const exec = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const readFile = ({ path }: FFMessageReadFileData): Uint8Array =>
  ffmpeg.FS.readFile(path);

self.onmessage = async ({
  data: { id, type, data: _data },
}: FFMessageEvent): Promise<void> => {
  const trans = [];
  let data: CallbackData;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED;

    switch (type) {
      case FFMessageType.LOAD:
        data = await load(_data as FFMessageLoadConfig);
        break;
      case FFMessageType.WRITE_FILE:
        data = writeFile(_data as FFMessageWriteFileData);
        break;
      case FFMessageType.EXEC:
        data = exec(_data as FFMessageExecData);
        break;
      case FFMessageType.READ_FILE:
        data = readFile(_data as FFMessageReadFileData);
        break;
      default:
        throw ERROR_UNKNOWN_MESSAGE_TYPE;
    }
  } catch (e) {
    self.postMessage({ id, type: FFMessageType.ERROR, data: e as Error });
    return;
  }
  if (data instanceof Uint8Array) {
    trans.push(data.buffer);
  }
  self.postMessage({ id, type, data }, trans);
};
