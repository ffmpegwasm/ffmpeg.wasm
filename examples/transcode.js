const fs = require('fs');
const ffmpeg = require('../src');
const { argv } = process;
const [,, inputPath, outputPath] = argv;

(async () => {
  await ffmpeg.load();
  const data = ffmpeg.transcode(inputPath, outputPath.split('.').pop());
  fs.writeFileSync(outputPath, data);
})();
