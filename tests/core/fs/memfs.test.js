// The FS runtime method @ffmpeg/ffmpeg's worker relies on.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test("writes and reads binary data", ({ core, dir }) => {
  const data = Uint8Array.from({ length: 1024 }, (_, i) => i % 256);
  core.FS.writeFile(`${dir}/bin`, data);
  expect(core.FS.readFile(`${dir}/bin`)).to.deep.equal(data);
});

test("writes and reads UTF-8 text", ({ core, dir }) => {
  core.FS.writeFile(`${dir}/t.txt`, "héllo 🎬");
  expect(core.FS.readFile(`${dir}/t.txt`, { encoding: "utf8" })).to.equal("héllo 🎬");
});

test("creates, lists, renames and removes directories", ({ core, dir }) => {
  const { FS } = core;
  FS.mkdir(`${dir}/a`);
  FS.writeFile(`${dir}/a/f`, "x");
  FS.rename(`${dir}/a`, `${dir}/b`);
  expect(FS.readdir(`${dir}/b`)).to.include("f");
  FS.unlink(`${dir}/b/f`);
  FS.rmdir(`${dir}/b`);
  expect(FS.readdir(dir)).to.deep.equal([".", ".."]);
});

test("throws for a missing file", ({ core, dir }) => {
  expect(() => core.FS.readFile(`${dir}/missing`)).to.throw();
});

test("holds a 64 MiB file", { timeout: 30000 }, ({ core, dir }) => {
  const big = new Uint8Array(64 * 1024 * 1024);
  big[big.length - 1] = 7;
  core.FS.writeFile(`${dir}/big`, big);
  expect(core.FS.stat(`${dir}/big`).size).to.equal(big.length);
  expect(core.FS.readFile(`${dir}/big`)[big.length - 1]).to.equal(7);
});
