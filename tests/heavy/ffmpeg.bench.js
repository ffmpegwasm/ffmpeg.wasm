// Times common jobs on FATE samples with each core; with FATE_NATIVE=1, also
// with native `ffmpeg`.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { test } from "vitest";
import { createCore } from "../helpers/core.js";
import { exec } from "../helpers/run.js";
import { suite } from "./fate.js";

const H264_1080P = "h264/h264refframeregression.mp4";
const VP9_480P = "vp9-test-vectors/vp90-2-15-segkey_adpq.webm";
const WAV = "audio-reference/luckynight_2ch_44kHz_s16.wav";

const JOBS = [
  ["decode h264 1080p", H264_1080P, ["-f", "null", "-"]],
  ["decode vp9 480p", VP9_480P, ["-f", "null", "-"]],
  ["scale 1080p to 480p", H264_1080P, ["-vf", "scale=854:480", "-f", "null", "-"]],
  ["remux mp4 to mkv", H264_1080P, ["-c", "copy", "-f", "matroska", "/out"]],
  ["x264 veryfast 720p", H264_1080P, ["-t", "2", "-vf", "scale=1280:720", "-c:v", "libx264", "-preset", "veryfast", "-an", "-f", "mp4", "/out"]],
  ["vp9 realtime 480p", VP9_480P, ["-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-f", "webm", "/out"]],
  ["aac encode", WAV, ["-c:a", "aac", "-f", "ipod", "/out"]],
  ["mp3 encode", WAV, ["-f", "mp3", "/out"]],
  ["opus encode", WAV, ["-c:a", "libopus", "-f", "ogg", "/out"]],
];

const RUNS = { iterations: 3, time: 0, warmupIterations: 1, warmupTime: 0 };

const core = await createCore();
[H264_1080P, VP9_480P, WAV].forEach((sample) => core.FS.writeFile(`/${basename(sample)}`, readFileSync(join(suite, sample))));

test.for(JOBS)("%s", async ([, sample, args], { bench }) => {
  const wasm = bench("ffmpeg.wasm", { perProject: true }, () => exec(core, "-i", `/${basename(sample)}`, ...args));
  const nativeArgs = ["-v", "error", "-y", "-i", join(suite, sample), ...args.map((arg) => (arg === "/out" ? "/dev/null" : arg))];
  const native = bench("native ffmpeg", () => execFileSync("ffmpeg", nativeArgs, { stdio: "ignore" }));
  await (process.env.FATE_NATIVE ? bench.compare(wasm, native, RUNS) : wasm.run(RUNS));
});
