// send_progress() in the patched print_report() reports progress = pts /
// longest input duration, and always ends with progress 1.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { testdata } from "../../helpers/testdata.js";

const run = ({ core }, ...args) => {
  const events = [];
  core.setProgress((e) => events.push(e));
  const ret = core.exec(...args);
  return { ret, events };
};

test("reports increasing progress ending at 1", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/in.avi`, await testdata("video-3s.avi"));
  const { ret, events } = run({ core }, "-i", `${dir}/in.avi`, `${dir}/out.mp4`);
  expect(ret).to.equal(0);
  expect(events.length).to.be.above(0);
  const progress = events.map((e) => e.progress);
  expect(progress.at(-1)).to.equal(1);
  expect(progress).toEqual(progress.toSorted((a, b) => a - b));
});

test("reports time in microseconds of output timestamps", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/in.wav`, await testdata("audio-3s.wav"));
  const { events } = run({ core }, "-i", `${dir}/in.wav`, `${dir}/out.wav`);
  expect(events.at(-1).time).to.be.closeTo(3e6, 1e5);
});

test("still ends at 1 when the output is trimmed", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/in.wav`, await testdata("audio-3s.wav"));
  const { events } = run({ core }, "-i", `${dir}/in.wav`, "-t", "1", `${dir}/out.wav`);
  expect(events.at(-1).progress).to.equal(1);
});

test("is not called after setProgress(() => {})", async ({ core, dir }) => {
  const events = [];
  core.setProgress((e) => events.push(e));
  core.setProgress(() => {});
  core.FS.writeFile(`${dir}/in.wav`, await testdata("audio-1s.wav"));
  core.exec("-i", `${dir}/in.wav`, `${dir}/out.wav`);
  expect(events).to.deep.equal([]);
});

test("never reports negative progress when the input duration is unknown", ({ core }) => {
  const { events } = run({ core }, "-f", "lavfi", "-i", "testsrc=d=1:s=16x16", "-f", "null", "-");
  events.forEach((e) => expect(e.progress).to.be.within(0, 1));
});
