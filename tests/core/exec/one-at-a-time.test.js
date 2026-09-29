// The JSPI core's exec() returns before the command finishes; a second call
// meanwhile would interleave with it in the same module.
import { expect, inject } from "vitest";
import { test } from "../../helpers/core.js";

const NULL_JOB = ["-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-"];

test.runIf(inject("core") === "jspi")("rejects a second command while one runs", async ({ core }) => {
  const first = core.exec(...NULL_JOB);
  const overlapping = () => core.exec("-h");
  expect(overlapping).toThrow(/one command at a time/);
  const firstRet = await first;
  expect(firstRet).to.equal(0);
});

test("runs the next command once the previous one finished", async ({ core }) => {
  const firstRet = await core.exec(...NULL_JOB);
  const nextRet = await core.exec("-h");
  expect(firstRet).to.equal(0);
  expect(nextRet).to.equal(0);
});
