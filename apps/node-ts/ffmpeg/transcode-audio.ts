import fs from "node:fs";
import path from "node:path";
import createFFmpeg from "@ffmpeg/core";
import type { FFmpegCoreModule } from "@ffmpeg/types";

void (async () => {
  const wav = Uint8Array.from(
    fs.readFileSync(path.join(__dirname, "../../../testdata/audio-15s.wav"))
  );

  const ffmpeg = (await createFFmpeg()) as FFmpegCoreModule;
  ffmpeg.setProgress((progress) =>
    console.log(`transcoding progress: ${progress * 100} %`)
  );

  ffmpeg.FS.writeFile("audio.wav", wav);
  console.log("return code: ", ffmpeg.exec("-i", "audio.wav", "audio.mp4"));
})();
