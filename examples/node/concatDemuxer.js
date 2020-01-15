const fs = require('fs');
const { createWorker } = require('../../src');

const worker = createWorker({
  logger: ({ message }) => console.log(message),
});

(async () => {
  await worker.load();
  console.log('Start to concat');
  await worker.write('flame.avi', '../../tests/assets/flame.avi');
  await worker.concatDemuxer(['flame.avi', 'flame.avi'], 'flame.mp4');
  const { data } = await worker.read('flame.mp4');
  console.log('Complete concat');
  fs.writeFileSync('flame.mp4', Buffer.from(data));
  process.exit(0);
})();
