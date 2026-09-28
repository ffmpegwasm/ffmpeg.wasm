// ffmpeg() is called many times in one module instance; init_globals() in the
// patched ffmpeg.c resets the state main() would normally start from.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, probe } from "../../helpers/run.js";

test("produces identical output across 5 runs", ({ core, dir }) => {
  const run = (i) => {
    const out = `${dir}/o${i}.y4m`;
    const result = exec(core, "-f", "lavfi", "-i", "testsrc=d=0.3:s=32x24:r=10", "-pix_fmt", "yuv420p", "-f", "yuv4mpegpipe", out);
    expect(result.ret).to.equal(0);
    return core.FS.readFile(out);
  };
  const outputs = Array.from({ length: 5 }, (_, i) => run(i));
  const [first, ...rest] = outputs;
  rest.forEach((output) => expect(output).toEqual(first));
});

test("does not carry input/output files over to the next run", ({ core, dir }) => {
  exec(core, "-f", "lavfi", "-i", "sine=d=0.2", `${dir}/a.wav`);
  exec(core, "-f", "lavfi", "-i", "testsrc=d=0.2:s=16x16:r=5", `${dir}/b.mp4`);
  const b = probe(core, `${dir}/b.mp4`);
  expect(b.streams.map((s) => s.codec_type)).to.deep.equal(["video"]);
});

test("frame counters restart each run", ({ core }) => {
  const frameCount = () => {
    const { log } = exec(core, "-loglevel", "info", "-f", "lavfi", "-i", "testsrc=d=1:s=16x16:r=10", "-f", "null", "-");
    return Number([...log.matchAll(/frame=\s*(\d+)/g)].at(-1)[1]);
  };
  const first = frameCount();
  const second = frameCount();
  expect(first).to.equal(10);
  expect(second).to.equal(10);
});

test("survives 30 back-to-back runs (no leak or state build-up)", { timeout: 120000 }, ({ core }) => {
  const run = () => exec(core, "-f", "lavfi", "-i", "testsrc=d=0.1:s=16x16:r=10", "-f", "null", "-").ret;
  const exitCodes = Array.from({ length: 30 }, run);
  expect(exitCodes).toEqual(Array(30).fill(0));
});
