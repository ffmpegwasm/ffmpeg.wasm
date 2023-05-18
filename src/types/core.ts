import type { FFmpegFileSystem } from "./fs";

interface FFmpegCore extends EmscriptenModule {
  //flags
  simd: boolean;
  thread: boolean;
  wasi: boolean;
  // methods
  addFunction: typeof addFunction;
  ccall: typeof ccall;
  cwrap: typeof cwrap;
  exit: () => boolean;
  FS: FFmpegFileSystem;
  lengthBytesUTF8: typeof lengthBytesUTF8;
  setValue: typeof setValue;
  stringToUTF8: typeof stringToUTF8;
}

type FFmpegCoreConstructor = EmscriptenModuleFactory<FFmpegCore>;

export type { FFmpegCore, FFmpegCoreConstructor };
