import { expect } from "vitest";
import { test } from "../../helpers/core.js";

test("sets ret and timeout back to -1", ({ core }) => {
  core.ret = 1024;
  core.timeout = 1024;
  core.reset();
  expect(core.ret).to.equal(-1);
  expect(core.timeout).to.equal(-1);
});

test("keeps the logger and progress handlers", ({ core }) => {
  const logger = () => {};
  const progress = () => {};
  core.setLogger(logger);
  core.setProgress(progress);
  core.reset();
  expect(core.logger).to.equal(logger);
  expect(core.progress).to.equal(progress);
});
