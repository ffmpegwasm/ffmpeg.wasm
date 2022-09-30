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

export interface FFMessageWriteFileData {
  path: FFFSPath;
  bin: Uint8Array | string;
}

export interface FFMessageExecData {
  args: string[];
  timeout?: number;
}

export interface FFMessageReadFileData {
  path: FFFSPath;
}

export type FFMessageData =
  | FFMessageLoadConfig
  | FFMessageWriteFileData
  | FFMessageExecData
  | FFMessageReadFileData;

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

export type ExitCode = number;
export type ErrorMessage = string;
export type FileData = Uint8Array;
export type Progress = number;
export type IsFirst = boolean;
export type IsDone = boolean;

export type CallbackData =
  | FileData
  | ExitCode
  | ErrorMessage
  | DownloadProgressEvent
  | LogEvent
  | Progress
  | IsFirst
  | IsDone
  | Error
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
