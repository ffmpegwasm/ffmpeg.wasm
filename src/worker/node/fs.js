const util = require('util');
const fs = require('fs');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const deleteFile = util.promisify(fs.unlink);

module.exports = (path) => (
  readFile(`./data/${path}`)
);

module.exports = {
  readFile: (path) => readFile(`./data/${path}`),
  writeFile: (path, data) => writeFile(`./data/${path}`, data),
  deleteFile: (path) => deleteFile(`./data/${path}`),
};
