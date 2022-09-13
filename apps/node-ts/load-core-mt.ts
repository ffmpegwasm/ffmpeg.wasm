import createFFmpegCore from "@ffmpeg/core-mt";

void (async () => {
  const core = await createFFmpegCore();
  console.log(core);
})();
