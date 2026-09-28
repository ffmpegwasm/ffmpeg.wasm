// Decodes every sample of FFmpeg's FATE suite with ffmpeg.wasm and compares
// the result with tests/heavy/baseline/fate-<type>.json.
//
//   pnpm test:heavy                     st and mt, fails on regressions
//   pnpm test:heavy --type=st --only=h264,vp9 --jobs=4
//   pnpm test:heavy --update         write the results as the new baseline
//   pnpm test:heavy --native         also run native `ffmpeg`, list what only it decodes
//
// The samples (~1.3 GB) are rsynced to .cache/fate-suite, or FATE_SUITE=<dir>
// points at an existing copy.
import { existsSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, readdirSync, statSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { join, relative, extname } from "node:path";
import { chromium } from "playwright";
import { startServer, root } from "../helpers/server.js";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value = true] = a.replace(/^--/, "").split("=");
    return [key, value];
  })
);
const types = (args.type ?? "st,mt").split(",");
const jobs = Number(args.jobs ?? 4);
const only = args.only?.split(",");
const SECONDS = 5;
const TIMEOUT_MS = 30000;

// Checksums, reference text and similar files in the suite that are not media.
const NOT_MEDIA = new Set([".md5", ".sha1", ".sha256", ".txt", ".html", ".xml", ".json", ".lst", ".ffmeta", ".cfg", ".sub-ref"]);

const suite = join(root, ".cache/fate-suite");
if (!existsSync(suite)) {
  mkdirSync(join(root, ".cache"), { recursive: true });
  if (process.env.FATE_SUITE) {
    symlinkSync(process.env.FATE_SUITE, suite);
  } else {
    console.log("Downloading the FATE suite to .cache/fate-suite (~1.3 GB)...");
    execFileSync("rsync", ["-rlLt", "--delete", "rsync://fate-suite.ffmpeg.org/fate-suite/", `${suite}/`], { stdio: "inherit" });
  }
}

const walk = (dir) =>
  readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = walk(suite)
  .map((f) => relative(suite, f))
  .filter((f) => !NOT_MEDIA.has(extname(f).toLowerCase()))
  .filter((f) => !only || only.some((o) => f.startsWith(`${o}/`)));

// First video and first audio stream, at most SECONDS, hashed per frame.
const command = (input) => ["-i", input, "-map", "0:v:0?", "-map", "0:a:0?", "-t", String(SECONDS), "-f", "framemd5", "/out"];

function summarize({ ret, error, out, tail, ms }) {
  if (error) return { status: "crash", error };
  if (ms >= TIMEOUT_MS) return { status: "timeout" };
  const frames = out?.text?.split("\n").filter((l) => l && !l.startsWith("#")).length ?? 0;
  if (ret !== 0 || !frames) return { status: "error", error: tail.split("\n").at(-1) };
  return { status: "ok", frames, hash: out.sha256.slice(0, 16) };
}

function native(file) {
  const r = spawnSync("ffmpeg", ["-v", "error", ...command(join(suite, file)).slice(0, -1), "-"], { maxBuffer: 1 << 26, timeout: TIMEOUT_MS });
  const frames = r.stdout?.toString().split("\n").filter((l) => l && !l.startsWith("#")).length ?? 0;
  return r.status === 0 && frames > 0 ? "ok" : "error";
}

const { server, url } = await startServer();
const browser = await chromium.launch();
let failed = false;

for (const type of types) {
  console.log(`\n# ${type}: ${files.length} files, ${jobs} pages`);
  const results = {};
  const queue = [...files];
  let done = 0;

  const worker = async () => {
    let page;
    const open = async () => {
      await page?.close();
      page = await browser.newPage();
      await page.goto(`${url}/tests/heavy/page.html?type=${type}`);
      await page.waitForFunction(() => window.ready);
    };
    await open();
    while (queue.length) {
      const file = queue.shift();
      // Keep the extension: FFmpeg probes some formats by file name.
      const name = `/in${extname(file)}`;
      const job = page.evaluate((job) => window.run(job), {
        input: `/.cache/fate-suite/${file}`,
        name,
        args: command(name),
        timeout: TIMEOUT_MS,
      });
      // exec()'s own timeout can't interrupt a thread that is stuck, so also
      // give up from the outside and start a new page.
      const stuck = new Promise((r) => setTimeout(() => r({ error: "hang" }), TIMEOUT_MS + 15000));
      const r = await Promise.race([job, stuck]).catch((e) => ({ error: String(e) }));
      results[file] = r.error === "hang" ? { status: "hang" } : summarize(r);
      if (r.error === "hang") await open();
      if (++done % 100 === 0) console.log(`  ${done}/${files.length}`);
    }
    await page.close();
  };
  await Promise.all(Array.from({ length: jobs }, worker));

  if (args.native) {
    for (const file of files) results[file].native = native(file);
  }

  const baselinePath = join(root, `tests/heavy/baseline/fate-${type}.json`);
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf8")) : {};
  const regressions = [];
  const fixed = [];
  const changed = [];
  for (const file of files) {
    const now = results[file];
    const was = baseline[file];
    if (!was) continue;
    if (was.status === "ok" && now.status !== "ok") regressions.push(`${file}: ${now.status} ${now.error ?? ""}`);
    else if (was.status !== "ok" && now.status === "ok") fixed.push(file);
    else if (was.status === "ok" && was.hash !== now.hash) changed.push(`${file}: ${was.frames} -> ${now.frames} frames`);
  }

  const count = (s) => files.filter((f) => results[f].status === s).length;
  console.log(`  ok ${count("ok")}  error ${count("error")}  crash ${count("crash")}  timeout ${count("timeout")}  hang ${count("hang")}`);
  if (args.native) {
    const gaps = files.filter((f) => results[f].native === "ok" && results[f].status !== "ok");
    console.log(`  native ffmpeg decodes ${files.filter((f) => results[f].native === "ok").length}; ffmpeg.wasm fails ${gaps.length} of those:`);
    for (const f of gaps) console.log(`    ${f}: ${results[f].status} ${results[f].error ?? ""}`);
  }
  for (const [title, list] of [["regressions", regressions], ["now decoding", fixed], ["different output", changed]]) {
    if (list.length) console.log(`  ${title} (${list.length}):\n    ${list.join("\n    ")}`);
  }

  mkdirSync(join(root, "tests/heavy/results"), { recursive: true });
  writeFileSync(join(root, `tests/heavy/results/fate-${type}.json`), JSON.stringify(results, null, 1));
  if (args.update) {
    mkdirSync(join(root, "tests/heavy/baseline"), { recursive: true });
    // One file per line, so baseline changes read well in a diff.
    const lines = files.map((f) => {
      const { status, frames, hash } = results[f];
      return `${JSON.stringify(f)}: ${JSON.stringify({ status, frames, hash })}`;
    });
    writeFileSync(baselinePath, `{\n${lines.join(",\n")}\n}\n`);
    console.log(`  wrote ${relative(root, baselinePath)}`);
  } else if (regressions.length) {
    failed = true;
  }
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
