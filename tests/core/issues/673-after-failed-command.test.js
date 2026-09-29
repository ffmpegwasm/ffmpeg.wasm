// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/673 (also #665):
// with FFmpeg 5.1, after a command failed early (e.g. a missing input), the
// next commands trapped with "memory access out of bounds" until the core was
// reloaded. FFmpeg 9 returns from errors instead of aborting.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("commands keep working after a failed one", ({ core, dir }) => {
  const failed = core.exec("-i", `${dir}/missing.mp4`, `${dir}/o.mp4`);
  const helps = Array.from({ length: 20 }, () => core.exec("-h"));
  const real = exec(core, "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/a.wav`);
  expect(failed).to.not.equal(0);
  expect(helps).toEqual(Array(20).fill(0));
  expect(real.ret).to.equal(0);
});
