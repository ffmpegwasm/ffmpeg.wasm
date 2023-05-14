interface FFmpegCore extends EmscriptenModule {
  //flags
  thread: boolean;
  wasi: boolean;
  // methods
  addFunction: typeof addFunction;
  ccall: typeof ccall;
  cwrap: typeof cwrap;
  exit: () => boolean;
  FS: typeof FS;
  lengthBytesUTF8: typeof lengthBytesUTF8;
  setValue: typeof setValue;
  stringToUTF8: typeof stringToUTF8;
}

type FFmpegCoreConstructor = EmscriptenModuleFactory<FFmpegCore>;

export type { FFmpegCore, FFmpegCoreConstructor };
