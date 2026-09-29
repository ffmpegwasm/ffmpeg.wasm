import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const banner = async (core) =>
  (await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-")).log.includes("ffmpeg version");

test("prints the banner by default", async ({ core }) => {
  expect(await banner(core)).to.equal(true);
});

test("-loglevel in one call does not leak into the next", async ({ core }) => {
  await exec(core, "-loglevel", "error", "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(await banner(core)).to.equal(true);
});
