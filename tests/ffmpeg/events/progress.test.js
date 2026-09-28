import { expect } from "vitest";
import { test, testdata } from "../../helpers/ffmpeg.js";

test("delivers progress ending at 1", async ({ ffmpeg, dir }) => {
  const events = [];
  const onProgress = (e) => events.push(e);
  ffmpeg.on("progress", onProgress);
  await ffmpeg.writeFile(`${dir}/in.avi`, await testdata("video-1s.avi"));
  await ffmpeg.exec(["-i", `${dir}/in.avi`, `${dir}/out.mp4`]);
  ffmpeg.off("progress", onProgress);
  const last = events.at(-1);
  expect(last.progress).to.equal(1);
  expect(last).toEqual({ progress: expect.any(Number), time: expect.any(Number) });
});
