const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

// Regression guard for #946: the multi-threaded (core-mt) build must allow
// WebAssembly memory to grow (bounded by a maximum) so that decoding a single
// high-resolution frame (e.g. 4K) does not abort with `Aborted(OOM)`. A fixed
// INITIAL_MEMORY with no growth caps the heap and reintroduces the OOM.
const BUILD_SCRIPT = path.resolve(__dirname, "../build/ffmpeg-wasm.sh");

describe("[build] core-mt memory growth (#946)", () => {
  // Isolate the FFMPEG_MT-guarded flags line so we only assert on the MT build.
  const readMtFlagsLine = () => {
    const script = fs.readFileSync(BUILD_SCRIPT, "utf8");
    const line = script
      .split("\n")
      .find((l) => l.includes("FFMPEG_MT:+") && l.includes("INITIAL_MEMORY"));
    assert.ok(line, "could not find the FFMPEG_MT memory flags line");
    return line;
  };

  it("allows memory growth up to a maximum for the multi-threaded build", () => {
    const line = readMtFlagsLine();
    console.log("core-mt build flags:", line.trim());
    assert.match(
      line,
      /-sALLOW_MEMORY_GROWTH/,
      "core-mt build must pass -sALLOW_MEMORY_GROWTH to avoid OOM on large frames"
    );
    assert.match(
      line,
      /-sMAXIMUM_MEMORY=\d+\w*/,
      "memory growth with threads requires an explicit -sMAXIMUM_MEMORY"
    );
  });
});
