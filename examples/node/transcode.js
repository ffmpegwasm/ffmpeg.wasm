const fs = require('fs');
const { createFFmpeg, fetchFile } = require('../../src');

const ffmpeg = createFFmpeg({
  log: true,
});

(async () => {
  await ffmpeg.load();
  ffmpeg.FS('writeFile', 'flame.avi', await fetchFile('../assets/flame.avi'));
  await ffmpeg.run('-i', 'flame.avi', 'flame.mp4');
  const data = ffmpeg.FS('readFile', 'flame.mp4');
  fs.writeFileSync('flame.mp4', Buffer.from(data));
  process.exit(0);
})();
