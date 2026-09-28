import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { testRoutes } from "./tests/helpers/routes.js";

// @ffmpeg/core runs in Node.js, where exec() may block the main thread.
const core = (name) => ({
  test: { name: `core-${name}`, include: ["tests/core/**/*.test.js"], provide: { core: name } },
});

// @ffmpeg/ffmpeg and @ffmpeg/util run in Chromium. SharedArrayBuffer, which
// the multi-threaded core needs, requires a cross-origin isolated page.
const browser = (name) => ({
  plugins: [testRoutes()],
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
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
    projects: [core("st"), core("mt"), browser("st"), browser("mt")],
  },
});
