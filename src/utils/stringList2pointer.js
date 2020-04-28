const string2pointer = require('./string2pointer');

module.exports = (Module, strList) => {
  const listPtr = Module._malloc(strList.length * Uint32Array.BYTES_PER_ELEMENT);

  strList.forEach((s, idx) => {
    const strPtr = string2pointer(Module, s);
    Module.setValue(listPtr + (4 * idx), strPtr, 'i32');
  });

  return listPtr;
};
