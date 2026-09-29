// Decoders that come from external libraries rather than FFmpeg itself.
import { readFile } from "node:fs/promises";
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const fixture = async (name) => new Uint8Array(await readFile(new URL(`../../fixtures/${name}`, import.meta.url)));

// FFmpeg's own AV1 decoder needs hardware acceleration; libdav1d decodes in
// software (#814). av1.webm: 4 frames of testsrc, 64x64, from SVT-AV1.
test("decodes AV1 with libdav1d", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/in.webm`, await fixture("av1.webm"));
  const { ret, log } = await exec(core, "-i", `${dir}/in.webm`, "-f", "framemd5", `${dir}/out`);
  const framemd5 = core.FS.readFile(`${dir}/out`, { encoding: "utf8" });
  const frames = framemd5.split("\n").filter((line) => line && !line.startsWith("#"));
  expect(ret, log).to.equal(0);
  expect(log).to.match(/av1 \(libdav1d\)/);
  expect(frames).toHaveLength(4);
});
