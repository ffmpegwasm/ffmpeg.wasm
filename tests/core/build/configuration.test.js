// The configure flags in build/ffmpeg.sh and the Dockerfile made it into the
// binary.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const buildconf = async (core) => (await exec(core, "-buildconf")).log;

const libs = ["gpl", "libx264", "libvpx", "libmp3lame", "libtheora", "libvorbis",
  "libopus", "zlib", "libwebp", "libfreetype", "libfribidi", "libass", "libzimg"];

test.for(libs)("--enable-%s", async (lib, { core }) => {
  expect(await buildconf(core)).to.include(`--enable-${lib}`);
});

test("is built with threads, which FFmpeg's command line tools need", async ({ core }) => {
  const conf = await buildconf(core);
  expect(conf).to.not.include("--disable-pthreads");
});

test("has libx265 only in the multi-threaded core", async ({ core }) => {
  const conf = await buildconf(core);
  expect(conf.includes("--enable-libx265")).to.equal(isMT());
});

test("-threads 4 encodes", async ({ core }) => {
  const { ret } = await exec(core, "-f", "lavfi", "-i", "testsrc=d=0.3:s=64x48", "-threads", "4", "-c:v", "libx264", "-f", "null", "-");
  expect(ret).to.equal(0);
});
