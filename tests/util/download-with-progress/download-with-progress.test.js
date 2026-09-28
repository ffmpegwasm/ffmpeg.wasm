import { expect, test } from "vitest";
import { downloadWithProgress } from "@ffmpeg/util";

const wav = new Uint8Array(await (await fetch("/testdata/audio-1s.wav")).arrayBuffer());

async function download(url) {
  const events = [];
  const data = new Uint8Array(await downloadWithProgress(url, (e) => events.push(e)));
  return { data, events };
}

test("returns the body and reports Content-Length as total", async () => {
  const { data, events } = await download("/testdata/audio-1s.wav");
  expect(data).toEqual(wav);
  const last = events.at(-1);
  expect(last).toMatchObject({ total: wav.length, received: wav.length, done: true });
});

test("reports deltas that add up to the total", async () => {
  const { events } = await download("/testdata/audio-1s.wav");
  const received = events.reduce((sum, e) => sum + e.delta, 0);
  expect(received).toBe(wav.length);
});

// The documented contract: total is -1 when the server doesn't send a length,
// so progress UIs can show an indeterminate state.
test("reports total -1 without Content-Length", async () => {
  const { data, events } = await download("/__test/nolength/testdata/audio-1s.wav");
  expect(data).toEqual(wav);
  expect(events[0].total).toBe(-1);
  expect(events.at(-1).done).toBe(true);
});

test("returns the decoded body of a gzip response", async () => {
  const { data, events } = await download("/__test/gzip/testdata/audio-1s.wav");
  expect(data).toEqual(wav);
  expect(events.at(-1).done).toBe(true);
});

test("passes the URL through in events", async () => {
  const { events } = await download("/testdata/audio-1s.wav");
  expect(events[0].url).toBe("/testdata/audio-1s.wav");
});
