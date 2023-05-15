import { readFile, writeFile } from "fs/promises";
import FFmpeg from "../../src";

const ffmpeg = await FFmpeg.create({
  core: "@ffmpeg.wasm/core-mt",
  log: true,
});

ffmpeg.fs.writeFile("flame.avi", await readFile("../assets/flame.avi"));
await ffmpeg.run(["-i", "flame.avi", "flame.mp4"]);
await writeFile("flame.mp4", ffmpeg.fs.readFile("flame.mp4"));

process.exit(0);
