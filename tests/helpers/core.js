import { test as base, inject } from "vitest";

const path = (core) => `../../packages/${core === "mt" ? "core-mt" : "core"}/dist/esm/ffmpeg-core.js`;

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
