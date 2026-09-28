// setThreads() caps the core count FFmpeg, swscale and x264 size their thread
// pools from; the default cap is 4 (#597, #142).
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

// x264 writes its settings, e.g. "threads=6", into the stream it encodes. It
// picks 1.5 threads per core (up to a limit set by the frame height).
const x264Threads = async (core, dir) => {
  await exec(core, "-f", "lavfi", "-i", "testsrc2=s=1280x720:d=0.1", "-c:v", "libx264", `${dir}/o.h264`);
  const stream = new TextDecoder("latin1").decode(core.FS.readFile(`${dir}/o.h264`));
  return Number(stream.match(/ threads=(\d+)/)[1]);
};
const expected = (cap) => Math.floor(Math.min(navigator.hardwareConcurrency, cap) * 1.5);

test.skipIf(!isMT())("sizes thread pools for at most 4 cores by default", async ({ core, dir }) => {
  const threads = await x264Threads(core, dir);
  expect(threads).toBe(expected(4));
});

test.skipIf(!isMT()).for([1, 2, 8])("setThreads(%i) sizes them for that many cores", async (n, { core, dir }) => {
  core.setThreads(n);
  const threads = await x264Threads(core, dir);
  core.setThreads(4);
  expect(threads).toBe(expected(n));
});

test.runIf(!isMT())("the single-threaded core encodes with one thread", async ({ core, dir }) => {
  core.setThreads(8);
  const threads = await x264Threads(core, dir);
  core.setThreads(4);
  expect(threads).toBe(1);
});
