// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/898 (also #511): libx265 hung the single-thread core.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec, probe } from "../../helpers/run.js";

const INPUT = ["-f", "lavfi", "-i", "testsrc=d=0.4:s=64x48:r=10"];

test.runIf(isMT())("encodes HEVC with libx265", async ({ core, dir }) => {
  const out = `${dir}/out.mp4`;
  const { ret, log } = await exec(core, ...INPUT, "-c:v", "libx265", out);
  const [stream] = (await probe(core, out)).streams;
  expect(ret, log).to.equal(0);
  expect(stream.codec_name).to.equal("hevc");
});

test.skipIf(isMT())("fails right away with a clear error instead of hanging", async ({ core, dir }) => {
  const { ret, log } = await exec(core, ...INPUT, "-c:v", "libx265", `${dir}/out.mp4`);
  expect(ret).to.not.equal(0);
  expect(log).to.match(/Unknown encoder 'libx265'/);
});
