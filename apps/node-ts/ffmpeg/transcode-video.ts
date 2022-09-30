import fs from "node:fs";
import path from "node:path";
import createFFmpeg from "@ffmpeg/core";

void (async () => {
  const avi = Uint8Array.from(
    fs.readFileSync(path.join(__dirname, "../../../testdata/video-15s.avi"))
  );

  const ffmpeg = await createFFmpeg();
  ffmpeg.setProgress((progress) =>
    console.log(`transcoding progress: ${progress * 100} %`)
  );

  ffmpeg.FS.writeFile("video.avi", avi);
  console.log("return code: ", ffmpeg.exec("-i", "video.avi", "video.mp4"));
})();
