import type { Stats } from "node:fs";

type Interface<T> = { [K in keyof T]: T[K] };
type EmscriptenFSStats = Pick<
  Stats,
  "atimeMs" | "mtimeMs" | "ctimeMs" | "birthtimeMs"
>;

// Provide more detailed type definitions
interface FFmpegFileSystem extends Interface<typeof FS> {
  mount: (
    type: Emscripten.FileSystemType,
    opts: object,
    mountpoint: string
  ) => void;
  mkdir(path: string, mode?: number): void;
  mkdev(path: string, mode?: number, dev?: number): void;
  symlink(oldpath: string, newpath: string): void;
  readdir(path: string): string[];
  stat(path: string, dontFollow?: boolean): EmscriptenFSStats;
  lstat(path: string): EmscriptenFSStats;
  llseek(stream: FS.FSStream, offset: number, whence: number): void;
}

export type { FFmpegFileSystem };
