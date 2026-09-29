import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, ffprobe } from "../../helpers/run.js";

test("receives { type, message } objects", async ({ core }) => {
  const { logs } = await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(logs.length).to.be.above(0);
  logs.forEach((l) => expect(l).toEqual({ type: expect.stringMatching(/^std(out|err)$/), message: expect.any(String) }));
});

test("gets ffmpeg's log (stderr)", async ({ core }) => {
  const { logs } = await exec(core, "-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(logs.some((l) => l.type === "stderr" && /Input #0, lavfi/.test(l.message))).to.equal(true);
});

test("gets ffprobe's output (stdout)", async ({ core }) => {
  const { logs } = await ffprobe(core, "-v", "quiet", "-f", "lavfi", "-show_entries", "stream=width", "-of", "csv=p=0", "nullsrc=s=24x16:d=0.1");
  expect(logs.filter((l) => l.type === "stdout").map((l) => l.message.trim())).to.include("24");
});

test("a replaced logger stops receiving messages", async ({ core }) => {
  const first = [];
  core.setLogger((l) => first.push(l));
  core.setLogger(() => {});
  await core.exec("-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-");
  expect(first).to.have.length(0);
});
