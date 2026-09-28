// The configure flags in build/ffmpeg.sh and the Dockerfile made it into the
// binary; ST and MT builds differ only in threading.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const buildconf = (core) => exec(core, "-buildconf").log;

const libs = ["gpl", "libx264", "libvpx", "libmp3lame", "libtheora", "libvorbis",
  "libopus", "zlib", "libwebp", "libfreetype", "libfribidi", "libass", "libzimg"];

test.for(libs)("--enable-%s", (lib, { core }) => {
  expect(buildconf(core)).to.include(`--enable-${lib}`);
});

test("threading and libx265 match the build type", ({ core }) => {
  expect(buildconf(core).includes("--disable-pthreads")).to.equal(!isMT());
  expect(buildconf(core).includes("--enable-libx265")).to.equal(isMT());
});

test("-threads 4 encodes", ({ core }) => {
  const { ret } = exec(core, "-f", "lavfi", "-i", "testsrc=d=0.3:s=64x48", "-threads", "4", "-c:v", "libx264", "-f", "null", "-");
  expect(ret).to.equal(0);
});
