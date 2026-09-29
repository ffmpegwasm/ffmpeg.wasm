import { test as base, inject } from "vitest";
import { FFmpeg } from "@ffmpeg/ffmpeg";

export const coreURL = () =>
  `${location.origin}/packages/${inject("core") === "mt" ? "core-mt" : "core"}/dist/esm/ffmpeg-core.js`;

export async function loadFFmpeg(config) {
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({ coreURL: coreURL(), ...config });
  return ffmpeg;
}

export const test = base.extend({
  unloaded: async ({}, use) => {
    const ffmpeg = new FFmpeg();
    await use(ffmpeg);
    ffmpeg.terminate();
  },
  ffmpeg: [
    async ({}, use) => {
      const ffmpeg = await loadFFmpeg();
      await use(ffmpeg);
      ffmpeg.terminate();
    },
    { scope: "file" },
  ],
  // different dir per test runner so we can parallelize
  dir: async ({ ffmpeg }, use) => {
    const dir = `/${crypto.randomUUID()}`;
    await ffmpeg.createDir(dir);
    await use(dir);
  },
});

export const testdata = async (name) => new Uint8Array(await (await fetch(`/testdata/${name}`)).arrayBuffer());
