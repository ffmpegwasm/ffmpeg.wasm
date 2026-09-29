// bind.js _locateFile: @ffmpeg/ffmpeg passes a custom wasm URL in the hash of
// mainScriptUrlOrBlob (see the comment in bind.js). Loading from such a URL
// is covered by tests/ffmpeg/load/blob-urls.test.js.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";

const hash = (obj) => btoa(JSON.stringify(obj));

test("returns the wasmURL from the hash", ({ core }) => {
  core.mainScriptUrlOrBlob = `https://cdn/ffmpeg-core.js#${hash({ wasmURL: "W" })}`;
  const wasm = core.locateFile("ffmpeg-core.wasm", "p/");
  const other = core.locateFile("other.data", "p/");
  expect(wasm).to.equal("W");
  expect(other).to.equal("p/other.data");
});

test("falls back to prefix + path without mainScriptUrlOrBlob", ({ core }) => {
  core.mainScriptUrlOrBlob = undefined;
  const wasm = core.locateFile("ffmpeg-core.wasm", "https://x/y/");
  expect(wasm).to.equal("https://x/y/ffmpeg-core.wasm");
});
