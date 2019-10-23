let FFmpegCore = null;

module.exports = () => {
  if (FFmpegCore === null) {
    FFmpegCore = require('@ffmpeg/core');
  }
  return FFmpegCore;
};
