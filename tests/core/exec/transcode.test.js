// Everyday conversions from the README and docs, on the testdata fixtures.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, makeMedia, probe } from "../../helpers/run.js";
import { testdata } from "../../helpers/testdata.js";

const conv = ({ core, dir }, input, inName, outName, extra = []) => {
  core.FS.writeFile(`${dir}/${inName}`, input);
  const { ret, log } = exec(core, "-i", `${dir}/${inName}`, ...extra, `${dir}/${outName}`);
  expect(ret, log).to.equal(0);
  return probe(core, `${dir}/${outName}`);
};

test("mp4 -> avi", async ({ core, dir }) => {
  const input = await testdata("video-1s.mp4");
  const output = conv({ core, dir }, input, "in.mp4", "out.avi");
  expect(output.format.format_name).to.equal("avi");
  expect(output.streams[0].codec_type).to.equal("video");
});

test("avi -> mp4 (libx264)", async ({ core, dir }) => {
  const input = await testdata("video-1s.avi");
  const output = conv({ core, dir }, input, "in.avi", "out.mp4");
  const video = output.streams.find((s) => s.codec_type === "video");
  expect(video.codec_name).to.equal("h264");
});

test("wav -> mp3", async ({ core, dir }) => {
  const input = await testdata("audio-1s.wav");
  const output = conv({ core, dir }, input, "in.wav", "out.mp3");
  expect(output.streams[0].codec_name).to.equal("mp3");
});

test("extracts audio from a video", ({ core, dir }) => {
  const av = makeMedia(core, `${dir}/av.mp4`, [
    "-f", "lavfi", "-i", "testsrc=d=0.5:s=32x32", "-f", "lavfi", "-i", "sine=d=0.5",
  ]);
  const output = conv({ core, dir }, av, "in.mp4", "out.wav", ["-vn"]);
  const types = output.streams.map((s) => s.codec_type);
  expect(types).to.deep.equal(["audio"]);
});

test("trims with -ss/-t", async ({ core, dir }) => {
  const input = await testdata("video-3s.avi");
  const output = conv({ core, dir }, input, "in.avi", "out.mp4", ["-ss", "1", "-t", "1"]);
  const duration = Number(output.format.duration);
  expect(duration).to.be.closeTo(1, 0.25);
});

test("scales with -vf scale", async ({ core, dir }) => {
  const input = await testdata("video-1s.mp4");
  const output = conv({ core, dir }, input, "in.mp4", "out.mp4", ["-vf", "scale=16:12"]);
  const video = output.streams.find((s) => s.codec_type === "video");
  expect(video.width).to.equal(16);
  expect(video.height).to.equal(12);
});

test("decodes a 1080p60 h264 clip", { timeout: 120000 }, async ({ core, dir }) => {
  const input = await testdata("video-1080p-60fps-2s.mp4");
  const output = conv({ core, dir }, input, "in.mp4", "out.mp4", ["-an", "-vf", "scale=160:-2", "-t", "0.5"]);
  const video = output.streams.find((s) => s.codec_type === "video");
  expect(video.width).to.equal(160);
});

test("jpg -> png and png -> jpg", async ({ core, dir }) => {
  const png = conv({ core, dir }, await testdata("image.jpg"), "in.jpg", "out.png");
  const jpg = conv({ core, dir }, await testdata("image.png"), "in2.png", "out.jpg");
  expect(png.streams[0].codec_name).to.equal("png");
  expect(jpg.streams[0].codec_name).to.equal("mjpeg");
});

test("writes several outputs from one command", async ({ core, dir }) => {
  core.FS.writeFile(`${dir}/in.avi`, await testdata("video-1s.avi"));
  const { ret } = exec(core, "-i", `${dir}/in.avi`, `${dir}/a.mp4`, `${dir}/b.webm`);
  const mp4 = probe(core, `${dir}/a.mp4`);
  const webm = probe(core, `${dir}/b.webm`);
  expect(ret).to.equal(0);
  expect(mp4.format.format_name).to.include("mp4");
  expect(webm.format.format_name).to.include("webm");
});

test("concatenates with the concat demuxer", async ({ core, dir }) => {
  const { FS } = core;
  FS.writeFile(`${dir}/1.wav`, await testdata("audio-1s.wav"));
  FS.writeFile(`${dir}/2.wav`, await testdata("audio-1s.wav"));
  FS.writeFile(`${dir}/list.txt`, `file '${dir}/1.wav'\nfile '${dir}/2.wav'\n`);
  const { ret } = exec(core, "-f", "concat", "-safe", "0", "-i", `${dir}/list.txt`, "-c", "copy", `${dir}/o.wav`);
  const duration = Number(probe(core, `${dir}/o.wav`).format.duration);
  expect(ret).to.equal(0);
  expect(duration).to.be.closeTo(2, 0.1);
});
