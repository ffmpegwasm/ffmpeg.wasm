<p align="center">
  <a href="#">
    <img alt="ffmpeg.js" width="128px" height="128px" src="https://github.com/ffmpegjs/ffmpeg.js/raw/master/docs/images/ffmpegjs-icon.png">
  </a>
</p>

# ffmpeg.js

[![Node Version](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)
[![Actions Status](https://github.com/ffmpegjs/ffmpeg.js/workflows/CI/badge.svg)](https://github.com/ffmpegjs/ffmpeg.js/actions)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/ffmpegjs/ffmpeg.js/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![Downloads Total](https://img.shields.io/npm/dt/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
[![Downloads Month](https://img.shields.io/npm/dm/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)

Use FFmpeg directly in your browser without any backend services!!

**Transcode**
<p align="center">
  <a href="#">
    <img alt="transcode-demo" src="https://github.com/ffmpegjs/ffmpeg.js/raw/master/docs/images/transcode.gif">
  </a>
</p>

<a href="https://codepen.io/jeromewu/pen/NWWaMeY" target="_blank">
<img alt="codepen" width="128px" src="https://blog.codepen.io/wp-content/uploads/2012/06/codepen-wordmark-display-inside-black@10x.png">
</a>

[Source Code](https://github.com/ffmpegjs/ffmpeg.js/blob/master/examples/browser/transcode.html)

## Examples:

| Name | Demo | Source Code |
| ---- | ------- | ----------- |
| Webcam | <a href="https://codepen.io/jeromewu/pen/qBBKzyW" target="_blank"><img alt="codepen" width="128px" src="https://blog.codepen.io/wp-content/uploads/2012/06/codepen-wordmark-display-inside-black@10x.png"></a> | [Link](https://github.com/ffmpegjs/ffmpeg.js/blob/master/examples/browser/webcam.html) |


---

ffmpeg.js provides simple to use APIs, to transcode a video you only need few lines of code:

```javascript
const fs = require('fs');
const { createWorker } = require('@ffmpeg/ffmpeg');

const worker = createWorker();

(async () => {
  await worker.load();
  await worker.write('test.avi', './test.avi');
  await worker.transcode('test.avi', 'test.mp4');
  const { data } = await worker.read('test.mp4');
  fs.writeFileSync('./test.mp4', data);
})();
```

## Installation

```
$ npm install @ffmpeg/ffmpeg
```

> As we use `worker_threads` which was introduced in Node.js v10.5.0, please remember to add `--experimental-worker` if you are using Node.js v10, and you don't have to add anything if you are using Node.js v12

## Documentation

- [API](https://github.com/ffmpegjs/ffmpeg.js/blob/master/docs/api.md)

## Tutorials

Learn how to build ffmpeg.js from stories:

- [Part.1 Preparation](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-1-preparation-ed12bf4c8fac)
- [Part.2 Compile with Emscripten](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-2-compile-with-emscripten-4c581e8c9a16)
- [Part.3 ffmpeg.js v0.1.0 — Transcoding avi to mp4](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-3-ffmpeg-js-v0-1-0-transcoding-avi-to-mp4-f729e503a397)
- [Part.4 ffmpeg.js v0.2 — Web Worker and Libx264](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-4-ffmpeg-js-v0-2-web-worker-and-libx264-d0596f1beb4e)
- [Part.5 ffmpeg.js v0.3 — pre-js and live streaming](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-5-ffmpeg-js-v0-3-pre-js-and-live-streaming-c1498939a74c)
- [Part.6 a Deep Dive into File System](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-6-a-deep-dive-into-file-system-56eba10067ca)
