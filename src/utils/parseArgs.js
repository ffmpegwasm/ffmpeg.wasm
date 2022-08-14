module.exports = (Core, args) => {
  const argsPtr = Core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
    const sz = Core.lengthBytesUTF8(s) + 1;
    const buf = Core._malloc(sz);
    Core.stringToUTF8(s, buf, sz);
    Core.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};
