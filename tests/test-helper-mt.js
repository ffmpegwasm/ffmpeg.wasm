const chai = require("chai");
const browser = require("./test-helper-browser");

global.expect = chai.expect;
global.createFFmpegCore = require("../packages/core-mt");
global.atob = require("./util").atob;
global.FFMPEG_TYPE = "mt";

Object.keys(browser).forEach((key) => {
  global[key] = browser[key];
});
