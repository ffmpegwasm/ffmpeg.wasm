// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/848 (also #909):
// the @ffmpeg/util UMD bundle threw "exports is not defined" in a <script>
// tag and never defined FFmpegUtil.
import { expect, test } from "vitest";

test("the UMD bundle defines window.FFmpegUtil", async () => {
  const errors = [];
  const onError = (e) => errors.push(e.message);
  window.addEventListener("error", onError);
  await new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement("script"), { src: "/packages/util/dist/umd/index.js", onload: resolve, onerror: reject });
    document.head.append(el);
  });
  window.removeEventListener("error", onError);
  expect(errors).to.deep.equal([]);
  expect(window.FFmpegUtil?.fetchFile).to.be.a("function");
});
