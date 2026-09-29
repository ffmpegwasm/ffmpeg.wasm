// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/820 (also #563, #704): each exec() leaked wasm stack.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, times } from "../../helpers/run.js";

const writeWav = ({ core, dir }) => exec(core, "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/a.wav`);

test("keeps working after 10000 commands", { timeout: 120000 }, async ({ core, dir }) => {
  // this trapped at ~6800 calls
  await times(10000, () => core.exec("-h"));
  const result = await writeWav({ core, dir });
  expect(result.ret).to.equal(0);
});

test("exec() leaves the stack pointer where it was", async ({ core, dir }) => {
  const before = core.stackSave();
  await writeWav({ core, dir });
  await core.exec("-i", `${dir}/missing.mp4`, `${dir}/o.mp4`);
  await core.exec("-h");
  const after = core.stackSave();
  expect(after).to.equal(before);
});

test("ffprobe() leaves the stack pointer where it was", async ({ core, dir }) => {
  const before = core.stackSave();
  await core.ffprobe("-h");
  await core.ffprobe(`${dir}/missing.mp4`);
  const after = core.stackSave();
  expect(after).to.equal(before);
});
