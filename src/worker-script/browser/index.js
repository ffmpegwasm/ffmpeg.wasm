const worker = require('../');
const getCore = require('./getCore');
const fs = require('../../worker/browser/fs');

global.addEventListener('message', ({ data }) => {
  worker.dispatchHandlers(data, (obj) => postMessage(obj));
});

worker.setAdapter({
  getCore,
  fs,
});
