import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("-n in one call does not leak into the next", async ({ core, dir }) => {
  await exec(core, "-n", "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/a.wav`);
  const next = await exec(core, "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/b.wav`);
  expect(next.ret).to.equal(0);
});
