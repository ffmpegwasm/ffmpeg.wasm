// Documents https://github.com/ffmpegwasm/ffmpeg.wasm/issues/911 (also #745):
// writeFile() transfers the caller's buffer to the worker, so the caller's
// Uint8Array is empty afterwards.
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test.fails("leaves the caller's data intact (#911)", async ({ ffmpeg, dir }) => {
  const data = new Uint8Array([1, 2, 3]);
  await ffmpeg.writeFile(`${dir}/a.bin`, data);
  expect(data.length).to.equal(3);
});
