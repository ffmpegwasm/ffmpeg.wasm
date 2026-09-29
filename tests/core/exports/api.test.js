// @ffmpeg/ffmpeg's worker calls these; a missing one would only show up as a
// failing load() or command in users' apps.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test.for(["exec", "ffprobe", "setLogger", "setProgress", "setTimeout", "reset", "terminateThreads"])(
  "exports %s()",
  async (name, { core }) => expect(core[name]).toBeTypeOf("function")
);

test("exports FS with the file systems mount() offers", async ({ core }) => {
  expect(core.FS.filesystems).toHaveProperty("MEMFS");
  expect(core.FS.filesystems).toHaveProperty("WORKERFS");
});
