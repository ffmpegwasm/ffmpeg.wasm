// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/820 (also #563, #704): each exec() leaked wasm stack.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

// this trapped at ~6800 calls
test.for([
  ["exec", ["-h"]],
  ["exec", ["-i", "/missing.mp4", "/o.mp4"]],
  ["ffprobe", ["-h"]],
])("keeps working after 10000 × %s %j", { timeout: 300000 }, ([method, args], { core, dir }) => {
  Array.from({ length: 10000 }).forEach(() => core[method](...args));
  const result = exec(core, "-f", "lavfi", "-i", "sine=d=0.1", `${dir}/a.wav`);
  expect(result.ret).to.equal(0);
});
