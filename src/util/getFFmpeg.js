const { getModule } = require('./module');

module.exports = () => {
  const Module = getModule();
  return Module.cwrap('ffmpeg', 'number', ['number', 'number']);
};
