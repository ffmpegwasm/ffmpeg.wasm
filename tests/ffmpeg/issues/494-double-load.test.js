// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/494 (also #666):
// load() on a loaded instance starts a second core in the same worker without
// freeing the first, which drops the file system and leaks its memory.
import { expect } from "vitest";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test("load() again keeps the loaded core", { timeout: 60000 }, async ({ ffmpeg }) => {
  await ffmpeg.writeFile("/kept.txt", "hello");
  const isFirst = await ffmpeg.load({ coreURL: coreURL() });
  const kept = await ffmpeg.readFile("/kept.txt", "utf8");
  expect(isFirst).to.equal(false);
  expect(kept).to.equal("hello");
});
