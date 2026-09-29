// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/899: a LAME assert aborted the module.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test("encodes audio containing NaN samples to mp3", ({ core, dir }) => {
  const samples = new Float32Array(44100 * 2).map((_, i) => (i % 4410 < 10 ? NaN : Math.sin(i / 10)));
  core.FS.writeFile(`${dir}/in.f32`, new Uint8Array(samples.buffer));
  const { ret, log } = exec(core,
    "-f", "f32le", "-ar", "44100", "-ac", "2", "-i", `${dir}/in.f32`, `${dir}/out.mp3`);
  expect(log).to.not.match(/Assertion failed/);
  expect(ret).to.equal(0);
});
