FFmpeg.js
=========

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
