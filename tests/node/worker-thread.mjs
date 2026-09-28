import { parentPort } from "node:worker_threads";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const ffmpeg = new FFmpeg();
await ffmpeg.load();
const ret = await ffmpeg.exec(["-f", "lavfi", "-i", "sine=d=0.2", "a.wav"]);
const size = (await ffmpeg.readFile("a.wav")).length;
ffmpeg.terminate();
parentPort.postMessage({ ret, size });
