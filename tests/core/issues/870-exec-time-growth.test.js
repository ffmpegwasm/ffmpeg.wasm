// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/870: the same
// command took longer on every run. It measures this process's CPU time
// (FFmpeg's threads included), which other test files running in parallel
// don't affect, unlike wall time.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, times } from "../../helpers/run.js";

test("runs the same command in about the same time every time", { timeout: 300000 }, async ({ core, dir }) => {
  const run = async () => {
    const start = process.cpuUsage();
    const { ret, log } = await exec(core,
      "-f", "lavfi", "-i", "testsrc2=s=640x360:d=1", "-c:v", "libx264", "-preset", "ultrafast", `${dir}/o.mp4`);
    expect(ret, log).to.equal(0);
    const { user, system } = process.cpuUsage(start);
    return user + system;
  };
  const cpuTimes = await times(20, run);
  const median = (xs) => xs.toSorted((a, b) => a - b)[Math.floor(xs.length / 2)];
  expect(median(cpuTimes.slice(-5))).to.be.below(median(cpuTimes.slice(1, 6)) * 2);
});
