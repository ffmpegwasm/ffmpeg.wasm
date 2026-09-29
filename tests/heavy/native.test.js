// With FATE_NATIVE=1, the samples native `ffmpeg` decodes and ffmpeg.wasm
// doesn't (or the other way around) fail.
import { expect, test } from "vitest";
import { decodeNatively, decoder, samples } from "./fate.js";

const decode = decoder();

test.skipIf(!process.env.FATE_NATIVE).for(samples)("%s", async (sample) => {
  const native = decodeNatively(sample);
  const wasm = await decode(sample);
  expect(wasm.status).to.equal(native.status);
});
