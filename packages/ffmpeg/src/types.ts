import type { FFMessageType } from "./const.js";

export type FFFSPath = string;

/**
 * ffmpeg-core loading configuration.
 */
export interface FFMessageLoadConfig {
  /**
   * `ffmpeg-core.js` URL.
   *
   * @defaultValue `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
   */
  coreURL?: string;
  /**
   * `ffmpeg-core.wasm` URL.
   *
   * @defaultValue `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;
   */
  wasmURL?: string;
  /**
   * @deprecated Ignored since @ffmpeg/core 0.13: FFmpeg's threads start from
   * `coreURL`, and there is no `ffmpeg-core.worker.js` any more.
   */
  workerURL?: string;
  /**
   * `ffmpeg.worker.js` URL. This worker is spawned when FFmpeg.load() is called, it is an essential worker and usually you don't need to update this config.
   *
   * @ref: https://ffmpegwasm.netlify.app/docs/overview#architecture
   * @defaultValue `./worker.js`
   */
  classWorkerURL?: string;
  /**
   * Most threads a codec or filter may use. More threads can be faster on
   * machines with many cores, but a complex command may then need more threads
   * than the core's pool of 64 and fail.
   *
   * @defaultValue `Math.min(navigator.hardwareConcurrency, 4)`
   */
  threads?: number;
}

export interface FFMessageExecData {
  args: string[];
  timeout?: number;
  /** Set to 1 by an AbortSignal; the core stops the command when it sees it. */
  abortFlag?: Int32Array;
}

export interface FFMessageOpenData {
  path: FFFSPath;
  flags: string;
}

export interface FFMessageReadData {
  fd: number;
  length: number;
  position?: number;
}

export interface FFMessageWriteData {
  fd: number;
  data: Uint8Array;
  position?: number;
}

export interface FFMessageCloseData {
  fd: number;
}

export interface FFMessageWriteFileData {
  path: FFFSPath;
  data: FileData;
}

export interface FFMessageReadFileData {
  path: FFFSPath;
  encoding: string;
}

export interface FFMessageDeleteFileData {
  path: FFFSPath;
}

export interface FFMessageRenameData {
  oldPath: FFFSPath;
  newPath: FFFSPath;
}

export interface FFMessageCreateDirData {
  path: FFFSPath;
}

export interface FFMessageListDirData {
  path: FFFSPath;
}

/**
 * @remarks
 * Only deletes empty directory.
 */
export interface FFMessageDeleteDirData {
  path: FFFSPath;
}

export enum FFFSType {
  MEMFS = "MEMFS",
  NODEFS = "NODEFS",
  NODERAWFS = "NODERAWFS",
  IDBFS  = "IDBFS",
  WORKERFS = "WORKERFS",
  PROXYFS = "PROXYFS",
}

export type WorkerFSFileEntry =
  | File;

export interface WorkerFSBlobEntry {
  name: string;
  data: Blob;
}

export interface WorkerFSMountData {
  blobs?: WorkerFSBlobEntry[];
  files?: WorkerFSFileEntry[];
}

export type FFFSMountOptions =
  | WorkerFSMountData;

export interface FFMessageMountData {
  fsType: FFFSType;
  options: FFFSMountOptions;
  mountPoint: FFFSPath;
}

export interface FFMessageUnmountData {
  mountPoint: FFFSPath;
}

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageExecData
  | FFMessageOpenData
  | FFMessageReadData
  | FFMessageWriteData
  | FFMessageCloseData
  | FFMessageWriteFileData
  | FFMessageReadFileData
  | FFMessageDeleteFileData
  | FFMessageRenameData
  | FFMessageCreateDirData
  | FFMessageListDirData
  | FFMessageDeleteDirData
  | FFMessageMountData
  | FFMessageUnmountData;

export interface Message {
  type: FFMessageType;
  data?: FFMessageData;
}

export interface FFMessage extends Message {
  id: number;
}

export interface FFMessageEvent extends MessageEvent {
  data: FFMessage;
}

export interface LogEvent {
  type: FFMessageType;
  message: string;
}

export interface ProgressEvent {
  progress: number;
  time: number;
}

export type ExitCode = number;
export type ErrorMessage = string;
export type FileData = Uint8Array | string;
export type IsFirst = boolean;
export type OK = boolean;

export interface FSNode {
  name: string;
  isDir: boolean;
}

export type CallbackData =
  | FileData
  | ExitCode
  | ErrorMessage
  | LogEvent
  | ProgressEvent
  | IsFirst
  | OK // eslint-disable-line
  | Error
  | FSNode[]
  | undefined;

export type Callbacks = Record<number, (data: CallbackData) => void>;

export type LogEventCallback = (event: LogEvent) => void;
export type ProgressEventCallback = (event: ProgressEvent) => void;

export interface FFMessageEventCallback {
  data: {
    id: number;
    type: FFMessageType;
    data: CallbackData;
  };
}
