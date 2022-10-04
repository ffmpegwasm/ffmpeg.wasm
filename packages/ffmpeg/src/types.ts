export type FFFSPath = string;
export type FFFSPaths = FFFSPath[];

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
   * `ffmpeg-core.worker.js` URL, only being loaded when `thread` is `true`.
   *
   * @defaultValue `https://unpkg.com/@ffmpeg/core-mt@${CORE_VERSION}/dist/umd/ffmpeg-core.worker.js`;
   */
  workerURL?: string;
  /**
   * When `blob` is true, the content of `coreURL`, `wasmURL` and `workerURL`
   * will be fetched and convert to blob URL. This avoids problems like CORS
   * and provides download progress than can be listened like below:
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * ffmpeg.on(FFmpeg.DOWNLOAD, (ev) => {
   *   console.log(ev);
   * })
   * await ffmpeg.load();
   * ```
   *
   * @defaultValue `true`
   */
  blob?: boolean;
  /**
   * When `thread` is true, ffmpeg imports `ffmpeg-core.worker.js` and thus
   * makes multi-threaded core work.
   *
   * @defaultValue `false`
   */
  thread?: boolean;
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

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageExecData
  | FFMessageWriteFileData
  | FFMessageReadFileData
  | FFMessageDeleteFileData
  | FFMessageRenameData
  | FFMessageCreateDirData
  | FFMessageListDirData
  | FFMessageDeleteDirData;

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

export interface DownloadProgressEvent {
  url: string | URL;
  total: number;
  received: number;
  delta: number;
  done: boolean;
}

export interface LogEvent {
  type: string;
  message: string;
}

export interface Progress {
  progress: number;
}

export type ExitCode = number;
export type ErrorMessage = string;
export type FileData = Uint8Array | string;
export type IsFirst = boolean;
export type OK = boolean;

export type CallbackData =
  | FileData
  | ExitCode
  | ErrorMessage
  | DownloadProgressEvent
  | LogEvent
  | Progress
  | IsFirst
  | OK
  | Error
  | FFFSPaths
  | undefined;

export interface Callbacks {
  [id: number | string]: (data: CallbackData) => void;
}

export interface FFMessageEventCallback {
  data: {
    id: number;
    type: string;
    data: CallbackData;
  };
}

export type ProgressCallback = (event: DownloadProgressEvent) => void;
