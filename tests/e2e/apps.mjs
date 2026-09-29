// End-to-end tests of the example apps in apps/: starts each one's dev server,
// loads ffmpeg-core (this repository's build, in place of jsDelivr's) and
// transcodes its sample video in Chromium.
//
//   pnpm test:e2e:apps                  every app
//   pnpm test:e2e:apps react-vite-app   some of them
import { spawn } from "node:child_process";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium } from "playwright";
import { root } from "../helpers/server.js";
import { hermeticContext, runner } from "./lib.mjs";

// The dev server command of each app, with the port to use.
const APPS = {
  "angular-app": (port) => ["ng", "serve", "--port", port],
  "nextjs-app": (port) => ["next", "dev", "--port", port],
  "react-vite-app": (port) => ["vite", "--port", port, "--strictPort"],
  "solidstart-app": (port) => ["vinxi", "dev", "--port", port],
  "sveltekit-app": (port) => ["vite", "dev", "--port", port, "--strictPort"],
  "vue-vite-app": (port) => ["vite", "--port", port, "--strictPort"],
};

async function waitUntilUp(url, deadline) {
  const up = await fetch(url).then((res) => res.ok, () => false);
  if (up || Date.now() > deadline) return up;
  await sleep(500);
  return waitUntilUp(url, deadline);
}

async function startApp(name, port) {
  const [bin, ...args] = APPS[name](String(port));
  const cwd = join(root, "apps", name);
  const server = spawn(join(cwd, "node_modules/.bin", bin), args, { cwd, stdio: "ignore", detached: true });
  const stop = () => process.kill(-server.pid);
  const url = `http://localhost:${port}`;
  const up = await waitUntilUp(url, Date.now() + 120000);
  if (up) return { url, stop };
  stop();
  throw new Error(`${name} didn't start on ${url}`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(APPS);
const browser = await chromium.launch();
const context = await hermeticContext(browser);
const { test, failures } = runner(context);

for (const [i, name] of names.entries()) {
  await test(`${name}: loads ffmpeg-core and transcodes its sample`, async (page) => {
    const app = await startApp(name, 5200 + i);
    try {
      await page.goto(app.url, { waitUntil: "networkidle" }); // hydrated, so clicks work
      const load = page.getByRole("button", { name: /^Load ffmpeg-core/ });
      if (await load.isVisible({ timeout: 30000 }).catch(() => false)) {
        await load.click();
        await load.waitFor({ state: "detached", timeout: 60000 });
      }
      await page.getByRole("button", { name: /^(Transcode|Start)/ }).click({ timeout: 60000 });
      const video = await page.locator("video").elementHandle();
      await page.waitForFunction((el) => el.src.startsWith("blob:") && el.readyState >= 1 && el.duration > 0, video, { timeout: 300000 });
    } finally {
      app.stop();
    }
  });
}

await browser.close();
process.exit(failures() ? 1 : 0);
