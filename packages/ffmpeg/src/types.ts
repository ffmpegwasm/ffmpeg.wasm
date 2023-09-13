export type FFFSPath = string;

/**
 * ffmpeg-core loading configuration.
 */
export interface FFMessageLoadConfig {
  /**
   * `ffmpeg-core.js` URL.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.js`;
   */
  coreURL?: string;
  /**
   * `ffmpeg-core.wasm` URL.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd/ffmpeg-core.wasm`;
   */
  wasmURL?: string;
  /**
   * `ffmpeg-core.worker.js` URL.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core-mt@${CORE_VERSION}/dist/umd/ffmpeg-core.worker.js`;
   */
  workerURL?: string;
}

export interface FFMessageExecData {
  args: string[];
  timeout?: number;
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

export interface FFMessageMountData {
  path: FFFSPath;
  data: WorkerFSMountData;
}

export interface FFMessageUnmountData {
  path: FFFSPath;
}

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageExecData
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
  type: string;
  data?: FFMessageData;
}

export interface FFMessage extends Message {
  id: number;
}

export interface FFMessageEvent extends MessageEvent {
  data: FFMessage;
}

export interface LogEvent {
  type: string;
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
  | OK
  | Error
  | FSNode[]
  | undefined;

export interface Callbacks {
  [id: number | string]: (data: CallbackData) => void;
}

export type LogEventCallback = (event: LogEvent) => void;
export type ProgressEventCallback = (event: ProgressEvent) => void;

export interface FFMessageEventCallback {
  data: {
    id: number;
    type: string;
    data: CallbackData;
  };
}
