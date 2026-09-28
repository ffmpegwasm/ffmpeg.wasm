// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/609: when the
// wasm URL serves HTML (a 404 page or an SPA fallback), load() fails with
// "expected magic word 00 61 73 6d, found 3c 21 44 4f", which doesn't say
// which URL was wrong.
import { expect } from "vitest";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test.fails("names the URL when the wasm file is not WebAssembly (#609)", async ({ unloaded }) => {
  const wasmURL = `${location.origin}/tests/README.md`;
  const loading = unloaded.load({ coreURL: coreURL(), wasmURL });
  await expect(loading).rejects.toThrow(wasmURL);
});
