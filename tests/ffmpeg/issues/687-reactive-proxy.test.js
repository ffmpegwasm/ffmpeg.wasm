// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/687 (also #858,
// #907): Vue's reactive() wraps the instance in a Proxy, and methods that read
// #private fields through it throw "Cannot read private member".
import { expect } from "vitest";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { test } from "../../helpers/ffmpeg.js";

test("works through a Proxy, like Vue's reactive()", () => {
  const ffmpeg = new Proxy(new FFmpeg(), {});
  ffmpeg.on("log", () => {});
  ffmpeg.off("log", () => {});
});
