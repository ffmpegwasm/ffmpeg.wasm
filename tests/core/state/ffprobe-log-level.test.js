import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, ffprobe } from "../../helpers/run.js";

const banner = (core) =>
  exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-").log.includes("ffmpeg version");

test("ffprobe -v in one call does not leak into ffmpeg", ({ core }) => {
  ffprobe(core, "-v", "error", "-f", "lavfi", "nullsrc=s=16x16:d=0.1");
  expect(banner(core)).to.equal(true);
});
