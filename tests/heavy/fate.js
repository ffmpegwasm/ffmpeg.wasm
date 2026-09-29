import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { inject } from "vitest";
import { createCore } from "../helpers/core.js";
import { exec } from "../helpers/run.js";

export const suite = inject("suite");

const NOT_MEDIA = [".md5", ".sha1", ".sha256", ".txt", ".html", ".xml", ".json", ".lst", ".ffmeta", ".cfg", ".sub-ref"];

export const samples = readdirSync(suite, { recursive: true })
  .filter((sample) => statSync(join(suite, sample)).isFile())
  .filter((sample) => !NOT_MEDIA.includes(extname(sample).toLowerCase()))
  .sort();

// Damaged streams whose error concealment differs between runs with frame threads.
const UNSTABLE_OUTPUT = [
  "hevc/two_first_slice.mp4",
  "mov/empty_edit_5s.mp4",
  "mxf/C0023S01.mxf",
];

// The first video and audio stream, at most 5 s, hashed per frame.
const framemd5 = (input, output) => ["-i", input, "-map", "0:v:0?", "-map", "0:a:0?", "-t", "5", "-f", "framemd5", output];

function summarize(sample, out) {
  const frames = out.split("\n").filter((line) => line && !line.startsWith("#")).length;
  const hash = createHash("sha256").update(out).digest("hex").slice(0, 16);
  if (!frames) return { status: "error" };
  return UNSTABLE_OUTPUT.includes(sample) ? { status: "ok", frames } : { status: "ok", frames, hash };
}

function decode(core, sample) {
  // keep the extension: FFmpeg guesses some formats from the file name
  const input = `/in${extname(sample)}`;
  core.FS.writeFile(input, readFileSync(join(suite, sample)));
  core.setTimeout(60000);
  const { ret } = exec(core, ...framemd5(input, "/out"));
  const out = ret === 0 ? core.FS.readFile("/out", { encoding: "utf8" }) : "";
  [input, "/out"].filter((path) => core.FS.analyzePath(path).exists).forEach((path) => core.FS.unlink(path));
  return summarize(sample, out);
}

// Decodes samples with one core; a crash leaves it unusable, so the next
// sample gets a new one.
export function decoder() {
  const cores = {};
  return async (sample) => {
    cores.current ??= await createCore();
    try {
      return decode(cores.current, sample);
    } catch {
      delete cores.current;
      return { status: "crash" };
    }
  };
}

export function decodeNatively(sample) {
  const { status, stdout } = spawnSync("ffmpeg", ["-v", "error", ...framemd5(join(suite, sample), "-")], { maxBuffer: 1 << 26, timeout: 60000 });
  return status === 0 ? summarize(sample, stdout.toString()) : { status: "error" };
}
