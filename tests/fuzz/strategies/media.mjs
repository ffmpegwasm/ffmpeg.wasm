// Mutated media files, decoded and probed: exercises every demuxer and
// decoder the core ships, the way untrusted uploads reach them.
import { mutate } from "../lib.mjs";

export function generate(r, seeds) {
  const [name, bytes] = r.pick(seeds);
  const [, other] = r.pick(seeds);
  const file = `/fuzz-${name}`;
  return [
    ["writeFile", file, Array.from(mutate(r, bytes, other))],
    ["exec", ["-i", file, "-f", "null", "-"]],
    ["ffprobe", ["-v", "error", "-show_format", "-show_streams", file, "-o", "/probe.json"]],
    ["deleteFile", file],
  ];
}
