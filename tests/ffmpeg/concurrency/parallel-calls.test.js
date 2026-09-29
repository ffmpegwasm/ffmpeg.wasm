import { expect } from "vitest";
import { test, loadFFmpeg } from "../../helpers/ffmpeg.js";

test("resolves each of many concurrent calls with its own result", async ({ ffmpeg, dir }) => {
  const n = 20;
  await Promise.all(Array.from({ length: n }, (_, i) => ffmpeg.writeFile(`${dir}/${i}`, String(i))));
  const got = await Promise.all(Array.from({ length: n }, (_, i) => ffmpeg.readFile(`${dir}/${i}`, "utf8")));
  expect(got).to.deep.equal(Array.from({ length: n }, (_, i) => String(i)));
});

test("keeps two instances' file systems separate", async ({ ffmpeg, dir }) => {
  const other = await loadFFmpeg();
  await ffmpeg.writeFile(`${dir}/mine`, "x");
  const names = (await other.listDir("/")).map((n) => n.name);
  other.terminate();
  expect(names).to.not.include(dir.slice(1));
});
