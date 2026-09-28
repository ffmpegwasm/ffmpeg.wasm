// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/719 (also #620,
// #187): aborting exec() rejects its promise, but the command keeps running in
// the worker, so every later call waits for it to finish.
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test.runIf(crossOriginIsolated)("an aborted exec() stops running", { timeout: 120000 }, async ({ ffmpeg }) => {
  const controller = new AbortController();
  const running = ffmpeg.exec(
    ["-f", "lavfi", "-i", "testsrc2=s=1280x720:d=600", "-c:v", "libx264", "-f", "null", "-"],
    -1,
    { signal: controller.signal }
  );
  setTimeout(() => controller.abort(), 500);
  await expect(running).rejects.toHaveProperty("name", "AbortError");

  const start = performance.now();
  await Promise.race([ffmpeg.listDir("/"), new Promise((resolve) => setTimeout(resolve, 10000))]);
  const elapsed = performance.now() - start;
  expect(elapsed).to.be.below(10000);
});
