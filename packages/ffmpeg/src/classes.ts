import { FFMessageType } from "./const.js";
import {
  CallbackData,
  Callbacks,
  FSNode,
  FFMessageEventCallback,
  FFMessageLoadConfig,
  OK,
  IsFirst,
  LogEvent,
  Message,
  ProgressEvent,
  LogEventCallback,
  ProgressEventCallback,
  FileData,
  FFFSType,
  FFFSMountOptions,
  FFFSPath,
} from "./types.js";
import { getMessageID } from "./utils.js";
import { ERROR_TERMINATED, ERROR_NOT_LOADED } from "./errors.js";

type FFMessageOptions = {
  signal?: AbortSignal;
};

/**
 * Provides APIs to interact with ffmpeg web worker.
 *
 * @example
 * ```ts
 * const ffmpeg = new FFmpeg();
 * ```
 */
export class FFmpeg {
  #worker: Worker | null = null;
  /**
   * #resolves and #rejects tracks Promise resolves and rejects to
   * be called when we receive message from web worker.
   */
  #resolves: Callbacks = {};
  #rejects: Callbacks = {};

  #logEventCallbacks: LogEventCallback[] = [];
  #progressEventCallbacks: ProgressEventCallback[] = [];

  public loaded = false;

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
            this.loaded = true;
            this.#resolves[id](data);
            break;
          case FFMessageType.MOUNT:
          case FFMessageType.UNMOUNT:
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
          case FFMessageType.LOG:
            this.#logEventCallbacks.forEach((f) => f(data as LogEvent));
            break;
          case FFMessageType.PROGRESS:
            this.#progressEventCallbacks.forEach((f) =>
              f(data as ProgressEvent)
            );
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
    trans: Transferable[] = [],
    signal?: AbortSignal
  ): Promise<CallbackData> => {
    if (!this.#worker) {
      return Promise.reject(ERROR_NOT_LOADED);
    }

    return new Promise((resolve, reject) => {
      const id = getMessageID();
      this.#worker && this.#worker.postMessage({ id, type, data }, trans);
      this.#resolves[id] = resolve;
      this.#rejects[id] = reject;

      signal?.addEventListener(
        "abort",
        () => {
          reject(new DOMException(`Message # ${id} was aborted`, "AbortError"));
        },
        { once: true }
      );
    });
  };

  /**
   * Listen to log or prgress events from `ffmpeg.exec()`.
   *
   * @example
   * ```ts
   * ffmpeg.on("log", ({ type, message }) => {
   *   // ...
   * })
   * ```
   *
   * @example
   * ```ts
   * ffmpeg.on("progress", ({ progress, time }) => {
   *   // ...
   * })
   * ```
   *
   * @remarks
   * - log includes output to stdout and stderr.
   * - The progress events are accurate only when the length of
   * input and output video/audio file are the same.
   *
   * @category FFmpeg
   */
  public on(event: "log", callback: LogEventCallback): void;
  public on(event: "progress", callback: ProgressEventCallback): void;
  public on(
    event: "log" | "progress",
    callback: LogEventCallback | ProgressEventCallback
  ) {
    if (event === "log") {
      this.#logEventCallbacks.push(callback as LogEventCallback);
    } else if (event === "progress") {
      this.#progressEventCallbacks.push(callback as ProgressEventCallback);
    }
  }

  /**
   * Unlisten to log or prgress events from `ffmpeg.exec()`.
   *
   * @category FFmpeg
   */
  public off(event: "log", callback: LogEventCallback): void;
  public off(event: "progress", callback: ProgressEventCallback): void;
  public off(
    event: "log" | "progress",
    callback: LogEventCallback | ProgressEventCallback
  ) {
    if (event === "log") {
      this.#logEventCallbacks = this.#logEventCallbacks.filter(
        (f) => f !== callback
      );
    } else if (event === "progress") {
      this.#progressEventCallbacks = this.#progressEventCallbacks.filter(
        (f) => f !== callback
      );
    }
  }

  /**
   * Loads ffmpeg-core inside web worker. It is required to call this method first
   * as it initializes WebAssembly and other essential variables.
   *
   * @category FFmpeg
   * @returns `true` if ffmpeg core is loaded for the first time.
   */
  public load = (
    { classWorkerURL, ...config }: FFMessageLoadConfig = {},
    { signal }: FFMessageOptions = {}
  ): Promise<IsFirst> => {
    if (!this.#worker) {
      this.#worker = classWorkerURL ?
        new Worker(new URL(classWorkerURL, import.meta.url), {
          type: "module",
        }) :
        // We need to duplicated the code here to enable webpack
        // to bundle worekr.js here.
        new Worker(new URL("./worker.js", import.meta.url), {
          type: "module",
        });
      this.#registerHandlers();
    }
    return this.#send(
      {
        type: FFMessageType.LOAD,
        data: config,
      },
      undefined,
      signal
    ) as Promise<IsFirst>;
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
    timeout = -1,
    { signal }: FFMessageOptions = {}
  ): Promise<number> =>
    this.#send(
      {
        type: FFMessageType.EXEC,
        data: { args, timeout },
      },
      undefined,
      signal
    ) as Promise<number>;

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
      this.loaded = false;
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
  public writeFile = (
    path: string,
    data: FileData,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> => {
    const trans: Transferable[] = [];
    if (data instanceof Uint8Array) {
      trans.push(data.buffer);
    }
    return this.#send(
      {
        type: FFMessageType.WRITE_FILE,
        data: { path, data },
      },
      trans,
      signal
    ) as Promise<OK>;
  };

  public mount = (fsType: FFFSType, options: FFFSMountOptions, mountPoint: FFFSPath, ): Promise<OK> => {
    const trans: Transferable[] = [];
    return this.#send(
      {
        type: FFMessageType.MOUNT,
        data: { fsType, options, mountPoint },
      },
      trans
    ) as Promise<OK>;
  };

  public unmount = (mountPoint: FFFSPath): Promise<OK> => {
    const trans: Transferable[] = [];
    return this.#send(
      {
        type: FFMessageType.UNMOUNT,
        data: { mountPoint },
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
    encoding = "binary",
    { signal }: FFMessageOptions = {}
  ): Promise<FileData> =>
    this.#send(
      {
        type: FFMessageType.READ_FILE,
        data: { path, encoding },
      },
      undefined,
      signal
    ) as Promise<FileData>;

  /**
   * Delete a file.
   *
   * @category File System
   */
  public deleteFile = (
    path: string,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> =>
    this.#send(
      {
        type: FFMessageType.DELETE_FILE,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>;

  /**
   * Rename a file or directory.
   *
   * @category File System
   */
  public rename = (
    oldPath: string,
    newPath: string,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> =>
    this.#send(
      {
        type: FFMessageType.RENAME,
        data: { oldPath, newPath },
      },
      undefined,
      signal
    ) as Promise<OK>;

  /**
   * Create a directory.
   *
   * @category File System
   */
  public createDir = (
    path: string,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> =>
    this.#send(
      {
        type: FFMessageType.CREATE_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>;

  /**
   * List directory contents.
   *
   * @category File System
   */
  public listDir = (
    path: string,
    { signal }: FFMessageOptions = {}
  ): Promise<FSNode[]> =>
    this.#send(
      {
        type: FFMessageType.LIST_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<FSNode[]>;

  /**
   * Delete an empty directory.
   *
   * @category File System
   */
  public deleteDir = (
    path: string,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> =>
    this.#send(
      {
        type: FFMessageType.DELETE_DIR,
        data: { path },
      },
      undefined,
      signal
    ) as Promise<OK>;
}
