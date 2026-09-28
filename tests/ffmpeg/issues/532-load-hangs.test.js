// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/532 (also #815): load() hung when the worker failed to load.
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("rejects when the worker script is missing", async ({ unloaded }) => {
  const loading = unloaded.load({ classWorkerURL: `${location.origin}/missing-worker.js` });
  await expect(loading).rejects.toThrow(/worker/);
  expect(unloaded.loaded).to.equal(false);
});

test("rejects when the worker script throws", async ({ unloaded }) => {
  const classWorkerURL = URL.createObjectURL(new Blob(["throw new Error('boom')"], { type: "text/javascript" }));
  const loading = unloaded.load({ classWorkerURL });
  await expect(loading).rejects.toThrow(/worker/);
});
