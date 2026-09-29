// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/898 (also #511): libx265 hung the single-thread core.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec, probe } from "../../helpers/run.js";

const INPUT = ["-f", "lavfi", "-i", "testsrc=d=0.4:s=64x48:r=10"];

test.runIf(isMT())("encodes HEVC with libx265", ({ core, dir }) => {
  const out = `${dir}/out.mp4`;
  const { ret, log } = exec(core, ...INPUT, "-c:v", "libx265", out);
  const [stream] = probe(core, out).streams;
  expect(ret, log).to.equal(0);
  expect(stream.codec_name).to.equal("hevc");
});

test.skipIf(isMT())("fails right away with a clear error instead of hanging", ({ core, dir }) => {
  const { ret, log } = exec(core, ...INPUT, "-c:v", "libx265", `${dir}/out.mp4`);
  expect(ret).to.not.equal(0);
  expect(log).to.match(/Unknown encoder 'libx265'/);
});
