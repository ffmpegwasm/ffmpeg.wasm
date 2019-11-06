const constants = require('../tests/constants');

global.expect = require('expect.js');
global.FFmpeg = require('../src');

Object.keys(constants).forEach((key) => {
  global[key] = constants[key];
});
