// Reproduces https://github.com/ffmpegwasm/ffmpeg.wasm/issues/623 (also #876,
// #931): the heap could only grow to 2 GB. Files live outside the heap (MEMFS
// keeps them in JavaScript), but FFmpeg's own buffers don't.
import { expect, inject, test } from "vitest";
import { readFile } from "node:fs/promises";

// An unsigned LEB128 number at reader.at, which it moves past.
const leb128 = (reader, shift = 0) => {
  const byte = reader.bytes[reader.at++];
  const value = (byte & 0x7f) * 2 ** shift;
  return byte < 0x80 ? value : value + leb128(reader, shift + 7);
};

const skipName = (reader) => {
  const length = leb128(reader);
  reader.at += length;
};

// The wasm binary's sections, as [id, reader positioned at the section].
const sections = (bytes) => {
  const found = [];
  const reader = { bytes, at: 8 };
  while (reader.at < bytes.length) {
    const id = bytes[reader.at++];
    const size = leb128(reader);
    found.push([id, { bytes, at: reader.at }]);
    reader.at += size;
  }
  return found;
};

const limits = (reader) => {
  const flags = reader.bytes[reader.at++];
  const initial = leb128(reader);
  const maximum = flags & 1 ? leb128(reader) : undefined;
  return { initial, maximum };
};

// The maximum of the module's memory, in 64 KiB pages: @ffmpeg/core defines
// it (memory section), @ffmpeg/core-mt imports its shared memory (import
// section, next to functions only).
const maximumPages = (wasm) => {
  const all = sections(wasm);
  const defined = all.find(([id]) => id === 5);
  if (defined) {
    const [, reader] = defined;
    leb128(reader); // count
    return limits(reader).maximum;
  }
  const [, reader] = all.find(([id]) => id === 2);
  const count = leb128(reader);
  const imports = Array.from({ length: count }, () => {
    skipName(reader);
    skipName(reader);
    const kind = reader.bytes[reader.at++];
    if (kind === 0) return { kind, type: leb128(reader) };
    return { kind, ...limits(reader) };
  });
  const memory = imports.find((i) => i.kind === 2);
  return memory.maximum;
};

test("the heap can grow to 4 GB", async () => {
  const pkg = inject("core") === "mt" ? "core-mt" : "core";
  const wasm = await readFile(new URL(`../../../packages/${pkg}/dist/esm/ffmpeg-core.wasm`, import.meta.url));
  const pages = maximumPages(wasm);
  expect(pages * 65536).toBe(4 * 1024 ** 3);
});
