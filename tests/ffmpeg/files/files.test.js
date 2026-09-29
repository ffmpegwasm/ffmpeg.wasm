import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("writes and reads text", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/t`, "héllo");
  const text = await ffmpeg.readFile(`${dir}/t`, "utf8");
  expect(text).to.equal("héllo");
});

test("reads binary by default", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/b`, Uint8Array.from([1, 2, 3]));
  const data = await ffmpeg.readFile(`${dir}/b`);
  expect(data).to.deep.equal(Uint8Array.from([1, 2, 3]));
});

test("transfers (detaches) the written Uint8Array's buffer", async ({ ffmpeg, dir }) => {
  const data = Uint8Array.from([1, 2, 3]);
  await ffmpeg.writeFile(`${dir}/b`, data);
  expect(data.buffer.byteLength).to.equal(0);
});

test("deletes a file", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/d`, "x");
  const ok = await ffmpeg.deleteFile(`${dir}/d`);
  const names = (await ffmpeg.listDir(dir)).map((n) => n.name);
  expect(ok).to.equal(true);
  expect(names).to.not.include("d");
});

test("renames a file", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/a`, "x");
  await ffmpeg.rename(`${dir}/a`, `${dir}/b`);
  const text = await ffmpeg.readFile(`${dir}/b`, "utf8");
  expect(text).to.equal("x");
});

test("rejects when reading a missing file, saying why", async ({ ffmpeg, dir }) => {
  const reading = ffmpeg.readFile(`${dir}/missing`);
  await expect(reading).rejects.toMatch(/ENOENT/);
});

test("rejects when deleting a missing file", async ({ ffmpeg, dir }) => {
  const deleting = ffmpeg.deleteFile(`${dir}/missing`);
  await expect(deleting).rejects.toBeTruthy();
});
