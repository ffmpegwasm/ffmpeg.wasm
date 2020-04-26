const fs = require('fs');
const { createWorker } = require('../../src');

const worker = createWorker({
  logger: ({ message }) => console.log(message),
});

(async () => {
  await worker.load();
  console.log('Start hstack');
  await worker.write('flame.avi', '../../tests/assets/flame.avi');
  await worker.run('-i flame.avi -i flame.avi -filter_complex hstack flame.mp4');
  const { data } = await worker.read('flame.mp4');
  console.log('Complete hstack');
  fs.writeFileSync('flame.mp4', Buffer.from(data));
  await worker.terminate();
})();
