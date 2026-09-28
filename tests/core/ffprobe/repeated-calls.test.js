// ffprobe keeps its options in globals, and ffprobe() runs many times in one
// module, so each call must start from a clean state (reset in the patched
// ffprobe.c) and must not disturb ffmpeg().
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { ffprobe, makeMedia } from "../../helpers/run.js";

const probe = ({ core, dir }, ...args) => {
  const file = `${dir}/a.mp4`;
  if (!core.FS.analyzePath(file).exists) makeMedia(core, file, ["-f", "lavfi", "-i", "testsrc=d=0.2:s=16x16:r=10"]);
  ffprobe(core, "-v", "error", "-of", "json", ...args, file, "-o", `${dir}/p.json`);
  return JSON.parse(core.FS.readFile(`${dir}/p.json`, { encoding: "utf8" }));
};

test("does not keep -select_streams for the next call", ({ core, dir }) => {
  const audioOnly = probe({ core, dir }, "-show_streams", "-select_streams", "a");
  const all = probe({ core, dir }, "-show_streams");
  expect(audioOnly.streams).to.have.length(0);
  expect(all.streams).to.have.length(1);
});

test("keeps working when calls alternate with ffmpeg", ({ core, dir }) => {
  const round = (i) => {
    const streams = probe({ core, dir }, "-show_format").format.nb_streams;
    makeMedia(core, `${dir}/b${i}.wav`, ["-f", "lavfi", "-i", "sine=d=0.1"]);
    return streams;
  };
  const streamCounts = [0, 1, 2].map(round);
  expect(streamCounts).toEqual([1, 1, 1]);
});
