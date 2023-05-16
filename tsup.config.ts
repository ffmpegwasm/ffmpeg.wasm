import { defineConfig } from "tsup";

const isDev =
  process.argv.includes("--watch") && process.env["NODE_ENV"] !== "production";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm", "iife"],
  clean: true,
  dts: true,
  minify: !isDev,
  target: ["es6"],
  external: [/^data:.+$/], // ignore inline module
});
