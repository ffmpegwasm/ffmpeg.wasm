import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { testRoutes } from "./tests/helpers/routes.js";

// @ffmpeg/core runs in Node.js, where exec() may block the main thread.
const core = (name) => ({
  test: { name: `core-${name}`, include: ["tests/core/**/*.test.js"], provide: { core: name } },
});

// The JSPI build of @ffmpeg/core needs WebAssembly.Suspending: Node.js 24+.
const jspi = typeof WebAssembly.Suspending === "function";

// @ffmpeg/ffmpeg and @ffmpeg/util run in Chromium. The multi-threaded core
// needs SharedArrayBuffer, so a cross-origin isolated page; the
// single-threaded ones must work without one.
const ISOLATED = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};

const browser = (name) => ({
  plugins: [testRoutes()],
  server: { headers: name === "mt" ? ISOLATED : {} },
  optimizeDeps: { exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"] },
  test: {
    name: `browser-${name}`,
    include: ["tests/ffmpeg/**/*.test.js", ...(name === "st" ? ["tests/util/**/*.test.js"] : [])],
    provide: { core: name },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      screenshotFailures: false,
    },
  },
});

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 60000,
    projects: [core("st"), core("mt"), ...(jspi ? [core("jspi")] : []), browser("st"), browser("jspi"), browser("mt")],
  },
});
