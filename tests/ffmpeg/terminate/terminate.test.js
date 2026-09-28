import { expect } from "vitest";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test("rejects pending calls with the terminate error", async ({ unloaded }) => {
  await unloaded.load({ coreURL: coreURL() });
  const pending = unloaded.exec(["-f", "lavfi", "-i", "testsrc=d=600", "-f", "null", "-"]);
  unloaded.terminate();
  await expect(pending).rejects.toThrow(/terminate/);
});

test("rejects calls made after terminate()", async ({ unloaded }) => {
  await unloaded.load({ coreURL: coreURL() });
  unloaded.terminate();
  const listing = unloaded.listDir("/");
  await expect(listing).rejects.toThrow(/not loaded/);
});

test("can load again after terminate(), with a fresh file system", async ({ unloaded }) => {
  await unloaded.load({ coreURL: coreURL() });
  await unloaded.writeFile("/before", "x");
  unloaded.terminate();
  const isFirst = await unloaded.load({ coreURL: coreURL() });
  const names = (await unloaded.listDir("/")).map((n) => n.name);
  expect(isFirst).to.equal(true);
  expect(names).to.not.include("before");
});

test("is a no-op when never loaded", () => {
  expect(() => new FFmpeg().terminate()).to.not.throw();
});
