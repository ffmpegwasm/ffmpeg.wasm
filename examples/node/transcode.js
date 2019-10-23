const { createWorker } = require('../../src');

const { argv } = process;
const [,, inputPath, outputPath] = argv;

const worker = createWorker();

(async () => {
  await worker.load();
  const { data } = await worker.transcode(inputPath, outputPath.split('.').pop());
  console.log(data.length);
})();
