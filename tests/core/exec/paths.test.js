import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { makeMedia, probe } from "../../helpers/run.js";

test.for(["with space.wav", "ünïcödé-文件-🎬.wav", "dash-leading-name.wav", "a'quote\".wav"])("writes and reads %j", async (name, { core, dir }) => {
  const p = `${dir}/${name}`;
  await makeMedia(core, p, ["-f", "lavfi", "-i", "sine=d=0.1"]);
  const [stream] = (await probe(core, p)).streams;
  expect(stream.codec_type).to.equal("audio");
});

test("supports relative paths from the FS cwd", async ({ core, dir }) => {
  const cwd = core.FS.cwd();
  core.FS.chdir(dir);
  try {
    await makeMedia(core, "rel.wav", ["-f", "lavfi", "-i", "sine=d=0.1"]);
    expect(core.FS.stat(`${dir}/rel.wav`).size).to.be.above(44);
  } finally {
    core.FS.chdir(cwd);
  }
});

test("writes into nested directories", async ({ core, dir }) => {
  core.FS.mkdir(`${dir}/a`);
  core.FS.mkdir(`${dir}/a/b`);
  await makeMedia(core, `${dir}/a/b/c.wav`, ["-f", "lavfi", "-i", "sine=d=0.1"]);
  expect(core.FS.readdir(`${dir}/a/b`)).to.include("c.wav");
});
