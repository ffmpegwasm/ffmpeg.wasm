// Shared helpers for the fuzz strategies.

/** Small deterministic PRNG (mulberry32), so every case can be replayed. */
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n) => Math.floor(next() * n);
  const pick = (list) => list[int(list.length)];
  return { next, int, pick };
}

const INTERESTING = [0x00, 0x01, 0x7f, 0x80, 0xff];

/** Returns a copy of `bytes` with 1-4 random mutations. */
export function mutate(r, bytes, other) {
  let out = Uint8Array.from(bytes);
  for (let n = 1 + r.int(4); n > 0 && out.length; n--) {
    const at = r.int(out.length);
    switch (r.int(6)) {
      case 0: // flip a bit
        out[at] ^= 1 << r.int(8);
        break;
      case 1: // interesting byte
        out[at] = r.pick(INTERESTING);
        break;
      case 2: { // overwrite a run with random bytes
        const len = Math.min(1 + r.int(16), out.length - at);
        for (let i = 0; i < len; i++) out[at + i] = r.int(256);
        break;
      }
      case 3: // truncate
        out = out.subarray(0, at);
        break;
      case 4: { // duplicate a chunk
        const len = Math.min(1 + r.int(256), out.length - at);
        const copy = new Uint8Array(out.length + len);
        copy.set(out.subarray(0, at + len));
        copy.set(out.subarray(at, at + len), at + len);
        copy.set(out.subarray(at + len), at + 2 * len);
        out = copy;
        break;
      }
      case 5: { // splice in part of another seed
        const cut = other.subarray(r.int(other.length));
        const spliced = new Uint8Array(at + cut.length);
        spliced.set(out.subarray(0, at));
        spliced.set(cut, at);
        out = spliced;
        break;
      }
    }
  }
  return out;
}

/**
 * Seed media, generated with ffmpeg.wasm itself (small, so mutations reach
 * interesting code quickly): [file name, ffmpeg output arguments].
 */
const V = ["-map", "0:v", "-t", "0.3"];
const A = ["-map", "1:a", "-t", "0.3"];
const AV = ["-map", "0:v", "-map", "1:a", "-t", "0.3"];
export const SEEDS = [
  ["h264.mp4", [...AV, "-c:v", "libx264", "-c:a", "aac"]],
  ["hevc.mp4", [...V, "-c:v", "libx265"]],
  ["vp8.webm", [...AV, "-c:v", "libvpx", "-c:a", "libvorbis"]],
  ["vp9.webm", [...AV, "-c:v", "libvpx-vp9", "-c:a", "libopus"]],
  ["theora.ogv", [...V, "-c:v", "libtheora"]],
  ["mpeg4.avi", [...AV, "-c:v", "mpeg4", "-c:a", "libmp3lame"]],
  ["mpeg2.ts", [...AV, "-c:v", "mpeg2video", "-c:a", "mp2"]],
  ["mjpeg.mov", [...AV, "-c:v", "mjpeg", "-c:a", "pcm_s16le"]],
  ["ffv1.mkv", [...AV, "-c:v", "ffv1", "-c:a", "flac"]],
  ["frame.png", ["-map", "0:v", "-frames:v", "1"]],
  ["frame.jpg", ["-map", "0:v", "-frames:v", "1"]],
  ["frame.webp", ["-map", "0:v", "-c:v", "libwebp", "-frames:v", "1"]],
  ["anim.gif", V],
  ["sound.mp3", A],
  ["sound.aac", A],
  ["sound.opus", A],
  ["sound.ogg", [...A, "-c:a", "libvorbis"]],
  ["sound.flac", A],
  ["sound.wav", A],
];
export const SEED_INPUT = ["-f", "lavfi", "-i", "testsrc=s=64x48:r=10", "-f", "lavfi", "-i", "sine=f=440"];
