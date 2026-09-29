import { expect } from "vitest";
import { test } from "../../helpers/ffmpeg.js";

test("delivers log events while exec runs", async ({ ffmpeg }) => {
  const logs = [];
  const onLog = (e) => logs.push(e);
  ffmpeg.on("log", onLog);
  await ffmpeg.exec(["-version"]);
  ffmpeg.off("log", onLog);
  const banner = logs.find((l) => /ffmpeg version/.test(l.message));
  expect(banner).toEqual({ type: expect.any(String), message: expect.any(String) });
});

test("stops delivering after off()", async ({ ffmpeg }) => {
  const logs = [];
  const onLog = (e) => logs.push(e);
  ffmpeg.on("log", onLog);
  ffmpeg.off("log", onLog);
  await ffmpeg.exec(["-version"]);
  expect(logs).toEqual([]);
});

test("calls every listener", async ({ ffmpeg }) => {
  const first = [];
  const second = [];
  const onFirst = (e) => first.push(e);
  const onSecond = (e) => second.push(e);
  ffmpeg.on("log", onFirst);
  ffmpeg.on("log", onSecond);
  await ffmpeg.exec(["-version"]);
  ffmpeg.off("log", onFirst);
  ffmpeg.off("log", onSecond);
  expect(first.length).to.be.above(0);
  expect(second).toEqual(first);
});
