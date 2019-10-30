const fs = require('fs');
const { createWorker } = require('../../src');

const { argv } = process;
const [,, inputPath, outputPath] = argv;

const worker = createWorker({
  logger: ({ message }) => console.log(message),
});

(async () => {
  await worker.load();
  console.log('Start transcoding');
  const { data } = await worker.transcode(inputPath, outputPath.split('.').pop());
  console.log('Complete transcoding');
  fs.writeFileSync(outputPath, Buffer.from(data));
  process.exit(0);
})();
