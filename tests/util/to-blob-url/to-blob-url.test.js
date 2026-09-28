import { expect, test } from "vitest";
import { toBlobURL } from "@ffmpeg/util";

test("returns a blob: URL with the given MIME type and content", async () => {
  const url = await toBlobURL("/__test/echo?body=hello", "text/plain");
  const res = await fetch(url);
  const type = res.headers.get("content-type");
  const body = await res.text();
  expect(url).toMatch(/^blob:/);
  expect(type).toBe("text/plain");
  expect(body).toBe("hello");
});

test("reports progress when asked to", async () => {
  const events = [];
  await toBlobURL("/testdata/audio-1s.wav", "audio/wav", true, (e) => events.push(e));
  const last = events.at(-1);
  expect(last.done).toBe(true);
  expect(last.received).toBe(last.total);
});
