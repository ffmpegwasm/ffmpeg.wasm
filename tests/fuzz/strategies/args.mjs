// Random command lines: filters, encoders, muxers and options with edge-case
// values, on generated input.
const num = (r) => r.pick([0, 1, 2, 3, 7, 16, 63, 64, 65, 255, 1023, 4097, -1, -2]);
const size = (r) => `${num(r)}x${num(r)}`;

const INPUTS = [
  (r) => ["-f", "lavfi", "-i", `testsrc2=s=${r.pick(["16x16", "33x17", "320x240", "1x1"])}:r=${r.pick([1, 10, 30])}:d=0.3`],
  (r) => ["-f", "lavfi", "-i", `sine=f=${r.pick([1, 440, 20000])}:r=${r.pick([8000, 44100, 96000])}:d=0.3`],
  (r) => ["-f", "lavfi", "-i", `color=c=red:s=${r.pick(["2x2", "64x48"])}:d=0.3`],
  () => ["-f", "lavfi", "-i", "anoisesrc=d=0.3", "-f", "lavfi", "-i", "mandelbrot=s=32x32:r=5"],
];
const VIDEO_FILTERS = [
  (r) => `scale=${num(r)}:${num(r)}`,
  (r) => `crop=${num(r)}:${num(r)}:${num(r)}:${num(r)}`,
  (r) => `pad=${num(r)}:${num(r)}`,
  (r) => `fps=${r.pick([0.1, 1, 60, 1000])}`,
  (r) => `rotate=${r.next() * 7}`,
  () => "transpose=1",
  () => "hflip,vflip",
  (r) => `format=${r.pick(["yuv420p", "rgb24", "gray", "yuv444p10le", "pal8", "nv12"])}`,
  (r) => `setpts=${r.pick(["0.1*PTS", "N", "PTS+1000"])}`,
  (r) => `boxblur=${1 + r.int(8)}`,
  () => "split[a][b];[a][b]overlay",
  (r) => `zscale=w=${num(r)}:h=${num(r)}`,
  (r) => `tile=${r.int(5)}x${r.int(5)}`,
];
const AUDIO_FILTERS = [
  (r) => `aresample=${r.pick([1, 8000, 192000])}`,
  (r) => `volume=${r.pick([0, 1e9, -1])}`,
  (r) => `atempo=${r.pick([0.5, 2, 100])}`,
  (r) => `aformat=channel_layouts=${r.pick(["mono", "5.1", "7.1"])}`,
  () => "asplit[a][b];[a][b]amix",
  (r) => `apad=pad_len=${num(r)}`,
];
const OUTPUTS = [
  ["-c:v", "libx264", "out.mp4"], ["-c:v", "libx265", "out.mp4"], ["-c:v", "libvpx", "out.webm"],
  ["-c:v", "libvpx-vp9", "out.webm"], ["-c:v", "mpeg4", "out.avi"], ["-c:v", "libwebp", "out.webp"],
  ["out.gif"], ["out.png"], ["-c:v", "libtheora", "out.ogv"], ["-c:a", "libopus", "out.opus"],
  ["-c:a", "aac", "out.m4a"], ["out.mp3"], ["-c:a", "flac", "out.mkv"], ["-f", "null", "-"],
];
const OPTIONS = [
  (r) => ["-t", String(r.pick([0, 0.01, 0.2, 5]))],
  (r) => ["-frames:v", String(num(r))],
  (r) => ["-r", String(r.pick([0.5, 1, 1000]))],
  (r) => ["-b:v", r.pick(["1", "1k", "100M"])],
  (r) => ["-g", String(num(r))],
  (r) => ["-threads", String(r.pick([0, 1, 16]))],
  () => ["-pix_fmt", "yuv420p"],
  (r) => ["-s", size(r)],
];

export function generate(r) {
  const args = [...r.pick(INPUTS)(r)];
  if (r.int(2)) args.push("-vf", Array.from({ length: 1 + r.int(3) }, () => r.pick(VIDEO_FILTERS)(r)).join(","));
  if (r.int(3) === 0) args.push("-af", r.pick(AUDIO_FILTERS)(r));
  for (let n = r.int(3); n > 0; n--) args.push(...r.pick(OPTIONS)(r));
  args.push(...r.pick(OUTPUTS));
  return [["exec", args]];
}
