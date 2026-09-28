// is_timeout() in the patched ffmpeg.c ends transcode() with exit code 1 once
// Module.timeout milliseconds have passed.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const LONG_JOB = ["-f", "lavfi", "-i", "testsrc=d=600:s=320x240", "-f", "null", "-"];
const SHORT_JOB = ["-f", "lavfi", "-i", "testsrc=d=0.5:s=16x16", "-f", "null", "-"];

test("stops a long job and returns 1", ({ core }) => {
  core.setTimeout(50);
  const start = performance.now();
  const ret = core.exec(...LONG_JOB);
  const elapsed = performance.now() - start;
  expect(ret).to.equal(1);
  expect(elapsed).to.be.below(10000);
});

test("-1 disables the timeout", ({ core }) => {
  core.setTimeout(-1);
  const ret = core.exec(...SHORT_JOB);
  expect(ret).to.equal(0);
});

test("does not fire for a job that finishes in time", ({ core }) => {
  core.setTimeout(60000);
  const ret = core.exec(...SHORT_JOB);
  expect(ret).to.equal(0);
});

test("setTimeout() stores the value on the module", ({ core }) => {
  core.setTimeout(1234);
  expect(core.timeout).to.equal(1234);
});

test("the next job runs normally after a timeout and reset()", ({ core }) => {
  core.setTimeout(20);
  core.exec(...LONG_JOB);
  core.reset();
  const result = exec(core, ...SHORT_JOB);
  expect(result.ret).to.equal(0);
});
