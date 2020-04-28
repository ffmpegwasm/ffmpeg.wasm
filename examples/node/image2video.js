const fs = require('fs');
const { createFFmpeg } = require('../../src');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('audio.ogg', '../../tests/assets/triangle/audio.ogg');
  for (let i = 0; i < 60; i += 1) {
    const num = `00${i}`.slice(-3);
    await ffmpeg.write(`tmp.${num}.png`, `../../tests/assets/triangle/tmp.${num}.png`);
  }
  await ffmpeg.run('-framerate 30 -pattern_type glob -i *.png -i audio.ogg -c:a copy -shortest -c:v libx264 -pix_fmt yuv420p out.mp4');
  await ffmpeg.remove('audio.ogg');
  for (let i = 0; i < 60; i += 1) {
    const num = `00${i}`.slice(-3);
    await ffmpeg.remove(`tmp.${num}.png`);
  }
  fs.writeFileSync('out.mp4', ffmpeg.read('out.mp4'));
  process.exit(0);
})();
