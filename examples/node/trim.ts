import { readFile, writeFile } from "fs/promises";
import FFmpeg from "../../src";
import { join } from "path";
import { assetsDir, outDir } from "./utils";

const ffmpeg = await FFmpeg.create({ log: true });

ffmpeg.fs.writeFile("flame.avi", await readFile(join(assetsDir, "flame.avi")));
await ffmpeg.run(["-i", "flame.avi", "-ss", "0", "-to", "1", "flame_trim.avi"]);
await writeFile(
  join(outDir, "flame_trim.avi"),
  ffmpeg.fs.readFile("flame_trim.avi")
);

await ffmpeg.exit("kill");
process.exit(0);
