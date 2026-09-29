// Filters backed by optional libraries (freetype, fribidi, harfbuzz, libass,
// zimg) that ffmpeg.wasm links in.
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec, makeMedia, probe } from "../../helpers/run.js";
import { testdata } from "../../helpers/testdata.js";

const ASS = `[Script Info]
ScriptType: v4.00+
PlayResX: 64
PlayResY: 48

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: Default,Arial,20,&H00FFFFFF,0,0,1,1,0,2,0,0,0

[Events]
Format: Layer, Start, End, Style, Text
Dialogue: 0,0:00:00.00,0:00:01.00,Default,مرحبا hi
`;

// The frames' md5s, so a test can tell whether a filter changed the picture.
const frames = async ({ core, dir }, input, vf) => {
  const out = `${dir}/${crypto.randomUUID()}.md5`;
  const { ret, log } = await exec(core, "-f", "lavfi", "-i", input, ...(vf ? ["-vf", vf] : []), "-f", "framemd5", out);
  expect(ret, log).to.equal(0);
  return new TextDecoder().decode(core.FS.readFile(out)).split("\n").filter((l) => !l.startsWith("#"));
};

const font = async ({ core, dir }) => core.FS.writeFile(`${dir}/arial.ttf`, await testdata("arial.ttf"));
const BLACK = "color=c=black:s=64x48:d=0.2";

test("drawtext draws text (libfreetype)", async ({ core, dir }) => {
  await font({ core, dir });
  const plain = await frames({ core, dir }, BLACK);
  const drawn = await frames({ core, dir }, BLACK, `drawtext=fontfile=${dir}/arial.ttf:text=hi:fontcolor=white`);
  expect(drawn).not.toEqual(plain);
});

test("drawtext shapes right-to-left text (libfribidi)", async ({ core, dir }) => {
  await font({ core, dir });
  const plain = await frames({ core, dir }, BLACK);
  const drawn = await frames({ core, dir }, BLACK, `drawtext=fontfile=${dir}/arial.ttf:text=مرحبا:text_shaping=1:fontcolor=white`);
  expect(drawn).not.toEqual(plain);
});

test("ass renders subtitles (libass + harfbuzz)", async ({ core, dir }) => {
  await font({ core, dir });
  core.FS.writeFile(`${dir}/s.ass`, ASS);
  const input = "color=c=black:s=64x48:d=0.5";
  const plain = await frames({ core, dir }, input);
  const subtitled = await frames({ core, dir }, input, `ass=${dir}/s.ass:fontsdir=${dir}`);
  expect(subtitled).not.toEqual(plain);
});

test("zscale resizes (libzimg)", async ({ core, dir }) => {
  await makeMedia(core, `${dir}/o.png`, ["-f", "lavfi", "-i", "testsrc=s=64x48:d=0.2"], ["-vf", "zscale=w=32:h=24", "-frames:v", "1"]);
  const [image] = (await probe(core, `${dir}/o.png`)).streams;
  expect(image.width).to.equal(32);
  expect(image.height).to.equal(24);
});
