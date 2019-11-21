const fs = require('fs');
const { createWorker } = require('../../src');

const worker = createWorker({
  progress: (p) => console.log(p),
});

(async () => {
  console.log('Loading ffmpeg-core.js');
  await worker.load();
  console.log('Loading data');
  await worker.write('audio.ogg', '../../tests/assets/triangle/audio.ogg');
  for (let i = 0; i < 60; i += 1) {
    const num = `00${i}`.slice(-3);
    await worker.write(`tmp.${num}.png`, `../../tests/assets/triangle/tmp.${num}.png`);
  }
  console.log('Start transcoding');
  await worker.run('-framerate 30 -pattern_type glob -i *.png -i audio.ogg -c:a copy -shortest -c:v libx264 -pix_fmt yuv420p out.mp4');
  const { data } = await worker.read('out.mp4');
  console.log('Complete transcoding');
  fs.writeFileSync('out.mp4', Buffer.from(data));
  process.exit(0);
})();
