const worker = require('../');
const getCore = require('./getCore');

global.addEventListener('message', ({ data }) => {
  worker.dispatchHandlers(data, (obj) => postMessage(obj));
});

worker.setAdapter({
  getCore,
});
