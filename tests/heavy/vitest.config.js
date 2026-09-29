import { basename } from "node:path";
import { defineConfig } from "vitest/config";

// FFmpeg's FATE samples and benchmarks, with @ffmpeg/core in Node.js like the
// core tests. Too slow for `pnpm test`: run with `pnpm test:heavy` and `pnpm bench`.
const heavy = (name) => ({
  test: {
    name: `heavy-${name}`,
    root: import.meta.dirname,
    include: ["*.test.js"],
    globalSetup: ["setup.js"],
    provide: { core: name },
  },
});

export default defineConfig({
  test: {
    testTimeout: 120000,
    projects: [heavy("st"), heavy("mt")],
    // The FATE suite gains samples over time: record new ones instead of failing.
    update: "new",
    // one baseline per core: baseline/fate-st.snap, baseline/fate-mt.snap
    resolveSnapshotPath: (path, extension, { config }) =>
      `${import.meta.dirname}/baseline/${basename(path, ".test.js")}-${config.name.replace("heavy-", "")}${extension}`,
  },
});
