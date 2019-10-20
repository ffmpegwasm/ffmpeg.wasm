const { setModule } = require('./util/module');
const FFmpegCore = require('@ffmpeg/core');

module.exports = () => (
  new Promise((resolve, reject) => {
    FFmpegCore()
      .then((Module) => {
        setModule(Module);
        resolve();
      });
  })
);
