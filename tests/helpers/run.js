// exec() and ffprobe() resolve to the exit code: the JSPI core returns
// Promises, the others numbers.
async function logged(core, method, args) {
  const logs = [];
  core.setLogger((entry) => logs.push(entry));
  const ret = await core[method](...args);
  core.reset();
  core.setLogger(() => {});
  return { ret, logs, log: logs.map((l) => l.message).join("\n") };
}

export const exec = (core, ...args) => logged(core, "exec", args);
export const ffprobe = (core, ...args) => logged(core, "ffprobe", args);

export async function makeMedia(core, path, input, output = []) {
  const { ret, log } = await exec(core, ...input, ...output, path);
  if (ret !== 0) throw new Error(`makeMedia ${path} failed (${ret}):\n${log}`);
  return core.FS.readFile(path);
}

export async function probe(core, path) {
  const out = `${path}.json`;
  const { log } = await ffprobe(core, "-v", "error", "-print_format", "json", "-show_format", "-show_streams", path, "-o", out);
  if (!core.FS.analyzePath(out).exists) throw new Error(`ffprobe ${path} failed:\n${log}`);
  return JSON.parse(core.FS.readFile(out, { encoding: "utf8" }));
}

// fn(0) ... fn(n - 1), one after another: a core runs one command at a time.
export async function times(n, fn) {
  const results = [];
  for (let i = 0; i < n; i++) results.push(await fn(i));
  return results;
}
