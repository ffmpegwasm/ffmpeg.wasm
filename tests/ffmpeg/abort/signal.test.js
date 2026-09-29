import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("rejects exec() with an AbortError", async ({ ffmpeg }) => {
  const controller = new AbortController();
  const p = ffmpeg.exec(["-f", "lavfi", "-i", "testsrc=d=1:s=16x16", "-f", "null", "-"], -1, { signal: controller.signal });
  controller.abort();
  await expect(p).rejects.toHaveProperty("name", "AbortError");
});

test("rejects file calls with an AbortError", async ({ ffmpeg }) => {
  const controller = new AbortController();
  const p = ffmpeg.listDir("/", { signal: controller.signal });
  controller.abort();
  await expect(p).rejects.toHaveProperty("name", "AbortError");
});
