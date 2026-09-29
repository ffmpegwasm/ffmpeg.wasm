function logged(core, method, args) {
  const logs = [];
  core.setLogger((entry) => logs.push(entry));
  const ret = core[method](...args);
  core.reset();
  core.setLogger(() => {});
  return { ret, logs, log: logs.map((l) => l.message).join("\n") };
}

export const exec = (core, ...args) => logged(core, "exec", args);
export const ffprobe = (core, ...args) => logged(core, "ffprobe", args);

export function makeMedia(core, path, input, output = []) {
  const { ret, log } = exec(core, ...input, ...output, path);
  if (ret !== 0) throw new Error(`makeMedia ${path} failed (${ret}):\n${log}`);
  return core.FS.readFile(path);
}

export function probe(core, path) {
  const out = `${path}.json`;
  const { log } = ffprobe(core, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path, "-o", out);
  if (!core.FS.analyzePath(out).exists) throw new Error(`ffprobe ${path} failed:\n${log}`);
  return JSON.parse(core.FS.readFile(out, { encoding: "utf8" }));
}
