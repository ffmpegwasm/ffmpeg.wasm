/// <reference types="emscripten" />

type Pointer = number;
type StringArrayPointer = Pointer;

interface FFmpegCoreModule extends EmscriptenModule {
  _ffmpeg: (number, StringArrayPointer) => number;
}
declare const createFFmpegCore: EmscriptenModuleFactory<FFmpegCoreModule>;
export default createFFmpegCore;
