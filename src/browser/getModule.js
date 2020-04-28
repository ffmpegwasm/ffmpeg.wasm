const { log } = require('../utils/log');

module.exports = ({ corePath }) => new Promise((resolve) => {
  if (typeof window.Module === 'undefined') {
    log('info', `download ffmpeg-core script (~25 MB) from ${corePath}`);
    const script = document.createElement('script');
    const eventHandler = () => {
      script.removeEventListener('load', eventHandler);
      log('info', 'initialize ffmpeg-core');
      window.Module.onRuntimeInitialized = () => {
        log('info', 'ffmpeg-core initialized');
        resolve(window.Module);
      };
    };
    script.src = corePath;
    script.type = 'text/javascript';
    script.addEventListener('load', eventHandler);
    document.getElementsByTagName('head')[0].appendChild(script);
  } else {
    log('info', 'ffmpeg-core is loaded already');
    resolve(window.Module);
  }
});
