// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/820 (also #563, #704): each exec() leaked wasm stack.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const writeWav = ({ core, dir }) => exec(core, "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/a.wav`);

test("keeps working after 10000 commands", { timeout: 120000 }, ({ core, dir }) => {
  // this trapped at ~6800 calls
  Array.from({ length: 10000 }).forEach(() => core.exec("-h"));
  const result = writeWav({ core, dir });
  expect(result.ret).to.equal(0);
});

test("exec() leaves the stack pointer where it was", ({ core, dir }) => {
  const before = core.stackSave();
  writeWav({ core, dir });
  core.exec("-i", `${dir}/missing.mp4`, `${dir}/o.mp4`);
  core.exec("-h");
  const after = core.stackSave();
  expect(after).to.equal(before);
});

test("ffprobe() leaves the stack pointer where it was", ({ core, dir }) => {
  const before = core.stackSave();
  core.ffprobe("-h");
  core.ffprobe(`${dir}/missing.mp4`);
  const after = core.stackSave();
  expect(after).to.equal(before);
});
