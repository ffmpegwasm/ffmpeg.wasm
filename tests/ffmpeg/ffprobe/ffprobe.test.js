import { expect } from "vitest";
import { test, testdata } from "../../helpers/ffmpeg.js";

test("writes the probe result to a file", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/v.mp4`, await testdata("video-1s.mp4"));
  await ffmpeg.ffprobe([
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
    `${dir}/v.mp4`, "-o", `${dir}/d.txt`,
  ]);
  const duration = Number(await ffmpeg.readFile(`${dir}/d.txt`, "utf8"));
  expect(duration).to.be.closeTo(1, 0.1);
});

test("resolves 0 on success", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/v.mp4`, await testdata("video-1s.mp4"));
  const ret = await ffmpeg.ffprobe([`${dir}/v.mp4`]);
  expect(ret).to.equal(0);
});

test("returns non-zero for a missing file", async ({ ffmpeg, dir }) => {
  const ret = await ffmpeg.ffprobe([`${dir}/missing.mp4`]);
  expect(ret).to.not.equal(0);
});
