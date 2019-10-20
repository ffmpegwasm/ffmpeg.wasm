const { getModule } = require('./module');

module.exports = (s) => {
  const Module = getModule();
  const ptr = Module._malloc((s.length+1)*Uint8Array.BYTES_PER_ELEMENT);
  for (let i = 0; i < s.length; i++) {
    Module.setValue(ptr+i, s.charCodeAt(i), 'i8');
  }
  Module.setValue(ptr+s.length, 0, 'i8');
  return ptr;
};
