// @ffmpeg/ffmpeg in Node.js (#897, #659, #773)
import { test as base, expect } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const test = base.extend({
  ffmpeg: [
    async ({}, use) => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load();
      await use(ffmpeg);
      ffmpeg.terminate();
    },
    { scope: "file" },
  ],
  hostDir: async ({}, use) => {
    const dir = await mkdtemp(join(tmpdir(), "ffmpeg-wasm-"));
    await use(dir);
    await rm(dir, { recursive: true });
  },
});

test("constructing FFmpeg has no side effects (SSR)", () => {
  expect(() => new FFmpeg()).not.toThrow();
});

test("loads the installed @ffmpeg/core and runs a command", async ({ ffmpeg }) => {
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "testsrc=d=0.5:s=64x48", "-c:v", "libx264", "out.mp4"]);
  const out = await ffmpeg.readFile("out.mp4");
  const boxType = new TextDecoder().decode(out.slice(4, 8));
  expect(ret).toBe(0);
  expect(boxType).toBe("ftyp");
});

test("writes, lists and deletes files", async ({ ffmpeg }) => {
  await ffmpeg.writeFile("hello.txt", "hi");
  const text = await ffmpeg.readFile("hello.txt", "utf8");
  const names = (await ffmpeg.listDir("/")).map((n) => n.name);
  await ffmpeg.deleteFile("hello.txt");
  const namesAfterDelete = (await ffmpeg.listDir("/")).map((n) => n.name);
  expect(text).toBe("hi");
  expect(names).toContain("hello.txt");
  expect(namesAfterDelete).not.toContain("hello.txt");
});

test("ffprobe reports a file's duration", async ({ ffmpeg }) => {
  await ffmpeg.exec(["-f", "lavfi", "-i", "sine=d=0.5", "a.wav"]);
  await ffmpeg.ffprobe(["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "a.wav", "-o", "d.txt"]);
  const duration = Number(await ffmpeg.readFile("d.txt", "utf8"));
  expect(duration).toBe(0.5);
});

test("mounts a host directory with NODEFS", async ({ ffmpeg, hostDir }) => {
  await writeFile(join(hostDir, "in.txt"), "from the host");
  await ffmpeg.createDir("/host");
  const mounted = await ffmpeg.mount("NODEFS", { root: hostDir }, "/host");
  const fromHost = await ffmpeg.readFile("/host/in.txt", "utf8");
  const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "sine=d=0.2", "/host/out.wav"]);
  await ffmpeg.unmount("/host");
  const onHost = await readFile(join(hostDir, "out.wav"));
  expect(mounted).toBe(true);
  expect(fromHost).toBe("from the host");
  expect(ret).toBe(0);
  expect(onHost.subarray(0, 4).toString()).toBe("RIFF");
});

test("terminate() rejects pending calls", async () => {
  const other = new FFmpeg();
  await other.load();
  const pending = other.exec(["-f", "lavfi", "-i", "testsrc=d=600", "-f", "null", "-"]);
  other.terminate();
  await expect(pending).rejects.toThrow(/terminate/);
});
