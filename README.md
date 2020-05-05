# Please visit [Kagami/ffmpeg.js](https://github.com/Kagami/ffmpeg.js/) if you are looking for ffmpeg.js


<p align="center">
  <a href="#">
    <img alt="ffmpeg.wasm" width="128px" height="128px" src="https://github.com/ffmpegwasm/ffmpeg.wasm/raw/master/docs/images/ffmpegjs-icon.png">
  </a>
</p>

# ffmpeg.wasm

[![Node Version](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)](https://img.shields.io/node/v/@ffmpeg/ffmpeg.svg)
[![Actions Status](https://github.com/ffmpegwasm/ffmpeg.wasm/workflows/CI/badge.svg)](https://github.com/ffmpegwasm/ffmpeg.wasm/actions)
![npm (tag)](https://img.shields.io/npm/v/@ffmpeg/ffmpeg/latest)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/ffmpegwasm/ffmpeg.wasm/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![Downloads Total](https://img.shields.io/npm/dt/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
[![Downloads Month](https://img.shields.io/npm/dm/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)

Use FFmpeg directly in your browser without any backend services!!

**Transcode**
<p align="center">
  <a href="#">
    <img alt="transcode-demo" src="https://github.com/ffmpegwasm/ffmpeg.wasm/raw/master/docs/images/transcode.gif">
  </a>
</p>

<a href="https://codepen.io/jeromewu/pen/NWWaMeY" target="_blank">
<img alt="codepen" width="128px" src="https://blog.codepen.io/wp-content/uploads/2012/06/codepen-wordmark-display-inside-black@10x.png">
</a>

[Source Code](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/examples/browser/transcode.html)

## Browsers support

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome |
| --------- |
| last 2 versions

## Examples:

| Name | Demo | Source Code |
| ---- | ------- | ----------- |
| Webcam | <a href="https://codepen.io/jeromewu/pen/qBBKzyW" target="_blank"><img alt="codepen" width="128px" src="https://blog.codepen.io/wp-content/uploads/2012/06/codepen-wordmark-display-inside-black@10x.png"></a> | [Link](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/examples/browser/webcam.html) |

## Supported Formats

- mp4 (x264)
- webm (vp8/vp9) (^0.8.0)
- mp3 (^0.8.0)

---

ffmpeg.wasm provides simple to use APIs, to transcode a video you only need few lines of code:

```javascript
const fs = require('fs');
const { createFFmpeg } = require('@ffmpeg/ffmpeg');

const ffmpeg = createFFmpeg({ log: true });

(async () => {
  await ffmpeg.load();
  await ffmpeg.write('test.avi', './test.avi');
  await ffmpeg.transcode('test.avi', 'test.mp4');
  fs.writeFileSync('./test.mp4', ffmpeg.read('test.mp4'));
  process.exit(0);
})();
```

## Installation

```
$ npm install @ffmpeg/ffmpeg
```

> As we are using the latest experimental features, you need to add few flags to run in Node.js

```
$ node --experimental-wasm-threads --experimental-wasm-bulk-memory transcode.js
```

Or, using a script tag in the browser (only works in Chrome):

```html
<script src="https://unpkg.com/@ffmpeg/ffmpeg@0.8.3/dist/ffmpeg.min.js"></script>
<script>
  const { createFFmpeg } = FFmpeg;
  ...
</script>
```

## Multi-thread

Starting from v0.8.0, multithreading is enabled and you can use this feature by passing `-threads <NUM>` (`NUM` < 8 ). For built-in functions like `transcode()`, you can pass it as 3rd argument.

```javascript
// in transcode()
await ffmpeg.transcode('flame.avi', 'flame.mp4', '-threads 2');

// in run()
await ffmpeg.run('-i flame.avi -threads 2 flame.mp4');
```

## Examples

- With React: https://github.com/ffmpegwasm/react-app

## Documentation

- [API](https://github.com/ffmpegwasm/ffmpeg.wasm/blob/master/docs/api.md)

## Tutorials

Learn how to build ffmpeg.wasm from stories:

- [Part.1 Preparation](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-1-preparation-ed12bf4c8fac)
- [Part.2 Compile with Emscripten](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-2-compile-with-emscripten-4c581e8c9a16)
- [Part.3 ffmpeg.wasm v0.1.0 — Transcoding avi to mp4](https://itnext.io/build-ffmpeg-webassembly-version-ffmpeg-js-part-3-ffmpeg-js-v0-1-0-transcoding-avi-to-mp4-f729e503a397)
- [Part.4 ffmpeg.wasm v0.2 — Web Worker and Libx264](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-4-ffmpeg-js-v0-2-web-worker-and-libx264-d0596f1beb4e)
- [Part.5 ffmpeg.wasm v0.3 — pre-js and live streaming](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-5-ffmpeg-js-v0-3-pre-js-and-live-streaming-c1498939a74c)
- [Part.6 a Deep Dive into File System](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-6-a-deep-dive-into-file-system-56eba10067ca)
- [Part.7 multithreading (WIP)]()
