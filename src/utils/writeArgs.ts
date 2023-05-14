import type { FFmpegCore } from "../types";

/**
 * Write arguments to memory
 * @param core FFmpeg core
 * @param args array of arguments
 * @returns a pointer
 */
export const writeArgs = (core: FFmpegCore, args: string[]) => {
  const argsPtr = core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((arg, idx) => {
    const strLength = core.lengthBytesUTF8(arg) + 1;
    const buf = core._malloc(strLength);
    core.stringToUTF8(arg, buf, strLength);
    core.setValue(argsPtr + Uint32Array.BYTES_PER_ELEMENT * idx, buf, "i32");
  });
  return argsPtr;
};
