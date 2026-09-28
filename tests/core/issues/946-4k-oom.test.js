// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/946 (also #717, #511): core-mt ran out of memory on 4K.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, makeMedia } from "../../helpers/run.js";

test("scales a 4K H.264 clip down to 1080p", { timeout: 300000 }, ({ core, dir }) => {
  const input = `${dir}/4k.mp4`;
  makeMedia(core, input, ["-f", "lavfi", "-i", "testsrc2=s=3840x2160:r=30:d=0.2"], ["-c:v", "libx264", "-preset", "ultrafast"]);
  const { ret, log } = exec(core,
    "-i", input, "-vf", "scale=1920:1080", "-an", "-c:v", "libx264", `${dir}/out.mp4`);
  expect(ret, log).to.equal(0);
});
