const { getModule } = require('./module');
const str2ptr = require('./str2ptr');

module.exports = (strList) => {
  const Module = getModule();
  const listPtr = Module._malloc(strList.length*Uint32Array.BYTES_PER_ELEMENT);

  strList.forEach((s, idx) => {
    const strPtr = str2ptr(s);
    Module.setValue(listPtr + (4*idx), strPtr, 'i32');
  });

  return listPtr;
};
