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

// The JSPI build (Node.js 24+) runs the same code as the Asyncify one, so its
// output must match @ffmpeg/core's baseline.
const jspi = typeof WebAssembly.Suspending === "function";
const baseline = (name) => (name === "heavy-jspi" ? "st" : name.replace("heavy-", ""));

export default defineConfig({
  test: {
    testTimeout: 120000,
    projects: [heavy("st"), heavy("mt"), ...(jspi ? [heavy("jspi")] : [])],
    // The FATE suite gains samples over time: record new ones instead of failing.
    update: "new",
    // baseline/fate-st.snap (also for jspi), baseline/fate-mt.snap
    resolveSnapshotPath: (path, extension, { config }) =>
      `${import.meta.dirname}/baseline/${basename(path, ".test.js")}-${baseline(config.name)}${extension}`,
  },
});
