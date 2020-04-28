module.exports = () => new Promise((resolve) => {
  const Module = require('@ffmpeg/core');
  Module.onRuntimeInitialized = () => {
    resolve(Module);
  };
});
