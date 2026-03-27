/**
 * Node.js integration test for @ffmpeg/ffmpeg.
 *
 * Verifies that the Node.js FFmpeg class works end-to-end:
 * 1. Loads the WASM core in a worker_threads Worker
 * 2. Writes a file to the virtual filesystem
 * 3. Reads it back
 * 4. Terminates cleanly
 *
 * Run: node --experimental-vm-modules tests/node-ffmpeg.test.mjs
 *
 * Requires: @ffmpeg/core installed (npm install @ffmpeg/core)
 */

import { FFmpeg } from "../packages/ffmpeg/src/node-classes.js";

const ffmpeg = new FFmpeg();

// Log progress
ffmpeg.on("log", ({ type, message }) => {
  if (type === "fferr") {
    // Only show ffmpeg stderr (configuration, version info)
    console.log(`  [ffmpeg] ${message}`);
  }
});

console.log("=== ffmpeg.wasm Node.js Test ===\n");

console.log("1. Loading ffmpeg-core...");
try {
  const isFirst = await ffmpeg.load();
  console.log(`   Loaded (first time: ${isFirst})\n`);
} catch (err) {
  console.error(`   Failed to load: ${err.message}`);
  console.error("   Make sure @ffmpeg/core is installed: npm install @ffmpeg/core");
  process.exit(1);
}

console.log("2. Writing test file to virtual FS...");
const testData = new TextEncoder().encode("Hello from Node.js ffmpeg.wasm!");
await ffmpeg.writeFile("test.txt", testData);
console.log("   Written test.txt\n");

console.log("3. Reading file back...");
const readBack = await ffmpeg.readFile("test.txt", "utf8");
console.log(`   Content: "${readBack}"\n`);

console.log("4. Listing root directory...");
const files = await ffmpeg.listDir("/");
console.log(`   Files: ${files.map(f => f.name).join(", ")}\n`);

console.log("5. Cleaning up...");
await ffmpeg.deleteFile("test.txt");
console.log("   Deleted test.txt\n");

console.log("6. Terminating worker...");
ffmpeg.terminate();
console.log("   Done!\n");

console.log("=== All tests passed ===");
