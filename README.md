<p align="center">
  <a href="#">
    <img alt="ffmpeg.wasm" width="128px" height="128px" src="https://github.com/ffmpegwasm/ffmpeg.wasm/raw/master/docs/images/ffmpegwasm-icon.png">
  </a>
</p>

# ffmpeg.wasm

[![Node Version](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)
[![Actions Status](https://github.com/ffmpegwasm/ffmpeg.wasm/workflows/CI/badge.svg)](https://github.com/ffmpegwasm/ffmpeg.wasm/actions)
![CodeQL](https://github.com/ffmpegwasm/ffmpeg.wasm/workflows/CodeQL/badge.svg)
![npm (tag)](https://img.shields.io/npm/v/@ffmpeg/ffmpeg/latest)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/ffmpegwasm/ffmpeg.wasm/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![Downloads Total](https://img.shields.io/npm/dt/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
[![Downloads Month](https://img.shields.io/npm/dm/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)

ffmpeg.wasm is a pure Webassembly / Javascript port of FFmpeg. It enables video & audio record, convert and stream right inside browsers.

**AVI to MP4 Demo**
<p align="center">
  <a href="#">
    <img alt="transcode-demo" src="https://github.com/ffmpegwasm/ffmpeg.wasm/raw/master/docs/images/transcode.gif">
  </a>
</p>

Try it: [https://ffmpegwasm.github.io](https://ffmpegwasm.github.io#demo)


## Installation

```
$ npm install @ffmpeg/ffmpeg @ffmpeg/core
```

> As we are using the latest experimental features, you need to add few flags to run in Node.js

```
$ node --experimental-wasm-threads --experimental-wasm-bulk-memory transcode.js
```

Or, using a script tag in the browser (only works in Chrome):

```html
<script src="https://unpkg.com/@ffmpeg/ffmpeg@0.9.2/dist/ffmpeg.min.js"></script>
<script>
  const { createFFmpeg } = FFmpeg;
  ...
</script>
```

> Only browsers with SharedArrayBuffer support can use ffmpeg.wasm, you can check [HERE](https://caniuse.com/sharedarraybuffer) for the complete list.

## Usage

ffmpeg.wasm provides simple to use APIs, to transcode a video you only need few lines of code:

```javascript
const fs = require('fs');
const { createFFmpeg, fetchFile } = require('@ffmpeg/ffmpeg');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  ffmpeg.FS('writeFile', 'test.avi', await fetchFile('./test.avi'));
  await ffmpeg.run('-i', 'test.avi', 'test.mp4');
  await fs.promises.writeFile('./test.mp4', ffmpeg.FS('readFile', 'test.mp4'));
  process.exit(0);
})();
```

## Multi-threading

Multi-threading need to be configured per external libraries, only following libraries supports it now:

### x264

Run it multi-threading mode by default, no need to pass any arguments.

### libvpx / webm

Need to pass `-row-mt 1`, but can only use one thread to help, can speed up around 30%

## Documentation

- [API](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/docs/api.md)
- [Supported External Libraries](https://github.com/ffmpegwasm/ffmpeg.wasm-core#configuration)
