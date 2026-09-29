// Related to https://github.com/ffmpegwasm/ffmpeg.wasm/issues/881: the UMD
// bundle loads the UMD core from a <script> tag. (#881 itself needs a webpack
// consumer that re-bundles the package.)
import { expect, test } from "vitest";

const script = (src) =>
  new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement("script"), { src, onload: resolve, onerror: reject });
    document.head.append(el);
  });

test("the UMD bundle loads the UMD core", async () => {
  await script("/packages/ffmpeg/dist/umd/ffmpeg.js");
  const ffmpeg = new window.FFmpegWASM.FFmpeg();
  await ffmpeg.load({ coreURL: `${location.origin}/packages/core/dist/umd/ffmpeg-core.js` });
  const ret = await ffmpeg.exec(["-version"]);
  ffmpeg.terminate();
  expect(ret).toBe(0);
});
