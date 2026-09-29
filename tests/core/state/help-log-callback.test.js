// -h, -version, -buildconf and friends switch FFmpeg to its help log callback,
// which prints every message regardless of -loglevel.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("-version does not change how later commands log", async ({ core }) => {
  await core.exec("-version");
  const { logs } = await exec(core, "-loglevel", "error", "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(logs).to.have.length(0);
});
