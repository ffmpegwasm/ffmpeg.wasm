import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test("builds a char** array of SIZE_I32-sized pointers", ({ core }) => {
  const strs = ["./ffmpeg", "-i", "a b.mp4", "ö"];
  const argv = core.stringsToPtr(strs);
  const read = strs.map((_, i) => core.UTF8ToString(core.getValue(argv + core.SIZE_I32 * i, "i32")));
  expect(read).to.deep.equal(strs);
});

test("handles an empty array", ({ core }) => {
  expect(() => core.stringsToPtr([])).to.not.throw();
});
