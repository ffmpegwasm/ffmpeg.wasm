// dist/umd/ffmpeg.js with the UMD core, as used from a plain <script> tag.
import { expect } from "vitest";
import { test, coreURL } from "../../helpers/ffmpeg.js";

const script = (src) =>
  new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement("script"), { src, onload: resolve, onerror: reject });
    document.head.append(el);
  });

test("the UMD bundle loads the UMD core and runs a command", async () => {
  await script("/packages/ffmpeg/dist/umd/ffmpeg.js");
  const ffmpeg = new window.FFmpegWASM.FFmpeg();
  await ffmpeg.load({ coreURL: coreURL().replace("/esm/", "/umd/") });
  const ret = await ffmpeg.exec(["-version"]);
  ffmpeg.terminate();
  expect(ret).toBe(0);
});
