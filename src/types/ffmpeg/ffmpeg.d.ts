type Pointer = number;
type StringPointer = Pointer;
type StringArrayPointer = Pointer;

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

export interface FFmpegModule {
  DEFAULT_ARGS: string[];
  FS: FS;
  NULL: Pointer;
  SIZE_I32: number;

  ret: number;
  timeout: number;

  exec: (args: string[]) => number;
  reset: () => void;
  setLogger: (logger: (log: Log) => void) => void;
  setTimeout: (timeout: number) => void;
  setProgress: (handler: (progress: number) => void) => void;

  _ffmpeg: (args: number, argv: StringArrayPointer) => number;
  stringToPtr: (str: string) => Pointer;
  stringsToPtr: (strs: string[]) => Pointer;
}

declare function createFFmpeg(): Promise<FFmpegModule>;
export default createFFmpeg;
