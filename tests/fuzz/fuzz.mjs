// Fuzzes ffmpeg.wasm through the FFmpeg class in Chromium and saves every
// case that crashes or hangs the core, so it can be replayed.
//
//   pnpm fuzz                                   2 minutes, every strategy
//   pnpm fuzz --time=600 --strategy=media --seed=42
//   pnpm fuzz --repro=tests/fuzz/crashes/media-42-17.json
//
// Strategies live in tests/fuzz/strategies/<name>.mjs and export
// generate(rng, seeds) -> [[method, ...args], ...] calls on FFmpeg. A case
// fails when a call rejects with a trap or worker error (not an ordinary
// error such as a missing file) or doesn't finish in time.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer, root } from "../helpers/server.js";
import { rng, SEEDS, SEED_INPUT } from "./lib.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [key, value = true] = a.replace(/^--/, "").split("=");
    return [key, value];
  })
);
const seconds = Number(args.time ?? 120);
const seed = Number(args.seed ?? Date.now() % 1e6);
const names = (args.strategy ?? readdirSync(join(root, "tests/fuzz/strategies")).map((f) => f.replace(".mjs", "")).join(",")).split(",");
const strategies = Object.fromEntries(await Promise.all(names.map(async (n) => [n, await import(`./strategies/${n}.mjs`)])));
const TIMEOUT_MS = 20000;
const CRASH = /RuntimeError|out of bounds|unreachable|Aborted|signature mismatch|table index|worker failed|not loaded|stack|OOM|Cannot enlarge/i;
const crashes = join(root, "tests/fuzz/crashes");

const { server, url } = await startServer();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${url}/tests/fuzz/page.html`);
await page.waitForFunction(() => window.ready);
const reload = () => page.evaluate(() => window.reload());
await reload();

// Calls since the core was (re)loaded: a crash can depend on earlier ones.
let history = [];

// Runs one case; returns the reason it failed, or null.
async function run(calls, log = () => {}) {
  history.push(...calls);
  const hang = new Promise((r) => setTimeout(() => r("hang"), TIMEOUT_MS * calls.length + 10000));
  const results = await Promise.race([page.evaluate(([c, t]) => window.runCase(c, t), [calls, TIMEOUT_MS]), hang]);
  log(results);
  const failure =
    results === "hang" ? "hang" :
    results.find((x) => x.error && CRASH.test(x.error))?.error ??
    ((await page.evaluate(() => window.alive())) ? null : "the core stopped answering after this case");
  if (failure) {
    lastResults = results;
    await page.reload();
    await page.waitForFunction(() => window.ready);
    await reload();
  }
  return failure ?? null;
}
let lastResults;

if (args.repro) {
  const saved = JSON.parse(readFileSync(args.repro, "utf8"));
  console.log(`${args.repro}: ${(await run(saved.calls, console.log)) ?? "no crash"}`);
  await browser.close();
  server.close();
  process.exit(0);
}

// Seed media, generated once with ffmpeg.wasm and cached.
const seedDir = join(root, ".cache/fuzz-seeds");
mkdirSync(seedDir, { recursive: true });
const seeds = [];
for (const [name, out] of SEEDS) {
  const path = join(seedDir, name);
  let bytes;
  try {
    bytes = readFileSync(path);
  } catch {
    const [result] = await page.evaluate(([args]) => window.runCase([["exec", args]], 60000), [[...SEED_INPUT, ...out, `/${name}`]]);
    if (result.ok !== 0) throw new Error(`seed ${name}: ${JSON.stringify(result)}`);
    bytes = Buffer.from(await page.evaluate((n) => window.readBytes(n), `/${name}`));
    writeFileSync(path, bytes);
  }
  seeds.push([name, new Uint8Array(bytes)]);
}

console.log(`fuzzing ${names.join(", ")} for ${seconds}s, seed ${seed}`);
const r = rng(seed);
const stats = Object.fromEntries(names.map((n) => [n, { cases: 0, crashes: 0 }]));
const end = Date.now() + seconds * 1000;
for (let i = 0; Date.now() < end; i++) {
  // A fresh core every so often keeps crash histories short and replayable.
  if (i % 200 === 0 && history.length) {
    history = [];
    await reload();
  }
  const name = names[i % names.length];
  const calls = strategies[name].generate(r, seeds);
  stats[name].cases++;
  const failure = await run(calls);
  if (!failure) continue;
  stats[name].crashes++;
  mkdirSync(crashes, { recursive: true });
  const file = join(crashes, `${name}-${seed}-${i}.json`);
  // `calls` replays everything since the last reload; the last ones crashed.
  writeFileSync(file, JSON.stringify({ strategy: name, seed, iteration: i, failure, results: lastResults, calls: history }));
  history = [];
  console.log(`✗ ${name} case ${i}: ${failure.slice(0, 200)}\n  saved ${file}`);
}

await browser.close();
server.close();
for (const [name, s] of Object.entries(stats)) console.log(`${name}: ${s.cases} cases, ${s.crashes} crashes`);
process.exit(Object.values(stats).some((s) => s.crashes) ? 1 : 0);
