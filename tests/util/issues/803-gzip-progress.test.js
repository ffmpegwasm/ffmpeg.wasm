// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/803 (also #781):
// with a compressed response, Content-Length is the compressed size but the
// received bytes are counted after decompression, so progress passes 100%.
import { expect, test } from "vitest";
import { downloadWithProgress } from "@ffmpeg/util";

test.fails("received never exceeds total for a gzip response (#803)", async () => {
  const events = [];
  await downloadWithProgress("/__test/gzip/testdata/audio-1s.wav", (e) => events.push(e));
  const withTotal = events.filter((e) => e.total > 0);
  withTotal.forEach(({ received, total }) => expect(received).to.be.at.most(total));
});
