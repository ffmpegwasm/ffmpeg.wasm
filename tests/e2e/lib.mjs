import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "../helpers/server.js";

/**
 * A browser context where jsDelivr's @ffmpeg/core(-mt) is this repository's build
 * and the testdata repository's media is downloaded once into .cache/testdata.
 */
export async function hermeticContext(browser) {
  const context = await browser.newContext();
  await context.route(/google|doubleclick|adtrafficquality/, (route) => route.abort());
  await context.route(/cdn\.jsdelivr\.net\/npm\/@ffmpeg\/(core(?:-mt)?)@[^/]+\/dist\/(.*)$/, (route) => {
    const [, pkg, file] = route.request().url().match(/@ffmpeg\/(core(?:-mt)?)@[^/]+\/dist\/(.*)$/);
    route.fulfill({ path: join(root, "packages", pkg, "dist", file), headers: { "Access-Control-Allow-Origin": "*" } });
  });
  const cache = join(root, ".cache/testdata");
  mkdirSync(cache, { recursive: true });
  await context.route(/raw\.githubusercontent\.com\/ffmpegwasm\/testdata\/master\/(.*)$/, async (route) => {
    const file = join(cache, route.request().url().split("/").pop());
    if (!existsSync(file)) {
      writeFileSync(file, Buffer.from(await (await fetch(route.request().url())).arrayBuffer()));
    }
    route.fulfill({ body: readFileSync(file), headers: { "Access-Control-Allow-Origin": "*" } });
  });
  return context;
}

/** Runs named checks on fresh pages; failures() counts the ones that threw. */
export function runner(context) {
  let failed = 0;
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
      failed++;
      console.log(`✗ ${name}\n  ${e.message.split("\n").join("\n  ")}`);
    }
    await page.close();
  }
  return { test, failures: () => failed };
}
