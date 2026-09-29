// @ffmpeg/core-mt on a page that isn't cross-origin isolated: load() says why
// it can't start (the browser-st project serves pages without COOP/COEP).
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test.runIf(!crossOriginIsolated)("load() of @ffmpeg/core-mt explains the missing isolation", async ({ unloaded }) => {
  const coreURL = `${location.origin}/packages/core-mt/dist/esm/ffmpeg-core.js`;
  const loading = unloaded.load({ coreURL });
  await expect(loading).rejects.toThrow(/needs SharedArrayBuffer/);
});
