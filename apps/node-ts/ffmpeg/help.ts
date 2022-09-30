import createFFmpeg from "@ffmpeg/core";

void (async () => {
  const ffmpeg = await createFFmpeg();
  ffmpeg.setLogger(({ message }) => console.log(message));
  console.log("return code: ", ffmpeg.exec("-h"));
})();
