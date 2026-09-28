// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/898 (also #511): libx265 hung the single-thread core.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec, probe } from "../../helpers/run.js";

const encode = ({ core, dir }) =>
  exec(core, "-f", "lavfi", "-i", "testsrc=d=0.4:s=64x48:r=10", "-c:v", "libx265", `${dir}/out.mp4`);

if (isMT()) {
  test("encodes HEVC with libx265", ({ core, dir }) => {
    const { ret } = encode({ core, dir });
    const [stream] = probe(core, `${dir}/out.mp4`).streams;
    expect(ret).to.equal(0);
    expect(stream.codec_name).to.equal("hevc");
  });
} else {
  test("fails right away with a clear error instead of hanging", ({ core, dir }) => {
    const { ret, log } = encode({ core, dir });
    expect(ret).to.not.equal(0);
    expect(log).to.match(/Unknown encoder 'libx265'/);
  });
}
