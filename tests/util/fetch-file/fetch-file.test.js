import { expect, test } from "vitest";
import { fetchFile } from "@ffmpeg/util";

const wav = new Uint8Array(await (await fetch("/testdata/audio-1s.wav")).arrayBuffer());

test("fetches a URL string", async () => {
  const data = await fetchFile("/testdata/audio-1s.wav");
  expect(data).toEqual(wav);
});

test("fetches a URL object", async () => {
  const url = new URL("/testdata/audio-1s.wav", location.href);
  const data = await fetchFile(url);
  expect(data).toEqual(wav);
});

test("reads a Blob", async () => {
  const data = await fetchFile(new Blob([wav]));
  expect(data).toEqual(wav);
});

test("reads a File", async () => {
  const data = await fetchFile(new File([wav], "a.wav"));
  expect(data).toEqual(wav);
});

test("decodes a base64 data URL", async () => {
  const bytes = Uint8Array.from([0, 1, 2, 250, 255]);
  const base64 = btoa(String.fromCharCode(...bytes));
  const data = await fetchFile(`data:application/octet-stream;base64,${base64}`);
  expect(data).toEqual(bytes);
});

test("returns an empty array for undefined", async () => {
  const data = await fetchFile();
  expect(data).toEqual(new Uint8Array(0));
});
