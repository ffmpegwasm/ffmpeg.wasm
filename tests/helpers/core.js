import { test as base, inject } from "vitest";

// st: @ffmpeg/core, jspi: its JSPI build, mt: @ffmpeg/core-mt
export const coreFile = (core) =>
  ({ st: "core/dist/esm/ffmpeg-core.js", jspi: "core/dist/esm/ffmpeg-core-jspi.js", mt: "core-mt/dist/esm/ffmpeg-core.js" })[core];

const path = (core) => `../../packages/${coreFile(core)}`;

export async function createCore(options) {
  const { default: createFFmpegCore } = await import(path(inject("core")));
  return createFFmpegCore(options);
}

export const test = base.extend({
  core: [async ({}, use) => use(await createCore()), { scope: "file" }],
  // different dir per test so tests can run in parallel
  dir: async ({ core }, use) => {
    const dir = `/${crypto.randomUUID()}`;
    core.FS.mkdir(dir);
    await use(dir);
  },
});

export const isMT = () => inject("core") === "mt";
