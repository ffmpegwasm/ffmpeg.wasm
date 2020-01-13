const util = require('util');
const fs = require('fs');
const fetch = require('node-fetch');
const isURL = require('is-url');

module.exports = async (_data) => {
  let data = _data;
  if (typeof _data === 'undefined') {
    return new Uint8Array();
  }

  if (typeof _data === 'string') {
    if (isURL(_data) || _data.startsWith('chrome-extension://') || _data.startsWith('file://')) {
      const res = await fetch(_data);
      data = await res.arrayBuffer();
    } else if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(_data)) {
      data = Buffer.from(_data.split(',')[1], 'base64');
    } else {
      data = await util.promisify(fs.readFile)(_data);
    }
  } else if (Buffer.isBuffer(_data)) {
    data = _data;
  }

  return new Uint8Array(data);
};
