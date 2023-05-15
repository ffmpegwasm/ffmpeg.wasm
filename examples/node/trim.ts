import { readFile, writeFile } from "fs/promises";
import FFmpeg from "../../src";

const ffmpeg = await FFmpeg.create({ log: true });

ffmpeg.fs.writeFile("flame.avi", await readFile("../assets/flame.avi"));
await ffmpeg.run(["-i", "flame.avi", "-ss", "0", "-to", "1", "flame_trim.avi"]);
await writeFile("flame_trim.avi", ffmpeg.fs.readFile("flame_trim.avi"));
process.exit(0);
