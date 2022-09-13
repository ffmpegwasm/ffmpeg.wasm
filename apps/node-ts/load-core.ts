import createFFmpegCore from "@ffmpeg/core";

void (async () => {
  const core = await createFFmpegCore();
  console.log(core);
})();
