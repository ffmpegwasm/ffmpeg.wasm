const fs = require('fs');
const { createFFmpeg } = require('../../src');

const ffmpeg = createFFmpeg({
  log: true,
});

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('flame.avi', '../../tests/assets/flame.avi');
  await ffmpeg.transcode('flame.avi', 'flame.mp4', '-threads 2');
  const data = ffmpeg.read('flame.mp4');
  fs.writeFileSync('flame.mp4', Buffer.from(data));
  process.exit(0);
})();
