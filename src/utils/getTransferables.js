module.exports = (packet) => {
  const transferables = [];
  const check = (b) => {
    if (b instanceof Uint8Array) {
      transferables.push(b.buffer);
    } else if (b instanceof ArrayBuffer) {
      transferables.push(b);
    }
  };
  const { payload: { args, data } } = packet;
  check(data);
  if (Array.isArray(args)) {
    args.forEach((arg) => check(arg));
  }
  return transferables;
};
