import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { ffprobe, makeMedia } from "../../helpers/run.js";
import { testdata } from "../../helpers/testdata.js";

test("writes JSON to a file with -o", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/v.mp4`, await testdata("video-1s.mp4"));
  const out = `${dir}/probe.json`;
  ffprobe(core, "-v", "error", "-of", "json", "-show_format", `${dir}/v.mp4`, "-o", out);
  const json = JSON.parse(core.FS.readFile(out, { encoding: "utf8" }));
  expect(json.format.format_name).to.include("mp4");
});

test.fails("returns 0 after probing a file (#817)", ({ core, dir }) => {
  makeMedia(core, `${dir}/a.wav`, ["-f", "lavfi", "-i", "sine=d=0.1"]);
  const ret = core.ffprobe(`${dir}/a.wav`);
  expect(ret).to.equal(0);
});

test("prints to the logger as stdout without -o", ({ core, dir }) => {
  makeMedia(core, `${dir}/a.wav`, ["-f", "lavfi", "-i", "sine=d=0.5"]);
  const { logs } = ffprobe(core, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${dir}/a.wav`);
  const stdout = logs.filter((l) => l.type === "stdout").map((l) => l.message);
  expect(stdout[0]).to.match(/^0\.500000/);
});

test("returns non-zero for a missing file", ({ core, dir }) => {
  const result = ffprobe(core, `${dir}/missing.mp4`);
  expect(result.ret).to.not.equal(0);
});

test("returns non-zero without an input", ({ core }) => {
  const result = ffprobe(core, "-show_format");
  expect(result.ret).to.not.equal(0);
});
