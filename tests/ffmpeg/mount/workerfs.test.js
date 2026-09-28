import { expect } from "vitest";
import { test, testdata } from "../../helpers/ffmpeg.js";

test("mounts Files and Blobs with WORKERFS and ffmpeg reads them", async ({ ffmpeg, dir }) => {
  const mnt = `${dir}/mnt`;
  await ffmpeg.createDir(mnt);
  const wav = await testdata("audio-1s.wav");
  const ok = await ffmpeg.mount("WORKERFS", {
    files: [new File([wav], "file.wav")],
    blobs: [{ name: "blob.wav", data: new Blob([wav]) }],
  }, mnt);
  const mounted = (await ffmpeg.listDir(mnt)).map((n) => n.name);
  const ret = await ffmpeg.exec(["-i", `${mnt}/blob.wav`, `${dir}/o.mp3`]);
  await ffmpeg.unmount(mnt);
  const unmounted = (await ffmpeg.listDir(mnt)).map((n) => n.name);
  expect(ok).to.equal(true);
  expect(mounted).to.include.members(["file.wav", "blob.wav"]);
  expect(ret).to.equal(0);
  expect(unmounted).to.deep.equal([".", ".."]);
});

test("returns false for an unknown file system", async ({ ffmpeg, dir }) => {
  await ffmpeg.createDir(`${dir}/m2`);
  const ok = await ffmpeg.mount("NOPEFS", {}, `${dir}/m2`);
  expect(ok).to.equal(false);
});
