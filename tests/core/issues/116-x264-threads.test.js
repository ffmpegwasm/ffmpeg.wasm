// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/116 (also #212, #359): x264's threads overflowed their stack.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const INPUT = ["-f", "lavfi", "-i", "testsrc2=s=854x480:r=30:d=0.5", "-c:v", "libx264"];

test.for([
  ["-preset veryfast", ["-preset", "veryfast"]],
  ["-preset faster", ["-preset", "faster"]],
  ["the default preset (#359)", []],
  ["sliced threads", ["-x264-params", "sliced-threads=1"]],
  ["4 lookahead threads", ["-x264-params", "lookahead-threads=4"]],
])("encodes with %s", async ([, options], { core, dir }) => {
  const { ret, log } = await exec(core, ...INPUT, ...options, `${dir}/out.mp4`);
  expect(ret, log).to.equal(0);
});

test("encodes in two passes (#212)", async ({ core, dir }) => {
  const passlog = ["-passlogfile", `${dir}/x264`];
  const firstPass = await exec(core, ...INPUT, "-b:v", "160k", "-pass", "1", ...passlog, "-f", "mp4", "/dev/null");
  const secondPass = await exec(core, ...INPUT, "-b:v", "160k", "-pass", "2", ...passlog, `${dir}/out.mp4`);
  expect(firstPass.ret, firstPass.log).to.equal(0);
  expect(secondPass.ret, secondPass.log).to.equal(0);
});
