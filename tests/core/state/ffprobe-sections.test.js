import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { ffprobe, makeMedia } from "../../helpers/run.js";

test.fails("-show_format in one call does not leak into the next (no issue yet)", ({ core, dir }) => {
  const wav = `${dir}/a.wav`;
  makeMedia(core, wav, ["-f", "lavfi", "-i", "sine=d=0.5"]);
  ffprobe(core, "-v", "error", "-show_format", wav, "-o", `${dir}/p.txt`);
  const { logs } = ffprobe(core, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav);
  expect(logs.map((l) => l.message)).to.deep.equal(["0.500000"]);
});
