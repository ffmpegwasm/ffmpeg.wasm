// Random sequences of FFmpeg class calls with odd paths and data.
const NAMES = ["a", "dir", "ünïcödé-🎬", "with space", "..", ".", "a/b/c", "x".repeat(300), "__proto__", ""];

export function generate(r) {
  const path = () => `/${r.pick(NAMES)}${r.int(2) ? `/${r.pick(NAMES)}` : ""}`;
  const bytes = () => Array.from({ length: r.pick([0, 1, 1000, 100000]) }, () => r.int(256));
  const CALLS = [
    () => ["writeFile", path(), bytes()],
    () => ["writeFile", path(), "text ✓"],
    () => ["readFile", path()],
    () => ["readFile", path(), "utf8"],
    () => ["deleteFile", path()],
    () => ["rename", path(), path()],
    () => ["createDir", path()],
    () => ["listDir", path()],
    () => ["deleteDir", path()],
    () => ["exec", ["-i", path(), "-f", "null", "-"]],
    () => ["ffprobe", ["-show_format", path()]],
  ];
  return Array.from({ length: 3 + r.int(12) }, () => r.pick(CALLS)());
}
