const str2ptr = require('./str2ptr');

module.exports = (Module, strList) => {
  const listPtr = Module._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);

  strList.forEach((s, idx) => {
    const strPtr = str2ptr(Module, s);
    Module.setValue(listPtr + (4 * idx), strPtr, 'i32');
  });

  return listPtr;
};
