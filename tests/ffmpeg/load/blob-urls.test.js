// The documented way to load the core from a CDN: fetch it into blob: URLs.
import { expect } from "vitest";
import { toBlobURL } from "@ffmpeg/util";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test("loads the core from blob: URLs", async ({ unloaded }) => {
  await unloaded.load({
    coreURL: await toBlobURL(coreURL(), "text/javascript"),
    wasmURL: await toBlobURL(coreURL().replace(/js$/, "wasm"), "application/wasm"),
  });
  const ret = await unloaded.exec(["-version"]);
  expect(ret).toBe(0);
});
