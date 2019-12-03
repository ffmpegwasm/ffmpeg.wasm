const defaultOptions = require('./defaultOptions');
const spawnWorker = require('./spawnWorker');
const terminateWorker = require('./terminateWorker');
const onMessage = require('./onMessage');
const send = require('./send');
const fetchFile = require('./fetchFile');
const fs = require('./fs');

module.exports = {
  defaultOptions,
  spawnWorker,
  terminateWorker,
  onMessage,
  send,
  fetchFile,
  fs,
};
