// exit_program() is patched (src/fftools/cmdutils.c) to store the exit code in
// Module.ret and abort() instead of exit(); exec() swallows the abort and
// returns Module.ret.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, makeMedia } from "../../helpers/run.js";

test("returns 0 on success", ({ core }) => {
  const { ret } = exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(ret).to.equal(0);
});

test("returns non-zero for an unknown option", ({ core }) => {
  const { ret, log } = exec(core, "-definitely-not-an-option");
  expect(ret).to.not.equal(0);
  expect(log).to.match(/Unrecognized option/);
});

test("returns non-zero when the input does not exist", ({ core, dir }) => {
  const { ret, log } = exec(core, "-i", `${dir}/missing.mp4`, `${dir}/out.mp4`);
  expect(ret).to.not.equal(0);
  expect(log).to.match(/No such file or directory/);
});

test("returns non-zero for an unknown encoder", ({ core, dir }) => {
  const { ret } = exec(
    core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-c:v", "no-such-encoder", `${dir}/o.mp4`
  );
  expect(ret).to.not.equal(0);
});

test("returns non-zero when no output is given", ({ core }) => {
  const { ret } = exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1");
  expect(ret).to.not.equal(0);
});

test("exec() returns the same value it leaves in core.ret", ({ core }) => {
  const ret = core.exec("-definitely-not-an-option");
  expect(ret).to.equal(core.ret);
});

test("does not throw to the caller when ffmpeg aborts", ({ core }) => {
  expect(() => core.exec("-i")).to.not.throw();
});

test("logs no \"Aborted()\" line after a successful run", ({ core }) => {
  const { logs } = exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(logs.map((l) => l.message).filter((m) => m.startsWith("Aborted("))).to.be.empty;
});

test("works on a real file after a failure", ({ core, dir }) => {
  exec(core, "-bogus");
  makeMedia(core, `${dir}/a.mp4`, ["-f", "lavfi", "-i", "testsrc=d=0.2:s=32x32:r=10"]);
  expect(core.FS.stat(`${dir}/a.mp4`).size).to.be.above(0);
});
