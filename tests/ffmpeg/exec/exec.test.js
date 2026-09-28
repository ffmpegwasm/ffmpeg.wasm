import { expect } from "vitest";
import { test, testdata } from "../../helpers/ffmpeg.js";

test("returns 0 on success", async ({ ffmpeg }) => {
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "nullsrc=s=16x16:d=0.1", "-f", "null", "-"]);
  expect(ret).to.equal(0);
});

test("returns non-zero on failure", async ({ ffmpeg, dir }) => {
  const ret = await ffmpeg.exec(["-i", `${dir}/missing.mp4`, `${dir}/o.mp4`]);
  expect(ret).to.not.equal(0);
});

test("transcodes a written file and the output can be read back", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/in.avi`, await testdata("video-1s.avi"));
  const ret = await ffmpeg.exec(["-i", `${dir}/in.avi`, `${dir}/out.mp4`]);
  const out = await ffmpeg.readFile(`${dir}/out.mp4`);
  const boxType = new TextDecoder().decode(out.slice(4, 8));
  expect(ret).to.equal(0);
  expect(out).to.be.an.instanceof(Uint8Array);
  expect(boxType).to.equal("ftyp");
});

test("returns 1 when the timeout expires", async ({ ffmpeg }) => {
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "testsrc=d=600", "-f", "null", "-"], 50);
  expect(ret).to.equal(1);
});

test("runs normally after a timeout", async ({ ffmpeg }) => {
  await ffmpeg.exec(["-f", "lavfi", "-i", "testsrc=d=600", "-f", "null", "-"], 20);
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "testsrc=d=0.2", "-f", "null", "-"]);
  expect(ret).to.equal(0);
});

test("runs many commands on one instance", async ({ ffmpeg, dir }) => {
  const run = (i) => ffmpeg.exec(["-f", "lavfi", "-i", "sine=d=0.1", `${dir}/${i}.wav`]);
  // The worker runs them one after another, in order.
  const exitCodes = await Promise.all(Array.from({ length: 10 }, (_, i) => run(i)));
  const files = (await ffmpeg.listDir(dir)).filter((n) => !n.isDir);
  expect(exitCodes).toEqual(Array(10).fill(0));
  expect(files).to.have.length(10);
});
