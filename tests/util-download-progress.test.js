const assert = require("node:assert").strict;

// Run with: npx mocha tests/util-download-progress.test.js
// (build @ffmpeg/util first: npm run build --workspace=packages/util)
// The built package is ESM, so it is loaded with a dynamic import().

// Number of decompressed bytes the body stream actually delivers.
const DECOMPRESSED_LENGTH = 300;
// What the server advertises in Content-Length for a gzip-encoded response:
// the *compressed* size, always smaller than the decompressed payload.
const COMPRESSED_CONTENT_LENGTH = 100;
const CHUNK_SIZE = 100;

const makePayload = () => {
  const full = new Uint8Array(DECOMPRESSED_LENGTH);
  for (let i = 0; i < DECOMPRESSED_LENGTH; i += 1) full[i] = i % 256;
  return full;
};

const streamOf = (payload) =>
  new ReadableStream({
    start(controller) {
      for (let off = 0; off < payload.length; off += CHUNK_SIZE) {
        controller.enqueue(payload.subarray(off, off + CHUNK_SIZE));
      }
      controller.close();
    },
  });

describe("downloadWithProgress content-encoding handling", () => {
  const realFetch = globalThis.fetch;
  const payload = makePayload();
  let downloadWithProgress;

  before(async () => {
    ({ downloadWithProgress } = await import(
      "../packages/util/dist/esm/index.js"
    ));
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("never reports received > total for compressed responses and returns the full payload", async () => {
    // Content-Length is the compressed size while the body reader yields the
    // decompressed bytes, so a length-based meter would exceed 100% (issue #803).
    globalThis.fetch = async () =>
      new Response(streamOf(payload), {
        headers: {
          "Content-Length": String(COMPRESSED_CONTENT_LENGTH),
          "Content-Encoding": "gzip",
        },
      });

    const events = [];
    const buf = await downloadWithProgress("http://localhost/core.wasm", (e) =>
      events.push(e)
    );

    // Regression guard: the decompressed payload is returned intact.
    assert.equal(buf.byteLength, DECOMPRESSED_LENGTH);
    assert.deepEqual(new Uint8Array(buf), payload);

    assert.ok(events.length > 0, "expected at least one progress event");
    const overflow = events.filter(
      (e) => e.total !== -1 && e.received > e.total
    );
    assert.deepEqual(
      overflow,
      [],
      `progress reported received > total (over 100%): ${JSON.stringify(overflow)}`
    );
  });

  it("still reports an accurate total for uncompressed responses", async () => {
    globalThis.fetch = async () =>
      new Response(streamOf(payload), {
        headers: { "Content-Length": String(DECOMPRESSED_LENGTH) },
      });

    const events = [];
    const buf = await downloadWithProgress("http://localhost/core.wasm", (e) =>
      events.push(e)
    );

    assert.equal(buf.byteLength, DECOMPRESSED_LENGTH);
    const last = events[events.length - 1];
    assert.equal(last.total, DECOMPRESSED_LENGTH);
    assert.equal(last.received, DECOMPRESSED_LENGTH);
    assert.equal(last.done, true);
  });

  it("keeps the accurate total for Content-Encoding: identity", async () => {
    // "identity" means no transformation, so Content-Length is still the real
    // decompressed size and progress must keep working.
    globalThis.fetch = async () =>
      new Response(streamOf(payload), {
        headers: {
          "Content-Length": String(DECOMPRESSED_LENGTH),
          "Content-Encoding": "identity",
        },
      });

    const events = [];
    const buf = await downloadWithProgress("http://localhost/core.wasm", (e) =>
      events.push(e)
    );

    assert.equal(buf.byteLength, DECOMPRESSED_LENGTH);
    const last = events[events.length - 1];
    assert.equal(last.total, DECOMPRESSED_LENGTH);
    assert.equal(last.received, DECOMPRESSED_LENGTH);
    assert.equal(last.done, true);
  });
});
