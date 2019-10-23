const worker = require('../');
const getCore = require('./getCore');

process.on('message', (packet) => {
  worker.dispatchHandlers(packet, (obj) => process.send(obj));
});

worker.setAdapter({
  getCore,
});
