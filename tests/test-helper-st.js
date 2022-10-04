const chai = require("chai");
const browser = require("./test-helper-browser");

global.expect = chai.expect;
global.createFFmpegCore = require("../packages/core");
global.atob = require("./util").atob;
global.FFMPEG_TYPE = "st";

Object.keys(browser).forEach((key) => {
  global[key] = browser[key];
});
