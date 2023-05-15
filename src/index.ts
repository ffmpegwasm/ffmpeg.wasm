import { version } from "../package.json";
import {
  defaultInitOptions,
  defaultRunningOptions,
  type FFmpegInitOptions,
  type FFmpegLogger,
  type FFmpegRunningOptions,
} from "./options";
import type {
  FFmpegCore,
  FFmpegCoreVersion,
  FFmpegFileSystem,
  FFmpegVersion,
} from "./types";
import { logError, parseVersion, writeArgs } from "./utils";
import { importCore } from "./utils/importCore";

// arguments to get version
const VERSION_ARGS = ["ffmpeg", "-version"];

class FFmpeg {
  /**
   * Versions of FFmpeg.wasm
   */
  public version: FFmpegVersion;
  /**
   * Has the core exited
   */
  public get exited() {
    return this._exited;
  }
  protected _exited = false;
  /**
   * Memory file system
   */
  public fs: FFmpegFileSystem;
  protected core: FFmpegCore;
  protected exec: (argc: number, argv: number) => number;
  protected execAsync: (
    argc: number,
    argv: number,
    resolve: number,
    reject: number
  ) => number;
  protected options: Required<FFmpegInitOptions>;
  protected tasks: Map<
    symbol,
    { promise: Promise<number>; reject: (reason: unknown) => void }
  > = new Map();

  /**
   * Don't use this constructor direct, use FFmpeg.create() instead!
   * @see {@link create}
   * @param core FFmpeg.wasm core
   * @param options init options
   */
  private constructor(
    core: FFmpegCore,
    options: Required<FFmpegInitOptions>,
    coreVersion: FFmpegCoreVersion
  ) {
    this.core = core;
    this.options = { ...defaultInitOptions, ...options };
    this.version = { main: version, core: coreVersion };

    this.exec = core.cwrap("_exec", "number", ["number", "number"]);
    this.execAsync = core.cwrap("_execAsync", "number", [
      "number",
      "number",
      "number",
      "number",
    ]);

    this.fs = core.FS;
  }

  /**
   * Create a new FFmpeg instance
   * @param _options init options
   * @returns created instance
   */
  public static async create(_options: FFmpegInitOptions): Promise<FFmpeg> {
    const options = { ...defaultInitOptions, ..._options };

    // used to get version info
    const { log, logger } = options;
    let output = "";
    options.log = true;
    options.logger = (level, msg) => {
      if (level === "info") output += msg;
    };

    // import and create core
    const core = await (
      await importCore(options.core, options.logger)
    )({
      arguments: VERSION_ARGS,
      noExitRuntime: true,
      print(msg) {
        if (options.log) options.logger("info", msg);
      },
      printErr(msg) {
        if (options.log) options.logger("error", msg);
      },
    });

    const coreVersion = parseVersion(output);

    // restore options
    options.log = log;
    options.logger = logger;
    return new FFmpeg(core, options, coreVersion);
  }

  public async run(
    _args: string[],
    _options: Partial<FFmpegRunningOptions> = {}
  ): Promise<number> {
    if (this._exited) throw new Error("FFmpeg core has already been exited!");

    const options = { ...defaultRunningOptions, ..._options };
    const args = [
      "ffmpeg",
      ...(options.useDefaultArgs ? this.options.defaultArgs.concat(_args) : []),
      ..._args,
    ];

    const handle = Symbol(
      process?.env?.["NODE_ENV"] === "development"
        ? `FFmpeg convert ${args.join(" ")}`
        : ""
    );
    let argsPtr: number | undefined,
      resloveCallbackPtr: number | undefined,
      rejectCallbackPtr: number | undefined;
    try {
      const promise: Promise<number> = new Promise((resolve, reject) => {
        argsPtr = writeArgs(this.core, args);
        resloveCallbackPtr = this.core.addFunction(resolve, "vi");
        rejectCallbackPtr = this.core.addFunction(reject, "vi");
        if (this.core.thread) {
          const result = this.execAsync(
            args.length,
            argsPtr,
            resloveCallbackPtr,
            rejectCallbackPtr
          );
          if (!result) reject("Failed to add task into queue!");
          this.tasks.set(handle, { promise, reject });
        } else {
          resolve(this.exec(args.length, argsPtr));
        }
      });
      return await promise;
    } catch (err) {
      logError(err, args, this.options.logger);
      throw err;
    } finally {
      this.tasks.delete(handle);
      if (argsPtr) this.core._free(argsPtr);
      if (resloveCallbackPtr) this.core._free(resloveCallbackPtr);
      if (rejectCallbackPtr) this.core._free(rejectCallbackPtr);
    }
  }

  public runSync(
    _args: string[],
    _options: Partial<FFmpegRunningOptions> = {}
  ): number {
    if (this._exited) throw new Error("FFmpeg core has already been exited!");

    const options = { ...defaultRunningOptions, ..._options };
    const args = [
      "ffmpeg",
      ...(options.useDefaultArgs ? this.options.defaultArgs.concat(_args) : []),
      ..._args,
    ];

    const argsPtr = writeArgs(this.core, args);
    try {
      return this.exec(args.length, argsPtr);
    } catch (err) {
      logError(err, args, this.options.logger);
      throw err;
    } finally {
      this.core._free(argsPtr);
    }
  }
  /**
   *
   * @param handleInProgress
   * @returns
   */
  public exit(
    handleInProgress: "break" | "kill" | "wait" = "break"
  ): boolean | Promise<boolean> {
    this._exited = true;
    switch (handleInProgress) {
      case "wait":
        return Promise.allSettled(
          Array.from(this.tasks.values()).map(({ promise }) => promise)
        ).then(() => this.core.exit());
      case "kill":
        this.tasks.forEach(({ reject }) => reject("ffmpeg core has exited!"));
        break;
      default:
        if (this.tasks.size !== 0) {
          this.options.logger("warn", `Task list is not empty, break.`);
          return false;
        }
        break;
    }
    return this.core.exit();
  }

  public setLogging(enbale: boolean) {
    this.options.log = enbale;
  }

  /**
   * Replace logger
   * @param logger logger function
   */
  public setLogger(logger: FFmpegLogger) {
    this.options.logger = logger;
  }
}

type FFmpegExecWrapper = FFmpeg["exec"];
type FFmpegExecAsyncWrapper = FFmpeg["exec"];

export default FFmpeg;
export type { FFmpegExecWrapper, FFmpegExecAsyncWrapper };
