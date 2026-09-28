import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

const calls = {
  exec: (f) => f.exec(["-h"]),
  ffprobe: (f) => f.ffprobe(["-h"]),
  writeFile: (f) => f.writeFile("/a", "x"),
  readFile: (f) => f.readFile("/a"),
  deleteFile: (f) => f.deleteFile("/a"),
  rename: (f) => f.rename("/a", "/b"),
  createDir: (f) => f.createDir("/d"),
  listDir: (f) => f.listDir("/"),
  deleteDir: (f) => f.deleteDir("/d"),
};

test.for(Object.entries(calls))("%s() rejects before load()", async ([, call], { unloaded }) => {
  await expect(call(unloaded)).rejects.toThrow(/not loaded/);
});
