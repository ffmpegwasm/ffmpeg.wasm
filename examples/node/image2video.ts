import { readFile, writeFile } from "fs/promises";
import FFmpeg from "../../src";
import { join } from "path";
import { assetsDir, outDir } from "./utils";

const ffmpeg = await FFmpeg.create({
  core: "@ffmpeg.wasm/core-mt",
  log: true,
});

ffmpeg.fs.writeFile(
  "audio.ogg",
  await readFile(join(assetsDir, "triangle", "audio.ogg"))
);
for (let i = 0; i < 60; i += 1) {
  const num = `00${i}`.slice(-3);
  ffmpeg.fs.writeFile(
    `tmp.${num}.png`,
    await readFile(join(assetsDir, "triangle", `tmp.${num}.png`))
  );
}
console.log(ffmpeg.fs.readdir("/"));

await ffmpeg.run([
  "-framerate",
  "30",
  "-pattern_type",
  "glob",
  "-i",
  "*.png",
  "-i",
  "audio.ogg",
  "-c:a",
  "copy",
  "-shortest",
  "-c:v",
  "libx264",
  "-pix_fmt",
  "yuv420p",
  "out.mp4",
]);

ffmpeg.fs.unlink("audio.ogg");
for (let i = 0; i < 60; i += 1) {
  const num = `00${i}`.slice(-3);
  ffmpeg.fs.unlink(`tmp.${num}.png`);
}
await writeFile(join(outDir, "out.mp4"), ffmpeg.fs.readFile("out.mp4"));

await ffmpeg.exit("kill");
process.exit(0);
