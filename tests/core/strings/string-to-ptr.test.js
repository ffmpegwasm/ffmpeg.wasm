import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test.for(["", "-i", "video with spaces.mp4", "ünïcödé-文件-🎬.mp4"])("round-trips %j as NUL-terminated UTF-8", (s, { core }) => {
  const ptr = core.stringToPtr(s);
  const readBack = core.UTF8ToString(ptr);
  const terminator = core.getValue(ptr + core.lengthBytesUTF8(s), "i8");
  expect(ptr).to.be.above(0);
  expect(readBack).to.equal(s);
  expect(terminator).to.equal(0);
});
