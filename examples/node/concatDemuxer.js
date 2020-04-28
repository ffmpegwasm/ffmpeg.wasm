const fs = require('fs');
const { createFFmpeg } = require('../../src');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('flame.avi', '../../tests/assets/flame.avi');
  await ffmpeg.concatDemuxer(['flame.avi', 'flame.avi'], 'flame.mp4');
  fs.writeFileSync('flame.mp4', ffmpeg.read('flame.mp4'));
  process.exit(0);
})();
