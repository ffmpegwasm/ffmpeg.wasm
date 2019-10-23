module.exports = (corePath) => {
  if (typeof global.Module === 'undefined') {
    global.importScripts(corePath);
  }
  return global.Module;
};
