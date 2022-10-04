import EventEmitter from "events";
import { FFMessageType } from "./const";
import {
  CallbackData,
  Callbacks,
  DownloadProgressEvent,
  FFFSPaths,
  FFMessageEventCallback,
  FFMessageLoadConfig,
  OK,
  IsFirst,
  LogEvent,
  Message,
  Progress,
  FileData,
} from "./types";
import { getMessageID } from "./utils";
import { ERROR_TERMINATED, ERROR_NOT_LOADED } from "./errors";

export declare interface FFmpeg {
  /**
   * Listen to download progress events from `ffmpeg.load()`.
   *
   * @example
   * ```ts
   * ffmpeg.on(FFmpeg.DOWNLOAD, ({ url, total, received, delta, done }) => {
   *   // ...
   * })
   * ```
   *
   * @category Event
   */
  on(
    event: typeof FFmpeg.DOWNLOAD,
    listener: (data: DownloadProgressEvent) => void
  ): this;
  /**
   * Listen to log events from `ffmpeg.exec()`.
   *
   * @example
   * ```ts
   * ffmpeg.on(FFmpeg.LOG, ({ message }) => {
   *   // ...
   * })
   * ```
   *
   * @remarks
   * log includes output to stdout and stderr.
   *
   * @category Event
   */
  on(event: typeof FFmpeg.LOG, listener: (log: LogEvent) => void): this;
  /**
   * Listen to progress events from `ffmpeg.exec()`.
   *
   * @example
   * ```ts
   * ffmpeg.on(FFmpeg.PROGRESS, ({ progress }) => {
   *   // ...
   * })
   * ```
   *
   * @remarks
   * The progress events are accurate only when the length of
   * input and output video/audio file are the same.
   *
   * @category Event
   */
  on(
    event: typeof FFmpeg.PROGRESS,
    listener: (progress: Progress) => void
  ): this;
}

/**
 * Provides APIs to interact with ffmpeg web worker.
 *
 * @example
 * ```ts
 * const ffmpeg = new FFmpeg();
 * ```
 */
export class FFmpeg extends EventEmitter {
  /** @event */ static readonly DOWNLOAD = "download" as const;
  /** @event */ static readonly LOG = "log" as const;
  /** @event */ static readonly PROGRESS = "progress" as const;

  #worker: Worker | null = null;
  /**
   * #resolves and #rejects tracks Promise resolves and rejects to
   * be called when we receive message from web worker.
   *
   */
  #resolves: Callbacks = {};
  #rejects: Callbacks = {};

  constructor() {
    super();
  }

  /**
   * register worker message event handlers.
   */
  #registerHandlers = () => {
    if (this.#worker) {
      this.#worker.onmessage = ({
        data: { id, type, data },
      }: FFMessageEventCallback) => {
        switch (type) {
          case FFMessageType.LOAD:
          case FFMessageType.EXEC:
          case FFMessageType.WRITE_FILE:
          case FFMessageType.READ_FILE:
          case FFMessageType.DELETE_FILE:
          case FFMessageType.RENAME:
          case FFMessageType.CREATE_DIR:
          case FFMessageType.LIST_DIR:
          case FFMessageType.DELETE_DIR:
            this.#resolves[id](data);
            break;
          case FFMessageType.DOWNLOAD:
            this.emit(FFmpeg.DOWNLOAD, data as DownloadProgressEvent);
            break;
          case FFMessageType.LOG:
            this.emit(FFmpeg.LOG, data as LogEvent);
            break;
          case FFMessageType.PROGRESS:
            this.emit(FFmpeg.PROGRESS, data as Progress);
            break;
          case FFMessageType.ERROR:
            this.#rejects[id](data);
            break;
        }
        delete this.#resolves[id];
        delete this.#rejects[id];
      };
    }
  };

  /**
   * Generic function to send messages to web worker.
   */
  #send = (
    { type, data }: Message,
    trans: Transferable[] = []
  ): Promise<CallbackData> => {
    if (!this.#worker) {
      return Promise.reject(ERROR_NOT_LOADED);
    }

    return new Promise((resolve, reject) => {
      const id = getMessageID();
      this.#worker && this.#worker.postMessage({ id, type, data }, trans);
      this.#resolves[id] = resolve;
      this.#rejects[id] = reject;
    });
  };

  /**
   * Loads ffmpeg-core inside web worker. It is required to call this method first
   * as it initializes WebAssembly and other essential variables.
   *
   * @category FFmpeg
   * @returns `true` if ffmpeg core is loaded for the first time.
   */
  public load = (config: FFMessageLoadConfig = {}): Promise<IsFirst> => {
    if (!this.#worker) {
      this.#worker = new Worker(new URL("./worker.ts", import.meta.url));
      this.#registerHandlers();
    }
    return this.#send({
      type: FFMessageType.LOAD,
      data: config,
    }) as Promise<IsFirst>;
  };

  /**
   * Execute ffmpeg command.
   *
   * @remarks
   * To avoid common I/O issues, ["-nostdin", "-y"] are prepended to the args
   * by default.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile("video.avi", ...);
   * // ffmpeg -i video.avi video.mp4
   * await ffmpeg.exec(["-i", "video.avi", "video.mp4"]);
   * const data = ffmpeg.readFile("video.mp4");
   * ```
   *
   * @returns `0` if no error, `!= 0` if timeout (1) or error.
   * @category FFmpeg
   */
  public exec = (
    /** ffmpeg command line args */
    args: string[],
    /**
     * milliseconds to wait before stopping the command execution.
     *
     * @defaultValue -1
     */
    timeout = -1
  ): Promise<number> =>
    this.#send({
      type: FFMessageType.EXEC,
      data: { args, timeout },
    }) as Promise<number>;

  /**
   * Terminate all ongoing API calls and terminate web worker.
   * `FFmpeg.load()` must be called again before calling any other APIs.
   *
   * @category FFmpeg
   */
  public terminate = (): void => {
    const ids = Object.keys(this.#rejects);
    // rejects all incomplete Promises.
    for (const id of ids) {
      this.#rejects[id](ERROR_TERMINATED);
      delete this.#rejects[id];
      delete this.#resolves[id];
    }

    if (this.#worker) {
      this.#worker.terminate();
      this.#worker = null;
    }
  };

  /**
   * Write data to ffmpeg.wasm.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile("video.avi", await fetchFile("../video.avi"));
   * await ffmpeg.writeFile("text.txt", "hello world");
   * ```
   *
   * @category File System
   */
  public writeFile = (path: string, data: FileData): Promise<OK> => {
    const trans: Transferable[] = [];
    if (data instanceof Uint8Array) {
      trans.push(data.buffer);
    }
    return this.#send(
      {
        type: FFMessageType.WRITE_FILE,
        data: { path, data },
      },
      trans
    ) as Promise<OK>;
  };

  /**
   * Read data from ffmpeg.wasm.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * const data = await ffmpeg.readFile("video.mp4");
   * ```
   *
   * @category File System
   */
  public readFile = (
    path: string,
    /**
     * File content encoding, supports two encodings:
     * - utf8: read file as text file, return data in string type.
     * - binary: read file as binary file, return data in Uint8Array type.
     *
     * @defaultValue binary
     */
    encoding = "binary"
  ): Promise<FileData> =>
    this.#send({
      type: FFMessageType.READ_FILE,
      data: { path, encoding },
    }) as Promise<FileData>;

  /**
   * Delete a file.
   *
   * @category File System
   */
  public deleteFile = (path: string): Promise<OK> =>
    this.#send({
      type: FFMessageType.DELETE_FILE,
      data: { path },
    }) as Promise<OK>;

  /**
   * Rename a file or directory.
   *
   * @category File System
   */
  public rename = (oldPath: string, newPath: string): Promise<OK> =>
    this.#send({
      type: FFMessageType.RENAME,
      data: { oldPath, newPath },
    }) as Promise<OK>;

  /**
   * Create a directory.
   *
   * @category File System
   */
  public createDir = (path: string): Promise<OK> =>
    this.#send({
      type: FFMessageType.CREATE_DIR,
      data: { path },
    }) as Promise<OK>;

  /**
   * List directory contents.
   *
   * @category File System
   */
  public listDir = (path: string): Promise<FFFSPaths> =>
    this.#send({
      type: FFMessageType.LIST_DIR,
      data: { path },
    }) as Promise<FFFSPaths>;

  /**
   * Delete an empty directory.
   *
   * @category File System
   */
  public deleteDir = (path: string): Promise<OK> =>
    this.#send({
      type: FFMessageType.DELETE_DIR,
      data: { path },
    }) as Promise<OK>;
}
