import { expect } from "vitest";
import { test, createCore } from "../../helpers/core.js";

test("a new core starts with ret and timeout at -1", ({ core }) => {
  expect(core.ret).to.equal(-1);
  expect(core.timeout).to.equal(-1);
});

test("cores have independent file systems", async ({ core }) => {
  const other = await createCore();
  core.FS.writeFile("/only-in-one", "x");
  expect(() => other.FS.stat("/only-in-one")).to.throw();
});
