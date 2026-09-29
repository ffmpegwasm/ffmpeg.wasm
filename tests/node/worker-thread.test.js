// @ffmpeg/ffmpeg from inside a worker_threads worker
import { expect, test } from "vitest";
import { Worker } from "node:worker_threads";

test("runs a command from a worker thread", async () => {
  const worker = new Worker(new URL("./worker-thread.mjs", import.meta.url));
  const result = await new Promise((resolve, reject) => {
    worker.once("message", resolve);
    worker.once("error", reject);
  });
  await worker.terminate();
  expect(result.ret).toBe(0);
  expect(result.size).toBeGreaterThan(44);
});
