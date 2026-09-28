import { expect } from "vitest";
import { test, coreURL } from "../../helpers/ffmpeg.js";

test("load({ threads }) sets the thread cap", async ({ unloaded }) => {
  await unloaded.load({ coreURL: coreURL(), threads: 1 });
  await unloaded.exec(["-f", "lavfi", "-i", "testsrc2=s=1280x720:d=0.1", "-c:v", "libx264", "o.h264"]);
  const stream = new TextDecoder("latin1").decode(await unloaded.readFile("o.h264"));
  expect(stream).toMatch(/ threads=1 /);
});
