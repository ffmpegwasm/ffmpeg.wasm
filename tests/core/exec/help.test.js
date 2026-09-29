import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("returns 0 for -h", async ({ core }) => {
  const ret = await core.exec("-h");
  expect(ret).to.equal(0);
});

test("prints the usage banner through the logger", async ({ core }) => {
  const { ret, log } = await exec(core, "-h");
  expect(ret).to.equal(0);
  expect(log).to.match(/usage: ffmpeg/i);
});

test("ffprobe -h returns 0", async ({ core }) => {
  const ret = await core.ffprobe("-h");
  expect(ret).to.equal(0);
});
