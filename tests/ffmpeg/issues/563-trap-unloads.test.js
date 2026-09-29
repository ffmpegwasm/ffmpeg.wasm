// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/563 (also #292,
// #665): after a trap such as "memory access out of bounds", the instance kept
// running commands on corrupt memory. No known command traps the current core,
// so a stand-in worker answers the command with a trap.
import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

const trappingWorker = URL.createObjectURL(new Blob([`
  self.onmessage = ({ data: { id, type } }) =>
    postMessage(type === "LOAD"
      ? { id, type, data: true }
      : { id, type: "ERROR", data: "RuntimeError: memory access out of bounds" });
`], { type: "text/javascript" }));

test("a trap unloads the instance", async ({ unloaded }) => {
  await unloaded.load({ classWorkerURL: trappingWorker });
  const running = unloaded.exec(["-version"]);
  await expect(running).rejects.toMatch(/RuntimeError/);
  expect(unloaded.loaded).toBe(false);
  const listing = unloaded.listDir("/");
  await expect(listing).rejects.toThrow(/not loaded/);
});
