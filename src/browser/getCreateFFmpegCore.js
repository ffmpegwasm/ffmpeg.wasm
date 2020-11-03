const resolveURL = require('resolve-url');
const { log } = require('../utils/log');

module.exports = async ({ corePath: _corePath }) => {
  if (typeof window.createFFmpegCore === 'undefined') {
    log('info', 'fetch ffmpeg-core.worker.js script');
    const corePath = resolveURL(_corePath);
    const workerBlob = await (await fetch(corePath.replace('ffmpeg-core.js', 'ffmpeg-core.worker.js'))).blob();
    window.FFMPEG_CORE_WORKER_SCRIPT = URL.createObjectURL(workerBlob);
    log('info', `worker object URL=${window.FFMPEG_CORE_WORKER_SCRIPT}`);
    log('info', `download ffmpeg-core script (~25 MB) from ${corePath}`);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      const eventHandler = () => {
        script.removeEventListener('load', eventHandler);
        log('info', 'initialize ffmpeg-core');
        resolve(window.createFFmpegCore);
      };
      script.src = corePath;
      script.type = 'text/javascript';
      script.addEventListener('load', eventHandler);
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
  log('info', 'ffmpeg-core is loaded already');
  return Promise.resolve(window.createFFmpegCore);
};
