import { describe, expect, test } from "vitest";
import FFmpeg from "../src";
import type { FFmpegCoreConstructor } from "../src/types";

describe("create", () => {
  test("construct with core path string", () =>
    FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" }));
  test("construct with core factory function", async () => {
    const core = (await import("@ffmpeg.wasm/core-mt"))
      .default as FFmpegCoreConstructor;
    await FFmpeg.create({ core });
  });
  test("construct with invaild core (expect error)", () =>
    expect(async () =>
      //@ts-expect-error intentional behaviour
      FFmpeg.create({ core: 1 })
    ).rejects.toThrowError());
  test("construct with core undefined (expect error)", () =>
    expect(async () =>
      //@ts-expect-error intentional behaviour
      FFmpeg.create({ core: undefined })
    ).rejects.toThrowError());
  test("construct with operator `new` (expect error)", () =>
    expect(
      () =>
        //@ts-expect-error intentional behaviour
        void new FFmpeg()
    ).toThrowError());
});

describe("flags", () => {
  test("flags of core-mt", async () => {
    const { flags } = await FFmpeg.create({ core: "@ffmpeg.wasm/core-mt" });

    expect(flags.simd).toBe(false);
    expect(flags.thread).toBe(true);
    expect(flags.wasi).toBe(false);
  });
  test("flags of core-st", async () => {
    const { flags } = await FFmpeg.create({ core: "@ffmpeg.wasm/core-st" });

    expect(flags.simd).toBe(false);
    expect(flags.thread).toBe(false);
    expect(flags.wasi).toBe(false);
  });
});
