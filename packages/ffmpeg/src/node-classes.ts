/**
 * Node.js FFmpeg class — drop-in replacement for the browser FFmpeg class.
 *
 * Uses `worker_threads.Worker` instead of the browser `Worker` API.
 * The public API is identical: load(), exec(), writeFile(), readFile(), etc.
 * This means existing code that works in the browser will work in Node.js
 * with zero changes (just swap the import).
 *
 * Architecture:
 *   [Node.js main thread]  ←→  [worker_threads Worker running node-worker.ts]
 *                                    ↓
 *                            [FFmpeg WASM module]
 *
 * The worker_threads approach keeps FFmpeg execution off the main thread,
 * preserving Node.js's async, non-blocking behavior during transcoding.
 */

import { Worker as NodeWorker } from "node:worker_threads";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
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
 * Provides APIs to interact with ffmpeg via Node.js worker_threads.
 *
 * @example
 * ```ts
 * import { FFmpeg } from "@ffmpeg/ffmpeg";
 * const ffmpeg = new FFmpeg();
 * await ffmpeg.load();
 * ```
 */
export class FFmpeg {
  #worker: NodeWorker | null = null;
  #resolves: Callbacks = {};
  #rejects: Callbacks = {};

  #logEventCallbacks: LogEventCallback[] = [];
  #progressEventCallbacks: ProgressEventCallback[] = [];

  public loaded = false;

  /**
   * Register worker_threads message handlers.
   * Maps the worker_threads `message` event to the same handler logic
   * used by the browser Web Worker `onmessage`.
   */
  #registerHandlers = () => {
    if (this.#worker) {
      this.#worker.on("message", ({ id, type, data }: { id: number; type: string; data: CallbackData }) => {
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
            break;
        }
        delete this.#resolves[id];
        delete this.#rejects[id];
      });

      this.#worker.on("error", (err) => {
        // Reject all pending promises on worker error
        for (const id of Object.keys(this.#rejects)) {
          this.#rejects[id](err);
          delete this.#rejects[id];
          delete this.#resolves[id];
        }
      });
    }
  };

  /**
   * Send a message to the worker thread.
   * Uses the same { id, type, data } protocol as the browser worker.
   */
  #send = (
    { type, data }: Message,
    trans: ArrayBuffer[] = [],
    signal?: AbortSignal
  ): Promise<CallbackData> => {
    if (!this.#worker) {
      return Promise.reject(ERROR_NOT_LOADED);
    }

    return new Promise((resolve, reject) => {
      const id = getMessageID();
      this.#worker?.postMessage({ id, type, data }, trans);
      this.#resolves[id] = resolve;
      this.#rejects[id] = reject;

      signal?.addEventListener(
        "abort",
        () => {
          reject(new Error(`Message # ${id} was aborted`));
        },
        { once: true }
      );
    });
  };

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
   * Load ffmpeg-core inside a Node.js worker thread.
   *
   * Unlike the browser version which loads from CDN by default,
   * the Node.js version defaults to `require("@ffmpeg/core")`,
   * expecting the core package to be installed via npm.
   */
  public load = (
    config: FFMessageLoadConfig = {},
    { signal }: FFMessageOptions = {}
  ): Promise<IsFirst> => {
    if (!this.#worker) {
      // Resolve the path to node-worker.js relative to this file
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const workerPath = join(__dirname, "node-worker.js");

      this.#worker = new NodeWorker(workerPath);
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

  public exec = (
    args: string[],
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

  public ffprobe = (
    args: string[],
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

  public terminate = (): void => {
    const ids = Object.keys(this.#rejects);
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

  public writeFile = (
    path: string,
    data: FileData,
    { signal }: FFMessageOptions = {}
  ): Promise<OK> => {
    const trans: ArrayBuffer[] = [];
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

  public mount = (fsType: FFFSType, options: FFFSMountOptions, mountPoint: FFFSPath): Promise<OK> => {
    const trans: ArrayBuffer[] = [];
    return this.#send(
      {
        type: FFMessageType.MOUNT,
        data: { fsType, options, mountPoint },
      },
      trans
    ) as Promise<OK>;
  };

  public unmount = (mountPoint: FFFSPath): Promise<OK> => {
    const trans: ArrayBuffer[] = [];
    return this.#send(
      {
        type: FFMessageType.UNMOUNT,
        data: { mountPoint },
      },
      trans
    ) as Promise<OK>;
  };

  public readFile = (
    path: string,
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
