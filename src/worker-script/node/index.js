const { parentPort } = require('worker_threads');
const worker = require('../');
const getCore = require('./getCore');

parentPort.on('message', (packet) => {
  worker.dispatchHandlers(
    packet,
    (...args) => {
      parentPort.postMessage(...args);
    },
  );
});

worker.setAdapter({
  getCore,
});
