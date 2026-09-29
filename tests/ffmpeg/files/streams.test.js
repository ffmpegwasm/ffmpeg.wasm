// open(), read(), write() and close(): files in chunks, e.g. a large download
// written as it arrives (#797, adapted from community PR #834).
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("writes a file in chunks", async ({ ffmpeg, dir }) => {
  const fd = await ffmpeg.open(`${dir}/f`, "w");
  const first = await ffmpeg.write(fd, Uint8Array.from([1, 2, 3]));
  const second = await ffmpeg.write(fd, Uint8Array.from([4, 5]));
  await ffmpeg.close(fd);
  const data = await ffmpeg.readFile(`${dir}/f`);
  expect(first).to.equal(3);
  expect(second).to.equal(2);
  expect(data).to.deep.equal(Uint8Array.from([1, 2, 3, 4, 5]));
});

test("reads a file in chunks until an empty read", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/f`, Uint8Array.from([1, 2, 3, 4, 5]));
  const fd = await ffmpeg.open(`${dir}/f`, "r");
  const first = await ffmpeg.read(fd, 3);
  const second = await ffmpeg.read(fd, 3);
  const end = await ffmpeg.read(fd, 3);
  await ffmpeg.close(fd);
  expect(first).to.deep.equal(Uint8Array.from([1, 2, 3]));
  expect(second).to.deep.equal(Uint8Array.from([4, 5]));
  expect(end).to.have.length(0);
});

test("reads and writes at a position", async ({ ffmpeg, dir }) => {
  await ffmpeg.writeFile(`${dir}/f`, Uint8Array.from([1, 2, 3, 4, 5]));
  const fd = await ffmpeg.open(`${dir}/f`, "r+");
  await ffmpeg.write(fd, Uint8Array.from([9]), 2);
  const middle = await ffmpeg.read(fd, 3, 1);
  await ffmpeg.close(fd);
  expect(middle).to.deep.equal(Uint8Array.from([2, 9, 4]));
});

test("rejects an unknown file descriptor, saying why", async ({ ffmpeg }) => {
  const reading = ffmpeg.read(12345, 1);
  await expect(reading).rejects.toMatch(/EBADF/);
});

test("rejects opening a missing file for reading", async ({ ffmpeg, dir }) => {
  const opening = ffmpeg.open(`${dir}/missing`, "r");
  await expect(opening).rejects.toMatch(/ENOENT/);
});
