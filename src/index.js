require('regenerator-runtime/runtime');
const { logging, setLogging } = require('./utils/log');
const createWorker = require('./createWorker');

module.exports = {
  logging,
  setLogging,
  createWorker,
};
