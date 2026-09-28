// Times common jobs with @ffmpeg/core and @ffmpeg/core-mt in Chromium (and
// native ffmpeg with --native). Inputs are generated, so nothing is downloaded.
//
//   pnpm bench
//   pnpm bench --runs=5 --only=x264 --type=st --native
//
// Prints a table and writes tests/heavy/results/bench.json.
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir, cpus } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer, root } from "../helpers/server.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value = true] = a.replace(/^--/, "").split("=");
    return [key, value];
  })
);
const runs = Number(args.runs ?? 3);

const video = (size) => ["-f", "lavfi", "-i", `testsrc2=s=${size}:r=30:d=5`];
const h264 = (size) => [...video(size), "-c:v", "libx264", "-preset", "ultrafast", "-f", "mp4", "/in"];
const wav = ["-f", "lavfi", "-i", "sine=f=440:d=30", "-ac", "2", "-f", "wav", "/in"];

// name, untimed setup writing /in, timed command reading /in
const JOBS = [
  ["decode h264 1080p 5s", h264("1920x1080"), ["-i", "/in", "-f", "null", "-"]],
  ["x264 veryfast 720p 5s", h264("1280x720"), ["-i", "/in", "-c:v", "libx264", "-preset", "veryfast", "-f", "mp4", "/out"]],
  ["vp9 realtime 480p 5s", h264("854x480"), ["-i", "/in", "-c:v", "libvpx-vp9", "-deadline", "realtime", "-cpu-used", "8", "-f", "webm", "/out"]],
  ["scale 1080p to 480p", h264("1920x1080"), ["-i", "/in", "-vf", "scale=-2:480", "-f", "null", "-"]],
  ["remux mp4 to mkv", h264("1920x1080"), ["-i", "/in", "-c", "copy", "-f", "matroska", "/out"]],
  ["aac encode 30s", wav, ["-i", "/in", "-c:a", "aac", "-f", "ipod", "/out"]],
  ["mp3 encode 30s", wav, ["-i", "/in", "-f", "mp3", "/out"]],
  ["opus encode 30s", wav, ["-i", "/in", "-c:a", "libopus", "-f", "ogg", "/out"]],
].filter(([name]) => !args.only || name.includes(args.only));

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

function native(setup, command) {
  const dir = mkdtempSync(join(tmpdir(), "ffbench-"));
  const local = (list) => list.map((a) => (a === "/in" || a === "/out" ? join(dir, a) : a));
  spawnSync("ffmpeg", ["-y", "-v", "error", ...local(setup)]);
  const times = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    spawnSync("ffmpeg", ["-y", "-v", "error", ...local(command)]);
    times.push(performance.now() - start);
  }
  rmSync(dir, { recursive: true });
  return Math.round(median(times));
}

const { server, url } = await startServer();
const browser = await chromium.launch();
const results = {};

for (const type of (args.type ?? "st,mt").split(",")) {
  const page = await browser.newPage();
  await page.goto(`${url}/tests/heavy/page.html?type=${type}`);
  await page.waitForFunction(() => window.ready);
  for (const [name, setup, command] of JOBS) {
    const times = [];
    for (let i = 0; i < runs; i++) {
      const r = await page.evaluate((job) => window.run(job), { setup, args: command });
      if (r.ret !== 0) throw new Error(`${name} (${type}) failed: ${r.tail}`);
      times.push(r.ms);
    }
    (results[name] ??= {})[type] = median(times);
    console.log(`${type} ${name}: ${results[name][type]} ms`);
  }
  await page.close();
}
await browser.close();
server.close();

if (args.native) {
  for (const [name, setup, command] of JOBS) results[name].native = native(setup, command);
}

const cols = [...(args.type ?? "st,mt").split(","), ...(args.native ? ["native"] : [])];
console.log(`\n| job | ${cols.join(" ms | ")} ms |\n|---|${cols.map(() => "---:").join("|")}|`);
for (const [name, r] of Object.entries(results)) console.log(`| ${name} | ${cols.map((c) => r[c]).join(" | ")} |`);

mkdirSync(join(root, "tests/heavy/results"), { recursive: true });
writeFileSync(
  join(root, "tests/heavy/results/bench.json"),
  JSON.stringify({ date: new Date().toISOString(), cpu: cpus()[0].model, cores: cpus().length, runs, results }, null, 2)
);
