// End-to-end tests: builds the website (apps/website) and drives every live
// example on the usage page and the playground in Chromium, with the CDN's
// @ffmpeg/core swapped for this repository's build.
//
//   pnpm test:e2e              build the site if needed, run everything
//   pnpm test:e2e --rebuild    rebuild the site first
//   pnpm test:e2e --headed
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright";
import { startServer, root } from "../helpers/server.js";

const args = new Set(process.argv.slice(2));
const site = join(root, "apps/website/build");
if (!existsSync(site) || args.has("--rebuild")) {
  execSync("pnpm --filter website build", { cwd: root, stdio: "inherit" });
}

const { server, url } = await startServer({ dir: site });
const browser = await chromium.launch({ headless: !args.has("--headed") });
const context = await browser.newContext();

// Keep the run hermetic: no ads or analytics.
await context.route(/google|doubleclick|adtrafficquality/, (route) => route.abort());
// jsDelivr's @ffmpeg/core and @ffmpeg/core-mt -> packages/core(-mt)/dist.
await context.route(/cdn\.jsdelivr\.net\/npm\/@ffmpeg\/(core(?:-mt)?)@[^/]+\/dist\/(.*)$/, (route) => {
  const [, pkg, file] = route.request().url().match(/@ffmpeg\/(core(?:-mt)?)@[^/]+\/dist\/(.*)$/);
  route.fulfill({ path: join(root, "packages", pkg, "dist", file), headers: { "Access-Control-Allow-Origin": "*" } });
});
// Sample media from the testdata repository, downloaded once into .cache.
const cache = join(root, ".cache/testdata");
mkdirSync(cache, { recursive: true });
await context.route(/raw\.githubusercontent\.com\/ffmpegwasm\/testdata\/master\/(.*)$/, async (route) => {
  const file = join(cache, route.request().url().split("/").pop());
  if (!existsSync(file)) {
    writeFileSync(file, Buffer.from(await (await fetch(route.request().url())).arrayBuffer()));
  }
  route.fulfill({ body: readFileSync(file), headers: { "Access-Control-Allow-Origin": "*" } });
});

let failures = 0;
async function test(name, fn) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const start = Date.now();
  try {
    await fn(page);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(`✓ ${name} (${((Date.now() - start) / 1000).toFixed(1)}s)`);
  } catch (e) {
    failures++;
    console.log(`✗ ${name}\n  ${e.message.split("\n").join("\n  ")}`);
  }
  await page.close();
}

// Every live example: click "Load ffmpeg-core", then its action button, and
// wait for the <video> it fills to load.
const probe = await context.newPage();
await probe.goto(`${url}/docs/getting-started/usage`);
const examples = await probe.$$eval('[class*="playgroundPreview"]', (previews) =>
  previews.map((preview) => {
    let el = preview.closest('[class*="playgroundContainer"]');
    while (el && el.tagName !== "H2") el = el.previousElementSibling;
    return el?.textContent.replace(/\u200b/g, "").trim() ?? "untitled";
  })
);
await probe.close();

await test("usage page has live examples", async () => {
  if (examples.length < 6) throw new Error(`found ${examples.length} live examples`);
});

for (const [i, title] of examples.entries()) {
  await test(`usage: ${title}`, async (page) => {
    await page.goto(`${url}/docs/getting-started/usage`);
    const preview = page.locator('[class*="playgroundPreview"]').nth(i);
    await preview.scrollIntoViewIfNeeded();
    const load = preview.getByRole("button", { name: /^Load ffmpeg-core/ });
    await load.click();
    await load.waitFor({ state: "detached", timeout: 60000 });
    const started = Date.now();
    await preview.getByRole("button").first().click();
    const video = await preview.locator("video").elementHandle();
    await page.waitForFunction((el) => el.src.startsWith("blob:"), video, { timeout: 180000 });
    if (/timeout/i.test(title)) {
      // exec(..., 1000) stops early; the partial output isn't expected to play.
      if (Date.now() - started > 15000) throw new Error("the 1 s timeout took over 15 s");
      return;
    }
    await page.waitForFunction((el) => el.readyState >= 1 && el.duration > 0, video, { timeout: 30000 });
  });
}

await test("playground: loads the core and runs the default command", async (page) => {
  await page.goto(`${url}/playground`);
  // The page also renders standalone copies of the file manager and editor
  // to explain them.
  const workspace = page.getByTestId("playground");
  await workspace.getByRole("button", { name: "Load Sample Files" }).click({ timeout: 120000 });
  await workspace.getByText("video.webm", { exact: true }).waitFor();
  await workspace.getByRole("button", { name: "Run" }).click(); // ["-i", "video.webm", "video.mp4"]
  await workspace.getByText(/Time Elapsed/).waitFor({ timeout: 180000 });
  await workspace.getByRole("button", { name: "fresh" }).click();
  await workspace.getByText("video.mp4", { exact: true }).waitFor();
});

await test("playground: survives arguments that aren't a list of strings (#791, #872)", async (page) => {
  await page.goto(`${url}/playground`);
  const editor = page.getByTestId("playground").locator("#input-args textarea");
  for (const args of ["", "{", '["-i", {"toString": "1"}]', "42"]) {
    await editor.focus();
    await page.keyboard.press("ControlOrMeta+A");
    await page.keyboard.insertText(args);
    await page.getByTestId("playground").getByText("ffmpeg.exec([]);").waitFor();
  }
});

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
