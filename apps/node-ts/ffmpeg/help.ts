import type { FFmpegCoreModule } from "@ffmpeg/types";
import createFFmpeg from "@ffmpeg/core";

void (async () => {
  const ffmpeg = (await createFFmpeg()) as FFmpegCoreModule;
  ffmpeg.setLogger(({ message }) => console.log(message));
  console.log("return code: ", ffmpeg.exec("-h"));
})();
