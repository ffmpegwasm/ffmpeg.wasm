// No issue: -tag values shorter than 4 characters were read past their end.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test.for([["x", "x[0][0][0]"], ["xv", "xv[0][0]"]])("zero-pads -tag:v %s", async ([tag, expected], { core, dir }) => {
  // avi rejects the tag for mpeg4, and the error shows the tag it parsed.
  const { log } = await exec(core,
    "-f", "lavfi", "-i", "testsrc=d=0.1:s=16x16", "-c:v", "mpeg4", "-tag:v", tag, `${dir}/out.avi`);
  expect(log).to.include(`Tag ${expected} incompatible`);
});
