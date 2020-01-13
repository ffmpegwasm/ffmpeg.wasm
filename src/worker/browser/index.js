/**
 *
 * Tesseract Worker adapter for browser
 *
 * @fileoverview Tesseract Worker adapter for browser
 * @author Kevin Kwok <antimatter15@gmail.com>
 * @author Guillermo Webster <gui@mit.edu>
 * @author Jerome Wu <jeromewus@gmail.com>
 */
const defaultOptions = require('./defaultOptions');
const spawnWorker = require('./spawnWorker');
const onMessage = require('./onMessage');
const fetchFile = require('./fetchFile');

module.exports = {
  defaultOptions,
  spawnWorker,
  onMessage,
  fetchFile,
};
