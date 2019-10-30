const util = require('util');
const fs = require('fs');
const fetch = require('node-fetch');
const isURL = require('is-url');

const readFile = util.promisify(fs.readFile);

module.exports = async (media) => {
  let data = media;
  if (typeof media === 'undefined') {
    return media;
  }

  if (typeof media === 'string') {
    if (isURL(media) || media.startsWith('chrome-extension://') || media.startsWith('file://')) {
      const res = await fetch(media);
      data = res.arrayBuffer();
    } else if (/data:media\/([a-zA-Z]*);base64,([^"]*)/.test(media)) {
      data = Buffer.from(media.split(',')[1], 'base64');
    } else {
      data = await readFile(media);
    }
  } else if (Buffer.isBuffer(media)) {
    data = media;
  }

  return new Uint8Array(data);
};
