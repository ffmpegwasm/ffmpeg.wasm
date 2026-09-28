// File paths in Node.js (#438, #426, #497): ffmpeg.wasm used to fetch() them.
import { expect, test } from "vitest";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const require = createRequire(import.meta.url);
const corePath = join(dirname(require.resolve("@ffmpeg/core")), "../esm/ffmpeg-core.js");
const wav = new URL("../../testdata/audio-1s.wav", import.meta.url);

test("load() accepts a filesystem path as coreURL", async () => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({ coreURL: corePath });
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "sine=d=0.1", "a.wav"]);
  ffmpeg.terminate();
  expect(ret).toBe(0);
});

test("fetchFile() reads a path, a file: URL string and a URL object", async () => {
  const fromURL = await fetchFile(wav);
  const fromPath = await fetchFile(wav.pathname);
  const fromString = await fetchFile(wav.href);
  expect(fromURL.length).toBeGreaterThan(44);
  expect(fromPath).toEqual(fromURL);
  expect(fromString).toEqual(fromURL);
});

test("fetchFile() reads a Blob without FileReader", async () => {
  const data = await fetchFile(new Blob([Uint8Array.of(1, 2, 3)]));
  expect(data).toEqual(Uint8Array.of(1, 2, 3));
});

test("@ffmpeg/util can be require()d", () => {
  const util = require("@ffmpeg/util");
  expect(util.fetchFile).toBeTypeOf("function");
});

test("a file read with fetchFile() transcodes", async () => {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();
  await ffmpeg.writeFile("in.wav", await fetchFile(pathToFileURL(wav.pathname)));
  const ret = await ffmpeg.exec(["-i", "in.wav", "out.mp3"]);
  ffmpeg.terminate();
  expect(ret).toBe(0);
});
