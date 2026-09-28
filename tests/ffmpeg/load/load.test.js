import { expect } from "vitest";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test("load() resolves true for a new instance", async ({ unloaded }) => {
  const isFirst = await unloaded.load({ coreURL: coreURL() });
  expect(isFirst).toBe(true);
});

test("loaded follows load() and terminate()", async ({ unloaded }) => {
  expect(unloaded.loaded).toBe(false);
  await unloaded.load({ coreURL: coreURL() });
  expect(unloaded.loaded).toBe(true);
  unloaded.terminate();
  expect(unloaded.loaded).toBe(false);
});

test("load() rejects when the core can't be fetched", async ({ unloaded }) => {
  const loading = unloaded.load({ coreURL: `${location.origin}/missing/ffmpeg-core.js` });
  await expect(loading).rejects.toBeTruthy();
});
