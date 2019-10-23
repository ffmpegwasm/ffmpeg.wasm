const FFmpegCore = require('@ffmpeg/core');
const { setModule } = require('./util/module');

module.exports = () => (
  new Promise((resolve) => {
    FFmpegCore()
      .then((Module) => {
        setModule(Module);
        resolve();
      });
  })
);
