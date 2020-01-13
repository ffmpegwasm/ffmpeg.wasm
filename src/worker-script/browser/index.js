const worker = require('../');
const getCore = require('./getCore');

global.addEventListener('message', ({ data }) => {
  worker.dispatchHandlers(data, postMessage);
});

worker.setAdapter({
  getCore,
});
