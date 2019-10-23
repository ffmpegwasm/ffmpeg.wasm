FFmpeg.js
=========
[![Actions Status](https://github.com/jeromewu/ffmpeg.js/workflows/CI/badge.svg)](https://github.com/jeromewu/ffmpeg.js/actions)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/jeromewu/ffmpeg.js/graphs/commit-activity)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code Style](https://badgen.net/badge/code%20style/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)
[![Downloads Total](https://img.shields.io/npm/dt/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)
[![Downloads Month](https://img.shields.io/npm/dm/@ffmpeg/ffmpeg.svg)](https://www.npmjs.com/package/@ffmpeg/ffmpeg)

<p align="center">
<a href="#"><img alt="ffmpeg.js" src="https://github.com/jeromewu/ffmpeg.js/raw/master/docs/images/cover.png"></a>
</p>

A FFmpeg WebAssembly version built from scratch, you can learn how to do it from this series of stories: [Build FFmpeg WebAssembly version (=ffmpeg.js)](https://medium.com/@jeromewus/build-ffmpeg-webassembly-version-ffmpeg-js-part-1-preparation-ed12bf4c8fac).

---

## Installation

```
$ npm install @ffmpeg/ffmpeg
```

## Example

```javascript
const fs = require('fs');
const ffmpeg = require('@ffmpeg/ffmpeg');

(async () => {
  await ffmpeg.load();
  const data = ffmpeg.transcode('./test.avi', 'mp4');
  fs.wrieFileSync('./test.mp4', data);
})();
```
