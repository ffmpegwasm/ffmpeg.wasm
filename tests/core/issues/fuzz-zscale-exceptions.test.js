// Found by `pnpm fuzz`: zimg (the zscale filter) reports errors by
// throwing C++ exceptions it catches itself. The core was built without
// exception support, so any zscale error aborted the whole module.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("an invalid zscale size is an error, not a crash", ({ core }) => {
  const run = (vf) => exec(core, "-f", "lavfi", "-i", "color=c=red:s=64x48:d=0.3", "-vf", vf, "-f", "null", "-").ret;
  expect(() => run("zscale=w=3:h=-1")).to.not.throw();
  expect(run("zscale=w=32:h=24")).to.equal(0);
});
