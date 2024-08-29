// TODO: Add lint and test.

export type Pointer = number;

export type StringPointer = Pointer;
export type StringArrayPointer = Pointer;
export type DateString = string;

/**
 * Options for readFile.
 *
 * @see [Emscripten File System API](https://emscripten.org/docs/api_reference/Filesystem-API.html#FS.readFile)
 * @category File System
 */
export interface ReadFileOptions {
  /** encoding of the file, must be `binary` or `utf8` */
  encdoing: string;
}

/**
 * Describes attributes of a node. (a.k.a file, directory)
 *
 * @see [Emscripten File System API](https://emscripten.org/docs/api_reference/Filesystem-API.html#FS.stat)
 * @category File System
 */
export interface Stat {
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  atime: DateString;
  mtime: DateString;
  ctime: DateString;
  blksize: number;
  blocks: number;
}

export interface FSFilesystemWORKERFS {}

export interface FSFilesystemMEMFS {}

export interface FSFilesystems {
  WORKERFS: FSFilesystemWORKERFS;
  MEMFS: FSFilesystemMEMFS;
}

export type FSFilesystem = FSFilesystemWORKERFS | FSFilesystemMEMFS;

export interface OptionReadFile {
  encoding: string;
}

export interface WorkerFSMountConfig {
  blobs?: {
    name: string;
    data: Blob;
  }[];
  files?: File[];
}

/**
 * Functions to interact with Emscripten FS library.
 *
 * @see [Emscripten File System API](https://emscripten.org/docs/api_reference/Filesystem-API.html)
 * @category File System
 */
export interface FS {
  mkdir: (path: string) => void;
  rmdir: (path: string) => void;
  rename: (oldPath: string, newPath: string) => void;
  writeFile: (path: string, data: Uint8Array | string) => void;
  readFile: (path: string, opts: OptionReadFile) => Uint8Array | string;
  readdir: (path: string) => string[];
  unlink: (path: string) => void;
  stat: (path: string) => Stat;
  /** mode is a numeric notation of permission, @see [Numeric Notation](https://en.wikipedia.org/wiki/File-system_permissions#Numeric_notation) */
  isFile: (mode: number) => boolean;
  /** mode is a numeric notation of permission, @see [Numeric Notation](https://en.wikipedia.org/wiki/File-system_permissions#Numeric_notation) */
  isDir: (mode: number) => boolean;
  mount: (
    fileSystemType: FSFilesystem,
    data: WorkerFSMountConfig,
    path: string
  ) => void;
  unmount: (path: string) => void;
  filesystems: FSFilesystems;
}

/**
 * Arguments passed to setLogger callback function.
 */
export interface Log {
  /** file descriptor of the log, must be `stdout` or `stderr` */
  type: string;
  message: string;
}

/**
 * Arguments passed to setProgress callback function.
 */
export interface Progress {
  /** progress of the operation, interval = [0, 1] */
  progress: number;
  /** time of transcoded media in microseconds, ex: if a video is 10 seconds long, when time is 1000000 means 1 second of the video is transcoded already. */
  time: number;
}

/**
 * FFmpeg core module, an object to interact with ffmpeg.
 */
export interface FFmpegCoreModule {
  /** default arguments prepend when running exec() */
  DEFAULT_ARGS: string[];
  FS: FS;
  NULL: Pointer;
  SIZE_I32: number;

  /** return code of the ffmpeg exec, error when ret != 0 */
  ret: number;
  timeout: number;
  mainScriptUrlOrBlob: string;

  exec: (...args: string[]) => number;
  ffprobe: (...args: string[]) => number;
  reset: () => void;
  setLogger: (logger: (log: Log) => void) => void;
  setTimeout: (timeout: number) => void;
  setProgress: (handler: (progress: Progress) => void) => void;

  locateFile: (path: string, prefix: string) => string;
}

/**
 * Factory of FFmpegCoreModule.
 */
export type FFmpegCoreModuleFactory = (
  moduleOverrides?: Partial<FFmpegCoreModule>
) => Promise<FFmpegCoreModule>;
