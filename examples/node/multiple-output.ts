import { readFile, writeFile } from "fs/promises";
import FFmpeg from "../../src";

const ffmpeg = await FFmpeg.create({
  core: "@ffmpeg.wasm/core-mt",
  log: true,
});

ffmpeg.fs.writeFile("flame.avi", await readFile("../assets/flame.avi"));
await ffmpeg.run([
  "-i",
  "flame.avi",
  "-map",
  "0:v",
  "-r",
  "25",
  "out_%06d.bmp",
]);
await Promise.all(
  ffmpeg.fs
    .readdir("/")
    .filter((p) => p.endsWith(".bmp"))
    .map((p) => writeFile(p, ffmpeg.fs.readFile(p)))
);

process.exit(0);
