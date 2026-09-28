// @ffmpeg/ffmpeg's worker calls these; a missing one would only show up as a
// failing load() or command in users' apps.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test.for(["exec", "ffprobe", "setLogger", "setProgress", "setTimeout", "reset", "terminateThreads"])(
  "exports %s()",
  (name, { core }) => expect(core[name]).toBeTypeOf("function")
);

test("exports FS with the file systems mount() offers", ({ core }) => {
  expect(core.FS.filesystems).toHaveProperty("MEMFS");
  expect(core.FS.filesystems).toHaveProperty("WORKERFS");
});

// Allocation and memory helpers stay inside the core.
test.for(["_malloc", "_free", "_abort", "setValue", "getValue", "stringToUTF8", "stackSave"])(
  "does not export %s",
  (name, { core }) => expect(core[name]).toBeUndefined()
);
