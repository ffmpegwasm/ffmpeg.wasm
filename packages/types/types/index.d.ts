// TODO: Add lint and test.

export type Pointer = number;

export type StringPointer = Pointer;
export type StringArrayPointer = Pointer;
export type DateString = string;

export interface ReadFileOptions {
  encdoing: string;
}

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

export interface FS {
  mkdir: (path: string) => void;
  rmdir: (path: string) => void;
  rename: (oldPath: string, newPath: string) => void;
  writeFile: (path: string, data: Uint8Array | string) => void;
  readFile: (path: string, opts: OptionReadFile) => Uint8Array | string;
  readdir: (path: string) => string[];
  unlink: (path: string) => void;
  stat: (path: string) => Stat;
  isFile: (mode: number) => boolean;
  isDir: (mode: number) => boolean;
}

export interface Log {
  type: string;
  message: string;
}

export interface FFmpegCoreModule {
  DEFAULT_ARGS: string[];
  FS: FS;
  NULL: Pointer;
  SIZE_I32: number;

  ret: number;
  timeout: number;
  mainScriptUrlOrBlob: string;

  exec: (...args: string[]) => number;
  reset: () => void;
  setLogger: (logger: (log: Log) => void) => void;
  setTimeout: (timeout: number) => void;
  setProgress: (handler: (progress: number, elapsed: number) => void) => void;

  locateFile: (path: string, prefix: string) => string;
}

export type FFmpegCoreModuleFactory = (
  moduleOverrides?: Partial<FFmpegCoreModule>
) => Promise<FFmpegCoreModule>;
