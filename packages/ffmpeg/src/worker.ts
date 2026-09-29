/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import type { FFmpegCoreModule, FFmpegCoreModuleFactory } from "@ffmpeg/types";
import type {
  FFMessageEvent,
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
} from "./types";
import { CORE_URL, CORE_JSPI_URL, CORE_MT_URL, FFMessageType } from "./const.js";
import {
  ERROR_UNKNOWN_MESSAGE_TYPE,
  ERROR_NOT_LOADED,
  ERROR_IMPORT_FAILURE,
  ERROR_NOT_ISOLATED,
} from "./errors.js";

declare global {
  interface WorkerGlobalScope {
    createFFmpegCore: FFmpegCoreModuleFactory;
  }
}

interface ImportedFFmpegCoreModuleFactory {
  default: FFmpegCoreModuleFactory;
}

let ffmpeg: FFmpegCoreModule;

// Without a coreURL, the fastest core that works here: @ffmpeg/core-mt on a
// cross-origin isolated page, else @ffmpeg/core's JSPI build where
// WebAssembly.Suspending exists, else @ffmpeg/core.
const defaultCoreURL = (): string => {
  if (self.crossOriginIsolated) return CORE_MT_URL;
  if (typeof (WebAssembly as { Suspending?: unknown }).Suspending === "function") return CORE_JSPI_URL;
  return CORE_URL;
};

const load = async ({
  coreURL: _coreURL,
  wasmURL: _wasmURL,
}: FFMessageLoadConfig): Promise<IsFirst> => {
  const first = !ffmpeg;

  const defaultCore = !_coreURL;
  _coreURL = _coreURL ?? defaultCoreURL();
  try {
    // when web worker type is `classic`.
    importScripts(_coreURL);
  } catch {
    if (defaultCore) _coreURL = _coreURL.replace('/umd/', '/esm/');
    // when web worker type is `module`.
    (self as WorkerGlobalScope).createFFmpegCore = (
      (await import(
        /* @vite-ignore */ _coreURL
      )) as ImportedFFmpegCoreModuleFactory
    ).default;

    if (!(self as WorkerGlobalScope).createFFmpegCore) {
      throw ERROR_IMPORT_FAILURE;
    }
  }

  const coreURL = _coreURL;
  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, ".wasm");

  try {
    ffmpeg = await (self as WorkerGlobalScope).createFFmpegCore({
      // @ffmpeg/core-mt starts its threads from the core script; the hash
      // carries the wasm URL for _locateFile() in bind.js.
      mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({ wasmURL }))}`,
    });
  } catch (e) {
    // @ffmpeg/core-mt's shared memory needs a cross-origin isolated page.
    if (String(e).includes("not cross-origin isolated")) throw ERROR_NOT_ISOLATED;
    throw e;
  }
  ffmpeg.setLogger((data) =>
    self.postMessage({ type: FFMessageType.LOG, data })
  );
  ffmpeg.setProgress((data) =>
    self.postMessage({
      type: FFMessageType.PROGRESS,
      data,
    })
  );
  return first;
};

const exec = async ({ args, timeout = -1 }: FFMessageExecData): Promise<ExitCode> => {
  ffmpeg.setTimeout(timeout);
  await ffmpeg.exec(...args); // a Promise with the JSPI core
  const ret = ffmpeg.ret;
  ffmpeg.reset();
  return ret;
};

const ffprobe = async ({ args, timeout = -1 }: FFMessageExecData): Promise<ExitCode> => {
  ffmpeg.setTimeout(timeout);
  await ffmpeg.ffprobe(...args); // a Promise with the JSPI core
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

// TODO: check if deletion works.
const deleteFile = ({ path }: FFMessageDeleteFileData): OK => {
  ffmpeg.FS.unlink(path);
  return true;
};

const rename = ({ oldPath, newPath }: FFMessageRenameData): OK => {
  ffmpeg.FS.rename(oldPath, newPath);
  return true;
};

// TODO: check if creation works.
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

// TODO: check if deletion works.
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

// emscripten's FS throws ErrnoError objects, which aren't Errors and only
// carry an errno.
const ERRNO: Record<number, string> = {
  2: "EACCES: permission denied",
  10: "EBUSY: resource busy",
  20: "EEXIST: file already exists",
  28: "EINVAL: invalid argument",
  31: "EISDIR: is a directory",
  44: "ENOENT: no such file or directory",
  54: "ENOTDIR: not a directory",
  55: "ENOTEMPTY: directory not empty",
  63: "EPERM: operation not permitted",
};
const errorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.toString();
  const errno = (e as { errno?: number })?.errno;
  return errno === undefined ? String(e) : `ErrnoError: ${ERRNO[errno] ?? `errno ${errno}`}`;
};

self.onmessage = async ({
  data: { id, type, data: _data },
}: FFMessageEvent): Promise<void> => {
  const trans = [];
  let data: CallbackData;
  try {
    if (type !== FFMessageType.LOAD && !ffmpeg) throw ERROR_NOT_LOADED; // eslint-disable-line

    switch (type) {
      case FFMessageType.LOAD:
        data = await load(_data as FFMessageLoadConfig);
        break;
      case FFMessageType.EXEC:
        data = await exec(_data as FFMessageExecData);
        break;
      case FFMessageType.FFPROBE:
        data = await ffprobe(_data as FFMessageExecData);
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
    self.postMessage({
      id,
      type: FFMessageType.ERROR,
      data: errorMessage(e),
    });
    return;
  }
  if (data instanceof Uint8Array) {
    trans.push(data.buffer);
  }
  self.postMessage({ id, type, data }, trans);
};
