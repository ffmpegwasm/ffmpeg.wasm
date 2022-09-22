import type { FFmpegModule } from "..";
import createFFmpeg from "..";

let core: FFmpegModule;

beforeAll(async () => {
  core = await createFFmpeg();
});

describe("core", () => {
  test("core is ready", () => {
    expect(core).not.toBeUndefined();
  });

  test("core functions are exported", () => {
    expect("NULL" in core).toBeTruthy();
    expect("SIZE_I32" in core).toBeTruthy();
    expect("exec" in core).toBeTruthy();
    expect("stringToPtr" in core).toBeTruthy();
    expect("stringsToPtr" in core).toBeTruthy();
  });
});

describe("stringToPtr()", () => {
  test("convert a string to pointer", () => {
    expect(core.stringToPtr("string")).not.toBe(core.NULL);
  });
});

describe("stringsToPtr()", () => {
  test("convert a string array to pointer", () => {
    expect(core.stringsToPtr(["string"])).not.toBe(core.NULL);
  });
});
