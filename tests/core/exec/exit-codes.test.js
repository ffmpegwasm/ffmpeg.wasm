// exec() returns ffmpeg()'s exit code.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, makeMedia } from "../../helpers/run.js";

test("returns 0 on success", async ({ core }) => {
  const { ret } = await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(ret).to.equal(0);
});

test("returns non-zero for an unknown option", async ({ core }) => {
  const { ret, log } = await exec(core, "-definitely-not-an-option");
  expect(ret).to.not.equal(0);
  expect(log).to.match(/Unrecognized option/);
});

test("returns non-zero when the input does not exist", async ({ core, dir }) => {
  const { ret, log } = await exec(core, "-i", `${dir}/missing.mp4`, `${dir}/out.mp4`);
  expect(ret).to.not.equal(0);
  expect(log).to.match(/No such file or directory/);
});

test("returns non-zero for an unknown encoder", async ({ core, dir }) => {
  const { ret } = await exec(
    core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-c:v", "no-such-encoder", `${dir}/o.mp4`
  );
  expect(ret).to.not.equal(0);
});

test("returns non-zero when no output is given", async ({ core }) => {
  const { ret } = await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1");
  expect(ret).to.not.equal(0);
});

test("exec() returns the same value it leaves in core.ret", async ({ core }) => {
  const ret = await core.exec("-definitely-not-an-option");
  expect(ret).to.equal(core.ret);
});

test("does not throw to the caller when ffmpeg aborts", async ({ core }) => {
  const ret = await core.exec("-i");
  expect(ret).to.not.equal(0);
});

test("logs no \"Aborted()\" line after a successful run", async ({ core }) => {
  const { logs } = await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(logs.map((l) => l.message).filter((m) => m.startsWith("Aborted("))).to.be.empty;
});

test("works on a real file after a failure", async ({ core, dir }) => {
  await exec(core, "-bogus");
  await makeMedia(core, `${dir}/a.mp4`, ["-f", "lavfi", "-i", "testsrc=d=0.2:s=32x32:r=10"]);
  expect(core.FS.stat(`${dir}/a.mp4`).size).to.be.above(0);
});
