import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("lists the root with the default directories", async ({ ffmpeg }) => {
  const names = (await ffmpeg.listDir("/")).map((n) => n.name);
  expect(names).to.include.members([".", "..", "tmp", "home", "dev", "proc"]);
});

test("marks directories with isDir", async ({ ffmpeg, dir }) => {
  await ffmpeg.createDir(`${dir}/sub`);
  await ffmpeg.writeFile(`${dir}/file`, "x");
  const nodes = Object.fromEntries((await ffmpeg.listDir(dir)).map((n) => [n.name, n.isDir]));
  expect(nodes).to.include({ sub: true, file: false });
});

test("deletes an empty directory", async ({ ffmpeg, dir }) => {
  await ffmpeg.createDir(`${dir}/e`);
  await ffmpeg.deleteDir(`${dir}/e`);
  const names = (await ffmpeg.listDir(dir)).map((n) => n.name);
  expect(names).to.not.include("e");
});

test("refuses to delete a non-empty directory", async ({ ffmpeg, dir }) => {
  await ffmpeg.createDir(`${dir}/ne`);
  await ffmpeg.writeFile(`${dir}/ne/f`, "x");
  const deleting = ffmpeg.deleteDir(`${dir}/ne`);
  await expect(deleting).rejects.toBeTruthy();
});

test("renames a directory", async ({ ffmpeg, dir }) => {
  await ffmpeg.createDir(`${dir}/x`);
  await ffmpeg.rename(`${dir}/x`, `${dir}/y`);
  const names = (await ffmpeg.listDir(dir)).map((n) => n.name);
  expect(names).to.include("y").and.not.include("x");
});

test("rejects creating an existing directory", async ({ ffmpeg, dir }) => {
  const creating = ffmpeg.createDir(dir);
  await expect(creating).rejects.toBeTruthy();
});

test("rejects listing a missing directory", async ({ ffmpeg, dir }) => {
  const listing = ffmpeg.listDir(`${dir}/missing`);
  await expect(listing).rejects.toBeTruthy();
});
