// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/911 (also #745):
// writeFile() transfers the caller's buffer to the worker, so the caller's
// Uint8Array is empty afterwards. That's the default, since it avoids a copy;
// { transfer: false } keeps the data.
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("{ transfer: false } leaves the caller's data intact", async ({ ffmpeg, dir }) => {
  const data = new Uint8Array([1, 2, 3]);
  await ffmpeg.writeFile(`${dir}/a.bin`, data, { transfer: false });
  const written = await ffmpeg.readFile(`${dir}/a.bin`);
  expect(data).toEqual(new Uint8Array([1, 2, 3]));
  expect(written).toEqual(new Uint8Array([1, 2, 3]));
});
