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
import { CORE_URL, FFMessageType } from "./const.js";
import {
  ERROR_UNKNOWN_MESSAGE_TYPE,
  ERROR_NOT_LOADED,
  ERROR_IMPORT_FAILURE,
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

const load = async ({
  coreURL: _coreURL,
  wasmURL: _wasmURL,
  workerURL: _workerURL,
}: FFMessageLoadConfig): Promise<IsFirst> => {
  const first = !ffmpeg;

  try {
    if (!_coreURL) _coreURL = CORE_URL;
    // when web worker type is `classic`.
    importScripts(_coreURL);
  } catch {
    if (!_coreURL) _coreURL = CORE_URL.replace('/umd/', '/esm/');
    // when web worker type is `module`.
    (self as WorkerGlobalScope).createFFmpegCore = (
      (await import(
        /* webpackIgnore: true *//* @vite-ignore */ _coreURL
      )) as ImportedFFmpegCoreModuleFactory
    ).default;

    if (!(self as WorkerGlobalScope).createFFmpegCore) {
      throw ERROR_IMPORT_FAILURE;
    }
  }

  const coreURL = _coreURL;
  const wasmURL = _wasmURL ? _wasmURL : _coreURL.replace(/.js$/g, ".wasm");
  const workerURL = _workerURL
    ? _workerURL
    : _coreURL.replace(/.js$/g, ".worker.js");

  ffmpeg = await (self as WorkerGlobalScope).createFFmpegCore({
    // Fix `Overload resolution failed.` when using multi-threaded ffmpeg-core.
    // Encoded wasmURL and workerURL in the URL as a hack to fix locateFile issue.
    mainScriptUrlOrBlob: `${coreURL}#${btoa(
      JSON.stringify({ wasmURL, workerURL })
    )}`,
  });
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

const exec = ({ args, timeout = -1 }: FFMessageExecData): ExitCode => {
  ffmpeg.setTimeout(timeout);
  ffmpeg.exec(...args);
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
        data = exec(_data as FFMessageExecData);
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
      data: (e as Error).toString(),
    });
    return;
  }
  if (data instanceof Uint8Array) {
    trans.push(data.buffer);
  }
  self.postMessage({ id, type, data }, trans);
};
