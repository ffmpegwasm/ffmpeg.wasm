const fs = require('fs');
const { getModule } = require('./util/module');
const getFFmpeg = require('./util/getFFmpeg');
const strList2ptr = require('./util/strList2ptr');
const defaultArgs = require('./constants/defaultArgs');

module.exports = (inputPath, outputExt, options='') => {
  const Module = getModule();
  const data = new Uint8Array(fs.readFileSync(inputPath));
  const iPath = `file.${inputPath.split('.').pop()}`;
  const oPath = `file.${outputExt}`;
  const ffmpeg = getFFmpeg();
  const args = [...defaultArgs, ...`${options} -i ${iPath} ${oPath}`.trim().split(' ')];
  Module.FS.writeFile(iPath, data);
  ffmpeg(args.length, strList2ptr(args));
  return Buffer.from(Module.FS.readFile(oPath));
};
