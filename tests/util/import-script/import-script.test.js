import { expect, test } from "vitest";
import { importScript } from "@ffmpeg/util";

test("resolves after the script has run", async () => {
  const src = URL.createObjectURL(new Blob(["window.imported = 42;"], { type: "text/javascript" }));
  await importScript(src);
  expect(window.imported).toBe(42);
});
