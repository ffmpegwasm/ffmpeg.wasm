const chai = require("chai");
const constants = require("../tests/constants");

global.expect = chai.expect;
global.createFFmpeg = require("..");
global.atob = (b64) => Buffer.from(b64, "base64").toString("binary");

Object.keys(constants).forEach((key) => {
  global[key] = constants[key];
});
