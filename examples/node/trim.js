const fs = require('fs');
const { createWorker } = require('../../src');

const worker = createWorker({
  logger: ({ message }) => console.log(message),
});

(async () => {
  await worker.load();
  console.log('Start trimming');
  await worker.write('flame.avi', '../../tests/assets/flame.avi');
  await worker.trim('flame.avi', 'flame_trim.avi', 0, 10);
  const { data } = await worker.read('flame_trim.avi');
  console.log('Complete trimming');
  fs.writeFileSync('flame_trim.avi', Buffer.from(data));
  await worker.terminate();
})();
