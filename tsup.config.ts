import { defineConfig } from "tsup";

const isDev =
  process.argv.includes("--watch") && process.env["NODE_ENV"] !== "production";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm", "iife"],
  dts: true,
  minify: !isDev,
  target: "es5",
});
