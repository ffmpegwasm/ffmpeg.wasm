// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/597 (also #530, #772, #883, #644, #542): core-mt hung with 6+ cores.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

const withCores = async (n, fn) => {
  Object.defineProperty(navigator, "hardwareConcurrency", { value: n, configurable: true });
  try {
    return await fn();
  } finally {
    delete navigator.hardwareConcurrency;
  }
};

test("scales and encodes on a 32-core machine", async ({ core, dir }) => {
  const { ret, log } = await withCores(32, () =>
    exec(core,
      "-f", "lavfi", "-i", "testsrc2=s=1280x720:d=1", "-f", "lavfi", "-i", "sine=d=1",
      "-vf", "scale=-2:480", "-c:v", "libx264", "-c:a", "aac", `${dir}/out.mp4`)
  );
  expect(ret, log).to.equal(0);
});

test("runs a filter_complex on a 32-core machine", async ({ core, dir }) => {
  const { ret, log } = await withCores(32, () =>
    exec(core,
      "-f", "lavfi", "-i", "testsrc2=s=1920x1080:d=1",
      "-filter_complex", "[0:v]scale=-2:720,split[a][b];[b]boxblur=5[bb];[a][bb]overlay",
      "-c:v", "libx264", `${dir}/out.mp4`)
  );
  expect(ret, log).to.equal(0);
});
