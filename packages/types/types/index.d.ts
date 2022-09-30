// TODO: Add lint and test.

export type Pointer = number;
export type StringPointer = Pointer;
export type StringArrayPointer = Pointer;

export interface FS {
  mkdir: (fileName: string) => void;
  readFile: (fileName: string) => Uint8Array;
  readdir: (pathName: string) => string[];
  unlink: (fileName: string) => void;
  writeFile: (fileName: string, binaryData: Uint8Array | string) => void;
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
  setProgress: (handler: (progress: number) => void) => void;

  locateFile: (path: string, prefix: string) => string;
}

export type FFmpegCoreModuleFactory = (
  moduleOverrides?: Partial<FFmpegCoreModule>
) => Promise<FFmpegCoreModule>;
