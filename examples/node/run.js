const fs = require('fs');
const { createWorker } = require('../../src');

const worker = createWorker({
  logger: ({ message }) => console.log(message),
});

(async () => {
  await worker.load();
  console.log('Start transcoding');
  await worker.write('flame.avi', '../../tests/assets/flame.avi');
  await worker.run('-i /data/flame.avi flame.mp4', { input: 'flame.avi', output: 'flame.mp4' });
  const { data } = await worker.read('flame.mp4');
  console.log('Complete transcoding');
  fs.writeFileSync('flame.mp4', Buffer.from(data));
  process.exit(0);
})();
