import fs from "node:fs";
import path from "node:path";
import createFFmpeg from "@ffmpeg/ffmpeg";

void (async () => {
  const wav = Uint8Array.from(
    fs.readFileSync(path.join(__dirname, "../../../testdata/audio-15s.wav"))
  );

  const ffmpeg = await createFFmpeg();
  ffmpeg.setProgress((progress) =>
    console.log(`transcoding progress: ${progress * 100} %`)
  );

  ffmpeg.FS.writeFile("audio.wav", wav);
  console.log("return code: ", ffmpeg.exec(["-i", "audio.wav", "audio.mp4"]));
})();
