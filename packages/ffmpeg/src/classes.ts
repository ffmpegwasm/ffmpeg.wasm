import EventEmitter from "events";
import { FFMessageType } from "./const";
import {
  CallbackData,
  Callbacks,
  DownloadProgressEvent,
  FFMessageEventCallback,
  FFMessageLoadConfig,
  IsDone,
  IsFirst,
  LogEvent,
  Message,
  Progress,
} from "./types";
import { getMessageID } from "./utils";

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

  /**
   * Listen to download progress events from `ffmpeg.load()`.
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
   * @remarks
   * log includes output to stdout and stderr.
   *
   * @category Event
   */
  on(event: typeof FFmpeg.LOG, listener: (log: LogEvent) => void): this;
  /**
   * Listen to progress events from `ffmpeg.exec()`.
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
  on(event: string, listener: any): this {
    return this;
  }

  #worker: Worker;
  #resolves: Callbacks = {};
  #rejects: Callbacks = {};

  constructor() {
    super();
    this.#worker = new Worker(new URL("./worker.ts", import.meta.url));
    this.#registerHandlers();
  }

  /** register worker message event handlers.
   */
  #registerHandlers = () => {
    this.#worker.onmessage = ({
      data: { id, type, data },
    }: FFMessageEventCallback) => {
      switch (type) {
        case FFMessageType.LOAD:
        case FFMessageType.EXEC:
        case FFMessageType.WRITE_FILE:
        case FFMessageType.READ_FILE:
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
  };

  /**
   * Generic function to send messages to web worker.
   */
  #send = (
    { type, data }: Message,
    trans: Transferable[] = []
  ): Promise<CallbackData> =>
    new Promise((resolve, reject) => {
      const id = getMessageID();
      this.#worker.postMessage({ id, type, data }, trans);
      this.#resolves[id] = resolve;
      this.#rejects[id] = reject;
    });

  /**
   * Loads ffmpeg-core inside web worker. It is required to call this method first
   * as it initializes WebAssembly and other essential variables.
   *
   * @category FFmpeg
   * @returns `true` if ffmpeg core is loaded for the first time.
   */
  public load = (config: FFMessageLoadConfig): Promise<IsFirst> =>
    this.#send({
      type: FFMessageType.LOAD,
      data: config,
    }) as Promise<IsFirst>;

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
   * Write data to ffmpeg.wasm in memory file system.
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
    bin: Uint8Array | string
  ): Promise<IsDone> => {
    const trans: Transferable[] = [];
    if (bin instanceof Uint8Array) {
      trans.push(bin.buffer);
    }
    return this.#send(
      {
        type: FFMessageType.WRITE_FILE,
        data: { path, bin },
      },
      trans
    ) as Promise<IsDone>;
  };

  /**
   * Read data from ffmpeg.wasm in memory file system.
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
  public readFile = (path: string): Promise<Uint8Array> =>
    this.#send({
      type: FFMessageType.READ_FILE,
      data: { path },
    }) as Promise<Uint8Array>;
}
