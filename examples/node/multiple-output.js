const fs = require('fs');
const { createFFmpeg } = require('../../src');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('flame.avi', '../../tests/assets/flame.avi');
  await ffmpeg.run('-i flame.avi -map 0:v -r 25 out_%06d.bmp');
  ffmpeg.ls('/').filter((p) => p.endsWith('.bmp')).forEach((p) => {
    fs.writeFileSync(p, ffmpeg.read(p));
  });

  process.exit(0);
})();
