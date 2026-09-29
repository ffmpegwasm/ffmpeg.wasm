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
import { ERROR_TERMINATED, ERROR_NOT_LOADED, ERROR_WORKER, ERROR_CRASHED } from "./errors.js";

type FFMessageOptions = {
  signal?: AbortSignal;
};

type EventListenerMethod = {
  (event: "log", callback: LogEventCallback): void;
  (event: "progress", callback: ProgressEventCallback): void;
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
          case FFMessageType.FFPROBE:
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
            // A trap (e.g. "memory access out of bounds") can leave the core's
            // memory corrupt, so don't run anything else on it (#563).
            if (String(data).startsWith("RuntimeError")) this.#terminate(ERROR_CRASHED);
            break;
        }
        delete this.#resolves[id];
        delete this.#rejects[id];
      };
      // Nothing will answer the pending calls, so reject them.
      this.#worker.onerror = (event) => {
        event.preventDefault(); // handled here, not an uncaught page error
        this.#terminate(ERROR_WORKER);
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
   * Listen to log or progress events from `ffmpeg.exec()`.
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
  // Arrow functions like the other methods, so they still reach the #private
  // fields when called through a Proxy such as Vue's reactive() (#687).
  public on: EventListenerMethod = (event, callback) => {
    if (event === "log") {
      this.#logEventCallbacks.push(callback as LogEventCallback);
    } else if (event === "progress") {
      this.#progressEventCallbacks.push(callback as ProgressEventCallback);
    }
  };

  /**
   * Unlisten to log or progress events from `ffmpeg.exec()`.
   *
   * @category FFmpeg
   */
  public off: EventListenerMethod = (event, callback) => {
    if (event === "log") {
      this.#logEventCallbacks = this.#logEventCallbacks.filter(
        (f) => f !== callback
      );
    } else if (event === "progress") {
      this.#progressEventCallbacks = this.#progressEventCallbacks.filter(
        (f) => f !== callback
      );
    }
  };

  protected createWorker(classWorkerURL?: string): Worker {
    return classWorkerURL
      ? new Worker(new URL(classWorkerURL, import.meta.url), { type: "module" })
      : // Keep the literal URL here so bundlers pick up worker.js.
        new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
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
      this.#worker = this.createWorker(classWorkerURL);
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
  ): Promise<number> => {
    // The worker is busy running the command, so abort through shared memory
    // the core checks while it runs (#719). Without cross-origin isolation
    // there is no shared memory, and the abort only rejects the promise.
    const abortFlag =
      signal && typeof SharedArrayBuffer !== "undefined" ? new Int32Array(new SharedArrayBuffer(4)) : undefined;
    if (abortFlag) signal?.addEventListener("abort", () => Atomics.store(abortFlag, 0, 1), { once: true });
    return this.#send(
      {
        type: FFMessageType.EXEC,
        data: { args, timeout, abortFlag },
      },
      undefined,
      signal
    ) as Promise<number>;
  };

  /**
   * Execute ffprobe command.
   *
   * @example
   * ```ts
   * const ffmpeg = new FFmpeg();
   * await ffmpeg.load();
   * await ffmpeg.writeFile("video.avi", ...);
   * // Getting duration of a video in seconds: ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video.avi -o output.txt
   * await ffmpeg.ffprobe(["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", "video.avi", "-o", "output.txt"]);
   * const data = ffmpeg.readFile("output.txt");
   * ```
   *
   * @returns `0` if no error, `!= 0` if timeout (1) or error.
   * @category FFmpeg
   */
  public ffprobe = (
    /** ffprobe command line args */
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
        type: FFMessageType.FFPROBE,
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
  public terminate = (): void => this.#terminate(ERROR_TERMINATED);

  #terminate = (reason: Error): void => {
    // rejects all incomplete Promises.
    Object.values(this.#rejects).forEach((reject) => reject(reason));
    this.#rejects = {};
    this.#resolves = {};

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
    { signal, transfer = true }: FFMessageOptions & { transfer?: boolean } = {}
  ): Promise<OK> => {
    // Transferring moves the data to the worker without a copy, which leaves
    // the caller's Uint8Array empty; { transfer: false } copies it (#911).
    const trans: Transferable[] = [];
    if (transfer && data instanceof Uint8Array) {
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
