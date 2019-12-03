const worker = require('../');
const getCore = require('./getCore');
const fs = require('../../worker/node/fs');

process.on('message', (packet) => {
  worker.dispatchHandlers(packet, (obj) => process.send(obj));
});

worker.setAdapter({
  getCore,
  fs,
});
