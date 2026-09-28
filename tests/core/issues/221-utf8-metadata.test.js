// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/221: non-ASCII
// metadata passed as arguments came out mangled.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { makeMedia, probe } from "../../helpers/run.js";

test("keeps non-ASCII metadata intact", async ({ core, dir }) => {
  const title = "日本語 — Ünïcödé 🎬";
  const out = `${dir}/a.mp4`;
  await makeMedia(core, out, ["-f", "lavfi", "-i", "sine=d=0.1"], ["-metadata", `title=${title}`]);
  const { tags } = (await probe(core, out)).format;
  expect(tags.title).to.equal(title);
});
