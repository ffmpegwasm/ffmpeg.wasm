import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const cache = fileURLToPath(new URL("../../.cache/fate-suite", import.meta.url));

// FFmpeg's FATE samples (~1.3 GB): FATE_SUITE=<dir>, or downloaded to .cache/fate-suite.
export default function setup({ provide }) {
  const suite = process.env.FATE_SUITE ?? cache;
  mkdirSync(suite, { recursive: true });
  if (readdirSync(suite).length === 0) {
    execFileSync("rsync", ["-rlLt", "rsync://fate-suite.ffmpeg.org/fate-suite/", `${suite}/`], { stdio: "inherit" });
  }
  provide("suite", suite);
}
