// Every external library in the Dockerfile's --enable-* list, plus the
// built-in encoders people use most, produces a stream ffprobe recognises.
import { expect } from "vitest";
import { test, isMT } from "../../helpers/core.js";
import { exec, probe } from "../../helpers/run.js";

const VIDEO = ["-f", "lavfi", "-i", "testsrc=d=0.4:s=64x48:r=10"];
const AUDIO = ["-f", "lavfi", "-i", "sine=f=440:d=0.4"];

const cases = [
  ["libx264", VIDEO, ["-c:v", "libx264"], "out.mp4", "h264"],
  ["libx265", VIDEO, ["-c:v", "libx265"], "out.mp4", "hevc"],
  ["libvpx (vp8)", VIDEO, ["-c:v", "libvpx"], "out.webm", "vp8"],
  ["libvpx-vp9", VIDEO, ["-c:v", "libvpx-vp9"], "out.webm", "vp9"],
  ["libwebp", VIDEO, ["-c:v", "libwebp", "-frames:v", "1"], "out.webp", "webp"],
  ["png (zlib)", VIDEO, ["-frames:v", "1"], "out.png", "png"],
  ["mjpeg", VIDEO, ["-frames:v", "1"], "out.jpg", "mjpeg"],
  ["gif", VIDEO, [], "out.gif", "gif"],
  ["mpeg4", VIDEO, ["-c:v", "mpeg4"], "out.avi", "mpeg4"],
  ["libmp3lame", AUDIO, [], "out.mp3", "mp3"],
  ["libvorbis", AUDIO, ["-c:a", "libvorbis"], "out.ogg", "vorbis"],
  ["libopus", AUDIO, ["-c:a", "libopus"], "out.opus", "opus"],
  ["aac", AUDIO, ["-c:a", "aac"], "out.m4a", "aac"],
  ["flac", AUDIO, [], "out.flac", "flac"],
  ["pcm_s16le", AUDIO, [], "out.wav", "pcm_s16le"],
  ["libtheora", VIDEO, ["-c:v", "libtheora"], "out.ogv", "theora"],
];

test.for(cases)("encodes with %s", ([name, input, opts, out, codec], { core, dir, skip }) => {
  // libx265 is only in core-mt, see issues/898.
  if (name === "libx265" && !isMT()) skip();
  const path = `${dir}/${out}`;
  const { ret, log } = exec(core, ...input, ...opts, path);
  const [stream] = probe(core, path).streams;
  expect(ret, log).to.equal(0);
  expect(stream.codec_name).to.equal(codec);
});

