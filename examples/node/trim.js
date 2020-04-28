const fs = require('fs');
const { createFFmpeg } = require('../../src');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('flame.avi', '../../tests/assets/flame.avi');
  await ffmpeg.trim('flame.avi', 'flame_trim.avi', 0, 10);
  fs.writeFileSync('flame_trim.avi', ffmpeg.read('flame_trim.avi'));
  process.exit(0);
})();
